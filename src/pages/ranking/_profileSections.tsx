/**
 * Primitivas e seções compartilhadas pelos 5 templates de perfil.
 * Mantém harmonia visual com /ranking (tracking, fontes, gradientes esmeralda).
 *
 * Cada template (A..E) compõe estas seções com layouts e acentos diferentes,
 * mas o conteúdo (Header / Ranking / Performance / Score / Badges / Estratégias /
 * Comunidade / Missões / Privacidade) é exatamente o mesmo da imagem-referência.
 */
import { useState, useEffect, type ReactNode } from "react";
import { Hexagon, Trophy, Crown, TrendingUp, TrendingDown, Target, Zap, Users, Sparkles, User, Award, X, Flame, Rocket, Landmark, Wallet, Repeat, Banknote, Brain, MessageCircle, CheckCircle2, Coins, Crosshair, Plus, Trash2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileStats, type StatsPeriod } from "@/hooks/useProfileStats";
import { useUserStrategies } from "@/hooks/useUserStrategies";
import { usePlan } from "@/hooks/usePlan";
import type { LucideIcon } from "lucide-react";
import { rankImg } from "@/lib/rankImages";
import { fmt } from "./_shared";
import StreakFlame from "./_StreakFlame";
import type { RankingRow } from "./_shared";
import type { ProfileMock } from "./_profileMockData";
import { PRIVACY_PUBLIC, PRIVACY_PRIVATE } from "./_profileMockData";
import { DialogClose } from "@/components/ui/dialog";

/** Badge real do catálogo do banco (subset de UserProfileData.all_badges) */
export interface RealBadge {
  key: string;
  title: string;
  rarity: "comum" | "rara" | "epica" | "lendaria";
  badge_group: string;
  earned: boolean;
  equipped: boolean;
}

export interface TplProps {
  row: RankingRow;
  name: string;
  position: number;
  mock: ProfileMock;
  /** id do usuário do perfil sendo exibido (para queries reais) */
  userId?: string;
  /** cor accent vinda do template */
  accent?: string;
  /** true quando o usuário logado está vendo o próprio perfil */
  isOwner?: boolean;
  /** true quando o usuário logado tem role admin */
  isAdmin?: boolean;
  /** badges reais do banco (substituem mock quando disponíveis) */
  realBadges?: RealBadge[];
  /** callback para equipar / desequipar badge (somente owner) */
  onToggleEquip?: (key: string, currentlyEquipped: boolean) => void;
}

const withAlpha = (color: string, alpha: number) => {
  if (color.startsWith("hsl(")) return color.replace(/\)$/, ` / ${alpha})`);
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  }
  return color;
};

const XP_ACCENT = "hsl(43 96% 56%)";
const TOP_ACCENT = "hsl(188 86% 53%)";
const STREAK_ACCENT = "hsl(25 95% 53%)";

/* ---------- chips e helpers ---------- */
export function Tag({
  children,
  color = "hsl(160 84% 65%)",
  variant = "soft",
}: {
  children: React.ReactNode;
  color?: string;
  variant?: "soft" | "outline";
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{
        color,
        background: variant === "soft" ? withAlpha(color, 0.1) : "transparent",
        border: `1px solid ${withAlpha(color, 0.34)}`,
      }}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  color = "hsl(160 84% 65%)",
}: {
  children: React.ReactNode;
  color?: string;
  glow?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className="text-[11px] font-black uppercase tracking-[0.32em]"
        style={{ color }}
      >
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${withAlpha(color, 0.5)}, transparent)` }}
      />
    </div>
  );
}

export function SubKpi({
  label, value, color = "hsl(160 84% 70%)", small,
}: { label: string; value: React.ReactNode; color?: string; small?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 backdrop-blur-md">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-black tabular-nums" style={{ color }}>{value}</div>
      {small && <div className="text-[10px] text-muted-foreground">{small}</div>}
    </div>
  );
}

/* ---------- Score com anel de progresso (igual V1) ---------- */
function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const size = 104;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* glow externo sutil */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 28px -8px ${withAlpha(accent, 0.4)}`, background: `radial-gradient(circle at 50% 50%, ${withAlpha(accent, 0.12)}, transparent 65%)` }}
      />
      <svg width={size} height={size} className="-rotate-90 relative">
        <defs>
          <linearGradient id={`ring-${accent}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="hsl(220 22% 8%)" stroke={withAlpha(accent, 0.13)} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#ring-${accent})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${withAlpha(accent, 0.67)})`, transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: accent }}>
        <div className="text-3xl font-black leading-none tabular-nums">{score}</div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] opacity-80">Score</div>
      </div>
    </div>
  );
}

/* ordem de patentes para descobrir a próxima */
const RANK_ORDER = [
  "Prata I", "Prata II", "Prata III",
  "Ouro I", "Ouro II", "Ouro III",
  "AK I", "AK II", "AK Cruzada",
  "Xerife", "Águia I", "Águia II",
  "Supremo", "Global",
];
export function nextRankOf(current: string): string {
  const i = RANK_ORDER.indexOf(current);
  if (i < 0 || i >= RANK_ORDER.length - 1) return "patente máxima";
  return RANK_ORDER[i + 1];
}

