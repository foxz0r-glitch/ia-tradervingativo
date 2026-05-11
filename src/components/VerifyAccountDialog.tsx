// Modal shown when the user clicks "Verificar Conta" in the user dropdown.
// UI-only: explains the email confirmation flow. Logic is wired later.
import { MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VerifyAccountDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  email: string;
}

export function VerifyAccountDialog({ open, onOpenChange, email }: VerifyAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-border/60 bg-card/95 p-0 backdrop-blur-xl">
        {/* Decorative top */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-8 pt-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[hsl(217_91%_60%/0.18)] blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_32px_hsl(var(--primary)/0.35)]">
              <MailCheck className="h-8 w-8 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                <ShieldCheck className="h-3 w-3" />
              </span>
            </div>

            <DialogTitle className="mt-5 text-xl font-bold tracking-tight text-foreground">
              Confirme seu e-mail
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-sm text-sm text-muted-foreground">
              Para verificar sua conta e desbloquear todos os recursos, confirme o e-mail
              cadastrado:
            </DialogDescription>

            {email && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-sm font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                {email}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-2">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>
                Enviaremos um link de confirmação para o e-mail acima — basta clicar para
                concluir.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>Verifique também sua caixa de spam ou promoções.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-3 w-3" />
              </span>
              <span>Após confirmar, o selo de conta verificada aparecerá no seu perfil.</span>
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-muted-foreground hover:text-foreground"
            >
              Agora não
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/90"
            >
              <MailCheck className="h-4 w-4" />
              Reenviar e-mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
