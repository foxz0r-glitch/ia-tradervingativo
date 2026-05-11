/**
 * Badge "Sua Patente" — espelha o card do menu lateral, porém adaptado
 * ao contexto mais amplo da página de ranking (mais informação visível).
 * Mantém a paleta esmeralda harmônica e o mesmo idioma visual:
 *   - shine diagonal estático + shine que cruza no hover
 *   - fina linha gradiente no topo
 *   - barra de progresso slim com glow da cor da patente
 *   - chip ⚡ XP + StreakFlame
 */
import { useUserXP } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { fmt } from "./_shared";
import { Sparkles, ChevronRight } from "lucide-react";
import StreakFlame from "./_StreakFlame";

export default function UserBadge({ position }: { position?: number | null }) {
  const { data } = useUserXP();
  if (!data) return null;
  const c = data.currentRank.color;
  const img = rankImg(data.currentRank.name);
  const pct = Math.round(data.progressPercent);

  return (
    <div
      className="rank-card group/rank relative overflow-hidden"
      style={{
        position: "relative",
        padding: "12px 14px 11px",
        borderRadius: 14,
        background: `linear-gradient(120deg, ${c}1c 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.04) 100%)`,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${c}10, 0 0 18px -10px ${c}90`,
        transition:
          "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
        ["--rank-color" as any]: c,
      }}
    >
      {/* shine diagonal estático */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: -20,
          width: 80,
          height: "100%",
          background: `linear-gradient(115deg, transparent, ${c}25, transparent)`,
          transform: "skewX(-20deg)",
          pointerEvents: "none",
        }}
      />
      {/* shine que cruza no hover */}
      <span
        aria-hidden
        className="rank-shine"
        style={{
          position: "absolute",
          top: 0,
          left: "-60%",
          width: "55%",
          height: "100%",
          background: `linear-gradient(115deg, transparent 20%, ${c}55 50%, transparent 80%)`,
          transform: "skewX(-20deg)",
          pointerEvents: "none",
          opacity: 0,
          transition: "left 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
        }}
      />
      {/* halo radial no hover */}
      <span
        aria-hidden
        className="rank-halo"
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 80% at 0% 100%, ${c}28, transparent 60%)`,
          opacity: 0,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />
      {/* fio gradiente no topo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
          opacity: 0.6,
        }}
      />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
        {/* AVATAR DA PATENTE */}
        <img
          src={img}
          alt={data.currentRank.name}
          className="rank-img"
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            objectFit: "contain",
            filter: `drop-shadow(0 0 10px ${c}90)`,
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.4s ease",
          }}
        />

        {/* COLUNA CENTRAL — label + nome + chip XP + streak */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "rgba(255,255,255,0.40)",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Sua Patente
            </span>
            {typeof position === "number" && position > 0 && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  padding: "2px 6px",
                  borderRadius: 5,
                  border: `1px solid ${c}55`,
                  background: `${c}1a`,
                  color: c,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                #{position}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: c,
              letterSpacing: "0.02em",
              lineHeight: 1.1,
              textShadow: `0 0 8px ${c}55`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data.currentRank.name}
          </span>

          {/* barra slim com % */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div
              style={{
                position: "relative",
                flex: 1,
                height: 5,
                background: "rgba(255,255,255,0.10)",
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: c,
                  borderRadius: 3,
                  transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                  minWidth: data.score > 0 ? 6 : 0,
                  boxShadow: `0 0 8px ${c}cc, inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 9.5,
                letterSpacing: "0.05em",
                color: c,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {pct}%
            </span>
          </div>

          {data.nextRank && (
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.2,
                marginTop: 1,
              }}
            >
              Próximo:{" "}
              <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                {data.nextRank.name}
              </span>{" "}
              · <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(data.nextRank.xpMin - data.score)} pts</span>
            </span>
          )}
        </div>

        {/* COLUNA DIREITA — chip XP empilhado, streak, CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 9px",
              borderRadius: 999,
              background: `${c}14`,
              border: `1px solid ${c}33`,
            }}
          >
            <span style={{ fontSize: 11, color: c, lineHeight: 1 }}>⚡</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.92)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {fmt(data.totalXp)} XP
            </span>
          </div>
          {data.streakDays > 0 && (
            <span title={`Sequência: ${data.streakDays} dia${data.streakDays === 1 ? "" : "s"}`}>
              <StreakFlame days={data.streakDays} size="sm" />
            </span>
          )}
          <a
            href="#"
            className="hidden md:inline-flex"
            style={{
              alignItems: "center",
              gap: 4,
              padding: "4px 9px",
              borderRadius: 8,
              border: `1px solid ${c}44`,
              background: `${c}10`,
              color: c,
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.background = `${c}22`;
              e.currentTarget.style.borderColor = `${c}88`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = `${c}10`;
              e.currentTarget.style.borderColor = `${c}44`;
            }}
          >
            <Sparkles style={{ width: 10, height: 10 }} />
            Conquistas
            <ChevronRight style={{ width: 10, height: 10 }} />
          </a>
        </div>
      </div>
    </div>
  );
}
