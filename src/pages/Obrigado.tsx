import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const CODE = "1337";

const Obrigado = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Fundo radial verde → quase-preto (tokens do repo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, hsl(139 80% 9% / 0.65) 0%, hsl(var(--background)) 60%)",
        }}
      />
      {/* Grid overlay neon sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(hsl(139 80% 50% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(139 80% 50% / 0.04) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
        }}
      />

      {/* Marca no topo: "V" neon + IA VINGATIVA */}
      <header className="flex shrink-0 justify-center px-4 pt-8 pb-2">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-primary/40 bg-primary/10 text-primary">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" aria-hidden>
              <path
                d="M22 26 L50 74 L78 26"
                stroke="currentColor"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[0.22em] text-primary/70">
            IA Vingativa
          </span>
        </span>
      </header>

      {/* Painel central glass */}
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <div
          className="relative w-full max-w-md rounded-3xl border border-primary/25 p-8 text-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500 sm:p-10"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 0%, hsl(139 80% 13% / 0.6) 0%, hsl(216 33% 5% / 0.92) 72%)",
            boxShadow: "var(--shadow-card), 0 0 60px -16px hsl(139 80% 50% / 0.45)",
          }}
        >
          {/* Ícone de sucesso com anel pulsante */}
          <div className="relative mx-auto h-20 w-20">
            <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/50" />
            <span
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(139 80% 50% / 0.45), hsl(142 88% 30%))",
                boxShadow: "0 0 40px -8px hsl(139 80% 50% / 0.8)",
              }}
            >
              <Check className="h-9 w-9 text-primary-foreground" strokeWidth={3} />
            </span>
          </div>

          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            Pagamento confirmado
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-[28px]">
            Obrigado pela compra!
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Use o código abaixo para ativar seu plano ao acessar sua conta na IA Vingativa.
          </p>

          {/* Card do código — código universal fixo "1337" */}
          <div
            className={`mt-6 rounded-2xl border p-5 text-left transition-colors ${
              copied ? "border-primary/50" : "border-primary/20"
            }`}
            style={{ background: "hsl(216 33% 4% / 0.55)" }}
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/70">
              Código de ativação
            </div>
            <div className="ct-mono mt-2 text-center text-5xl font-bold tracking-[0.3em] text-foreground [text-shadow:0_0_28px_hsl(139_80%_50%/0.45)]">
              {CODE}
            </div>
            <button
              onClick={handleCopy}
              className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold tracking-wide transition-all ${
                copied
                  ? "border-primary/50 bg-primary/15 text-[hsl(var(--mm5))]"
                  : "border-primary/35 bg-primary/[0.06] text-primary hover:bg-primary/10"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                  Código copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" strokeWidth={1.8} />
                  Copiar código
                </>
              )}
            </button>
          </div>

          {/* CTA → /?tab=signup (abre a aba Criar Conta) */}
          <Link
            to="/?tab=signup"
            className="btn-premium btn-emerald mt-4 h-14 w-full rounded-2xl text-[15px]"
          >
            Criar minha conta
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>

          <p className="mt-3.5 text-[11px] leading-relaxed text-muted-foreground/80">
            Guarde este código.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Obrigado;
