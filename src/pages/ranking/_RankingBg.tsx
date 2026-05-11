/**
 * RankingBg — fundo premium harmônico para todas as páginas Ranking.
 * Aurora esmeralda + grid sutil + vinheta. Fixed atrás de tudo.
 */
export default function RankingBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base radial — leve esmeralda no topo, fade para preto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, hsl(160 60% 12% / 0.55), transparent 60%), radial-gradient(ellipse 70% 50% at 100% 100%, hsl(150 70% 10% / 0.35), transparent 60%), radial-gradient(ellipse 70% 50% at 0% 100%, hsl(170 60% 10% / 0.30), transparent 60%), hsl(220 25% 4%)",
        }}
      />
      {/* aurora superior */}
      <div
        className="absolute -top-24 left-1/2 h-[640px] w-[1200px] -translate-x-1/2 rounded-[50%] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse, hsl(160 84% 45% / 0.18) 0%, hsl(150 90% 55% / 0.10) 35%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* orbs laterais */}
      <div
        className="absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(160 84% 45% / 0.18), transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="absolute -right-32 top-1/2 h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(150 90% 55% / 0.14), transparent 60%)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="absolute left-1/4 bottom-0 h-[360px] w-[360px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(170 70% 40% / 0.10), transparent 60%)",
          filter: "blur(90px)",
        }}
      />

      {/* grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160 84% 60% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 60% / 0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      />

      {/* noise / textura ultra sutil */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* vinheta */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 50%, hsl(220 25% 3% / 0.85) 100%)",
        }}
      />
    </div>
  );
}
