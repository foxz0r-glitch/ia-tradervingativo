// Cockpit do Trader — painel direito de controles (reskin RECON-4: SliderRow.dc.html + Dashboard.dc.html).
// ‼️ Estes controles alimentam o robô. Reskin é SÓ aparência: estados/props/handlers/clamp/min-max/gates INALTERADOS.
// - Valor por operação / Meta / Stop loss: <Slider> shadcn (arrastar real) re-vestido por instância via CSS vars.
// - Defesa Técnica (gale): stepper inteiro 1–5 (maxLoss) com 5 segmentos.
// - Botão "LIGAR IA" (gates inalterados: onStart/onStop/canStart/canStop).
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cockpitLimits } from "@/lib/cockpitLimits";

interface Props {
  valorEntrada: number; setValorEntrada: (v: number) => void;
  saldo: number | null;
  simbolo?: string;
  expiracao: number; setExpiracao: (v: number) => void;
  maxLoss: number; setMaxLoss: (v: number) => void;
  meta: number; setMeta: (v: number) => void;
  stopLoss: number; setStopLoss: (v: number) => void;
  onStart: () => void; onStop: () => void;
  canStart: boolean; canStop: boolean;
  rodando: boolean;
}

// Paleta (SliderRow.dc.html)
const GREEN = "#22c55e";
const RED = "#ef4444";
const VALUE = "#eef5f0";      // value-color Valor/Meta
const STOP_VALUE = "#f0726a"; // value-color Stop loss

// <Slider> shadcn re-vestido (SliderRow.dc.html) SEM editar ui/slider:
// classes ESTÁTICAS (Tailwind JIT vê todas) + cor por CSS var no style (dinâmico por instância).
// DOM ui/slider: Root > [Track(span:first-child) > Range(span)] + Thumb([role=slider]).
const SLIDER_CLASS =
  "[&>span:first-child]:!h-[5px] [&>span:first-child]:!rounded-[3px] [&>span:first-child]:!bg-[rgba(255,255,255,0.08)] " +
  "[&>span:first-child>span]:!bg-[image:var(--tv-fill)] " +
  "[&_[role=slider]]:!h-[18px] [&_[role=slider]]:!w-[18px] [&_[role=slider]]:!border-0 [&_[role=slider]]:!bg-[color:var(--tv-thumb)] " +
  "[&_[role=slider]]:!shadow-[0_0_10px_var(--tv-thumb),0_0_0_4px_rgba(34,197,94,0.16)]";

function sliderVars(accent: string): CSSProperties {
  return {
    ["--tv-fill" as string]: `linear-gradient(90deg,#15924a,${accent})`,
    ["--tv-thumb" as string]: accent,
  } as CSSProperties;
}

// −/+ : 30px, glifos de texto (minus 400 20px / plus 400 18px, line-height:1) — SliderRow.dc.html.
const STEP_BTN_CLASS =
  "flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-[rgba(255,255,255,0.1)] text-[#9bb0a5] transition hover:border-[rgba(34,197,94,0.4)] hover:bg-[rgba(34,197,94,0.08)] hover:text-[#5dffa0] disabled:cursor-not-allowed disabled:opacity-30";
const MINUS_GLYPH: CSSProperties = { fontFamily: "'Sora', sans-serif", fontWeight: 400, fontSize: 20, lineHeight: 1 };
const PLUS_GLYPH: CSSProperties = { fontFamily: "'Sora', sans-serif", fontWeight: 400, fontSize: 18, lineHeight: 1 };

const LABEL_STYLE: CSSProperties = {
  fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 10,
  letterSpacing: ".18em", color: "#5d7167", textTransform: "uppercase",
};

