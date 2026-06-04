/**
 * UserBadge13 — variante "TERMINAL / ID CARD" (estilo mesa de operações).
 * Layout estilo Bloomberg: monoespaçado, divisores verticais, dados em colunas
 * tipo cotação, com header "TRADER ID" e barra de progresso linear.
 */
import { useUserXP } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { fmt } from "./_shared";
import { Sparkles, TrendingUp, ArrowUpRight } from "lucide-react";
import StreakFlame from "./_StreakFlame";

export default function UserBadge13({ position }: { position?: number | null }) {
  const { data } = useUserXP();
  if (!data) return null;
  const c = data.currentRank.color;
  const img = rankImg(data.currentRank.name);
  const xpToNext = data.nextRank ? data.nextRank.xpMin - data.totalXp : 0;

  return (
    <div
      className="rank-card relative overflow-hidden rounded-xl backdrop-blur-md"
      style={{
        background:
          "linear-gradient(180deg, hsl(220 25% 7% / 0.96), hsl(220 22% 9% / 0.92))",
        border: "1px solid hsl(139 80% 45% / 0.28)",
        boxShadow:
          "inset 0 1px 0 hsl(139 80% 60% / 0.12), 0 0 28px -12px hsl(139 80% 45% / 0.55)",
        ["--rank-color" as any]: c,
      }}
    >
      {/* Status bar topo (estilo terminal) */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-[hsl(220_22%_5%/0.7)] px-4 py-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-300">
          TRADER ID · ATIVO
        </span>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {position && position > 0 ? `POS #${String(position).padStart(2, "0")}` : "POS —"}
        </span>
      </div>

      {/* Corpo: 4 colunas tipo cotação */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center divide-x divide-border/30">
        {/* Avatar */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-lg border"
            style={{
              borderColor: `${c}66`,
              background: `linear-gradient(135deg, ${c}25, transparent)`,
              boxShadow: `inset 0 0 12px ${c}33, 0 0 14px -4px ${c}aa`,
            }}
          >
            <img
              src={img}
              alt={data.currentRank.name}
              className="h-11 w-11 object-contain"
              style={{ filter: `drop-shadow(0 0 6px ${c}cc)` }}
            />
          </div>
        </div>

        {/* PATENTE */}
        <div className="px-4 py-3">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            PATENTE
          </div>
          <div className="mt-0.5 truncate font-mono text-base font-black uppercase text-foreground">
            {data.currentRank.name}
          </div>
          {data.nextRank && (
            <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <ArrowUpRight className="h-3 w-3" style={{ color: c }} />
              NEXT: <span className="text-foreground/80">{data.nextRank.name}</span>
            </div>
          )}
        </div>

        {/* XP */}
        <div className="px-4 py-3 text-right">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            XP TOTAL
          </div>
          <div
            className="mt-0.5 inline-flex items-baseline gap-1 font-mono text-xl font-black tabular-nums"
            style={{ color: c }}
          >
            {fmt(data.totalXp)}
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          {data.nextRank && (
            <div className="font-mono text-[10px] tabular-nums text-amber-300">
              +{fmt(xpToNext)} p/ subir
            </div>
          )}
        </div>

        {/* STREAK + CTA */}
        <div className="flex flex-col items-end gap-2 px-4 py-3">
          {data.streakDays > 0 ? (
            <StreakFlame days={data.streakDays} size="md" />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              sem streak
            </span>
          )}
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/70 hover:bg-emerald-500/20"
          >
            <Sparkles className="h-3 w-3" />
            CONQUISTAS
          </a>
        </div>
      </div>

      {/* Barra de progresso na base */}
      <div className="relative h-1 bg-[hsl(220_22%_12%)]">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${data.progressPercent}%`,
            background: `linear-gradient(90deg, ${c}, hsl(139 80% 60%), hsl(144 100% 65%))`,
            boxShadow: `0 0 10px ${c}cc`,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
      <div className="flex items-center justify-between bg-[hsl(220_22%_5%/0.6)] px-4 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>PROGRESSO</span>
        <span className="tabular-nums text-emerald-300">
          {data.progressPercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
