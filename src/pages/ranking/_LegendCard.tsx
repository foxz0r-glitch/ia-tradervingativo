/**
 * LegendCard — versão compacta do "Hall da Fama / Lenda do Mercado"
 * pensada para ficar lado-a-lado do TopStreaker (mesma altura/peso visual).
 * Substitui a antiga aba HALL DA FAMA.
 */
import { Crown, Sparkles } from "lucide-react";

import { fmt } from "./_shared";

interface Props {
  legend: any;
  meId?: string | null;
  displayName: string;
  onOpenProfile?: () => void;
}

export default function LegendCard({ legend, displayName, onOpenProfile }: Props) {
  if (!legend) return null;
  return (
    <div
      className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-amber-400/40 px-5 py-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/70"
      style={{
        background:
          "linear-gradient(110deg, rgba(251,191,36,0.16) 0%, rgba(217,119,6,0.08) 35%, hsl(220 22% 8% / 0.85) 100%)",
        boxShadow:
          "0 0 32px -8px rgba(251,191,36,0.55), inset 0 1px 0 rgba(254,215,170,0.20), inset 0 -1px 0 rgba(180,83,9,0.18)",
      }}
    >
      {/* halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.45), transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(251,191,36,0.85), transparent)",
        }}
      />
      {/* sparkles cantos */}
      <Sparkles className="pointer-events-none absolute right-3 top-3 h-3 w-3 text-amber-300/40" />
      <Sparkles className="pointer-events-none absolute left-3 bottom-3 h-2.5 w-2.5 text-amber-300/30" />

      {/* avatar/coroa do hall da fama */}
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/60"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.30), rgba(217,119,6,0.18))",
          boxShadow:
            "0 0 18px -2px rgba(251,191,36,0.85), inset 0 1px 0 rgba(254,243,199,0.40)",
        }}
      >
        <Crown
          className="h-7 w-7 text-amber-300"
          fill="currentColor"
          style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.9))" }}
        />
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
          HALL DA FAMA
        </div>
        <div className="truncate text-lg font-black uppercase text-foreground">
          {displayName}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          <span style={{ color: "#FBBF24" }}>{legend.current_rank}</span>
          {" · Lenda de todos os tempos"}
        </div>
      </div>

      <div className="relative flex flex-col items-end justify-center gap-2">
        <div
          className="text-xl font-black tabular-nums leading-none"
          style={{ color: "#FBBF24", textShadow: "0 0 10px rgba(251,191,36,0.6)" }}
        >
          {fmt(legend.total_xp)}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300/70">
          XP TOTAL
        </span>
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300 transition-all hover:border-amber-400/70 hover:bg-amber-400/20"
          >
            Perfil
          </button>
        )}
      </div>
    </div>
  );
}