// ===================== Hold-to-accelerate (INALTERADO) =====================
function useHoldRepeat(fn: () => void) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const tid = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase = useRef(0);

  const stop = useCallback(() => {
    if (tid.current !== null) { clearTimeout(tid.current); tid.current = null; }
  }, []);

  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    fnRef.current();
    phase.current += 1;
    const delay = phase.current < 4 ? 150 : phase.current < 8 ? 60 : 20;
    tid.current = setTimeout(tickRef.current, delay);
  };

  const start = useCallback(() => {
    stop();
    phase.current = 0;
    fnRef.current();
    tid.current = setTimeout(tickRef.current, 500);
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { start, stop };
}

// ===================== Campo numérico editável (LÓGICA INALTERADA) =====================
// Slider e −/+ continuam como entrada alternativa — o valor flui pelas MESMAS props (setter no Index).
// Digitação parcial permitida; clamp com os MESMOS min/max do slider no onBlur (ou Enter).
// (money-safety: handleStart também clampa antes do payload.)
// Re-vestido como a "caixa do valor" do SliderRow (700 13px JetBrains Mono, borda/raio/bg).
// w-auto + width inline (boxW) sobrescrevem o w-full da base do Input (caixa content-size, como o handoff).
// md:text-[13px] neutraliza o md:text-sm da base do Input (senão vira 14px no md+; handoff = 13px).
const EDIT_INPUT_CLASS =
  "h-auto w-auto rounded-[9px] border border-[rgba(34,197,94,0.22)] bg-[rgba(6,12,8,0.4)] py-[7px] px-[13px] font-mono text-[13px] md:text-[13px] font-bold leading-none tabular-nums shadow-none focus-visible:ring-1 focus-visible:ring-[rgba(34,197,94,0.4)] focus-visible:ring-offset-0";

function EditableValue({
  value, min, max, integer = false, color, ariaLabel, onCommit, align = "right", boxW = 64,
}: {
  value: number; min: number; max: number; integer?: boolean;
  color: string; ariaLabel: string; onCommit: (n: number) => void;
  align?: "right" | "center"; boxW?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false);

  // Reflete mudanças externas (slider, −/+) só quando o campo NÃO está sendo digitado
  useEffect(() => { if (!editing.current) setDraft(String(value)); }, [value]);

  const parse = (raw: string): number | null => {
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return integer ? Math.floor(n) : n;
  };
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const commit = () => {
    editing.current = false;
    const n = parse(draft);
    const next = n === null ? clamp(value) : clamp(n);   // clamp no onBlur com min/max das props
    onCommit(next);
    setDraft(String(next));
  };

  return (
    <Input
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      aria-label={ariaLabel}
      value={draft}
      onFocus={(e) => { editing.current = true; e.currentTarget.select(); }}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const n = parse(raw);                       // atualiza slider/indicador ao vivo (sem clamp)
        if (raw.trim() !== "" && n !== null) onCommit(n);
      }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      className={`${EDIT_INPUT_CLASS} ${align === "center" ? "text-center" : "text-right"}`}
      style={{ color, width: boxW }}
    />
  );
}

// ===== Botão LIGAR IA — gates IDÊNTICOS (onStart=handleStart, swap por canStop, disabled=!canStart) =====
function LigarIA({ canStart, canStop, onStart, onStop }: Pick<Props, "canStart" | "canStop" | "onStart" | "onStop">) {
  if (!canStop) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="flex w-full items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          height: 58, borderRadius: 16, border: "1px solid rgba(34,197,94,.55)",
          background: "linear-gradient(180deg, rgba(34,197,94,.22), rgba(34,197,94,.1))",
          color: "#5dffa0", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
          letterSpacing: ".16em", boxShadow: "0 0 36px -8px rgba(34,197,94,.85)",
        }}
      >
        <Play className="h-3.5 w-3.5" fill="currentColor" />
        <span>LIGAR IA</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onStop}
      className="flex w-full items-center justify-center gap-2 transition-all duration-300"
      style={{
        height: 58, borderRadius: 16, border: "1px solid rgba(239,68,68,.55)",
        background: "linear-gradient(180deg, rgba(239,68,68,.22), rgba(239,68,68,.1))",
        color: "#ff8a8a", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
        letterSpacing: ".16em", boxShadow: "0 0 36px -8px rgba(239,68,68,.85)",
      }}
    >
      <Square className="h-3.5 w-3.5" fill="currentColor" />
      <span>PARAR IA</span>
    </button>
  );
}

// ===================== SliderRow (Valor / Meta / Stop) — WIRING INALTERADO =====================
// Unifica o antigo InvestmentControl + ProSlider: mesma lógica (useHoldRepeat + <Slider> + EditableValue),
// só visual novo. Cada instância continua ligada no MESMO estado/setter via props (value/setValue).
function SliderRow({
  label, value, setValue, min, max, step, prefix, accent, valueColor,
}: {
  label: string; value: number; setValue: (n: number) => void;
  min: number; max: number; step: number; prefix: string;
  accent: string; valueColor: string;
}) {
  const vRef = useRef(value);
  useEffect(() => { vRef.current = value; });

  const dec = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current - step)));
  }, [min, max, step, setValue]));
  const inc = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current + step)));
  }, [min, max, step, setValue]));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span style={LABEL_STYLE}>{label}</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="pointer-events-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: accent }}>{prefix.trim()}</span>
          <EditableValue value={value} onCommit={setValue} min={min} max={max} color={valueColor} ariaLabel={label} />
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          aria-label="Diminuir"
          onMouseDown={dec.start}
          onMouseUp={dec.stop}
          onMouseLeave={dec.stop}
          onTouchStart={(e) => { e.preventDefault(); dec.start(); }}
          onTouchEnd={dec.stop}
          className={STEP_BTN_CLASS}
        >
          <span style={MINUS_GLYPH}>−</span>
        </button>
        <div className="flex-1">
          <Slider
            min={min} max={max} step={step}
            value={[Math.min(Math.max(min, value), max)]}
            onValueChange={(v) => setValue(v[0])}
            className={SLIDER_CLASS}
            style={sliderVars(accent)}
          />
        </div>
        <button
          type="button"
          aria-label="Aumentar"
          onMouseDown={inc.start}
          onMouseUp={inc.stop}
          onMouseLeave={inc.stop}
          onTouchStart={(e) => { e.preventDefault(); inc.start(); }}
          onTouchEnd={inc.stop}
          className={STEP_BTN_CLASS}
        >
          <span style={PLUS_GLYPH}>+</span>
        </button>
      </div>
    </div>
  );
}

