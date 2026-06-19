/**
 * UserBadge12 — variante "COCKPIT" (HUD horizontal full width).
 * Painel piloto com avatar de patente em moldura sextavada, barra XP slim na base,
 * stats em colunas e CTA "Minhas Conquistas" como botão de console.
 */
import { useUserXP } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { fmt } from "./_shared";
import { Sparkles, ChevronRight, Gauge } from "lucide-react";
import StreakFlame from "./_StreakFlame";

export default function UserBadge12({ position }: { position?: number | null }) {
  const { data } = useUserXP();
  if (!data) return null;
  const c = data.currentRank.color;
  const img = rankImg(data.currentRank.name);

  return (
    <div
      className="rank-card group relative overflow-hidden rounded-2xl backdrop-blur-md"
      style={{
        background:
          "linear-gradient(135deg, hsl(220 25% 6% / 0.92) 0%, hsl(220 22% 9% / 0.88) 60%, hsl(139 60% 8% / 0.85) 100%)",
        border: `1px solid ${c}40`,
        boxShadow: `0 0 1px ${c}80, inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 36px -18px ${c}aa`,
        ["--rank-color" as any]: c,
      }}
    >
      {/* Top thin highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c}aa, transparent)` }}
      />
      {/* Halo radial */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full"
        style={{ background: `radial-gradient(circle, ${c}40, transparent 65%)`, filter: "blur(28px)" }}
      />

      <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-5 px-5 py-4">
        {/* Avatar em "hexágono" */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute inset-0 -z-10 m-auto h-[72px] w-[72px]"
            style={{
              clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)",
              background: `linear-gradient(135deg, ${c}, hsl(139 80% 50%))`,
              filter: `drop-shadow(0 0 16px ${c}aa)`,
            }}
          />
          <div
            className="flex h-[68px] w-[68px] items-center justify-center"
            style={{
              clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)",
              background: "hsl(220 25% 7%)",
            }}
          >
            <img
              src={img}
              alt={data.currentRank.name}
              className="h-12 w-12 object-contain"
              style={{ filter: `drop-shadow(0 0 8px ${c}cc)` }}
            />
          </div>
        </div>

        {/* Centro — info principal + barra */}
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Gauge className="h-3 w-3" style={{ color: c }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: c }}>
              Seu Rank
            </span>
            {typeof position === "number" && position > 0 && (
              <span
                className="rounded border px-1.5 py-0.5 text-[9px] font-black tabular-nums"
                style={{ borderColor: `${c}80`, color: c, background: `${c}1a` }}
              >
                RANK #{position}
              </span>
            )}
          </div>
          <div className="truncate text-lg font-black uppercase leading-tight tracking-wide text-foreground">
            {data.currentRank.name}
          </div>

          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-foreground/80">
              <Sparkles className="h-3 w-3" style={{ color: c }} />
              {fmt(data.totalXp)} XP
            </span>
            {data.streakDays > 0 && <StreakFlame days={data.streakDays} size="sm" />}
            {data.nextRank && (
              <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
                → {data.nextRank.name} · {fmt(data.nextRank.xpMin - data.totalXp)} XP
              </span>
            )}
          </div>

          {/* Barra slim */}
          <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${data.progressPercent}%`,
                background: `linear-gradient(90deg, ${c}, hsl(139 80% 60%), hsl(144 100% 65%))`,
                boxShadow: `0 0 10px ${c}cc`,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            {/* tick a 100% */}
            <span className="absolute right-0 top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/30" />
          </div>
        </div>

        {/* CTA Conquistas */}
        <a
          href="#"
          className="hidden shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-300 hover:-translate-y-0.5 md:inline-flex"
          style={{
            borderColor: `${c}55`,
            background: `linear-gradient(135deg, ${c}1a, transparent)`,
            color: c,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Minhas Conquistas
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
