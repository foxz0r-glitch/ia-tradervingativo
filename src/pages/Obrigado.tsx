import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthFooter } from "@/components/AuthFooter";
import { BrandLockup } from "@/components/BrandLockup";

const Obrigado = () => {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    (supabase.rpc as any)("get_activation_code_by_order", { p_order_id: orderId })
      .then(({ data }: { data: string | null }) => {
        setCode(data ?? null);
        setLoading(false);
      });
  }, [orderId]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <div className="animate-float"><BrandLockup size={64} /></div>
          </div>

          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
            Compra Confirmada!
          </h1>
          <p className="mb-8 text-muted-foreground">
            Bem-vindo à IA Vingativa. Seu acesso está pronto para ser ativado.
          </p>

          {orderId ? (
            <div className="mb-8 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-sm">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Seu Código de Ativação
              </p>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Carregando código...</span>
                </div>
              ) : code ? (
                <>
                  <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-6 py-4">
                    <span className="font-mono text-2xl font-bold tracking-[0.15em] text-primary">
                      {code}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copiado!" : "Copiar código"}
                  </button>
                </>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  Código não encontrado. Entre em contato com o suporte.
                </p>
              )}
            </div>
          ) : (
            <div className="mb-8 rounded-2xl border border-border/60 bg-card/80 p-6">
              <p className="text-muted-foreground">
                Seu código de ativação foi gerado. Verifique o e-mail usado no checkout.
              </p>
            </div>
          )}

          <div className="mb-6 rounded-xl border border-border/40 bg-card/40 p-4 text-left text-sm text-muted-foreground">
            <p className="mb-2 font-semibold text-foreground">Como ativar seu plano:</p>
            <ol className="space-y-1.5 pl-1">
              <li>1. Crie sua conta na IA Vingativa usando o botão abaixo</li>
              <li>2. Acesse o dashboard e clique em <strong className="text-foreground">"Ativar Plano"</strong></li>
              <li>3. Cole o código acima e confirme</li>
            </ol>
            <p className="mt-3 text-xs">
              Use o <strong className="text-foreground">mesmo e-mail</strong> que você utilizou no checkout.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] transition hover:bg-primary/90"
          >
            Criar minha conta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default Obrigado;
