// Cockpit do Trader (estilo slider) — reskin COCKPIT-B (paleta do protótipo):
// - Valor por operação: slider + botões −/+
// - Meta e Stop Loss: sliders (com símbolo de moeda)
// - Defesa Técnica (gale): stepper inteiro 1–5
// - Botão "Ligar IA" (gates inalterados)
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Play, Square, TrendingDown, TrendingUp, Minus, Plus, ShieldCheck, type LucideIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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

// Paleta COCKPIT-B
const GREEN = "#22c55e";
const RED = "#ef4444";
const VALUE = "#eef5f0";
const MUTED = "#9bb0a5";

const STEP_BUTTON_STYLE: CSSProperties = {};

const STEP_BUTTON_CLASS =
  "flex h-11 w-11 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-[9px] border border-[rgba(255,255,255,0.08)] text-[#9bb0a5] transition hover:border-[rgba(34,197,94,0.4)] hover:bg-[rgba(34,197,94,0.08)] hover:text-[#5dffa0]";

// ===================== Hold-to-accelerate =====================
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

// ===================== Campo numérico editável (clicar e digitar) =====================
// Slider e botões −/+ continuam como entrada alternativa — o valor flui pelas MESMAS props
// (setter no Index, que persiste/envia ao WS). Digitação parcial é permitida; o clamp com os
// MESMOS min/max do slider acontece no onBlur (ou Enter). Vale para todos os dispositivos.
// (money-safety: o handleStart também clampa antes do payload — rede de segurança.)
const EDIT_INPUT_CLASS =
  "h-7 rounded-[9px] border border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.05)] px-2 py-0 text-right font-mono text-[15px] font-bold leading-none tabular-nums shadow-none focus-visible:ring-1 focus-visible:ring-[rgba(34,197,94,0.4)] focus-visible:ring-offset-0";

function EditableValue({
  value, min, max, integer = false, accent, ariaLabel, onCommit, widthClass = "w-16",
}: {
  value: number; min: number; max: number; integer?: boolean;
  accent: string; ariaLabel: string; onCommit: (n: number) => void; widthClass?: string;
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
      className={`${EDIT_INPUT_CLASS} ${widthClass}`}
      style={{ color: accent }}
    />
  );
}

// ===== Botão Ligar IA — gates IDÊNTICOS (onStart=handleStart, swap por canStop, disabled=!canStart) =====
function LigarIA({ canStart, canStop, onStart, onStop }: Pick<Props, "canStart" | "canStop" | "onStart" | "onStop">) {
  if (!canStop) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="group relative flex h-[58px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-[rgba(34,197,94,0.5)] bg-[rgba(34,197,94,0.10)] text-[15px] font-bold uppercase tracking-[0.16em] text-[#5dffa0] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[rgba(34,197,94,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: "0 0 24px -8px rgba(34,197,94,0.8)" }}
      >
        <Play className="h-4 w-4" fill="currentColor" />
        <span>Ligar IA</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onStop}
      className="flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(239,68,68,0.55)] bg-[rgba(239,68,68,0.12)] text-[15px] font-bold uppercase tracking-[0.16em] text-[#ff8a8a] transition-all duration-300 hover:bg-[rgba(239,68,68,0.18)]"
      style={{ boxShadow: "0 0 24px -8px rgba(239,68,68,0.8)" }}
    >
      <Square className="h-3.5 w-3.5" fill="currentColor" />
      Parar IA
    </button>
  );
}

function VariantHeader({ title, sub, icon: Ic = TrendingUp }: { title: string; sub: string; icon?: LucideIcon }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.10)] text-[#5dffa0]">
        <Ic className="h-[15px] w-[15px]" strokeWidth={2.2} />
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[8.5px] font-bold uppercase tracking-[0.32em] text-[#5d8a70]">{title}</span>
        <span className="mt-1 text-[15px] font-bold tracking-tight text-foreground">{sub}</span>
      </div>
    </div>
  );
}

// Trilho/thumb do slider — cor por `danger` (override de --primary, SEM editar ui/slider) + glow no thumb.
function sliderStyle(danger: boolean): { style?: CSSProperties; className: string } {
  // thumb/range coloridos por --primary (border-primary/bg-primary do ui/slider); só adicionamos o glow.
  if (danger) {
    return {
      style: { "--primary": "0 84% 60%" } as CSSProperties,
      className: "[&_[role=slider]]:shadow-[0_0_10px_2px_rgba(239,68,68,0.45)]",
    };
  }
  return {
    className: "[&_[role=slider]]:shadow-[0_0_10px_2px_rgba(34,197,94,0.45)]",
  };
}

