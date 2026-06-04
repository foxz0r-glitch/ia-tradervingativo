// 5 variantes de "Cockpit do Trader" no estilo SLIDER.
// - Investimento por operação: slider + input numérico + botões − / +
// - Meta R$ e Stop Loss R$: sliders
// - Botão "Estratégia" abre Popover (à esquerda) com:
//      • Seleção de estratégia pronta + opção Personalizada (com nome editável)
//      • Expiração da operação
//      • Gale (proteção / perdas seguidas)
// - Após confirmar, Expiração, Proteção e Estratégia aparecem
//   no painel do cockpit como BADGES READ-ONLY.
// - Botão "Ligar IA" permanece IDÊNTICO ao original.
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Settings2, Clock4, Shield, Layers, Play, Square,
  Target, Wallet, TrendingDown, TrendingUp, Coins, Sparkles,
  Crosshair, Zap, Check, Activity, Cpu, Minus, Plus, Pencil,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  valorEntrada: number; setValorEntrada: (v: number) => void;
  saldo: number | null;
  expiracao: number; setExpiracao: (v: number) => void;
  maxLoss: number; setMaxLoss: (v: number) => void;
  meta: number; setMeta: (v: number) => void;
  stopLoss: number; setStopLoss: (v: number) => void;
  onStart: () => void; onStop: () => void;
  canStart: boolean; canStop: boolean;
  rodando: boolean;
}

const EXPIRACOES = [
  { v: 5, label: "5s" }, { v: 10, label: "10s" }, { v: 15, label: "15s" },
  { v: 30, label: "30s" }, { v: 45, label: "45s" }, { v: 60, label: "1min" },
  { v: 120, label: "2min" }, { v: 180, label: "3min" }, { v: 300, label: "5min" },
];

// ===== Estratégias prontas =====
type PresetKey = "conservadora" | "moderada" | "agressiva" | "scalper" | "custom";
const PRESETS: Record<Exclude<PresetKey, "custom">, {
  name: string; desc: string; expiracao: number; maxLoss: number; color: string;
}> = {
  conservadora: { name: "Conservadora", desc: "Operações longas, baixo risco", expiracao: 300, maxLoss: 1, color: "hsl(139 80% 60%)" },
  moderada:     { name: "Moderada",     desc: "Equilíbrio entre risco e retorno", expiracao: 60,  maxLoss: 2, color: "hsl(190 90% 60%)" },
  agressiva:    { name: "Agressiva",    desc: "Mais entradas, gale ampliado",      expiracao: 30,  maxLoss: 3, color: "hsl(280 90% 70%)" },
  scalper:      { name: "Scalper",      desc: "Curtíssimo prazo, alta frequência", expiracao: 10,  maxLoss: 2, color: "hsl(40 95% 60%)" },
};

const STORAGE_KEY = "virtuspro_strategy_v2";
type Saved = { preset: PresetKey; customName: string };

const STEP_BUTTON_STYLE: CSSProperties = {
  color: "hsl(var(--muted-foreground))",
};

const STEP_BUTTON_CLASS = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/30 hover:text-foreground";

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { preset: "moderada", customName: "Minha Estratégia" };
}

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
      className="flex items-center justify-center gap-2 rounded-xl border border-[hsl(0_84%_60%/0.7)] bg-gradient-to-r from-[hsl(0_75%_28%/0.45)] to-[hsl(10_75%_32%/0.45)] px-5 py-4 text-base font-black uppercase tracking-[0.22em] text-[hsl(0_84%_78%)] transition-all duration-300 hover:shadow-[0_0_22px_-4px_hsl(0_84%_55%/0.85)]"
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
  value, setValue, min, max,
}: { value: number; setValue: (n: number) => void; min: number; max: number }) {
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
          <span aria-hidden className="pointer-events-none text-[15px] font-black leading-none tabular-nums opacity-70" style={{ color: accent }}>$</span>
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

function Sliders3({ p }: { p: Props }) {
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
        min={2} max={maxEntrada}
      />
      <ProSlider label="Meta" icon={TrendingUp} accent="hsl(139 80% 65%)"
        value={p.meta} setValue={p.setMeta}
        min={2} max={maxMeta} step={1} prefix="$ " />
      <ProSlider label="Stop Loss" icon={TrendingDown} accent="hsl(0 84% 70%)"
        value={p.stopLoss} setValue={p.setStopLoss}
        min={2} max={maxStopLoss} step={1} prefix="$ " />
    </div>
  );
}

