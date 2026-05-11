import { Play, Sparkles, Hexagon, Zap, ShieldCheck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DepositButton } from "@/components/DepositButton";
import { DEMO_MAX_SESSIONS } from "@/hooks/useDemoMode";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** "available" = sessões restantes | "exhausted" = esgotadas */
  mode: "available" | "exhausted";
  sessionsLeft: number;
  onStartDemo: () => void;
  running?: boolean;
}

/* ─────────── Shared shell (mesma identidade do popover de operação) ─────────── */
function PremiumShell({
  accent,
  children,
}: {
  /** "primary" = verde Virtus | "amber" = alerta */
  accent: "primary" | "amber";
  children: React.ReactNode;
}) {
  const tokens =
    accent === "primary"
      ? {
          border: "hsl(160 84% 45% / 0.28)",
          shadow:
            "0 0 60px -12px hsl(160 84% 45% / 0.45), inset 0 1px 0 hsl(160 84% 60% / 0.12)",
          glowA: "hsl(160 84% 45% / 0.18)",
          glowB: "hsl(160 84% 60% / 0.08)",
          stripe:
            "linear-gradient(90deg, transparent, hsl(160 84% 55% / 0.55), transparent)",
        }
      : {
          border: "hsl(38 92% 55% / 0.30)",
          shadow:
            "0 0 60px -12px hsl(38 92% 50% / 0.45), inset 0 1px 0 hsl(38 92% 65% / 0.12)",
          glowA: "hsl(38 92% 55% / 0.20)",
          glowB: "hsl(38 92% 65% / 0.08)",
          stripe:
            "linear-gradient(90deg, transparent, hsl(38 92% 60% / 0.55), transparent)",
        };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: tokens.border,
        background:
          "linear-gradient(180deg, hsl(220 22% 9% / 0.98), hsl(220 25% 6% / 0.99))",
        boxShadow: tokens.shadow,
      }}
    >
      {/* top stripe */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: tokens.stripe }}
      />
      {/* glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: tokens.glowA }}
        />
        <div
          className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: tokens.glowB }}
        />
      </div>
      {/* grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function DemoModeModal({
  open,
  onOpenChange,
  mode,
  sessionsLeft,
  onStartDemo,
  running,
}: Props) {
  /* ──────────────────────────── ESGOTADAS ──────────────────────────── */
  if (mode === "exhausted") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-md [&>button.absolute]:hidden">
          <DialogTitle className="sr-only">Sessões demo esgotadas</DialogTitle>
          <DialogDescription className="sr-only">
            Realize um depósito para continuar usando a Virtus Pro Analytics.
          </DialogDescription>

          <PremiumShell accent="amber">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-gradient-to-r from-card/80 via-card/40 to-transparent px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: "hsl(38 92% 55% / 0.35)",
                    background: "hsl(38 92% 50% / 0.12)",
                    boxShadow: "0 0 18px -6px hsl(38 92% 55% / 0.6)",
                  }}
                >
                  <ShieldCheck className="h-5 w-5 text-[hsl(38_92%_65%)]" />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-black uppercase tracking-tight text-foreground">
                    SALDO DEMO
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <Hexagon
                      className="h-2 w-2 text-[hsl(38_92%_60%)]"
                      fill="currentColor"
                    />
                    ACESSO RESTRITO
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Hero */}
            <div className="border-b border-border/30 px-5 py-6 text-center">
              <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
                Status
              </div>
              <div
                className="mt-1.5 text-2xl font-black leading-none tracking-tight"
                style={{
                  color: "hsl(38 92% 70%)",
                  textShadow: "0 0 22px hsl(38 92% 55% / 0.6)",
                }}
              >
                {DEMO_MAX_SESSIONS} / {DEMO_MAX_SESSIONS}
              </div>
              <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(38_92%_70%)]/80">
                sessões simuladas utilizadas
              </div>

              <p className="mx-auto mt-4 max-w-[340px] text-[13px] leading-relaxed text-muted-foreground">
                Faça seu <strong className="font-bold text-foreground underline underline-offset-2">depósito</strong> e desbloqueie{" "}
                <strong className="font-bold text-foreground underline underline-offset-2">acesso ilimitado</strong> às<br />
                operações automatizadas em conta real.
              </p>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-3 p-4">
              <span className="h-3.5" aria-hidden />
              <span className="self-end whitespace-nowrap text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(160_84%_70%)]/80">
                COMECE LUCRAR AGORA
              </span>
              <Button
                variant="outline"
                className="group relative h-12 w-full justify-center gap-2 overflow-hidden rounded-xl border border-[hsl(38_92%_55%/0.5)] bg-secondary/40 px-3 text-[12px] font-black uppercase tracking-wider text-foreground transition-all duration-500 ease-out hover:border-[hsl(38_92%_55%/0.8)] hover:bg-secondary/60 hover:text-foreground"
              >
                <Play className="h-4 w-4 text-[hsl(38_92%_65%)]" />
                <span>Tutoriais</span>
              </Button>
              <div className="[&>button]:!h-12 [&>button]:!w-full [&>button]:!rounded-xl [&>button]:!text-[12px] [&>button]:!font-black [&>button]:!uppercase [&>button]:!tracking-wider [&>button]:!shadow-none [&>button:hover]:!shadow-none">
                <DepositButton variant="default" />
              </div>
            </div>
          </PremiumShell>
        </DialogContent>
      </Dialog>
    );
  }

  /* ──────────────────────────── DISPONÍVEIS ──────────────────────────── */
  const used = DEMO_MAX_SESSIONS - sessionsLeft;

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-md [&>button.absolute]:hidden">
          <DialogTitle className="sr-only">Conta Demo</DialogTitle>
        <DialogDescription className="sr-only">
          Inicie operações demonstrativas gratuitas.
        </DialogDescription>

        <PremiumShell accent="primary">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-gradient-to-r from-card/80 via-card/40 to-transparent px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg border"
                style={{
                  borderColor: "hsl(160 84% 45% / 0.35)",
                  background: "hsl(160 84% 25% / 0.18)",
                  boxShadow: "0 0 18px -6px hsl(160 84% 50% / 0.6)",
                }}
              >
                <Zap className="h-5 w-5 fill-[hsl(160_84%_65%)] text-[hsl(160_84%_65%)]" />
              </div>
              <div className="leading-tight">
                <div className="text-base font-black uppercase tracking-tight text-foreground">
                  SALDO DEMO
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(160_84%_55%)] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(160_84%_55%)]" />
                  </span>
                  Modo Simulação
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hero */}
          <div className="border-b border-border/30 px-5 py-5 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Sessões Simuladas Disponíveis
            </div>
            <div
              className="ct-mono mt-2 text-4xl font-black leading-none tabular-nums"
              style={{
                color: "hsl(160 84% 70%)",
                textShadow: "0 0 22px hsl(160 84% 50% / 0.7)",
              }}
            >
              {sessionsLeft}
              <span className="text-xl text-muted-foreground/60">
                /{DEMO_MAX_SESSIONS}
              </span>
            </div>
            <p className="mx-auto mt-4 max-w-[360px] text-[11px] font-medium uppercase leading-[1.7] tracking-[0.12em] text-muted-foreground">
              <span className="whitespace-nowrap">Descubra como a inteligência artificial</span>
              <br />
              <span className="whitespace-nowrap">pode te ajudar em ambiente real</span>
            </p>
          </div>

          {/* Sessions chips */}
          <div className="grid grid-cols-3 gap-2 border-b border-border/30 p-3">
            {Array.from({ length: DEMO_MAX_SESSIONS }, (_, i) => {
              const num = i + 1;
              const isUsed = num <= used;
              return (
                <div
                  key={num}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center transition-all",
                  )}
                  style={
                    isUsed
                      ? {
                          borderColor: "hsl(220 10% 25% / 0.6)",
                          background: "hsl(220 15% 12% / 0.5)",
                        }
                      : {
                          borderColor: "hsl(160 84% 45% / 0.30)",
                          background: "hsl(160 84% 25% / 0.10)",
                          boxShadow: "0 0 14px -6px hsl(160 84% 50% / 0.4)",
                        }
                  }
                >
                  <div
                    className={cn(
                      "text-[8px] font-bold uppercase tracking-[0.22em]",
                      isUsed
                        ? "text-muted-foreground/50"
                        : "text-muted-foreground",
                    )}
                  >
                    Sessão
                  </div>
                  <div
                    className={cn(
                      "ct-mono mt-0.5 text-base font-black tabular-nums leading-none",
                      isUsed && "text-muted-foreground/40 line-through",
                    )}
                    style={
                      !isUsed
                        ? {
                            color: "hsl(160 84% 72%)",
                            textShadow: "0 0 12px hsl(160 84% 50% / 0.6)",
                          }
                        : undefined
                    }
                  >
                    {num}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3 p-4">
            <span className="h-3.5" aria-hidden />
            <span className="self-end whitespace-nowrap text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(160_84%_70%)]/80">
              ou opere em conta real
            </span>
            <Button
              onClick={onStartDemo}
              disabled={running}
              variant="outline"
              className="group relative h-12 w-full justify-center gap-2 overflow-hidden rounded-xl border border-[hsl(160_84%_45%/0.5)] bg-secondary/40 px-3 text-[12px] font-black uppercase tracking-wider text-foreground transition-all duration-500 ease-out hover:border-[hsl(160_84%_45%/0.8)] hover:bg-secondary/60 hover:text-foreground"
            >
              <Zap className="h-4 w-4 text-[hsl(160_84%_65%)]" />
              <span>Iniciar Demo</span>
              <span className="ct-mono opacity-70">
                {sessionsLeft}/{DEMO_MAX_SESSIONS}
              </span>
            </Button>
            <div className="[&>button]:!h-12 [&>button]:!w-full [&>button]:!rounded-xl [&>button]:!text-[12px] [&>button]:!font-black [&>button]:!uppercase [&>button]:!tracking-wider [&>button]:!shadow-none [&>button:hover]:!shadow-none">
              <DepositButton variant="default" />
            </div>
          </div>
        </PremiumShell>
      </DialogContent>
    </Dialog>
  );
}
