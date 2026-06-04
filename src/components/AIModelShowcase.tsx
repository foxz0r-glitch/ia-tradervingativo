/**
 * AIModelShowcase — 5 variantes de seletor "Modelo de Inteligência" em layout 2x2.
 * Apenas visual / showcase para o usuário escolher o oficial.
 */
import { useState } from "react";
import { Sparkles, Cpu, Bot, Zap, Hexagon, Check } from "lucide-react";
import claudeIcon from "@/assets/ai-claude.webp";
import gptIcon from "@/assets/ai-gpt.webp";
import geminiIcon from "@/assets/ai-gemini.webp";
import grokIcon from "@/assets/ai-grok.webp";

type ModelKey = "claude" | "gpt5" | "gemini" | "grok3";

const MODELS: { key: ModelKey; label: string; sub: string; icon: string; accent: string }[] = [
  { key: "claude", label: "Claude", sub: "Anthropic", icon: claudeIcon, accent: "25 95% 55%" },
  { key: "gpt5", label: "GPT-5", sub: "OpenAI", icon: gptIcon, accent: "139 80% 45%" },
  { key: "gemini", label: "Gemini", sub: "Google", icon: geminiIcon, accent: "217 91% 60%" },
  { key: "grok3", label: "Grok 3", sub: "xAI", icon: grokIcon, accent: "280 70% 60%" },
];

const PRIMARY = "139 80% 45%";

function Frame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/30 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-[12px] font-bold uppercase tracking-[0.25em] text-foreground/90">{title}</h4>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

