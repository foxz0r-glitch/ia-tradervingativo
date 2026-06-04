import { useEffect, useState } from "react";
import { Settings2, Sparkles, Brain, Shield, Clock4, Zap, Play, Square, Layers } from "lucide-react";
import { StrategyBuilder } from "@/components/StrategyBuilder";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import claudeIcon from "@/assets/ai-claude.webp";
import gptIcon from "@/assets/ai-gpt.webp";
import geminiIcon from "@/assets/ai-gemini.webp";
import grokIcon from "@/assets/ai-grok.webp";

type ModelKey = "claude" | "gpt5" | "gemini" | "grok3";

const MODELS: {
  key: ModelKey;
  label: string;
  sub: string;
  dot: string;
  icon: string;
  bg: string;
  invert?: boolean;
}[] = [
  { key: "claude", label: "Claude", sub: "Anthropic", dot: "hsl(25 95% 55%)", icon: claudeIcon, bg: "#F1F1EE" },
  { key: "gpt5", label: "GPT-5", sub: "OpenAI", dot: "hsl(139 80% 45%)", icon: gptIcon, bg: "#10A37F", invert: true },
  { key: "gemini", label: "Gemini", sub: "Google", dot: "hsl(217 91% 60%)", icon: geminiIcon, bg: "#FFFFFF" },
  { key: "grok3", label: "Grok 3", sub: "xAI", dot: "hsl(220 10% 80%)", icon: grokIcon, bg: "#000000" },
];

interface Toggle {
  key: string;
  title: string;
  desc: string;
  beta?: boolean;
  defaultOn?: boolean;
  Icon: typeof Brain;
}

const TOGGLES: Toggle[] = [
  {
    key: "deep",
    title: "Análise Profunda",
    desc: "Aumenta o número de checks por sinal; mais lento, mais criterioso.",
    beta: true,
    Icon: Brain,
  },
  {
    key: "ml",
    title: "ML Avançado",
    desc: "Ativa rotinas de aprendizado contínuo com dados da conta.",
    Icon: Sparkles,
  },
  {
    key: "shield",
    title: "Escudo de Risco",
    desc: "Aplica stop diário e trava após 2 perdas seguidas.",
    Icon: Shield,
  },
  {
    key: "liquidity",
    title: "Janela de Alta Liquidez",
    desc: "Só opera em janelas pré-definidas de maior liquidez.",
    defaultOn: true,
    Icon: Clock4,
  },
];

interface Props {
  valorEntrada: number;
  setValorEntrada: (v: number) => void;
  saldo: number | null;
  expiracao: number;
  setExpiracao: (v: number) => void;
  maxLoss: number;
  setMaxLoss: (v: number) => void;
  meta: number;
  setMeta: (v: number) => void;
  stopLoss: number;
  setStopLoss: (v: number) => void;
  onStart: () => void;
  onStop: () => void;
  canStart: boolean;
  canStop: boolean;
}

const VALORES_SUGERIDOS = [1, 2, 5, 10, 25, 50, 100, 200, 300, 500];
const EXPIRACOES = [
  { v: 5, label: "5s" },
  { v: 10, label: "10s" },
  { v: 15, label: "15s" },
  { v: 30, label: "30s" },
  { v: 45, label: "45s" },
  { v: 60, label: "1min" },
  { v: 120, label: "2min" },
  { v: 180, label: "3min" },
  { v: 300, label: "5min" },
];

