/**
 * Mock data determinístico para perfis públicos exibidos no modal de perfil.
 * Os dados visíveis dependem somente do user_id, do XP atual e do nome — assim
 * o mesmo trader sempre mostra os mesmos números entre reloads.
 *
 * Usado pelos templates ProfileTemplateA..E.
 */
import type { RankingRow } from "./_shared";
import { rankProgress } from "./_shared";

/* hash determinístico simples (string -> uint32) */
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const PROFILE_TAGS = [
  ["Scalper", "Consistente", "Agressivo"],
  ["Day Trader", "Disciplinado", "Técnico"],
  ["Swing", "Paciente", "Analítico"],
  ["Quant", "Sistemático", "Frio"],
  ["Position", "Macro", "Estrategista"],
];

const STRATEGY_NAMES = [
  "RSI + EMA Crossover",
  "Bollinger Reversal",
  "MACD Divergence",
  "Volume Breakout",
  "Fibonacci Retracement",
  "Ichimoku Cloud",
  "VWAP Reversal",
  "Smart Money Concept",
];

const QUOTES = [
  "Disciplina é mais importante que inteligência.",
  "Risco controlado é metade do trade vencedor.",
  "Quem opera com pressa, deposita com pressa.",
  "Padrão se repete; emoção sabota.",
  "O mercado paga quem espera.",
  "Sem plano, qualquer entrada é boa.",
];

const BADGE_POOL = [
  { name: "Sniper", icon: "🎯", rarity: "lendária" },
  { name: "Streak 30", icon: "🔥", rarity: "épica" },
  { name: "Centurião", icon: "🚀", rarity: "épica" },
  { name: "Streak 7", icon: "🔥", rarity: "comum" },
  { name: "1º Trade", icon: "🏆", rarity: "comum" },
  { name: "FTD", icon: "💰", rarity: "comum" },
  { name: "Estrategista", icon: "🧠", rarity: "rara" },
  { name: "Semana Verde", icon: "📗", rarity: "rara" },
  { name: "MVP", icon: "👑", rarity: "lendária" },
  { name: "Streak 90", icon: "🔥", rarity: "lendária" },
  { name: "Influente", icon: "✨", rarity: "rara" },
  { name: "Banca R$5k", icon: "💵", rarity: "rara" },
];

export interface ProfileMock {
  /* header */
  initials: string;
  tags: string[];
  trader_kind: "Trader Positivo" | "Trader Frequente" | "Em Recuperação";
  quote: string;
  score: number;
  level: number;
  xp_to_next_level: number;
  /* ranking & posição */
  global_pos: number;
  season_xp: number;
  hall_pos: number;
  percentil_top: number;
  history: { label: string; pos: number; sub: string }[];
  /* performance */
  winrate: number;
  trades: number;
  avg_per_trade: number;
  positive_days: number;
  negative_days: number;
  best_streak_gains: number;
  best_streak_record: number;
  goals_hit: number;
  drawdown_max: number;
  /* score breakdown */
  score_winrate: [number, number];
  score_financeiro: [number, number];
  score_consistencia: [number, number];
  score_engajamento: [number, number];
  score_volume: [number, number];
  /* badges equipados + coleção */
  equipped: typeof BADGE_POOL;
  collection: { badge: typeof BADGE_POOL[number]; owned: boolean }[];
  /* estratégias */
  strategies: { name: string; uses: number; winrate: number; top: boolean }[];
  /* comunidade */
  posts: number;
  replies: number;
  likes: number;
  threads: { title: string; cat: string; ago: string; replies: number }[];
  /* missões */
  daily: { title: string; pct: number; status: string }[];
  weekly: { title: string; pct: number; status: string }[];
  /* campos dinâmicos */
  preferred_asset: string;
  score_variation: number;
  rank_change: number | null;
}