/* ===== Variant A — Glass Cards ===== */
function VariantGlass() {
  const [sel, setSel] = useState<ModelKey>("gpt5");
  return (
    <div className="ct-card px-5 py-5">
      <div className="ct-label mb-4 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        MODELO DE INTELIGÊNCIA
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MODELS.map((m) => {
          const selected = sel === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSel(m.key)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-left backdrop-blur-md transition-all ${
                selected
                  ? "border-[hsl(139_80%_50%)] bg-[hsl(139_80%_45%/0.08)] shadow-[0_0_0_1px_hsl(139_80%_50%),0_8px_28px_-12px_hsl(139_80%_45%/0.6)]"
                  : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-border/60">
                <img src={m.icon} alt={m.label} className="h-full w-full object-cover" loading="lazy" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-bold text-foreground">{m.label}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{m.sub}</div>
              </div>
              {selected && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(139_80%_45%)] text-[hsl(139_30%_8%)]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Variant B — Neon Tiles ===== */
function VariantNeon() {
  const [sel, setSel] = useState<ModelKey>("gpt5");
  return (
    <div className="ct-card px-5 py-5">
      <div className="ct-label mb-4 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-[hsl(139_80%_55%)]" />
        MODELO DE INTELIGÊNCIA
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MODELS.map((m) => {
          const selected = sel === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSel(m.key)}
              className={`group relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all ${
                selected
                  ? "border-[hsl(139_80%_55%/0.7)] bg-[hsl(139_80%_45%/0.08)]"
                  : "border-border/40 bg-muted/5 hover:border-[hsl(139_80%_45%/0.4)]"
              }`}
              style={
                selected
                  ? { boxShadow: `0 0 24px -6px hsl(${m.accent} / 0.5), inset 0 1px 0 hsl(${m.accent} / 0.18)` }
                  : undefined
              }
            >
              {selected && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -top-px h-px"
                  style={{ background: `linear-gradient(90deg, transparent, hsl(${m.accent}), transparent)` }}
                />
              )}
              <div className="flex items-center gap-3">
                <span
                  className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card ring-1"
                  style={{ borderColor: selected ? `hsl(${m.accent} / 0.6)` : undefined, ["--tw-ring-color" as any]: selected ? `hsl(${m.accent} / 0.6)` : "hsl(var(--border) / 0.6)" }}
                >
                  <img src={m.icon} alt={m.label} className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm font-bold tracking-wide text-foreground">{m.label}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: `hsl(${m.accent})`, boxShadow: `0 0 6px hsl(${m.accent})` }}
                    />
                    {m.sub}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Variant C — Premium Stack (com badge "Selecionada") ===== */
function VariantPremium() {
  const [sel, setSel] = useState<ModelKey>("gpt5");
  return (
    <div className="ct-card px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="ct-label flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          MODELO DE INTELIGÊNCIA
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">4 disponíveis</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {MODELS.map((m) => {
          const selected = sel === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSel(m.key)}
              className={`group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                selected
                  ? "border-[hsl(139_80%_50%)] bg-gradient-to-br from-[hsl(139_80%_45%/0.12)] to-transparent"
                  : "border-border/50 hover:border-border hover:bg-muted/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-border/60">
                  <img src={m.icon} alt={m.label} className="h-full w-full object-cover" />
                </span>
                {selected && (
                  <span className="rounded-full border border-[hsl(139_80%_50%/0.5)] bg-[hsl(139_80%_45%/0.12)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(139_80%_70%)]">
                    Ativa
                  </span>
                )}
              </div>
              <div className="leading-tight">
                <div className="truncate text-sm font-bold text-foreground">{m.label}</div>
                <div className="truncate text-[11px] text-muted-foreground">{m.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Variant D — Minimal Slate ===== */
function VariantMinimal() {
  const [sel, setSel] = useState<ModelKey>("gpt5");
  return (
    <div className="ct-card px-5 py-5">
      <div className="ct-label mb-4 flex items-center gap-2">
        <Bot className="h-3.5 w-3.5 text-primary" />
        MODELO DE INTELIGÊNCIA
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MODELS.map((m) => {
          const selected = sel === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSel(m.key)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                selected
                  ? "bg-[hsl(139_80%_45%/0.10)] ring-1 ring-inset ring-[hsl(139_80%_50%/0.55)]"
                  : "ring-1 ring-inset ring-border/40 hover:ring-border"
              }`}
            >
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                <img src={m.icon} alt={m.label} className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-semibold text-foreground">{m.label}</div>
                <div className="truncate text-[11px] text-muted-foreground/80">{m.sub}</div>
              </div>
              <span
                className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                  selected ? "bg-[hsl(139_80%_55%)] shadow-[0_0_8px_hsl(139_80%_55%)]" : "bg-muted-foreground/20"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Variant E — Hex Holographic ===== */
function VariantHex() {
  const [sel, setSel] = useState<ModelKey>("gpt5");
  return (
    <div className="ct-card relative overflow-hidden px-5 py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(139 80% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(139 80% 60%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative ct-label mb-4 flex items-center gap-2">
        <Hexagon className="h-3.5 w-3.5 text-[hsl(139_80%_55%)]" />
        MODELO DE INTELIGÊNCIA
      </div>
      <div className="relative grid grid-cols-2 gap-3">
        {MODELS.map((m) => {
          const selected = sel === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSel(m.key)}
              className={`group relative overflow-hidden rounded-xl px-4 py-3.5 text-left transition-all ${
                selected ? "" : "hover:translate-y-[-1px]"
              }`}
              style={{
                background: selected
                  ? `linear-gradient(135deg, hsl(${m.accent} / 0.18), hsl(220 25% 7% / 0.6))`
                  : "linear-gradient(135deg, hsl(220 25% 9% / 0.5), hsl(220 25% 7% / 0.3))",
                border: selected ? `1px solid hsl(${m.accent} / 0.7)` : "1px solid hsl(var(--border) / 0.5)",
                boxShadow: selected ? `0 0 20px -6px hsl(${m.accent} / 0.55), inset 0 1px 0 hsl(${m.accent} / 0.2)` : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden"
                  style={{
                    clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
                    background: `linear-gradient(135deg, hsl(${m.accent} / 0.4), hsl(${m.accent} / 0.1))`,
                    padding: 2,
                  }}
                >
                  <span
                    className="flex h-full w-full items-center justify-center overflow-hidden bg-card"
                    style={{ clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" }}
                  >
                    <img src={m.icon} alt={m.label} className="h-full w-full object-cover" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm font-bold text-foreground">{m.label}</div>
                  <div className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{m.sub}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AIModelShowcase() {
  return (
    <section className="ct-card px-5 py-5 lg:col-span-4">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">
            5 variantes — Modelo de Inteligência (2×2)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Escolha qual layout deseja como oficial. Os ícones estão ~10% maiores.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Frame title="01 · Glass Cards" subtitle="Clean & blur"><VariantGlass /></Frame>
        <Frame title="02 · Neon Tiles" subtitle="Cyber accent"><VariantNeon /></Frame>
        <Frame title="03 · Premium Stack" subtitle="Editorial"><VariantPremium /></Frame>
        <Frame title="04 · Minimal Slate" subtitle="Quiet UI"><VariantMinimal /></Frame>
        <Frame title="05 · Hex Holographic" subtitle="Top-tier"><VariantHex /></Frame>
      </div>
    </section>
  );
}
