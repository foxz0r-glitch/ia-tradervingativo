// Lockup horizontal da IA Vingativa: V verde sólido (com glow) + "IA VINGATIVA".
// Proporções do brand kit (design_handoff_ia_vingativa/reference/logos.jsx — função Lockup,
// variante horizontal, base do V = 62). Tudo escala a partir de `size` (altura do V em px).
// Forçamos font-sans (Space Grotesk) no bloco de texto porque o AppSidebar aplica um
// override inline "Anthropic Sans" que, sem isso, cairia em fallback.

interface BrandLockupProps {
  /** Altura do "V" em px. Os demais valores escalam a partir dela (base = 62). */
  size?: number;
}

export function BrandLockup({ size = 62 }: BrandLockupProps) {
  return (
    <div className="flex items-center" style={{ gap: (size * 16) / 62 }}>
      <img
        src="/symbol-v-solid.svg"
        alt=""
        aria-hidden="true"
        style={{
          height: size,
          width: "auto",
          filter: `drop-shadow(0 0 ${0.2 * size}px rgba(26,230,92,0.7))`,
        }}
      />
      <div className="font-sans font-bold" style={{ lineHeight: 0.96 }}>
        <div
          style={{
            fontSize: (size * 12) / 62,
            letterSpacing: "0.30em",
            color: "#6BFFA6",
          }}
        >
          IA
        </div>
        <div
          style={{
            fontSize: (size * 30) / 62,
            letterSpacing: "0.01em",
            color: "#EEF4F8",
            marginTop: (size * 3) / 62,
          }}
        >
          VINGATIVA
        </div>
      </div>
    </div>
  );
}

export default BrandLockup;
