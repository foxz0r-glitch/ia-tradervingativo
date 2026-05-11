/**
 * UserBadge14 — variante "PASSAPORTE DO TRADER" (carteira / credencial).
 * Cartão estilo passaporte/credencial: faixa lateral colorida, "selo" da patente,
 * dados com tipografia mista (rótulos pequenos + valores grandes), CTA pílula.
 */
import { useUserXP } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { fmt } from "./_shared";
import { Sparkles, ChevronRight, ShieldCheck } from "lucide-react";
import StreakFlame from "./_StreakFlame";

export default function UserBadge14({ position }: { position?: number | null }) {
  const { data } = useUserXP();
  if (!data) return null;
  const c = data.currentRank.color;
  const img = rankImg(data.currentRank.name);

  return (
    <div
      className="rank-card group relative overflow-hidden rounded-2xl backdrop-blur-md"
      style={{
        background:
          "linear-gradient(115deg, hsl(220 22% 8% / 0.92), hsl(220 25% 6% / 0.88))",
        border: "1px solid hsl(160 84% 45% / 0.22)",
        boxShadow: `0 12px 36px -18px ${c}80, inset 0 1px 0 rgba(255,255,255,0.04)`,
        ["--rank-color" as any]: c,
      }}
    >
      {/* Faixa lateral colorida (selo/passaporte) */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{
          background: `linear-gradient(180deg, ${c}, hsl(160 84% 60%), ${c})`,
          boxShadow: `0 0 18px ${c}88`,
        }}
      />
      {/* Padrão decorativo passaporte (linhas oblíquas) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background:
            "repeating-linear-gradient(45deg, hsl(160 84% 60%) 0 1px, transparent 1px 14px)",
        }}
      />

      <div className="relative flex items-center gap-4 px-5 py-4">
        {/* Selo da patente */}
        <div
          className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-2xl border-2"
          style={{
            borderColor: `${c}88`,
            background: `radial-gradient(circle at 30% 30%, ${c}40, hsl(220 22% 6%) 75%)`,
            boxShadow: `inset 0 0 18px ${c}40, 0 0 22px -6px ${c}cc`,
          }}
        >
          <img
            src={img}
            alt={data.currentRank.name}
            className="h-14 w-14 object-contain"
            style={{ filter: `drop-shadow(0 0 10px ${c}cc)` }}
          />
          {/* Selo "verificado" */}
          <span
            className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background"
            style={{ background: `linear-gradient(135deg, ${c}, hsl(160 84% 50%))` }}
          >
            <ShieldCheck className="h-3 w-3 text-background" strokeWidth={3} />
          </span>
        </div>

        {/* Bloco rótulos + valores tipo carteira */}
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.32em]"
                style={{ color: c }}
              >
                PASSAPORTE TRADER
              </span>
              {typeof position === "number" && position > 0 && (
                <span
                  className="rounded-md border px-1.5 py-0.5 text-[9px] font-black tabular-nums"
                  style={{ borderColor: `${c}66`, color: c, background: `${c}1a` }}
                >
                  #{String(position).padStart(2, "0")}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-xl font-black uppercase leading-tight tracking-wide text-foreground">
              {data.currentRank.name}
            </div>

            {/* Barra com marcadores */}
            <div className="mt-2 flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${data.progressPercent}%`,
                    background: `linear-gradient(90deg, ${c}, hsl(160 84% 60%), hsl(150 90% 65%))`,
                    boxShadow: `0 0 10px ${c}cc`,
                    transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                {[25, 50, 75].map((p) => (
                  <span
                    key={p}
                    className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/20"
                    style={{ left: `${p}%` }}
                  />
                ))}
              </div>
              <span
                className="font-mono text-[10px] font-bold tabular-nums"
                style={{ color: c }}
              >
                {data.progressPercent.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Coluna de XP/Streak (fixa) */}
          <div className="hidden shrink-0 border-l border-border/40 pl-5 text-right md:block">
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              XP TOTAL
            </div>
            <div className="mt-0.5 inline-flex items-baseline gap-1 text-lg font-black tabular-nums" style={{ color: c }}>
              <Sparkles className="h-3.5 w-3.5" />
              {fmt(data.totalXp)}
            </div>
            {data.streakDays > 0 && (
              <div className="mt-1 flex justify-end">
                <StreakFlame days={data.streakDays} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* CTA pílula */}
        <a
          href="#"
          className="hidden shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 md:inline-flex"
          style={{
            borderColor: `${c}55`,
            background: `linear-gradient(135deg, ${c}25, transparent)`,
            color: "hsl(160 84% 80%)",
            boxShadow: `0 4px 14px -6px ${c}aa`,
          }}
        >
          <Sparkles className="h-3 w-3" />
          Minhas Conquistas
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