/* ---------- HEADER (rank badge acima + nome, sem avatar) ---------- */
export function HeaderBlock({
  row, name, accent = "hsl(160 84% 60%)",
}: TplProps) {
  return (
    <div className="relative">
      <DialogClose
        aria-label="Fechar"
        className="absolute right-0 top-0 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/70 text-muted-foreground backdrop-blur-md transition hover:border-border hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        <X className="h-4 w-4" strokeWidth={2.25} />
      </DialogClose>
      <SectionTitle color={accent}>Perfil & Progresso</SectionTitle>
      <div className="min-w-0 pr-10">
        <div className="mb-2 flex items-center">
          <img
            src={rankImg(row.current_rank)}
            alt={row.current_rank}
            className="h-12 w-auto"
            style={{ filter: `drop-shadow(0 0 6px hsl(0 0% 100% / 0.45)) drop-shadow(0 0 3px hsl(0 0% 100% / 0.3))` }}
          />
        </div>
        <h2 className="text-[1.7rem] font-black uppercase tracking-wide text-foreground leading-none">
          {name}
        </h2>
      </div>
    </div>
  );
}

/* chips reutilizáveis (Level, Patente, Top, Streak) — agora vão no rodapé do ProgressBlock */
function HeaderChips({ row, mock, accent }: { row: RankingRow; mock: ProfileMock; accent: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums"
        style={{
          color: "hsl(220 14% 92%)",
          background: "hsl(220 14% 92% / 0.08)",
          border: "1px solid hsl(220 14% 92% / 0.28)",
          boxShadow: "inset 0 1px 0 hsl(220 14% 100% / 0.12)",
        }}
      >
        Level {mock.level}
      </span>
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{
          color: accent,
          background: withAlpha(accent, 0.1),
          border: `1px solid ${withAlpha(accent, 0.34)}`,
          boxShadow: `inset 0 1px 0 ${withAlpha(accent, 0.15)}`,
        }}
      >
        {row.current_rank}
      </span>
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{
          color: TOP_ACCENT,
          background: withAlpha(TOP_ACCENT, 0.1),
          border: `1px solid ${withAlpha(TOP_ACCENT, 0.34)}`,
        }}
      >
        Top {mock.percentil_top}% trader
      </span>
      {row.streak_days > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums"
          style={{
            color: STREAK_ACCENT,
            background: withAlpha(STREAK_ACCENT, 0.1),
            border: `1px solid ${withAlpha(STREAK_ACCENT, 0.34)}`,
          }}
        >
          <Zap className="h-2.5 w-2.5" fill={STREAK_ACCENT} stroke={STREAK_ACCENT} />
          {row.streak_days} dias streak
        </span>
      )}
    </div>
  );
}

/* ---------- duas barras "Nível" e "Patente" ---------- */
export function ProgressBlock({ row, mock, accent = "hsl(160 84% 55%)" }: TplProps) {
  // Level L occupies [(L-1)²×50, L²×50) XP — width = 50×(2L-1)
  const levelWidth = Math.max(1, 50 * (2 * mock.level - 1));
  const remainingXp = mock.xp_to_next_level; // already computed from formula in buildProfileMock
  const xpInLevel = Math.max(0, levelWidth - remainingXp);
  const pctLevel = Math.min(100, Math.max(0, Math.round((xpInLevel / levelWidth) * 100)));
  const nextRank = nextRankOf(row.current_rank);
  return (
    <section className="mt-5">
      <div className="grid grid-cols-1 gap-4">
      <div>
        <div className="mb-1.5 text-[13px] font-bold uppercase tracking-wider text-foreground">
          Nível (XP) — Lv {mock.level}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[hsl(220_15%_24%)] ring-1 ring-inset ring-[hsl(220_15%_30%)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pctLevel}%`,
              background: "linear-gradient(90deg, hsl(220 90% 60%), hsl(265 85% 65%), hsl(310 80% 65%))",
              boxShadow: "0 0 10px hsl(265 85% 60% / 0.55)",
            }}
          />
        </div>
        <div className="mt-1.5 text-[11px] tabular-nums text-muted-foreground/70">
          Progresso {pctLevel}% · {fmt(remainingXp)} XP restantes
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-[13px] font-bold uppercase tracking-wider text-foreground">
          Patente (Score) — {row.current_rank}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[hsl(220_15%_24%)] ring-1 ring-inset ring-[hsl(220_15%_30%)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${mock.score}%`,
              background: `linear-gradient(90deg, ${accent}, #eab308, #f97316, #ef4444)`,
              boxShadow: `0 0 10px ${withAlpha(accent, 0.67)}`,
            }}
          />
        </div>
        <div className="mt-1.5 text-[11px] tabular-nums text-muted-foreground/70">
          Score {mock.score}/100 · próxima: {nextRank}
        </div>
      </div>

      {/* Chips (Level / Patente / Top / Streak) — agora no rodapé do bloco */}
      <div className="mt-1">
        <HeaderChips row={row} mock={mock} accent={accent} />
      </div>
      </div>
    </section>
  );
}

