// Dialog shown when user clicks "Acessar Broker" in the sidebar.
// Mirrors the DepositButton style: glass card, step indicator, copy-able credentials.
import { useEffect, useState } from "react";
import { Copy, Check, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BrokerAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokerUrl: string;
}

export const BrokerAccessDialog = ({
  open,
  onOpenChange,
  brokerUrl,
}: BrokerAccessDialogProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const [credsLoading, setCredsLoading] = useState(false);

  useEffect(() => {
    if (!open || email) return;
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
        if (creds) {
          setEmail(creds.casatrade_email || "");
          setPassword(creds.casatrade_password || "");
        }
      } finally {
        setCredsLoading(false);
      }
    })();
  }, [open]);

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
    window.open(brokerUrl, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl">
          {/* Animated gradient background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[hsl(217_91%_60%/0.18)] blur-3xl" />
            <div className="absolute -right-16 top-32 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          {/* Hero */}
          <div className="relative flex flex-col items-center px-6 pt-8 pb-2 text-center">
            {/* Step indicator */}
            <div className="mb-9 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                1
              </span>
              <span className="text-foreground">Login</span>
              <span className="h-px w-6 bg-border" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                2
              </span>
              <span>Operar</span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground">
              ACESSAR A CORRETORA
            </h2>
            <p className="mt-2 max-w-[340px] text-sm leading-relaxed text-muted-foreground">
              Acesse a corretora usando os <strong className="font-semibold text-foreground underline underline-offset-2">mesmos dados</strong> da sua conta registrada na IA Vingativa.
            </p>

            <div className="mt-[18px] inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Ambiente seguro · SSL
            </div>
          </div>

          {/* Credentials */}
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
                  disabled={!email}
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
                      : password ? "•".repeat(Math.min(password.length, 12)) : "—"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(password, "password")}
                  disabled={!password}
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

          {/* Footer */}
          <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/50 bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleProsseguir}
              className="animate-soft-pulse gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:[animation-play-state:paused]"
            >
              Acessar Área de Trade
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
