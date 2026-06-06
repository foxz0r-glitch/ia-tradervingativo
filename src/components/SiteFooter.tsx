export function SiteFooter() {
  return (
    <footer className="w-full bg-background pt-8 pb-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 text-center">
        <p className="text-sm font-semibold tracking-wide text-foreground">
          #WeAreTraders
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Aviso Legal:</span> Day trade envolve riscos substanciais de perda. Nunca opere com valores que você não pode perder. Este programa envolve conteúdo educacional e não constitui recomendação de investimento. Rentabilidade passada não garante resultados futuros. Opere com responsabilidade.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          © 2026 IA Vingativa. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