// ===================== Badges read-only no cockpit =====================
function StrategyBadges({
  expiracao, maxLoss, strategyName, accent,
}: { expiracao: number; maxLoss: number; strategyName: string; accent: string }) {
  const expLabel = EXPIRACOES.find((e) => e.v === expiracao)?.label ?? `${expiracao}s`;
  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      <ReadBadge icon={Layers} label="Estratégia" value={strategyName} accent={accent} />
      <ReadBadge icon={Clock4} label="Expiração"  value={expLabel}     accent="hsl(139 80% 65%)" />
      <ReadBadge icon={Shield} label="Proteção"   value={`${maxLoss}x`} accent="hsl(0 84% 70%)" />
    </div>
  );
}
function ReadBadge({ icon: Ic, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/10 px-2.5 py-1.5"
      title={`${label} (somente leitura — altere em Estratégia)`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1"
        style={{ color: accent, borderColor: accent, background: `linear-gradient(135deg, ${accent.replace(")", " / 0.18)")}, transparent)` }}>
        <Ic className="h-3 w-3" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">{label}</div>
        <div className="truncate text-[12px] font-black text-foreground" style={{ color: accent }}>{value}</div>
      </div>
    </div>
  );
}

// ===================== Pickers (Preset / Expiração / Gale) =====================
function PresetPicker({
  selected, setSelected, customName, setCustomName, accent,
}: {
  selected: PresetKey; setSelected: (k: PresetKey) => void;
  customName: string; setCustomName: (n: string) => void; accent: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>
        <Layers className="h-3 w-3" /> Estratégia
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((k) => {
          const p = PRESETS[k]; const active = selected === k;
          return (
            <button key={k} type="button" onClick={() => setSelected(k)}
              className={`rounded-lg border px-2.5 py-2 text-left transition-all ${active
                ? "border-[hsl(139_80%_45%/0.55)] bg-[hsl(139_80%_45%/0.14)] shadow-[0_0_14px_-4px_hsl(139_80%_45%/0.6)]"
                : "border-border/50 bg-muted/10 hover:border-[hsl(139_80%_45%/0.35)]"}`}>
              <div className="text-[11px] font-black uppercase tracking-wider text-foreground">{p.name}</div>
              <div className="truncate text-[9.5px] text-muted-foreground">{p.desc}</div>
            </button>
          );
        })}
        <button type="button" onClick={() => setSelected("custom")}
          className={`col-span-2 rounded-lg border px-2.5 py-2 text-left transition-all ${selected === "custom"
            ? "border-[hsl(280_90%_60%/0.55)] bg-[hsl(280_90%_60%/0.12)] shadow-[0_0_14px_-4px_hsl(280_90%_60%/0.6)]"
            : "border-border/50 bg-muted/10 hover:border-[hsl(280_90%_60%/0.35)]"}`}>
          <div className="flex items-center gap-2">
            <Pencil className="h-3 w-3 text-[hsl(280_90%_75%)]" />
            <div className="text-[11px] font-black uppercase tracking-wider text-foreground">Personalizada</div>
          </div>
          <div className="text-[9.5px] text-muted-foreground">Crie e nomeie sua própria estratégia</div>
        </button>
      </div>
      {selected === "custom" && (
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Nome da estratégia"
          maxLength={32}
          className="h-9 bg-muted/10 text-[12px] font-semibold"
        />
      )}
    </section>
  );
}

