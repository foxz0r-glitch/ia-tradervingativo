import { useState } from "react";
import { Plus, Copy, Check, Mail, Lock, ArrowRight, Wallet, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DepositButtonProps {
  variant?: "default" | "icon" | "wallet" | "wallet-card";
  children?: React.ReactNode;
  label?: string;
}

export const DepositButton = ({ variant = "default", children, label }: DepositButtonProps = {}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [credsLoading, setCredsLoading] = useState(false);

  const handleDepositar = () => {
    setOpen(true);
    if (email) return;
    setCredsLoading(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { data: creds } = await supabase
          .from("user_credentials")
          .select("casatrade_email, casatrade_password")
          .eq("id", user.id)
          .maybeSingle();
        if (creds?.casatrade_email) setEmail(creds.casatrade_email);
        if (creds?.casatrade_password) setPassword(creds.casatrade_password);
      } catch {
        // silencioso — o usuário ainda pode prosseguir para a corretora
      } finally {
        setCredsLoading(false);
      }
    })();
  };

  const handleCopy = async (value: string, field: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(`${field === "email" ? "E-mail" : "Senha"} copiado!`);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleProsseguir = () => {
    window.open("https://trade.casatrade.com/pt/counting", "_blank");
  };

  return (
    <>
      {variant === "wallet-card" ? (
        <button
          type="button"
          onClick={handleDepositar}
          title="Depositar"
          aria-label="Depositar"
          className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-[hsl(139_80%_45%/0.35)] bg-gradient-to-br from-[hsl(139_80%_30%/0.25)] via-[hsl(139_80%_22%/0.15)] to-[hsl(139_80%_18%/0.05)] px-3.5 py-2 text-left shadow-[inset_0_1px_0_hsl(139_80%_70%/0.18),0_0_30px_-10px_hsl(139_80%_45%/0.65)] transition-all hover:border-[hsl(139_80%_50%/0.55)] hover:shadow-[inset_0_1px_0_hsl(139_80%_70%/0.25),0_0_36px_-8px_hsl(139_80%_50%/0.8)] active:translate-y-px"
        >
          <span className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[hsl(139_80%_70%/0.7)] to-transparent" />
          <span className="pointer-events-none absolute -inset-y-4 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 group-hover:translate-x-[400%]" />
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(139_80%_45%)] to-[hsl(139_80%_30%)] text-[hsl(139_30%_8%)] shadow-[inset_0_1px_0_hsl(139_80%_75%/0.6),0_4px_10px_-2px_hsl(139_80%_39%/0.6)] transition-all group-hover:from-[hsl(139_80%_52%)] group-hover:to-[hsl(139_80%_36%)] group-hover:shadow-[inset_0_1px_0_hsl(139_80%_80%/0.7),0_6px_16px_-2px_hsl(139_80%_45%/0.8)]">
            <span className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <Wallet className="h-4 w-4 transition-transform duration-300 group-hover:scale-0 group-hover:opacity-0" strokeWidth={2.5} />
            <Plus className="absolute h-[18px] w-[18px] scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-hover:rotate-90" strokeWidth={2.75} />
          </span>
          {children}
        </button>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={handleDepositar}
          title="Depositar"
          aria-label="Depositar"
          className="group relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[hsl(139_80%_45%)] to-[hsl(139_80%_34%)] text-[hsl(139_30%_8%)] shadow-[0_4px_14px_-2px_hsl(139_80%_39%/0.55),inset_0_1px_0_hsl(139_80%_75%/0.5)] transition-all hover:from-[hsl(139_80%_50%)] hover:to-[hsl(139_80%_38%)] hover:shadow-[0_6px_20px_-2px_hsl(139_80%_45%/0.75),inset_0_1px_0_hsl(139_80%_80%/0.6)] active:translate-y-px"
        >
          <span className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <Plus className="h-5 w-5" strokeWidth={2.75} />
        </button>
      ) : variant === "wallet" ? (
        <button
          type="button"
          onClick={handleDepositar}
          title="Depositar"
          aria-label="Depositar"
          className="group relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(139_80%_45%)] to-[hsl(139_80%_30%)] text-[hsl(139_30%_8%)] shadow-[inset_0_1px_0_hsl(139_80%_75%/0.6),0_4px_10px_-2px_hsl(139_80%_39%/0.6)] transition-all hover:from-[hsl(139_80%_52%)] hover:to-[hsl(139_80%_36%)] hover:shadow-[inset_0_1px_0_hsl(139_80%_80%/0.7),0_6px_16px_-2px_hsl(139_80%_45%/0.8)] active:translate-y-px"
        >
          <span className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <Wallet className="h-4 w-4 transition-transform duration-300 group-hover:scale-0 group-hover:opacity-0" strokeWidth={2.5} />
          <Plus className="absolute h-[18px] w-[18px] scale-0 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-hover:rotate-90" strokeWidth={2.75} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDepositar}
          className="group relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-lg border border-[hsl(139_80%_50%/0.6)] bg-gradient-to-b from-[hsl(139_80%_44%)] to-[hsl(139_80%_32%)] px-3 text-xs font-semibold text-[hsl(139_30%_8%)] shadow-[0_4px_14px_-4px_hsl(139_80%_39%/0.6),inset_0_1px_0_hsl(139_80%_78%/0.5)] transition-all duration-300 hover:from-[hsl(139_80%_50%)] hover:to-[hsl(139_80%_36%)] hover:border-[hsl(139_80%_55%/0.8)] hover:shadow-[0_6px_22px_-4px_hsl(139_80%_45%/0.8),inset_0_1px_0_hsl(139_80%_82%/0.6)] active:translate-y-px sm:gap-2 sm:px-4 sm:text-sm"
        >
          {/* top shine */}
          <span className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          {/* sweep */}
          <span className="pointer-events-none absolute -inset-y-3 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
          <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.75} />
          <span className="relative">{label ?? "Depositar"}</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          <DialogTitle className="sr-only">Depositar na corretora</DialogTitle>
          <DialogDescription className="sr-only">
            Use seus dados de acesso para entrar na corretora e realizar o depósito.
          </DialogDescription>
          {/* Glass card with vertical hero layout */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl">
            {/* Animated gradient background */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[hsl(217_91%_60%/0.18)] blur-3xl" />
              <div className="absolute -right-16 top-32 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            {/* Hero icon + title centered */}
            <div className="relative flex flex-col items-center px-6 pt-8 pb-2 text-center">
              {/* Step indicator — Passo 1 de 2 */}
              <div className="mb-9 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  1
                </span>
                <span className="text-foreground">Depósito</span>
                <span className="h-px w-6 bg-border" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                  2
                </span>
                <span>Ativação</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                DEPOSITE PARA COMEÇAR
              </h2>
              <p className="mt-2 max-w-[340px] text-sm leading-relaxed text-muted-foreground">
                Acesse a corretora usando os <strong className="font-semibold text-foreground underline underline-offset-2">mesmos dados</strong> da sua conta registrada na IA Vingativa.
              </p>

              {/* Subtle status badge */}
              <div className="mt-[18px] inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Ambiente seguro · SSL
              </div>
            </div>

            {/* Credential cards */}
            <div className="relative space-y-2.5 px-6 pt-6 pb-2">
              <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-muted/50 to-muted/20 p-3 transition-all hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/60 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      E-mail
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {credsLoading ? <span className="animate-pulse text-muted-foreground">carregando...</span> : (email || "—")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(email, "email")}
                    className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/15 hover:text-primary"
                    aria-label="Copiar e-mail"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-muted/50 to-muted/20 p-3 transition-all hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/60 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Senha
                    </p>
                    <p className="truncate font-mono text-sm tracking-[0.25em] text-foreground">
                      {credsLoading
                        ? <span className="animate-pulse text-muted-foreground normal-case tracking-normal font-sans text-sm">carregando...</span>
                        : password
                          ? (showPassword ? password : "•".repeat(Math.min(password.length, 12)))
                          : "—"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((v) => !v)}
                    className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/15 hover:text-primary"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(password, "password")}
                    className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/15 hover:text-primary"
                    aria-label="Copiar senha"
                  >
                    {copiedField === "password" ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                </div>
              </div>
            </div>

            {/* Footer — Cancelar + Prosseguir lado a lado (igual ao antigo Depositar) */}
            <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/50 bg-muted/20 px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={handleProsseguir}
                className="animate-soft-pulse gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:[animation-play-state:paused]"
              >
                Depositar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
