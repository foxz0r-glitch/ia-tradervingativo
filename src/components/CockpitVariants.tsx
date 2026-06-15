// Cockpit do Trader (estilo slider):
// - Valor por operação: slider + botões −/+
// - Meta e Stop Loss: sliders (com símbolo de moeda)
// - Proteção (gale): stepper inteiro 1–4
// - Botão "Ligar IA" (inalterado)
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Settings2, Play, Square, TrendingDown, TrendingUp, Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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

const STEP_BUTTON_STYLE: CSSProperties = {
  color: "hsl(var(--muted-foreground))",
};

const STEP_BUTTON_CLASS = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/30 hover:text-foreground";

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

// ===== Botão Ligar IA — IDÊNTICO ao original =====
function LigarIA({ canStart, canStop, onStart, onStop }: Pick<Props, "canStart" | "canStop" | "onStart" | "onStop">) {
  if (!canStop) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-[hsl(139_80%_50%/0.55)] bg-gradient-to-r from-[hsl(139_80%_30%/0.35)] via-[hsl(139_80%_40%/0.45)] to-[hsl(139_80%_30%/0.35)] px-5 py-4 text-base font-black uppercase tracking-[0.22em] text-[hsl(139_80%_75%)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_18px_-6px_hsl(139_80%_50%/0.5)] disabled:cursor-not-allowed disabled:opacity-50"
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
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(0_84%_60%/0.7)] bg-gradient-to-r from-[hsl(0_75%_28%/0.45)] to-[hsl(10_75%_32%/0.45)] px-5 py-4 text-base font-black uppercase tracking-[0.22em] text-[hsl(0_84%_78%)] transition-all duration-300 hover:shadow-[0_0_22px_-4px_hsl(0_84%_55%/0.85)]"
    >
      <Square className="h-3.5 w-3.5" fill="currentColor" />
      Parar IA
    </button>
  );
}

function VariantHeader({ index, title, sub, icon: Ic = Settings2 }: { index: number; title: string; sub: string; icon?: any }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(139_80%_50%/0.28)] via-[hsl(139_80%_40%/0.14)] to-[hsl(139_80%_30%/0.04)] text-[hsl(139_80%_75%)] ring-1 ring-[hsl(139_80%_55%/0.45)] shadow-[inset_0_1px_0_hsl(139_80%_85%/0.20),0_0_14px_-4px_hsl(139_80%_50%/0.8)]">
          <Ic className="h-[15px] w-[15px]" strokeWidth={2.2} />
          <span aria-hidden className="absolute -right-[2px] -top-[2px] h-1.5 w-1.5 rounded-full bg-[hsl(139_80%_60%)] shadow-[0_0_6px_hsl(139_80%_55%)]" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[8.5px] font-bold uppercase tracking-[0.32em] text-[hsl(139_80%_60%)]">{title}</span>
          <span className="mt-1 text-[15px] font-black tracking-tight text-foreground">{sub}</span>
        </div>
      </div>
      
    </div>
  );
}

// ===================== Investimento (slider + display + −/+) =====================
function InvestmentControl({
  value, setValue, min, max, simbolo,
}: { value: number; setValue: (n: number) => void; min: number; max: number; simbolo?: string }) {
  const accent = "hsl(139 80% 65%)";
  const vRef = useRef(value);
  useEffect(() => { vRef.current = value; });

  const dec = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current - 1)));
  }, [min, max, setValue]));
  const inc = useHoldRepeat(useCallback(() => {
    setValue(Math.max(min, Math.min(max, vRef.current + 1)));
  }, [min, max, setValue]));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Valor por operação
        </Label>
        <div className="flex h-6 items-center gap-1 rounded-sm px-1">
          <span aria-hidden className="pointer-events-none text-[15px] font-black leading-none tabular-nums opacity-70" style={{ color: accent }}>{simbolo ?? "$"}</span>
          <span className="select-none text-[15px] font-black leading-none tabular-nums" style={{ color: accent }}>
            {value}
          </span>
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
  label, value, setValue, min, max, step, prefix, accent, icon: Ic,
}: {
  label: string; value: number; setValue: (n: number) => void;
  min: number; max: number; step: number; prefix: string;
  accent: string; icon: any;
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </Label>
        <div className="flex h-6 items-center gap-1 rounded-sm px-1">
          <span aria-hidden className="pointer-events-none text-[15px] font-black leading-none tabular-nums opacity-70" style={{ color: accent }}>{prefix.trim()}</span>
          <span className="select-none text-[15px] font-black leading-none tabular-nums" style={{ color: accent }}>
            {value}
          </span>
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

// ===================== Proteção (gale) — stepper inteiro 1–4 =====================
// Gale é CONTAGEM de níveis (inteiro), nunca dinheiro: por isso NÃO usa o ProSlider
// (compartilhado com os sliders de moeda, que exibem símbolo/prefixo). Stepper "- N +".
function GaleControl({ value, setValue }: { value: number; setValue: (n: number) => void }) {
  const accent = "hsl(0 84% 70%)";
  const v = Math.max(1, Math.min(4, Math.floor(Number(value) || 1)));
  const set = (n: number) => setValue(Math.max(1, Math.min(4, Math.floor(Number(n)))));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Proteção (gale)
        </Label>
        <div className="flex h-6 items-center gap-1 rounded-sm px-1">
          <span className="select-none text-[15px] font-black leading-none tabular-nums" style={{ color: accent }}>
            {v}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir proteção"
          onClick={() => set(v - 1)}
          disabled={v <= 1}
          className={`${STEP_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-30`}
          style={STEP_BUTTON_STYLE}
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              aria-hidden
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{ background: n <= v ? accent : "rgba(255,255,255,0.12)" }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Aumentar proteção"
          onClick={() => set(v + 1)}
          disabled={v >= 4}
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

  const floor = saldoBase != null && saldoBase > 0 ? Math.floor(saldoBase) : null;
  const maxEntrada  = floor != null ? Math.max(2, floor)      : 500;
  const maxStopLoss = floor != null ? Math.max(2, floor)      : 500;
  const maxMeta     = floor != null ? Math.max(10, floor * 5) : 2500;

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
      <ProSlider label="Meta" icon={TrendingUp} accent="hsl(139 80% 65%)"
        value={p.meta} setValue={p.setMeta}
        min={2} max={maxMeta} step={1} prefix={`${simb} `} />
      <ProSlider label="Stop Loss" icon={TrendingDown} accent="hsl(0 84% 70%)"
        value={p.stopLoss} setValue={p.setStopLoss}
        min={2} max={maxStopLoss} step={1} prefix={`${simb} `} />
      <GaleControl value={p.maxLoss} setValue={p.setMaxLoss} />
    </div>
  );
}

// ===================== VARIANTES (Cockpit) =====================

function makeVariant(
  index: number, title: string, sub: string,
  cardClassName: string,
  inner?: React.ReactNode,
  headerIcon?: any,
) {
  return function Variant(p: Props) {
    return (
      <div className={`h-full flex w-full flex-col p-5 ${cardClassName}`}>
        <VariantHeader index={index} title={title} sub={sub} icon={headerIcon} />
        {inner}
        <Sliders3 p={p} />
        <div className="mt-5">
          <LigarIA {...p} />
        </div>
      </div>
    );
  };
}

const V1 = makeVariant(1, "COCKPIT DO TRADER", "Painel de Controle", "ct-card");

// ===================== EXPORT =====================
export function CockpitVariants(props: Props) {
  return (
    <div className="h-full flex flex-col gap-4">
      <V1 {...props} />
    </div>
  );
}