function ExpGrid({ exp, setExp }: { exp: number; setExp: (n: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
      {EXPIRACOES.map((opt) => {
        const active = opt.v === exp;
        return (
          <button key={opt.v} type="button" onClick={() => setExp(opt.v)}
            className={`rounded-lg border px-2 py-2 text-[12px] font-bold tabular-nums transition-all ${active
              ? "border-[hsl(139_80%_45%/0.55)] bg-[hsl(139_80%_45%/0.18)] text-[hsl(139_80%_72%)] shadow-[0_0_14px_-4px_hsl(139_80%_45%/0.7)]"
              : "border-border/50 bg-muted/10 text-muted-foreground hover:border-[hsl(139_80%_45%/0.35)] hover:text-foreground"}`}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function GaleStepper({ value, setValue }: { value: number; setValue: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
        const active = n === value;
        return (
          <button key={n} type="button" onClick={() => setValue(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[12px] font-black tabular-nums transition-all ${active
              ? "border-[hsl(0_84%_60%/0.55)] bg-[hsl(0_84%_45%/0.18)] text-[hsl(0_84%_72%)] shadow-[0_0_14px_-4px_hsl(0_84%_55%/0.7)]"
              : "border-border/50 bg-muted/10 text-muted-foreground hover:border-[hsl(0_84%_60%/0.35)] hover:text-foreground"}`}>
            {n}
          </button>
        );
      })}
    </div>
  );
}

function DialogShell({
  title, sub, accent = "hsl(139 80% 60%)", icon: Ic, children,
  className = "", contentClassName = "",
}: {
  title: string; sub: string; accent?: string; icon: any;
  children: React.ReactNode; className?: string; contentClassName?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border/60 bg-[hsl(220_25%_6%)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] ${className}`}
    >
      <div
        className="relative px-5 pb-3 pt-5"
        style={{ background: `linear-gradient(135deg, ${accent.replace(")", " / 0.18)")}, transparent 70%)` }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent.replace(")", " / 0.45)")}, transparent)` }} />
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl ring-1"
            style={{
              background: `linear-gradient(135deg, ${accent.replace(")", " / 0.25)")}, transparent)`,
              boxShadow: `0 0 18px -6px ${accent}`,
              color: accent,
              borderColor: accent,
            }}>
            <Ic className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: accent }}>{sub}</div>
            <div className="text-base font-black tracking-tight text-foreground">{title}</div>
          </div>
        </div>
      </div>
      <div className={`max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4 ${contentClassName}`}>{children}</div>
    </div>
  );
}

// ===================== Estado compartilhado de estratégia =====================
function useStrategyState(p: Props) {
  const [saved, setSaved] = useState<Saved>(() => loadSaved());
  // Snapshot de edição (aplica só ao salvar)
  const [draftPreset, setDraftPreset] = useState<PresetKey>(saved.preset);
  const [draftCustomName, setDraftCustomName] = useState(saved.customName);
  const [draftExp, setDraftExp] = useState(p.expiracao);
  const [draftGale, setDraftGale] = useState(p.maxLoss);

  const resetDraft = () => {
    setDraftPreset(saved.preset);
    setDraftCustomName(saved.customName);
    setDraftExp(p.expiracao);
    setDraftGale(p.maxLoss);
  };

  const save = () => {
    const next: Saved = { preset: draftPreset, customName: draftCustomName.trim() || "Minha Estratégia" };
    setSaved(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    p.setExpiracao(draftExp);
    p.setMaxLoss(draftGale);
  };

  // Quando troca preset (e não custom), aplica os defaults dele no draft
  useEffect(() => {
    if (draftPreset !== "custom") {
      const pr = PRESETS[draftPreset];
      setDraftExp(pr.expiracao);
      setDraftGale(pr.maxLoss);
    }
  }, [draftPreset]);

  const strategyName = saved.preset === "custom"
    ? (saved.customName || "Personalizada")
    : PRESETS[saved.preset].name;

  const accent = saved.preset === "custom" ? "hsl(280 90% 70%)" : PRESETS[saved.preset].color;

  return {
    saved, strategyName, accent,
    draftPreset, setDraftPreset,
    draftCustomName, setDraftCustomName,
    draftExp, setDraftExp,
    draftGale, setDraftGale,
    save, resetDraft,
  };
}

// ===================== DIÁLOGOS =====================

type DlgProps = {
  p: Props;
  s: ReturnType<typeof useStrategyState>;
  onClose: () => void;
};

// V1 — Mission Brief (esmerald)
function DialogV1({ p, s, onClose }: DlgProps) {
  return (
    <DialogShell title="Briefing da Estratégia" sub="Mission Brief" icon={Layers} accent="hsl(139 80% 60%)">
      <PresetPicker
        selected={s.draftPreset} setSelected={s.setDraftPreset}
        customName={s.draftCustomName} setCustomName={s.setDraftCustomName}
        accent="hsl(139 80% 65%)"
      />
      <section className="space-y-2 border-t border-border/40 pt-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(139_80%_65%)]">
          <Clock4 className="h-3 w-3" /> Expiração da operação
        </div>
        <ExpGrid exp={s.draftExp} setExp={s.setDraftExp} />
      </section>
      <section className="space-y-2 border-t border-border/40 pt-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(0_84%_70%)]">
          <Shield className="h-3 w-3" /> Proteção · perdas seguidas (Gale)
        </div>
        <GaleStepper value={s.draftGale} setValue={s.setDraftGale} />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Após {s.draftGale} {s.draftGale === 1 ? "perda consecutiva" : "perdas consecutivas"}, a IA pausa para reavaliar.
        </p>
      </section>
      <button onClick={() => { s.save(); onClose(); }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(139_80%_50%/0.6)] bg-gradient-to-r from-[hsl(139_80%_30%/0.3)] to-[hsl(139_80%_40%/0.4)] py-3 text-[12px] font-black uppercase tracking-[0.18em] text-[hsl(139_80%_75%)] transition hover:shadow-[0_0_22px_-4px_hsl(139_80%_50%/0.7)]">
        <Check className="h-4 w-4" /> Salvar estratégia
      </button>
    </DialogShell>
  );
}

// V2 — Tactical Setup (aqua, tabs)
function DialogV2({ p, s, onClose }: DlgProps) {
  const [tab, setTab] = useState<"preset" | "tempo" | "gale">("preset");
  return (
    <DialogShell title="Tactical Setup" sub="Estratégia Operacional" icon={Crosshair} accent="hsl(190 90% 60%)">
      <div className="grid grid-cols-3 rounded-xl border border-border/60 bg-muted/10 p-1">
        {[["preset", "Modelo", Layers], ["tempo", "Tempo", Clock4], ["gale", "Proteção", Shield]].map(([k, lbl, Ic]: any) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${tab === k
              ? "bg-[hsl(190_90%_45%/0.18)] text-[hsl(190_90%_75%)] shadow-[inset_0_0_0_1px_hsl(190_90%_45%/0.4)]"
              : "text-muted-foreground hover:text-foreground"}`}>
            <Ic className="h-3 w-3" /> {lbl}
          </button>
        ))}
      </div>
      {tab === "preset" && (
        <PresetPicker
          selected={s.draftPreset} setSelected={s.setDraftPreset}
          customName={s.draftCustomName} setCustomName={s.setDraftCustomName}
          accent="hsl(190 90% 75%)"
        />
      )}
      {tab === "tempo" && (
        <>
          <ExpGrid exp={s.draftExp} setExp={s.setDraftExp} />
          <p className="text-[11px] text-muted-foreground">Tempo até a expiração da operação.</p>
        </>
      )}
      {tab === "gale" && (
        <>
          <GaleStepper value={s.draftGale} setValue={s.setDraftGale} />
          <p className="text-[11px] text-muted-foreground">Limite de perdas consecutivas antes da IA recuar.</p>
        </>
      )}
      <button onClick={() => { s.save(); onClose(); }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(190_90%_50%/0.55)] bg-gradient-to-r from-[hsl(190_90%_30%/0.25)] to-[hsl(190_90%_40%/0.35)] py-3 text-[12px] font-black uppercase tracking-[0.18em] text-[hsl(190_90%_75%)] transition hover:shadow-[0_0_22px_-4px_hsl(190_90%_50%/0.7)]">
        <Check className="h-4 w-4" /> Aplicar
      </button>
    </DialogShell>
  );
}

// V3 — Quantum Console (terminal)
function DialogV3({ p, s, onClose }: DlgProps) {
  return (
    <DialogShell title="Quantum Console" sub="Terminal Mode" icon={Cpu} accent="hsl(140 80% 60%)" contentClassName="font-mono">
      <div className="rounded-xl border border-[hsl(139_80%_45%/0.3)] bg-[#06080b] p-4 text-[12px] text-[hsl(139_80%_70%)] shadow-[inset_0_0_30px_hsl(139_80%_50%/0.05)]">
        <div className="mb-3 flex items-center gap-2 border-b border-[hsl(139_80%_45%/0.2)] pb-2 text-[10px] uppercase tracking-widest opacity-70">
          <span className="h-2 w-2 rounded-full bg-[hsl(139_80%_50%)] shadow-[0_0_8px_hsl(139_80%_50%)]" />
          strategy.config &gt; ready
        </div>
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 opacity-70">$ select --preset</div>
            <PresetPicker
              selected={s.draftPreset} setSelected={s.setDraftPreset}
              customName={s.draftCustomName} setCustomName={s.setDraftCustomName}
              accent="hsl(140 80% 70%)"
            />
          </div>
          <div>
            <div className="mb-1.5 opacity-70">$ set --expiracao</div>
            <ExpGrid exp={s.draftExp} setExp={s.setDraftExp} />
          </div>
          <div>
            <div className="mb-1.5 opacity-70">$ set --gale.max</div>
            <GaleStepper value={s.draftGale} setValue={s.setDraftGale} />
          </div>
        </div>
      </div>
      <button onClick={() => { s.save(); onClose(); }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(140_80%_50%/0.6)] bg-[hsl(140_80%_25%/0.25)] py-3 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[hsl(140_80%_75%)] transition hover:shadow-[0_0_22px_-4px_hsl(140_80%_50%/0.7)]">
        <Zap className="h-4 w-4" /> commit &amp; exit
      </button>
    </DialogShell>
  );
}

// V4 — Neon Glass
function DialogV4({ p, s, onClose }: DlgProps) {
  return (
    <DialogShell title="Neon Strategy" sub="Premium Setup" icon={Sparkles} accent="hsl(280 90% 70%)"
      className="border-[hsl(280_90%_60%/0.35)] shadow-[0_0_60px_-15px_hsl(280_90%_60%/0.5)]">
      <PresetPicker
        selected={s.draftPreset} setSelected={s.setDraftPreset}
        customName={s.draftCustomName} setCustomName={s.setDraftCustomName}
        accent="hsl(280 90% 80%)"
      />
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(280_90%_75%)]">
            <Clock4 className="h-3 w-3" /> Expiração
          </span>
          <span className="rounded-md bg-[hsl(280_90%_50%/0.15)] px-2 py-0.5 text-[10px] font-black tabular-nums text-[hsl(280_90%_80%)] ring-1 ring-[hsl(280_90%_60%/0.35)]">
            {EXPIRACOES.find((e) => e.v === s.draftExp)?.label ?? `${s.draftExp}s`}
          </span>
        </div>
        <ExpGrid exp={s.draftExp} setExp={s.setDraftExp} />
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(0_84%_72%)]">
            <Shield className="h-3 w-3" /> Gale (perdas seguidas)
          </span>
          <span className="rounded-md bg-[hsl(0_84%_45%/0.15)] px-2 py-0.5 text-[10px] font-black tabular-nums text-[hsl(0_84%_75%)] ring-1 ring-[hsl(0_84%_55%/0.35)]">
            {s.draftGale}x
          </span>
        </div>
        <GaleStepper value={s.draftGale} setValue={s.setDraftGale} />
      </section>
      <button onClick={() => { s.save(); onClose(); }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(280_90%_60%/0.5)] bg-gradient-to-r from-[hsl(280_90%_35%/0.3)] via-[hsl(300_90%_40%/0.4)] to-[hsl(280_90%_35%/0.3)] py-3 text-[12px] font-black uppercase tracking-[0.18em] text-[hsl(280_90%_85%)] transition hover:shadow-[0_0_28px_-4px_hsl(280_90%_60%/0.8)]">
        <Sparkles className="h-4 w-4" /> Confirmar Estratégia
      </button>
    </DialogShell>
  );
}

// V5 — Wizard (now used by all variants, with default green accent)
function DialogV5({ p, s, onClose }: DlgProps) {
  const [step, setStep] = useState(0);
  return (
    <DialogShell title="Wizard Estratégico" sub={`Passo ${step + 1} de 3`} icon={Activity} accent="hsl(139 80% 60%)">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-[hsl(139_80%_50%)] shadow-[0_0_8px_hsl(139_80%_45%)]" : "bg-muted/30"}`} />
        ))}
      </div>
      {step === 0 && (
        <PresetPicker
          selected={s.draftPreset} setSelected={s.setDraftPreset}
          customName={s.draftCustomName} setCustomName={s.setDraftCustomName}
          accent="hsl(139 80% 65%)"
        />
      )}
      {step === 1 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(139_80%_65%)]">
            <Clock4 className="h-3.5 w-3.5" /> Tempo da operação
          </div>
          <ExpGrid exp={s.draftExp} setExp={s.setDraftExp} />
        </section>
      )}
      {step === 2 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(0_84%_72%)]">
            <Shield className="h-3.5 w-3.5" /> Proteção contra sequências negativas
          </div>
          <GaleStepper value={s.draftGale} setValue={s.setDraftGale} />
        </section>
      )}
      <div className="flex items-center gap-2">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="flex-1 rounded-xl border border-border/60 bg-muted/10 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground">
            Voltar
          </button>
        )}
        {step < 2 ? (
          <button onClick={() => setStep(step + 1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[hsl(139_80%_50%/0.6)] bg-gradient-to-r from-[hsl(139_80%_30%/0.3)] to-[hsl(139_80%_40%/0.4)] py-3 text-[12px] font-black uppercase tracking-[0.18em] text-[hsl(139_80%_75%)] transition hover:shadow-[0_0_22px_-4px_hsl(139_80%_50%/0.7)]">
            Próximo <Zap className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => { s.save(); onClose(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[hsl(139_80%_50%/0.6)] bg-gradient-to-r from-[hsl(139_80%_30%/0.3)] to-[hsl(139_80%_40%/0.4)] py-3 text-[12px] font-black uppercase tracking-[0.18em] text-[hsl(139_80%_75%)] transition hover:shadow-[0_0_22px_-4px_hsl(139_80%_50%/0.7)]">
            <Check className="h-4 w-4" /> Concluir
          </button>
        )}
      </div>
    </DialogShell>
  );
}

// ===================== VARIANTES (Cockpit) =====================

function makeVariant(
  index: number, title: string, sub: string,
  Dlg: (props: DlgProps) => JSX.Element,
  cardClassName: string,
  inner?: React.ReactNode,
  headerIcon?: any,
) {
  return function Variant(p: Props) {
    const [open, setOpen] = useState(false);
    const s = useStrategyState(p);

    return (
      <div className={`h-full flex w-full flex-col p-5 ${cardClassName}`}>
        <VariantHeader index={index} title={title} sub={sub} icon={headerIcon} />
        {inner}
        <Sliders3 p={p} />
        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <Popover
            open={open}
            onOpenChange={(v) => { if (v) s.resetDraft(); setOpen(v); }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-gradient-to-b from-muted/15 to-muted/5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-[hsl(139_80%_45%/0.5)] hover:bg-[hsl(139_80%_45%/0.08)] hover:text-[hsl(139_80%_70%)] hover:shadow-[0_0_18px_-6px_hsl(139_80%_45%/0.7)]"
              >
                <Layers className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" strokeWidth={2.4} />
                Estratégia
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="left"
              align="start"
              sideOffset={16}
              className="w-[420px] border-0 bg-transparent p-0 shadow-none"
            >
              <Dlg p={p} s={s} onClose={() => setOpen(false)} />
            </PopoverContent>
          </Popover>
          <LigarIA {...p} />
        </div>
      </div>
    );
  };
}

const V1 = makeVariant(1, "COCKPIT DO TRADER", "Painel de Controle", DialogV5, "ct-card");

// ===================== EXPORT =====================
export function CockpitVariants(props: Props) {
  return (
    <div className="h-full flex flex-col gap-4">
      <V1 {...props} />
    </div>
  );
}