// ===================== Investimento (slider + display + −/+) =====================
function InvestmentControl({
  value, setValue, min, max, simbolo,
}: { value: number; setValue: (n: number) => void; min: number; max: number; simbolo?: string }) {
  const vRef = useRef(value);
  useEffect(() => { vRef.current = value; });

  const dec = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current - 1)));
  }, [min, max, setValue]));
  const inc = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current + 1)));
  }, [min, max, setValue]));

  const slider = sliderStyle(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d8a70]">
          Valor por operação
        </Label>
        <div className="flex h-7 items-center gap-1">
          <span aria-hidden className="pointer-events-none text-[13px] font-bold leading-none tabular-nums" style={{ color: MUTED }}>{simbolo ?? "$"}</span>
          <EditableValue
            value={value} onCommit={setValue}
            min={min} max={max}
            accent={VALUE} ariaLabel="Valor por operação"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir"
          onMouseDown={dec.start}
          onMouseUp={dec.stop}
          onMouseLeave={dec.stop}
          onTouchStart={(e) => { e.preventDefault(); dec.start(); }}
          onTouchEnd={dec.stop}
          className={STEP_BUTTON_CLASS}
          style={STEP_BUTTON_STYLE}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <div className="flex-1">
          <Slider
            min={min} max={max} step={1}
            value={[Math.min(Math.max(min, value), max)]}
            onValueChange={(v) => setValue(v[0])}
            className={slider.className}
            style={slider.style}
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
          className={STEP_BUTTON_CLASS}
          style={STEP_BUTTON_STYLE}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// ===================== Slider customizado (Meta / Stop) =====================
function ProSlider({
  label, value, setValue, min, max, step, prefix, accent, danger = false, icon: Ic,
}: {
  label: string; value: number; setValue: (n: number) => void;
  min: number; max: number; step: number; prefix: string;
  accent: string; danger?: boolean; icon: LucideIcon;
}) {
  const vRef = useRef(value);
  useEffect(() => { vRef.current = value; });

  const dec = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current - step)));
  }, [min, max, step, setValue]));
  const inc = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current + step)));
  }, [min, max, step, setValue]));

  const slider = sliderStyle(danger);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d8a70]">
          <Ic className="h-3.5 w-3.5" strokeWidth={2.4} style={{ color: danger ? RED : GREEN }} />
          {label}
        </Label>
        <div className="flex h-7 items-center gap-1">
          <span aria-hidden className="pointer-events-none text-[13px] font-bold leading-none tabular-nums" style={{ color: MUTED }}>{prefix.trim()}</span>
          <EditableValue
            value={value} onCommit={setValue}
            min={min} max={max}
            accent={accent} ariaLabel={label}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir"
          onMouseDown={dec.start}
          onMouseUp={dec.stop}
          onMouseLeave={dec.stop}
          onTouchStart={(e) => { e.preventDefault(); dec.start(); }}
          onTouchEnd={dec.stop}
          className={STEP_BUTTON_CLASS}
          style={STEP_BUTTON_STYLE}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <div className="flex-1">
          <Slider
            min={min} max={max} step={step}
            value={[Math.min(Math.max(min, value), max)]}
            onValueChange={(v) => setValue(v[0])}
            className={slider.className}
            style={slider.style}
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
          className={STEP_BUTTON_CLASS}
          style={STEP_BUTTON_STYLE}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// ===================== Defesa Técnica (gale) — stepper inteiro 1–5 =====================
// Gale é CONTAGEM de níveis (inteiro), nunca dinheiro: por isso NÃO usa o ProSlider
// (compartilhado com os sliders de moeda, que exibem símbolo/prefixo). Stepper "- N +".
// money-safety: o set() clampa SEMPRE 1..5 → maxPerdasSeguidas nunca escapa do range.
function GaleControl({ value, setValue }: { value: number; setValue: (n: number) => void }) {
  const v = Math.max(1, Math.min(5, Math.floor(Number(value) || 1)));
  const set = (n: number) => setValue(Math.max(1, Math.min(5, Math.floor(Number(n)))));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d8a70]">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} style={{ color: GREEN }} />
          Defesa Técnica
        </Label>
        <div className="flex h-7 items-center gap-1">
          <EditableValue
            value={v} onCommit={set}
            min={1} max={5} integer
            accent={VALUE} ariaLabel="Defesa Técnica" widthClass="w-10"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir defesa"
          onClick={() => set(v - 1)}
          disabled={v <= 1}
          className={`${STEP_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-30`}
          style={STEP_BUTTON_STYLE}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              aria-hidden
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ background: n <= v ? "rgba(34,197,94,0.85)" : "rgba(255,255,255,0.06)" }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Aumentar defesa"
          onClick={() => set(v + 1)}
          disabled={v >= 5}
          className={`${STEP_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-30`}
          style={STEP_BUTTON_STYLE}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
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
    <div className="space-y-5">
      <InvestmentControl
        value={p.valorEntrada} setValue={p.setValorEntrada}
        min={2} max={maxEntrada} simbolo={simb}
      />
      <ProSlider label="Meta" icon={TrendingUp} accent={VALUE}
        value={p.meta} setValue={p.setMeta}
        min={2} max={maxMeta} step={1} prefix={`${simb} `} />
      <ProSlider label="Stop loss" icon={TrendingDown} accent={RED} danger
        value={p.stopLoss} setValue={p.setStopLoss}
        min={2} max={maxStopLoss} step={1} prefix={`${simb} `} />
      <GaleControl value={p.maxLoss} setValue={p.setMaxLoss} />
    </div>
  );
}

// ===================== Card (paleta explícita — NÃO usa .ct-card global) =====================
function Variant(p: Props) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-[rgba(34,197,94,0.14)] bg-[#060a08] p-5">
      <VariantHeader title="COCKPIT DO TRADER" sub="Painel de Controle" />
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