// ===================== Defesa Técnica (gale) — stepper inteiro 1–5 (WIRING INALTERADO) =====================
// Gale é CONTAGEM de níveis (inteiro), nunca dinheiro. money-safety: set() clampa SEMPRE 1..5.
function GaleControl({ value, setValue }: { value: number; setValue: (n: number) => void }) {
  const v = Math.max(1, Math.min(5, Math.floor(Number(value) || 1)));
  const set = (n: number) => setValue(Math.max(1, Math.min(5, Math.floor(Number(n)))));
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span style={LABEL_STYLE}>Defesa Técnica</span>
        <EditableValue
          value={v} onCommit={set}
          min={1} max={5} integer
          color={VALUE} ariaLabel="Defesa Técnica" align="center" boxW={44}
        />
      </div>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          aria-label="Diminuir defesa"
          onClick={() => set(v - 1)}
          disabled={v <= 1}
          className={STEP_BTN_CLASS}
        >
          <span style={MINUS_GLYPH}>−</span>
        </button>
        <div className="flex flex-1 items-center" style={{ gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              aria-hidden
              className="flex-1 transition-all"
              style={{
                height: 6,
                borderRadius: 3,
                background: n <= v ? "linear-gradient(90deg,#15924a,#22c55e)" : "rgba(255,255,255,0.08)",
                boxShadow: n <= v ? "0 0 8px -2px #22c55e" : "none",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Aumentar defesa"
          onClick={() => set(v + 1)}
          disabled={v >= 5}
          className={STEP_BTN_CLASS}
        >
          <span style={PLUS_GLYPH}>+</span>
        </button>
      </div>
    </div>
  );
}

function Sliders3({ p }: { p: Props }) {
  const simb = p.simbolo ?? "$";
  // Congela o saldo no momento em que o bot inicia; atualiza só quando para
  const [saldoBase, setSaldoBase] = useState<number | null>(p.saldo);
  useEffect(() => {
    if (!p.rodando) setSaldoBase(p.saldo);
  }, [p.rodando, p.saldo]);

  // Limites: fonte ÚNICA (src/lib/cockpitLimits) — MESMA fórmula usada no clamp do handleStart
  const { maxEntrada, maxStopLoss, maxMeta } = cockpitLimits(saldoBase);

  // Clamp valores caso os limites diminuam (ex.: saldo caiu entre sessões)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.valorEntrada > maxEntrada)  p.setValorEntrada(maxEntrada);  }, [maxEntrada]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.stopLoss    > maxStopLoss)  p.setStopLoss(maxStopLoss);     }, [maxStopLoss]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.meta        > maxMeta)      p.setMeta(maxMeta);              }, [maxMeta]);

  return (
    <div className="flex flex-col gap-5">
      <SliderRow label="Valor por operação" prefix={simb} accent={GREEN} valueColor={VALUE}
        value={p.valorEntrada} setValue={p.setValorEntrada}
        min={2} max={maxEntrada} step={1} />
      <SliderRow label="Meta" prefix={simb} accent={GREEN} valueColor={VALUE}
        value={p.meta} setValue={p.setMeta}
        min={2} max={maxMeta} step={1} />
      <SliderRow label="Stop loss" prefix={simb} accent={RED} valueColor={STOP_VALUE}
        value={p.stopLoss} setValue={p.setStopLoss}
        min={2} max={maxStopLoss} step={1} />
      <GaleControl value={p.maxLoss} setValue={p.setMaxLoss} />
    </div>
  );
}

// ===================== Painel único (estilo do Dashboard.dc.html — coluna direita) =====================
// NB: o card "Modelo de inteligência" segue no Index (2 cards). Unificar 100% exigiria reabrir o Index;
// aqui o CockpitVariants é UM painel com o estilo do handoff (ver relatório RECON-4 §unificação).
function Variant(p: Props) {
  return (
    <div
      className="flex h-full w-full flex-col rounded-[18px] border border-[rgba(34,197,94,0.16)]"
      style={{ background: "linear-gradient(180deg, rgba(14,26,18,.5), rgba(6,12,8,.3))", padding: 20 }}
    >
      <Sliders3 p={p} />
      <div className="mt-5">
        <LigarIA {...p} />
      </div>
    </div>
  );
}

// ===================== EXPORT =====================
export function CockpitVariants(props: Props) {
  return (
    <div className="flex h-full flex-col gap-4">
      <Variant {...props} />
    </div>
  );
}
