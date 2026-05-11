import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RANKS, type UserXP } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { Flame, Zap, Trophy, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userXP: UserXP;
  userName: string;
}

/**
 * Modal exclusivo do próprio usuário, aberto a partir do card de patente
 * na sidebar. Foca em progressão de patente, conquistas de rank, XP e streak.
 */
export default function RankProgressModal({ open, onOpenChange, userXP, userName }: Props) {
  const c = userXP.currentRank.color;
  const next = userXP.nextRank;
  const currentIdx = RANKS.findIndex((r) => r.name === userXP.currentRank.name);

  // Anel de progresso
  const RING_SIZE = 220;
  const STROKE = 14;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - (userXP.progressPercent / 100) * CIRC;

  // XP do nível: nível = floor(sqrt(totalXp/50))+1 -> totalXp p/ próximo nível = ((level)^2)*50
  const xpForCurrentLevel = Math.pow(userXP.level - 1, 2) * 50;
  const xpForNextLevel = Math.pow(userXP.level, 2) * 50;
  const xpInLevel = userXP.totalXp - xpForCurrentLevel;
  const xpLevelRange = Math.max(1, xpForNextLevel - xpForCurrentLevel);
  const xpToNextLevel = Math.max(0, xpForNextLevel - userXP.totalXp);
  const levelPct = Math.min(100, (xpInLevel / xpLevelRange) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-none bg-transparent p-0 shadow-none [&>button]:hidden">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8"
          style={{
            background: `
              radial-gradient(120% 80% at 50% -10%, ${c}30, transparent 55%),
              radial-gradient(80% 60% at 50% 110%, ${c}18, transparent 60%),
              linear-gradient(180deg, hsl(220 25% 7%) 0%, hsl(220 25% 5%) 100%)
            `,
            boxShadow: `0 30px 80px -20px ${c}40, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Aurora decorativa */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }}
          />

          {/* Cabeçalho */}
          <div className="relative flex flex-col items-center text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/45">
              {userName}
            </p>

            <div
              className="relative mt-4 mb-2"
              style={{
                width: 132,
                height: 132,
                filter: `drop-shadow(0 0 24px ${c}aa)`,
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${c}55, transparent 65%)`,
                  animation: "pulse 3s ease-in-out infinite",
                }}
              />
              <img
                src={rankImg(userXP.currentRank.name)}
                alt={userXP.currentRank.name}
                className="relative h-full w-full object-contain"
              />
            </div>

            <h2
              className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: c, textShadow: `0 0 24px ${c}88` }}
            >
              {userXP.currentRank.name}
            </h2>
          </div>

          {/* Anel de progresso */}
          <div className="relative mt-8 flex flex-col items-center">
            <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
              <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={c} stopOpacity="1" />
                    <stop offset="100%" stopColor={c} stopOpacity="0.55" />
                  </linearGradient>
                </defs>
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={STROKE}
                />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
                    filter: `drop-shadow(0 0 8px ${c}cc)`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  Score
                </span>
                <span
                  className="text-6xl font-black leading-none tabular-nums"
                  style={{ color: "#fff", textShadow: `0 0 20px ${c}88` }}
                >
                  {userXP.score.toLocaleString()}
                </span>
                <span className="mt-1 text-[10px] font-semibold tabular-nums text-white/55">
                  {Math.round(userXP.progressPercent)}%
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/65">
              {next ? (
                <>
                  Faltam{" "}
                  <span className="font-bold tabular-nums" style={{ color: c }}>
                    {(next.xpMin - userXP.score).toLocaleString()}
                  </span>{" "}
                  pts para{" "}
                  <span className="font-bold text-white">{next.name}</span>
                </>
              ) : (
                <span className="font-bold text-white">Patente máxima atingida</span>
              )}
            </p>
          </div>

          {/* Trilha de patentes */}
          <div className="relative mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: c }} />
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                Trilha de Patentes
              </h3>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {RANKS.map((r, i) => {
                  const unlocked = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div
                      key={r.name}
                      className="flex shrink-0 flex-col items-center gap-1.5"
                      style={{ width: 64 }}
                      title={r.name}
                    >
                      <div
                        className="relative flex h-14 w-14 items-center justify-center rounded-lg transition-all"
                        style={{
                          background: isCurrent
                            ? `linear-gradient(135deg, ${r.color}30, ${r.color}10)`
                            : unlocked
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(255,255,255,0.015)",
                          border: isCurrent
                            ? `1.5px solid ${r.color}`
                            : "1px solid rgba(255,255,255,0.06)",
                          boxShadow: isCurrent
                            ? `0 0 18px ${r.color}80, inset 0 0 12px ${r.color}30`
                            : "none",
                        }}
                      >
                        <img
                          src={rankImg(r.name)}
                          alt={r.name}
                          className="h-10 w-10 object-contain transition-all"
                          style={{
                            filter: unlocked
                              ? `drop-shadow(0 0 6px ${r.color}88)`
                              : "grayscale(1) opacity(0.35)",
                          }}
                        />
                      </div>
                      <span
                        className="line-clamp-1 text-center text-[9px] font-semibold leading-tight"
                        style={{
                          color: isCurrent
                            ? r.color
                            : unlocked
                              ? "rgba(255,255,255,0.7)"
                              : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {r.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* XP & Nível */}
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: c }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Nível
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums" style={{ color: c }}>
                  {userXP.level}
                </span>
                <span className="text-xs font-semibold text-white/50">
                  {userXP.totalXp.toLocaleString()} XP total
                </span>
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${levelPct}%`,
                    background: `linear-gradient(90deg, ${c}, ${c}aa)`,
                    boxShadow: `0 0 8px ${c}cc`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-white/50">
                Faltam{" "}
                <span className="font-bold tabular-nums text-white/80">
                  {xpToNextLevel.toLocaleString()}
                </span>{" "}
                XP para o nível {userXP.level + 1}
              </p>
            </div>

            <div
              className="relative overflow-hidden rounded-xl border p-4"
              style={{
                borderColor:
                  userXP.streakDays > 0 ? "rgba(255,140,40,0.35)" : "rgba(255,255,255,0.08)",
                background:
                  userXP.streakDays > 0
                    ? "linear-gradient(135deg, rgba(255,140,40,0.18), rgba(255,80,40,0.05))"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Flame
                  className="h-4 w-4"
                  style={{ color: userXP.streakDays > 0 ? "#ff9b3d" : "rgba(255,255,255,0.4)" }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Streak
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-black tabular-nums"
                  style={{
                    color: userXP.streakDays > 0 ? "#ff9b3d" : "rgba(255,255,255,0.5)",
                    textShadow: userXP.streakDays > 0 ? "0 0 18px rgba(255,140,40,0.6)" : "none",
                  }}
                >
                  {userXP.streakDays}
                </span>
                <span className="text-xs font-semibold text-white/50">
                  dia{userXP.streakDays === 1 ? "" : "s"} consecutivo
                  {userXP.streakDays === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-white/50">
                {userXP.streakDays === 0
                  ? "Acesse hoje e comece sua sequência!"
                  : userXP.streakDays < 7
                    ? `Faltam ${7 - userXP.streakDays} dia(s) para o bônus de 100 XP.`
                    : userXP.streakDays < 30
                      ? `Faltam ${30 - userXP.streakDays} dia(s) para o bônus de 500 XP.`
                      : "Mestre da consistência!"}
              </p>
            </div>
          </div>

          {/* Temporada */}
          <div className="relative mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" style={{ color: c }} />
              <span className="text-xs font-semibold text-white/70">XP da temporada</span>
            </div>
            <span className="text-lg font-black tabular-nums" style={{ color: c }}>
              {(userXP.seasonXp ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Footer */}
          <div className="relative mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