export function AIConfigPanel({
  valorEntrada,
  setValorEntrada,
  saldo,
  expiracao,
  setExpiracao,
  maxLoss,
  setMaxLoss,
  meta,
  setMeta,
  stopLoss,
  setStopLoss,
  onStart,
  onStop,
  canStart,
  canStop,
  section = "all",
}: Props & { section?: "all" | "models" | "controls" }) {
  const [model, setModel] = useState<ModelKey>(() => {
    if (typeof window === "undefined") return "claude";
    return (localStorage.getItem("virtuspro_ia_modelo") as ModelKey) ?? "claude";
  });
  const [modelLoading, setModelLoading] = useState(false);

  const handleSelectModel = (key: ModelKey) => {
    if (key === model || modelLoading) return;

    setModelLoading(true);
    setTimeout(() => {
      setModel(key);
      setModelLoading(false);
    }, 1000);
  };

  const [strategyOpen, setStrategyOpen] = useState(false);

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    TOGGLES.forEach((t) => {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(`virtuspro_ia_toggle_${t.key}`)
          : null;
      init[t.key] = stored != null ? stored === "1" : !!t.defaultOn;
    });
    return init;
  });

  useEffect(() => {
    localStorage.setItem("virtuspro_ia_modelo", model);
  }, [model]);

  const setToggle = (key: string, v: boolean) => {
    setToggles((s) => ({ ...s, [key]: v }));
    localStorage.setItem(`virtuspro_ia_toggle_${key}`, v ? "1" : "0");
  };

  const showModels = section === "all" || section === "models";
  const showControls = section === "all" || section === "controls";

  return (
    <div className="ct-card flex h-full flex-col p-5">
      {showModels && (
        <>
          {/* Section 1: Model */}
          <div>
            <div className="ct-label mb-2.5 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              MODELO DE INTELIGÊNCIA
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODELS.map((m) => {
                const selected = model === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => handleSelectModel(m.key)}
                    className={`group relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                      selected
                        ? "border-[hsl(139_80%_45%)] bg-[hsl(139_80%_45%/0.08)] shadow-[0_0_0_1px_hsl(139_80%_45%/0.4)]"
                        : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-border/60"
                      style={{
                        background: m.bg,
                        boxShadow: selected ? `0 0 10px ${m.dot}` : undefined,
                      }}
                    >
                      <img
                        src={m.icon}
                        alt={m.label}
                        className="h-5 w-5 object-contain"
                        style={m.invert ? { filter: "brightness(0) invert(1)" } : undefined}
                        loading="lazy"
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-none">{m.label}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">{m.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Toggles */}
          <div className="mt-5">
            <div className="ct-label mb-2.5 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Opções Avançadas
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TOGGLES.map((t) => {
                const on = toggles[t.key];
                return (
                  <div
                    key={t.key}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/10 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <t.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold">{t.title}</span>
                        {t.beta && (
                          <span className="rounded-sm bg-[hsl(45_95%_55%/0.2)] px-1 py-px text-[9px] font-bold uppercase text-[hsl(45_95%_60%)]">
                            beta
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={on}
                        onCheckedChange={(v) => setToggle(t.key, v)}
                        className="scale-75"
                      />
                    </div>
                    <p className="text-[10px] leading-snug text-muted-foreground">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showControls && (
        <div className={`flex flex-1 flex-col ${showModels ? "mt-5" : ""}`}>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(139_80%_50%/0.28)] via-[hsl(139_80%_40%/0.14)] to-[hsl(139_80%_30%/0.04)] text-[hsl(139_80%_75%)] ring-1 ring-[hsl(139_80%_55%/0.45)] shadow-[inset_0_1px_0_hsl(139_80%_85%/0.20),0_0_14px_-4px_hsl(139_80%_50%/0.8)]">
              <Settings2 className="h-[15px] w-[15px]" strokeWidth={2.2} />
              <span aria-hidden className="absolute -right-[2px] -top-[2px] h-1.5 w-1.5 rounded-full bg-[hsl(139_80%_60%)] shadow-[0_0_6px_hsl(139_80%_55%)]" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[8.5px] font-bold uppercase tracking-[0.32em] text-[hsl(139_80%_60%)]">Cockpit do Trader</span>
              <span className="mt-1 text-[15px] font-black tracking-tight text-foreground">Planejamento Estratégico</span>
            </div>
          </div>

          {/* Inline config fields */}
          <div className="flex flex-col gap-3.5">
            {/* Linha 1: Valor + Meta + Stop Loss */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cfg-valor" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Valor
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[hsl(139_80%_60%)]">
                    $
                  </span>
                  <Input
                    id="cfg-valor"
                    type="number"
                    step="1"
                    min={1}
                    max={99999}
                    value={valorEntrada}
                    onChange={(e) => {
                      const raw = Math.max(1, Math.floor(Number(e.target.value) || 1));
                      const cap = Math.min(99999, saldo != null && saldo > 0 ? Math.floor(saldo) : 99999);
                      setValorEntrada(Math.min(cap, raw));
                    }}
                    className="h-9 pl-6 pr-2 text-sm font-semibold tabular-nums"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cfg-meta" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Meta
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[hsl(139_80%_60%)]">
                    R$
                  </span>
                  <Input
                    id="cfg-meta"
                    type="number"
                    step="1"
                    min={0}
                    max={99999}
                    value={meta}
                    onChange={(e) => setMeta(Math.min(99999, Math.max(0, Number(e.target.value) || 0)))}
                    className="h-9 pl-8 pr-2 text-sm font-semibold tabular-nums"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cfg-stoploss" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Stop Loss
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[hsl(0_84%_65%)]">
                    R$
                  </span>
                  <Input
                    id="cfg-stoploss"
                    type="number"
                    step="1"
                    min={0}
                    max={99999}
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Math.min(99999, Math.max(0, Number(e.target.value) || 0)))}
                    className="h-9 pl-8 pr-2 text-sm font-semibold tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Chips de valores sugeridos */}
            <div className="flex flex-wrap gap-1.5">
              {VALORES_SUGERIDOS.map((v) => {
                const active = v === valorEntrada;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const cap = Math.min(99999, saldo != null && saldo > 0 ? Math.floor(saldo) : 99999);
                      setValorEntrada(Math.min(cap, v));
                    }}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tabular-nums transition-all ${
                      active
                        ? "bg-[hsl(139_80%_45%/0.18)] text-[hsl(139_80%_70%)] ring-1 ring-[hsl(139_80%_45%/0.45)]"
                        : "bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    ${v}
                  </button>
                );
              })}
            </div>

            {/* Expiração */}
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Clock4 className="h-3 w-3 text-[hsl(139_80%_60%)]" strokeWidth={2.4} />
                Expiração da operação
              </Label>
              <div className="flex flex-nowrap gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {EXPIRACOES.map((opt) => {
                  const active = opt.v === expiracao;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setExpiracao(opt.v)}
                      className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-all ${
                        active
                          ? "bg-[hsl(139_80%_45%/0.18)] text-[hsl(139_80%_70%)] ring-1 ring-[hsl(139_80%_45%/0.45)] shadow-[0_0_10px_-3px_hsl(139_80%_45%/0.6)]"
                          : "bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stop (perdas) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cfg-loss" className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Shield className="h-3 w-3 text-[hsl(0_84%_65%)]" strokeWidth={2.4} />
                Stop (perdas seguidas)
              </Label>
              <Input
                id="cfg-loss"
                type="number"
                step="1"
                min={1}
                max={10}
                value={maxLoss}
                onChange={(e) => setMaxLoss(Math.floor(Number(e.target.value)))}
                className="h-9 text-sm font-semibold tabular-nums"
              />
            </div>
          </div>

          {/* Strategy + Ligar IA */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setStrategyOpen(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-gradient-to-b from-muted/15 to-muted/5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-[hsl(139_80%_45%/0.5)] hover:bg-[hsl(139_80%_45%/0.08)] hover:text-[hsl(139_80%_70%)] hover:shadow-[0_0_18px_-6px_hsl(139_80%_45%/0.7)]"
            >
              <Layers className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" strokeWidth={2.4} />
              Estratégia
            </button>
            {!canStop ? (
              <button
                type="button"
                onClick={onStart}
                disabled={!canStart}
                className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-[hsl(139_80%_50%/0.7)] bg-gradient-to-r from-[hsl(139_80%_30%/0.35)] via-[hsl(139_80%_40%/0.45)] to-[hsl(139_80%_30%/0.35)] px-5 py-4 text-base font-black uppercase tracking-[0.22em] text-[hsl(139_80%_75%)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-4px_hsl(139_80%_50%/0.85)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" fill="currentColor" />
                <span>Ligar IA</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center justify-center gap-2 rounded-xl border border-[hsl(0_84%_60%/0.7)] bg-gradient-to-r from-[hsl(0_75%_28%/0.45)] to-[hsl(10_75%_32%/0.45)] px-5 py-4 text-base font-black uppercase tracking-[0.22em] text-[hsl(0_84%_78%)] transition-all duration-300 hover:shadow-[0_0_22px_-4px_hsl(0_84%_55%/0.85)]"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" />
                Parar IA
              </button>
            )}
          </div>
        </div>
      )}

      <StrategyBuilder open={strategyOpen} onOpenChange={setStrategyOpen} />
      {modelLoading && <LoadingSpinner />}
    </div>
  );
}