export function buildProfileMock(row: RankingRow, displayName: string, position: number): ProfileMock {
  const seed = hash(row.user_id + "|" + row.total_xp);
  const r = rng(seed);

  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "VS";

  const tagSet = PROFILE_TAGS[Math.floor(r() * PROFILE_TAGS.length)];

  // Score 0-100 = progress within current rank tier (real data from row.score).
  // rankProgress returns pct=100 for Global (max rank, no next tier).
  const score = Math.max(1, Math.min(100, Math.round(rankProgress(row).pct)));
  const level = (row.level && row.level > 1) ? row.level : (35 + Math.floor(r() * 25));
  // XP remaining to next level using the same formula as the DB:
  // calculate_level(xp) = floor(sqrt(xp/50)) + 1
  // → level L occupies [(L-1)²×50, L²×50), so remaining = L²×50 - total_xp
  const xp_to_next_level = Math.max(0, level * level * 50 - row.total_xp);
  const season_xp = (row.season_xp && row.season_xp > 0) ? row.season_xp : (8000 + Math.floor(r() * 14000));
  const hall_pos = position;
  const percentil_top = position <= 3 ? 1 : position <= 10 ? 2 : 5;

  const winrate = 55 + Math.floor(r() * 22);
  const trades = 180 + Math.floor(r() * 280);
  const avg_per_trade = +(0.8 + r() * 3.5).toFixed(2);
  const positive_days = 12 + Math.floor(r() * 14);
  const negative_days = 2 + Math.floor(r() * 6);
  const best_streak_gains = 5 + Math.floor(r() * 8);
  const best_streak_record = best_streak_gains + 4 + Math.floor(r() * 5);
  const goals_hit = 18 + Math.floor(r() * 18);
  const drawdown_max = -(80 + Math.floor(r() * 220));

  const sb = (max: number) => {
    const got = Math.max(Math.floor(max * 0.55), Math.floor(max * (0.55 + r() * 0.45)));
    return [Math.min(got, max), max] as [number, number];
  };

  // shuffle badges deterministicamente
  const shuffled = [...BADGE_POOL].sort(() => r() - 0.5);
  const equipped = shuffled.slice(0, 3);
  const ownedCount = 6 + Math.floor(r() * 4);
  const collection = BADGE_POOL.map((b, i) => ({ badge: b, owned: i < ownedCount }));

  const stratPick = [...STRATEGY_NAMES].sort(() => r() - 0.5).slice(0, 2);
  const strategies = stratPick.map((name, i) => ({
    name,
    uses: 60 + Math.floor(r() * 120),
    winrate: 60 + Math.floor(r() * 18),
    top: i === 0,
  }));

  const posts = 20 + Math.floor(r() * 60);
  const replies = posts * 2 + Math.floor(r() * 40);
  const likes = posts * 4 + Math.floor(r() * 80);
  const threads = [
    { title: `Como configurei minha estratégia ${stratPick[0]?.split(" ")[0] ?? "RSI"}`, cat: "Estratégias", ago: "3 dias atrás", replies: 12 + Math.floor(r() * 14) },
    { title: "Dúvida sobre stop loss na sessão noturna", cat: "Dúvidas", ago: "1 semana atrás", replies: 5 + Math.floor(r() * 10) },
    { title: "Resultado da semana — positivo", cat: "Resultados", ago: "2 semanas atrás", replies: 18 + Math.floor(r() * 18) },
  ];

  const daily = [
    { title: "Login diário", pct: 100, status: "feito" },
    { title: "Realizar 3 operações", pct: 66, status: "2/3" },
    { title: "Sessão positiva", pct: 0, status: "0/1" },
  ];
  const weekly = [
    { title: "Streak 7 dias", pct: 86, status: "6/7" },
    { title: "Assistir 3 aulas", pct: 33, status: "1/3" },
    { title: "Postar no fórum", pct: 100, status: "feito" },
  ];

  // histórico: usuário só competiu na temporada atual (maio); anteriores não participou
  const history = [
    { label: "T1 — Jan", pos: 0, sub: "não participou" },
    { label: "T2 — Fev", pos: 0, sub: "não participou" },
    { label: "T3 — Mar", pos: 0, sub: "não participou" },
    { label: "T1 — Mai", pos: position, sub: "em andamento" },
  ];

  const traderKinds: ProfileMock["trader_kind"][] = ["Trader Positivo", "Trader Frequente", "Em Recuperação"];
  const trader_kind = winrate > 65 ? "Trader Positivo" : winrate > 58 ? "Trader Frequente" : "Em Recuperação";

  return {
    initials,
    tags: tagSet,
    trader_kind,
    quote: QUOTES[Math.floor(r() * QUOTES.length)],
    score,
    level,
    xp_to_next_level,
    global_pos: position,
    season_xp,
    hall_pos,
    percentil_top,
    history,
    winrate,
    trades,
    avg_per_trade,
    positive_days,
    negative_days,
    best_streak_gains,
    best_streak_record,
    goals_hit,
    drawdown_max,
    score_winrate: sb(35),
    score_financeiro: sb(25),
    score_consistencia: sb(20),
    score_engajamento: sb(12),
    score_volume: sb(8),
    equipped,
    collection,
    strategies,
    posts,
    replies,
    likes,
    threads,
    daily,
    weekly,
    preferred_asset: "EUR/USD",
    score_variation: Math.floor(r() * 31) - 5,
    rank_change: null,
  };
}

export const PRIVACY_PUBLIC = [
  "patente + score",
  "nível + XP total",
  "XP da temporada",
  "winrate + consistência",
  "badges + coleção",
  "ranking + histórico",
  "estratégias (winrate)",
  "comunidade e posts",
];
export const PRIVACY_PRIVATE = [
  "saldo e depósitos",
  "profit em R$",
  "missões e progresso",
  "lógica das estratégias",
  "dados pessoais",
];