/* ---------- RANKING & HISTÓRICO ---------- */
export function RankingBlock({ row, mock, accent = "hsl(160 84% 65%)" }: TplProps) {
  const rc = mock.rank_change;
  const rankChangeEl: ReactNode = rc === null
    ? <span className="text-muted-foreground/50">sem histórico</span>
    : rc === 0
      ? <span className="text-muted-foreground/70">sem variação</span>
      : (
        <span className="inline-flex items-center gap-0.5" style={{ color: rc > 0 ? "hsl(142 71% 55%)" : "hsl(0 72% 60%)" }}>
          {rc > 0
            ? <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
            : <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
          }
          {rc > 0 ? "+" : ""}{rc} posições
        </span>
      );

  const kpis: { label: string; value: string; small?: ReactNode; color: string }[] = [
    { label: "XP temporada", value: fmt(mock.season_xp), small: "temporada atual", color: "hsl(220 14% 96%)" },
    { label: "XP Acumulada", value: fmt(row.total_xp), small: "XP total", color: "hsl(220 14% 96%)" },
    { label: "Rank Temporada", value: `#${mock.global_pos}`, small: rankChangeEl, color: "hsl(220 14% 96%)" },
    { label: "Posição - Top", value: `${mock.percentil_top}%`, small: "trader", color: "hsl(220 14% 96%)" },
  ];

  // troféus: 1º ouro, 2º prata, 3º bronze
  const trophyFor = (pos: number) => {
    if (pos === 1) return { color: "hsl(43 96% 56%)", label: "MVP" }; // ouro
    if (pos === 2) return { color: "hsl(220 14% 82%)", label: "MVP" }; // prata
    if (pos === 3) return { color: "hsl(30 61% 50%)", label: "MVP" }; // bronze
    return null;
  };

  return (
    <section>
      <SectionTitle color={accent}>Status Competitivo</SectionTitle>

      {/* Geral */}
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        Geral
      </div>

      {/* KPIs principais — refinados, harmonia com header */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden rounded-xl border bg-card/40 px-3.5 py-3 backdrop-blur-md transition hover:bg-card/60"
            style={{
              borderColor: withAlpha(accent, 0.15),
              boxShadow: `inset 0 1px 0 ${withAlpha(accent, 0.1)}, 0 0 16px -14px ${withAlpha(accent, 0.67)}`,
            }}
          >
            <div className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[9px] sm:tracking-[0.16em]">
              {k.label}
            </div>
            <div className="mt-1 text-2xl font-black leading-none tabular-nums" style={{ color: k.color }}>
              {k.value}
            </div>
            {k.small && (
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/80">
                {k.small}
              </div>
            )}
          </div>
        ))}
      </div>

    </section>
  );
}

