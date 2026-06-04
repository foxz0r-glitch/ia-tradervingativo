import { useState } from "react";
import { TrendingUp, Copy, Check, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const BrokerAccessButton = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [credsLoading, setCredsLoading] = useState(false);

  const BROKER_URL = "https://trade.casatrade.com/traderoom";

  const handleAcessar = () => {
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
        // silencioso
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
    window.open(BROKER_URL, "_blank");
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAcessar}
        className="group inline-flex h-10 items-center gap-2 rounded-lg border border-border/70 bg-secondary/40 px-4 text-sm font-semibold text-foreground transition-all duration-500 ease-out hover:border-primary/50 hover:bg-secondary hover:shadow-[0_0_24px_-4px_hsl(139_80%_39%/0.65)] active:translate-y-px"
      >
        <TrendingUp className="h-4 w-4 text-[#3ddc97]" strokeWidth={2.5} />
        Acessar Broker
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          <DialogTitle className="sr-only">Acessar a corretora</DialogTitle>
          <DialogDescription className="sr-only">
            Use seus dados de acesso para entrar na corretora.
          </DialogDescription>
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[hsl(139_80%_39%/0.18)] blur-3xl" />
              <div className="absolute -right-16 top-32 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            <div className="relative flex flex-col items-center px-6 pt-8 pb-2 text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(139_80%_39%/0.15)] text-[#3ddc97] shadow-[inset_0_0_0_1px_hsl(139_80%_45%/0.3)]">
                <TrendingUp className="h-6 w-6" strokeWidth={2.4} />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                ACESSAR A CORRETORA
              </h2>
              <p className="mt-2 max-w-[340px] text-sm leading-relaxed text-muted-foreground">
                Entre na corretora usando os <strong className="font-semibold text-foreground underline underline-offset-2">mesmos dados</strong> da sua conta IA Vingativa.
              </p>

              <div className="mt-[18px] inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Ambiente seguro · SSL
              </div>
            </div>

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
                Acessar Broker
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
