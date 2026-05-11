import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RANKS, type UserXP } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { Flame, Zap, Trophy, Sparkles, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  trigger: ReactNode;
  userXP: UserXP;
  userName: string;
  side?: "right" | "top" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

/**
 * Popover top-tier que substitui o RankProgressModal — abre lateralmente
 * a partir do card de patente da sidebar, no mesmo padrão do UserMenu.
 */
export default function RankProgressPopover({
  trigger,
  userXP,
  userName,
  side = "right",
  align = "end",
  sideOffset = 12,
  alignOffset = -8,
}: Props) {
  const c = userXP.currentRank.color;
  const next = userXP.nextRank;
  const currentIdx = RANKS.findIndex((r) => r.name === userXP.currentRank.name);

  const RING_SIZE = 132;
  const STROKE = 9;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - (userXP.progressPercent / 100) * CIRC;

  const xpForCurrentLevel = Math.pow(userXP.level - 1, 2) * 50;
  const xpForNextLevel = Math.pow(userXP.level, 2) * 50;
  const xpInLevel = userXP.totalXp - xpForCurrentLevel;
  const xpLevelRange = Math.max(1, xpForNextLevel - xpForCurrentLevel);
  const xpToNextLevel = Math.max(0, xpForNextLevel - userXP.totalXp);
  const levelPct = Math.min(100, (xpInLevel / xpLevelRange) * 100);

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-transparent p-0 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      >
        <div
          className="relative overflow-hidden p-5"
          style={{
            background: `
              radial-gradient(120% 80% at 50% -10%, ${c}30, transparent 55%),
              radial-gradient(80% 60% at 50% 110%, ${c}18, transparent 60%),
              linear-gradient(180deg, hsl(220 25% 7%) 0%, hsl(220 25% 5%) 100%)
            `,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Top accent line */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }}
          />

          {/* HEADER: avatar do rank + nome + score ring lado-a-lado */}
          <div className="relative flex items-center gap-4">
            <div
              className="relative shrink-0"
              style={{ width: RING_SIZE, height: RING_SIZE }}
            >
              <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90 absolute inset-0">
                <defs>
                  <linearGradient id="rpop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={c} stopOpacity="1" />
                    <stop offset="100%" stopColor={c} stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="url(#rpop-grad)"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 6px ${c}cc)` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <img
                  src={rankImg(userXP.currentRank.name)}
                  alt={userXP.currentRank.name}
                  className="h-full w-full object-contain"
                  style={{ filter: `drop-shadow(0 0 14px ${c}aa)` }}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                {userName}
              </p>
              <h2
                className="mt-1 truncate text-2xl font-black leading-tight tracking-tight"
                style={{ color: c, textShadow: `0 0 18px ${c}77` }}
              >
                {userXP.currentRank.name}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: `${c}44`, background: `${c}14`, color: c }}>
                <Sparkles className="h-3 w-3" />
                {userXP.score.toLocaleString()} score · {Math.round(userXP.progressPercent)}%
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/55">
                {next ? (
                  <>
                    Faltam{" "}
                    <span className="font-bold tabular-nums" style={{ color: c }}>
                      {(next.xpMin - userXP.score).toLocaleString()}
                    </span>{" "}
                    pts para <span className="font-bold text-white">{next.name}</span>
                  </>
                ) : (
                  <span className="font-bold text-white">Patente máxima atingida</span>
                )}
              </p>
            </div>
          </div>

          {/* Trilha de patentes — compacta */}
          <div className="relative mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" style={{ color: c }} />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Trilha</h3>
              <span className="ml-auto text-[10px] tabular-nums text-white/35">
                {currentIdx + 1}/{RANKS.length}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                {RANKS.map((r, i) => {
                  const unlocked = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={r.name} className="flex shrink-0 flex-col items-center gap-1" style={{ width: 46 }} title={r.name}>
                      <div
                        className="relative flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          background: isCurrent ? `linear-gradient(135deg, ${r.color}30, ${r.color}10)` : unlocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                          border: isCurrent ? `1.5px solid ${r.color}` : "1px solid rgba(255,255,255,0.06)",
                          boxShadow: isCurrent ? `0 0 14px ${r.color}80, inset 0 0 8px ${r.color}30` : "none",
                        }}
                      >
                        <img
                          src={rankImg(r.name)}
                          alt={r.name}
                          className="h-7 w-7 object-contain"
                          style={{ filter: unlocked ? `drop-shadow(0 0 4px ${r.color}88)` : "grayscale(1) opacity(0.35)" }}
                        />
                      </div>
                      <span
                        className="line-clamp-1 text-center text-[8px] font-semibold leading-tight"
                        style={{ color: isCurrent ? r.color : unlocked ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}
                      >
                        {r.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nível + Streak */}
          <div className="relative mt-3 grid gap-2 grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" style={{ color: c }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">Nível</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums leading-none" style={{ color: c }}>
                  {userXP.level}
                </span>
                <span className="text-[10px] font-semibold text-white/50 tabular-nums">
                  {userXP.totalXp.toLocaleString()} XP
                </span>
              </div>
              <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${levelPct}%`, background: `linear-gradient(90deg, ${c}, ${c}aa)`, boxShadow: `0 0 6px ${c}cc` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/45">
                Faltam <span className="font-bold tabular-nums text-white/75">{xpToNextLevel.toLocaleString()}</span> XP
              </p>
            </div>

            <div
              className="relative overflow-hidden rounded-xl border p-3"
              style={{
                borderColor: userXP.streakDays > 0 ? "rgba(255,140,40,0.35)" : "rgba(255,255,255,0.1)",
                background: userXP.streakDays > 0 ? "linear-gradient(135deg, rgba(255,140,40,0.18), rgba(255,80,40,0.05))" : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" style={{ color: userXP.streakDays > 0 ? "#ff9b3d" : "rgba(255,255,255,0.4)" }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">Streak</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{
                    color: userXP.streakDays > 0 ? "#ff9b3d" : "rgba(255,255,255,0.5)",
                    textShadow: userXP.streakDays > 0 ? "0 0 14px rgba(255,140,40,0.6)" : "none",
                  }}
                >
                  {userXP.streakDays}
                </span>
                <span className="text-[10px] font-semibold text-white/50">
                  dia{userXP.streakDays === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-white/45">
                {userXP.streakDays === 0
                  ? "Acesse hoje!"
                  : userXP.streakDays < 7
                  ? `+${7 - userXP.streakDays}d p/ +100 XP`
                  : userXP.streakDays < 30
                  ? `+${30 - userXP.streakDays}d p/ +500 XP`
                  : "Mestre da consistência"}
              </p>
            </div>
          </div>

          {/* Temporada */}
          <div className="relative mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" style={{ color: c }} />
              <span className="text-[11px] font-semibold text-white/70">XP da temporada</span>
            </div>
            <span className="text-base font-black tabular-nums" style={{ color: c }}>
              {(userXP.seasonXp ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