/* ---------- PERFORMANCE ---------- */
export function PerformanceBlock({ mock, userId, accent = "hsl(160 84% 65%)" }: TplProps) {
  const [period, setPeriod] = useState<StatsPeriod>("Total");
  const { data: stats } = useProfileStats(userId ?? null, period);

  // Real data substitui mock quando disponível e há ao menos uma operação no período
  const hasReal = !!stats && stats.trades > 0;
  const winrate = hasReal ? stats!.winrate : mock.winrate;
  const trades  = hasReal ? stats!.trades  : mock.trades;
  const preferredAsset = stats?.preferredAsset ?? mock.preferred_asset;
  const bestRunUp = stats && stats.bestRunUp > 0
    ? stats.bestRunUp.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : `${mock.best_streak_record} dias`;

  const scoreVarPositive = mock.score_variation >= 0;
  const scoreVarDisplay = (
    <span className="inline-flex items-center gap-1">
      {scoreVarPositive ? (
        <TrendingUp className="h-4 w-4" style={{ color: "hsl(142 71% 55%)" }} strokeWidth={2.5} />
      ) : (
        <TrendingDown className="h-4 w-4" style={{ color: "hsl(0 72% 60%)" }} strokeWidth={2.5} />
      )}
      {scoreVarPositive ? "+" : ""}{mock.score_variation} pts
    </span>
  );
  return (
    <section>
      <SectionTitle color={accent}>Estatísticas</SectionTitle>
      <div className="mb-3 flex gap-1.5">
        {(["Total", "30 dias", "7 dias"] as const).map((t) => {
          const active = period === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setPeriod(t)}
              className={`rounded-lg border px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                active
                  ? "border-border/80 bg-card text-foreground"
                  : "border-border/40 bg-card/30 text-muted-foreground hover:border-border/70 hover:text-foreground"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        Overview
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <SubKpi label="Winrate" value={`${winrate}%`} color="hsl(220 14% 96%)" />
        <SubKpi label="Operações" value={fmt(trades)} color="hsl(220 14% 96%)" />
        <SubKpi label="Ativo Preferido" value={preferredAsset} color="hsl(220 14% 96%)" />
        <SubKpi label="Variação Score" value={scoreVarDisplay} color="hsl(220 14% 96%)" />
      </div>

      <div className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        Consistência
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <SubKpi label="Dias positivos" value={mock.positive_days} color="hsl(220 14% 96%)" />
        <SubKpi label="Maior seq. gains" value={mock.best_streak_gains} color="hsl(220 14% 96%)" />
        <SubKpi label="Maior seq. metas" value={mock.goals_hit} color="hsl(220 14% 96%)" />
        <SubKpi label="Melhor Sequência" value={bestRunUp} color="hsl(220 14% 96%)" />
      </div>

    </section>
  );
}

/* ---------- SCORE BREAKDOWN ---------- */
export function ScoreBreakdownBlock({ mock, accent = "hsl(160 84% 65%)" }: TplProps) {
  const items: { label: string; v: [number, number]; color: string }[] = [
    { label: "Winrate", v: mock.score_winrate, color: "#22c55e" },
    { label: "Financeiro", v: mock.score_financeiro, color: "#8b5cf6" },
    { label: "Consistência", v: mock.score_consistencia, color: "#d97706" },
    { label: "Engajamento", v: mock.score_engajamento, color: "hsl(220 14% 70%)" },
    { label: "Volume", v: mock.score_volume, color: "#ef4444" },
  ];
  return (
    <section>
      <SectionTitle color={accent}>Score Breakdown — {mock.score}/100</SectionTitle>
      {/* barra horizontal segmentada */}
      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full">
        {items.map((it) => (
          <div key={it.label} style={{ width: `${(it.v[0] / 100) * 100}%`, background: it.color, boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.2)` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-border/50 bg-card/40 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: it.color }}>
              {it.label}
            </div>
            <div className="mt-0.5 text-2xl font-black tabular-nums text-foreground">
              {it.v[0]}<span className="text-sm text-muted-foreground">/{it.v[1]}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- BADGES — lookup tables para badges reais do banco ---------- */
const REAL_BADGE_ICON: Record<string, LucideIcon> = {
  daily_login:   Zap,
  streak_7:      Flame,
  streak_30:     Flame,
  streak_100:    Flame,
  first_trade:   Trophy,
  win_10:        Target,
  win_50:        Target,
  win_100:       Award,
  deposit_first: Wallet,
  rank_ouro:     Award,
  rank_ak:       Award,
  rank_aguia:    Trophy,
  rank_supremo:  Crown,
  rank_global:   Crown,
};
const REAL_GROUP_COLOR: Record<string, string> = {
  streak:     "hsl(25 95% 58%)",
  trading:    "hsl(199 89% 60%)",
  financeiro: "hsl(43 96% 58%)",
  patente:    "hsl(265 85% 70%)",
  outros:     "hsl(220 14% 70%)",
};
const REAL_GROUP_LABEL: Record<string, string> = {
  streak: "Streak", trading: "Trading", financeiro: "Financeiro", patente: "Patente", outros: "Outros",
};
const REAL_GROUP_ICON: Record<string, LucideIcon> = {
  streak: Flame, trading: CheckCircle2, financeiro: Coins, patente: Crown, outros: Sparkles,
};
const RARITY_LABEL: Record<string, string> = {
  comum: "comum", rara: "rara", epica: "épica", lendaria: "lendária",
};
const REAL_GROUP_ORDER = ["streak", "trading", "patente", "financeiro", "outros"];

/* ---------- BADGES — lookup tables legados (mock) ---------- */
const BADGE_CATEGORIES: {
  key: string;
  label: string;
  icon: string;
  color: string;
  badgeNames: string[];
}[] = [
  {
    key: "streak",
    label: "Streak",
    icon: "🔥",
    color: "hsl(25 95% 58%)",
    badgeNames: ["Streak 7", "Streak 30", "Streak 90"],
  },
  {
    key: "trading",
    label: "Trading",
    icon: "✅",
    color: "hsl(199 89% 60%)",
    badgeNames: ["1º Trade", "Sniper", "Centurião", "500 Ops"],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    icon: "🪙",
    color: "hsl(43 96% 58%)",
    badgeNames: ["FTD", "Fiel à Banca", "Banca R$5k"],
  },
  {
    key: "social",
    label: "Estratégia e Social",
    icon: "✨",
    color: "hsl(320 80% 65%)",
    badgeNames: ["Estrategista", "Comunidade", "Influente", "MVP"],
  },
];

type BadgeMeta = { Icon: LucideIcon; rarity: string; color: string };

const ALL_BADGES_META: Record<string, BadgeMeta> = {
  // streak — laranja/âmbar
  "Streak 7":     { Icon: Flame,        rarity: "comum",     color: "hsl(25 95% 60%)" },
  "Streak 30":    { Icon: Flame,        rarity: "épica",     color: "hsl(15 92% 58%)" },
  "Streak 90":    { Icon: Flame,        rarity: "lendária",  color: "hsl(0 85% 60%)" },
  // trading — azul/ciano
  "1º Trade":     { Icon: Trophy,       rarity: "comum",     color: "hsl(199 90% 62%)" },
  "Sniper":       { Icon: Crosshair,    rarity: "lendária",  color: "hsl(190 90% 60%)" },
  "Centurião":    { Icon: Rocket,       rarity: "épica",     color: "hsl(210 90% 65%)" },
  "500 Ops":      { Icon: Landmark,     rarity: "épica",     color: "hsl(220 60% 70%)" },
  // financeiro — dourado
  "FTD":          { Icon: Wallet,       rarity: "comum",     color: "hsl(43 96% 60%)" },
  "Fiel à Banca": { Icon: Repeat,       rarity: "rara",      color: "hsl(38 92% 58%)" },
  "Banca R$5k":   { Icon: Banknote,     rarity: "rara",      color: "hsl(48 96% 60%)" },
  // social — rosa/violeta
  "Estrategista": { Icon: Brain,        rarity: "rara",      color: "hsl(280 80% 70%)" },
  "Comunidade":   { Icon: Users,        rarity: "rara",      color: "hsl(320 75% 68%)" },
  "Influente":    { Icon: Sparkles,     rarity: "rara",      color: "hsl(295 80% 70%)" },
  "MVP":          { Icon: Crown,        rarity: "lendária",  color: "hsl(43 96% 58%)" },
  "Semana Verde": { Icon: CheckCircle2, rarity: "rara",      color: "hsl(142 71% 55%)" },
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  streak: Flame,
  trading: CheckCircle2,
  financeiro: Coins,
  social: Sparkles,
};

export function BadgesBlock({ mock, accent = "hsl(160 84% 65%)", isOwner, isAdmin, realBadges, onToggleEquip }: TplProps) {
  const [equipping, setEquipping] = useState<string | null>(null);
  useEffect(() => { setEquipping(null); }, [realBadges]);

  const canSeeCollection = isOwner || isAdmin;
  const equippedReal = realBadges?.filter(b => b.equipped) ?? null;
  const equippedCount = equippedReal?.length ?? 0;

  return (
    <section>
      <SectionTitle color={accent}>Badges</SectionTitle>

      {/* ── Destaques equipados — visível a todos ── */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Destaques equipados
        </div>
        {isOwner && realBadges && (
          <span className="text-[9px] tabular-nums text-muted-foreground/60">{equippedCount}/3 equipados</span>
        )}
      </div>

      {realBadges ? (
        equippedReal && equippedReal.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {equippedReal.map((b) => {
              const Icon = REAL_BADGE_ICON[b.key] ?? Award;
              const c = REAL_GROUP_COLOR[b.badge_group] ?? accent;
              return (
                <div key={b.key}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-card/40 px-3 py-4 text-center"
                  style={{ borderColor: withAlpha(c, 0.28), boxShadow: `inset 0 1px 0 ${withAlpha(c, 0.1)}, 0 0 24px -16px ${withAlpha(c, 0.6)}` }}
                >
                  <Icon className="h-7 w-7" style={{ color: c, filter: `drop-shadow(0 0 8px ${withAlpha(c, 0.55)})` }} strokeWidth={2} />
                  <div className="text-xs font-black uppercase tracking-wide text-foreground">{b.title}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: withAlpha(c, 0.85) }}>
                    {RARITY_LABEL[b.rarity] ?? b.rarity}
                  </div>
                  {isOwner && onToggleEquip && (
                    <button type="button" onClick={() => onToggleEquip(b.key, true)}
                      className="mt-0.5 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground/50 transition hover:bg-red-400/10 hover:text-red-400">
                      remover
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-3 text-center text-[12px] text-muted-foreground/60">
            {isOwner ? "Nenhum badge equipado — selecione na coleção abaixo." : "Nenhum badge equipado."}
          </p>
        )
      ) : (
        /* fallback mock equipped */
        <div className="grid grid-cols-3 gap-3">
          {mock.equipped.map((b) => {
            const meta = ALL_BADGES_META[b.name];
            const Icon = meta?.Icon ?? Award;
            const c = meta?.color ?? accent;
            return (
              <div key={b.name}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-card/40 px-3 py-4 text-center"
                style={{ borderColor: withAlpha(c, 0.28), boxShadow: `inset 0 1px 0 ${withAlpha(c, 0.1)}, 0 0 24px -16px ${withAlpha(c, 0.6)}` }}
              >
                <Icon className="h-7 w-7" style={{ color: c, filter: `drop-shadow(0 0 8px ${withAlpha(c, 0.55)})` }} strokeWidth={2} />
                <div className="text-xs font-black uppercase tracking-wide text-foreground">{b.name}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: withAlpha(c, 0.85) }}>{b.rarity}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Coleção completa — exclusivo owner / admin ── */}
      {canSeeCollection && (
        <>
          <div className="mt-5 mb-3 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Coleção completa
            </div>
            {isOwner && realBadges && (
              <span className="text-[9px] text-muted-foreground/60">
                {equippedCount >= 3 ? "Máx. 3 — remova um para equipar outro" : "Toque num badge conquistado para equipar"}
              </span>
            )}
          </div>

          {realBadges ? (
            <div className="space-y-4">
              {REAL_GROUP_ORDER.map((group) => {
                const groupBadges = realBadges.filter(b => b.badge_group === group);
                if (groupBadges.length === 0) return null;
                const GIcon = REAL_GROUP_ICON[group] ?? Sparkles;
                const gc = REAL_GROUP_COLOR[group] ?? accent;
                return (
                  <div key={group}>
                    <div className="mb-2 flex items-center gap-2">
                      <GIcon className="h-3.5 w-3.5" style={{ color: gc, filter: `drop-shadow(0 0 6px ${withAlpha(gc, 0.55)})` }} strokeWidth={2.4} />
                      <span className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: gc }}>{REAL_GROUP_LABEL[group] ?? group}</span>
                      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${withAlpha(gc, 0.35)}, transparent)` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {groupBadges.map((b) => {
                        const Icon = REAL_BADGE_ICON[b.key] ?? Award;
                        const canEquip = isOwner && b.earned && !b.equipped && equippedCount < 3 && !equipping;
                        return (
                          <div key={b.key}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-center transition ${
                              b.earned ? "bg-card/50" : "bg-card/20 opacity-40"
                            } ${canEquip ? "cursor-pointer hover:bg-card/70" : ""}`}
                            style={{ borderColor: b.earned ? withAlpha(gc, 0.32) : "hsl(220 14% 22%)", boxShadow: b.earned ? `inset 0 1px 0 ${withAlpha(gc, 0.1)}` : undefined }}
                            onClick={canEquip ? () => { setEquipping(b.key); onToggleEquip?.(b.key, false); } : undefined}
                          >
                            <Icon className="h-6 w-6"
                              style={{ color: b.earned ? gc : "hsl(220 10% 50%)", filter: b.earned ? `drop-shadow(0 0 6px ${withAlpha(gc, 0.5)})` : undefined }}
                              strokeWidth={2}
                            />
                            <div className="text-[10px] font-black uppercase tracking-wider"
                              style={{ color: b.earned ? "hsl(220 14% 92%)" : "hsl(220 10% 55%)" }}>
                              {b.title}
                            </div>
                            {b.equipped && (
                              <span className="text-[8px] font-bold" style={{ color: "hsl(160 84% 65%)" }}>● equipado</span>
                            )}
                            {canEquip && (
                              <span className="text-[8px] text-muted-foreground/50">toque p/ equipar</span>
                            )}
                            {isOwner && b.equipped && onToggleEquip && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); onToggleEquip(b.key, true); }}
                                className="text-[8px] text-muted-foreground/40 transition hover:text-red-400">
                                remover
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* fallback mock collection */
            <div className="space-y-4">
              {BADGE_CATEGORIES.map((cat) => {
                const CatIcon = CATEGORY_ICONS[cat.key] ?? Sparkles;
                const ownedSet = new Set(mock.collection.filter((c) => c.owned).map((c) => c.badge.name));
                return (
                  <div key={cat.key}>
                    <div className="mb-2 flex items-center gap-2">
                      <CatIcon className="h-3.5 w-3.5" style={{ color: cat.color, filter: `drop-shadow(0 0 6px ${withAlpha(cat.color, 0.55)})` }} strokeWidth={2.4} />
                      <span className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${withAlpha(cat.color, 0.35)}, transparent)` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {cat.badgeNames.map((bname) => {
                        const meta = ALL_BADGES_META[bname];
                        const Icon = meta?.Icon ?? Award;
                        const owned = ownedSet.has(bname);
                        const c = meta?.color ?? cat.color;
                        return (
                          <div key={bname}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-center transition ${owned ? "bg-card/50" : "bg-card/20 opacity-40"}`}
                            style={{ borderColor: owned ? withAlpha(c, 0.32) : "hsl(220 14% 22%)", boxShadow: owned ? `inset 0 1px 0 ${withAlpha(c, 0.1)}` : undefined }}
                          >
                            <Icon className="h-6 w-6" style={{ color: owned ? c : "hsl(220 10% 50%)", filter: owned ? `drop-shadow(0 0 6px ${withAlpha(c, 0.5)})` : undefined }} strokeWidth={2} />
                            <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: owned ? "hsl(220 14% 92%)" : "hsl(220 10% 55%)" }}>{bname}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- ESTRATÉGIAS ---------- */
export function StrategiesBlock({ mock, userId, isOwner, accent = "hsl(160 84% 65%)" }: TplProps) {
  const { data: real, create, remove } = useUserStrategies(userId ?? null);
  const { maxEstrategias } = usePlan();
  const [adding, setAdding]   = useState(false);
  const [name, setName]       = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy]       = useState(false);

  // Marketplace submission states
  const [submissions, setSubmissions] = useState<Record<string, { status: string; checkout_url: string | null; admin_notes: string | null }>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mktDialog, setMktDialog] = useState(false);
  const [mktStrategy, setMktStrategy] = useState<{ id: string; name: string; winrate: number | null; trades: number } | null>(null);
  const [mktDescricao, setMktDescricao] = useState("");
  const [mktPreco, setMktPreco] = useState("");
  const [mktSaving, setMktSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setCurrentUserId(user.id);
      const { data } = await (supabase as any)
        .from("marketplace_submissions")
        .select("strategy_id, status, checkout_url, admin_notes")
        .eq("user_id", user.id);
      if (cancelled) return;
      const map: Record<string, any> = {};
      for (const row of data ?? []) map[row.strategy_id] = row;
      setSubmissions(map);
    })();
    return () => { cancelled = true; };
  }, []);

  async function reloadSubmissions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("marketplace_submissions")
      .select("strategy_id, status, checkout_url, admin_notes")
      .eq("user_id", user.id);
    const map: Record<string, any> = {};
    for (const row of data ?? []) map[row.strategy_id] = row;
    setSubmissions(map);
  }

  async function handleMktSubmit() {
    if (!mktStrategy || !mktDescricao.trim()) return;
    setMktSaving(true);
    const { error } = await (supabase as any).from("marketplace_submissions").insert({
      user_id: currentUserId,
      strategy_id: mktStrategy.id,
      nome: mktStrategy.name,
      descricao: mktDescricao.trim(),
      preco_sugerido: mktPreco ? parseFloat(mktPreco) : null,
      preview_winrate: mktStrategy.winrate,
      preview_trades: mktStrategy.trades,
    });
    setMktSaving(false);
    if (error) return;
    setMktDialog(false);
    setMktDescricao(""); setMktPreco("");
    await reloadSubmissions();
  }

  const useReal = !!real; // mostra real assim que disponível (mesmo lista vazia)
  const totalEstrategias = real?.length ?? 0;
  const limiteAtingido = totalEstrategias >= maxEstrategias;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    await create(name);
    setBusy(false);
    setName("");
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setBusy(true);
    await remove(id);
    setBusy(false);
    setConfirmId(null);
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.32em]" style={{ color: accent }}>
          Estratégias Criadas
        </span>
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${withAlpha(accent, 0.5)}, transparent)` }} />
        {useReal && isOwner && !adding && (
          <div className="flex items-center gap-2">
            {limiteAtingido ? (
              <button
                type="button"
                disabled
                title={`Limite do plano atingido (${totalEstrategias}/${maxEstrategias})`}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider opacity-50 cursor-not-allowed"
                style={{ color: accent, borderColor: withAlpha(accent, 0.4), background: withAlpha(accent, 0.08) }}
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} /> Nova
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition hover:bg-card"
                style={{ color: accent, borderColor: withAlpha(accent, 0.4), background: withAlpha(accent, 0.08) }}
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} /> Nova
              </button>
            )}
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
              {totalEstrategias}/{maxEstrategias}
            </span>
            {limiteAtingido && (
              <a
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition hover:opacity-80"
                style={{ color: accent, borderColor: withAlpha(accent, 0.3), background: withAlpha(accent, 0.06) }}
              >
                <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                Ver planos
              </a>
            )}
          </div>
        )}
      </div>

      {useReal && isOwner && adding && (
        <form onSubmit={handleCreate} className="mb-2 flex gap-2 rounded-xl border border-border/50 bg-card/40 p-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da estratégia"
            maxLength={60}
            className="flex-1 rounded-lg border border-border/50 bg-background/60 px-3 py-1.5 text-sm text-foreground outline-none focus:border-border"
          />
          <button type="submit" disabled={!name.trim() || busy}
            className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50"
            style={{ background: accent }}>
            Criar
          </button>
          <button type="button" onClick={() => { setAdding(false); setName(""); }}
            className="rounded-lg border border-border/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        </form>
      )}

      <div className="space-y-2">
        {useReal ? (
          real!.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/40 py-6 text-center text-[12px] text-muted-foreground/70">
              {isOwner ? "Você ainda não criou nenhuma estratégia." : "Nenhuma estratégia criada."}
            </p>
          ) : (
            real!.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: withAlpha(accent, 0.15), color: accent }}>
                  <Target className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">
                    {s.name}
                    {submissions[s.id] && (
                      <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider
                        ${submissions[s.id].status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          submissions[s.id].status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'}`}>
                        {submissions[s.id].status === 'approved' ? 'Aprovado' :
                         submissions[s.id].status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.trades} {s.trades === 1 ? "operação" : "operações"} · criada {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums" style={{ color: s.winrate === null ? "hsl(220 10% 55%)" : "#22c55e" }}>
                    {s.winrate === null ? "—" : `${s.winrate}%`}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">winrate</div>
                </div>
                {isOwner && useReal && !submissions[s.id] && (
                  <button
                    type="button"
                    title="Enviar ao Marketplace"
                    onClick={() => {
                      setMktStrategy({ id: s.id, name: s.name, winrate: s.winrate, trades: s.trades });
                      setMktDescricao(""); setMktPreco("");
                      setMktDialog(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-card"
                    style={{ color: accent }}
                  >
                    <Store className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                )}
                {isOwner && (
                  confirmId === s.id ? (
                    <div className="ml-1 flex items-center gap-1">
                      <button type="button" onClick={() => handleDelete(s.id)} disabled={busy}
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                        Confirmar
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)}
                        className="rounded-md border border-border/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(s.id)}
                      title="Excluir estratégia (irreversível)"
                      className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/40 text-muted-foreground transition hover:border-red-500/50 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            ))
          )
        ) : (
          mock.strategies.map((s) => (
            <div key={s.name} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: withAlpha(accent, 0.15), color: accent }}>
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-foreground">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {s.uses} usos {s.top && "· mais lucrativa"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black tabular-nums" style={{ color: "#22c55e" }}>{s.winrate}%</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">winrate</div>
              </div>
            </div>
          ))
        )}
      </div>

      {mktDialog && mktStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setMktDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-[#14141f] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold">Enviar ao Marketplace</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Estratégia: {mktStrategy.name}</p>
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
              <span>{mktStrategy.trades} operações</span>
              {mktStrategy.winrate != null && <span>{mktStrategy.winrate.toFixed(1)}% winrate</span>}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium">Descrição da estratégia *</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  placeholder="Explique como a estratégia funciona, indicadores usados, melhores condições de mercado..."
                  value={mktDescricao}
                  onChange={e => setMktDescricao(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Preço sugerido (R$)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="97.00"
                  value={mktPreco}
                  onChange={e => setMktPreco(e.target.value)}
                  min="0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                A Virtus Pro recebe 30% como plataforma. Após aprovação, você será adicionado como coprodutor na Cakto.
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-lg border border-border/60 py-2 text-sm transition hover:bg-card"
                onClick={() => setMktDialog(false)}
              >Cancelar</button>
              <button
                className="flex-1 rounded-lg py-2 text-sm font-semibold transition disabled:opacity-50"
                style={{ background: accent, color: '#000' }}
                disabled={mktSaving || !mktDescricao.trim()}
                onClick={handleMktSubmit}
              >
                {mktSaving ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- COMUNIDADE ---------- */
export function CommunityBlock({ mock, accent = "hsl(160 84% 65%)" }: TplProps) {
  return (
    <section>
      <SectionTitle color={accent}>Comunidade</SectionTitle>
      <div className="mb-3 grid grid-cols-3 gap-2.5">
        <SubKpi label="Postagens" value={mock.posts} color={accent} />
        <SubKpi label="Respostas" value={mock.replies} color={accent} />
        <SubKpi label="Curtidas" value={mock.likes} color={accent} />
      </div>
      <div className="space-y-2">
        {mock.threads.map((t) => (
          <div key={t.title} className="rounded-xl border border-border/50 bg-card/40 px-3 py-2">
            <div className="text-sm font-bold text-foreground">{t.title}</div>
            <div className="text-[11px] text-muted-foreground">
              {t.cat} · {t.ago} · {t.replies} respostas
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- MISSÕES ---------- */
export function MissionsBlock({ mock, accent = "hsl(160 84% 65%)", isOwner, isAdmin }: TplProps) {
  if (!isOwner && !isAdmin) return null;
  const renderRow = (m: { title: string; pct: number; status: string }) => (
    <div key={m.title} className="flex items-center gap-3 py-1.5">
      <div className="min-w-0 flex-1 truncate text-sm text-foreground">{m.title}</div>
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${m.pct}%`,
            background: m.pct >= 100 ? "hsl(160 84% 50%)" : `linear-gradient(90deg, ${accent}, hsl(160 84% 60%))`,
          }}
        />
      </div>
      <div className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">{m.status}</div>
    </div>
  );
  return (
    <section>
      <SectionTitle color={accent}>Missões e Progresso</SectionTitle>
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Diárias</div>
      {mock.daily.map(renderRow)}
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Semanais</div>
      {mock.weekly.map(renderRow)}
    </section>
  );
}

/* ---------- PRIVACIDADE ---------- */
export function PrivacyBlock({ accent = "hsl(160 84% 65%)" }: { accent?: string }) {
  return (
    <section>
      <SectionTitle color={accent}>Privacidade</SectionTitle>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRIVACY_PUBLIC.map((p) => (
          <Tag key={p} color="#22c55e" variant="soft">público: {p}</Tag>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRIVACY_PRIVATE.map((p) => (
          <Tag key={p} color="hsl(220 14% 60%)" variant="outline">privado: {p}</Tag>
        ))}
      </div>
    </section>
  );
}

/* ---------- ÍCONES exports re-export para templates ---------- */
export { Trophy, Crown, TrendingUp, Target, Zap, Users, Sparkles, Hexagon };
