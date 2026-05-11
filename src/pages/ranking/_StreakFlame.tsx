/**
 * StreakFlame — chip único e padrão para sequência (streak) usado em todo lugar:
 * sidebar, ranking, badge e MVP cards.
 *
 * Visual: pílula laranja vibrante com ícone Zap (raio) branco e glow suave.
 * O usuário pediu para trocar o ícone Flame por algo diferente — Zap traz a
 * mesma energia ("em chamas") sem ser literal.
 */
import { Zap } from "lucide-react";

interface Props {
  days: number;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { pad: "2px 7px", icon: 10, font: 10, gap: 3 },
  md: { pad: "3px 9px", icon: 12, font: 11, gap: 4 },
  lg: { pad: "4px 11px", icon: 14, font: 13, gap: 5 },
} as const;

export default function StreakFlame({ days, size = "md" }: Props) {
  const s = SIZES[size];
  return (
    <span
      className="streak-flame-chip"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        padding: s.pad,
        borderRadius: 999,
        background:
          "linear-gradient(90deg, #f97316 0%, #ea580c 55%, #dc2626 100%)",
        border: "1px solid rgba(255,180,100,0.55)",
        boxShadow:
          "0 0 12px -2px rgba(249,115,22,0.7), inset 0 1px 0 rgba(255,220,170,0.35), inset 0 -1px 0 rgba(0,0,0,0.18)",
        color: "#fff",
        fontWeight: 800,
        fontVariantNumeric: "tabular-nums",
        fontSize: s.font,
        lineHeight: 1,
        textShadow: "0 1px 2px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      <Zap
        size={s.icon}
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.7))" }}
      />
      {days}d
    </span>
  );
}
