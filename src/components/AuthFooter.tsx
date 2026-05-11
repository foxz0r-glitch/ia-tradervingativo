// Footer used only on the Auth page (sign in / sign up).
// Visual-only — pulled in from the reference project, color-adapted to this theme.
import logo from "@/assets/virtus-logo.png";

export const AuthFooter = () => {
  return (
    <footer className="mt-auto border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center space-y-3 text-center">
          <img src={logo} alt="Virtus Pro Analytics" className="h-6 opacity-80" />

          <p className="mx-auto max-w-2xl text-base text-foreground/80">
            #WeAreTraders
          </p>

          <div className="w-full max-w-3xl pt-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground/70">Aviso Legal:</strong> Day
              trade envolve riscos substanciais de perda. Nunca opere com valores
              que você não pode perder. Este programa envolve conteúdo educacional
              e não constitui recomendação de investimento. Rentabilidade passada
              não garante resultados futuros. Opere com responsabilidade.
            </p>
          </div>

          <div className="w-full border-t border-border/30 pt-4">
            <p className="text-xs text-muted-foreground">
              © 2026 Virtus Pro Analytics. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
