// ============================================================================
// useGamification.ts
// Hook de gamificação: XP, ranks, streak diário e achievements.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Tipos
// ============================================================================

export type RankTier = "prata" | "ouro" | "ak" | "aguia" | "supremo";
export type BadgeRarity = "comum" | "rara" | "epica" | "lendaria";

export interface RankInfo {
  name: string;
  tier: RankTier;
  xpMin: number;
  xpMax: number | null;
  color: string;
}

export interface UserXP {
  totalXp: number;      // XP acumulado all-time → determina level
  score: number;        // Score de trading → determina patente
  seasonXp: number;     // XP da temporada atual (mensal)
  level: number;        // Nível calculado via total_xp
  currentRank: RankInfo;
  nextRank: RankInfo | null;
  progressPercent: number;
  streakDays: number;
}

export interface BadgeInfo {
  key: string;
  title: string;
  description: string | null;
  rarity: BadgeRarity;
  xpReward: number;
  icon: string | null;
  earnedAt: string | null; // null = não conquistado
}

// ============================================================================
// Cores por tier
// ============================================================================

const TIER_COLORS: Record<RankTier, string> = {
  prata: "#B4B2A9",
  ouro: "#FAC775",
  ak: "#5DCAA5",
  aguia: "#AFA9EC",
  supremo: "#D85A30",
};

// ============================================================================
// Constante RANKS (14 ranks — Prata I até Global)
// xpMax é calculado a partir do xpMin do próximo rank (-1). Global é null.
// ============================================================================

const RAW_RANKS: Array<{ name: string; tier: RankTier; xpMin: number }> = [
  { name: "Prata I",     tier: "prata",   xpMin: 0 },
  { name: "Prata II",    tier: "prata",   xpMin: 500 },
  { name: "Prata III",   tier: "prata",   xpMin: 1200 },
  { name: "Ouro I",      tier: "ouro",    xpMin: 2500 },
  { name: "Ouro II",     tier: "ouro",    xpMin: 4500 },
  { name: "Ouro III",    tier: "ouro",    xpMin: 7500 },
  { name: "AK I",        tier: "ak",      xpMin: 12000 },
  { name: "AK II",       tier: "ak",      xpMin: 19000 },
  { name: "AK Cruzada",  tier: "ak",      xpMin: 28000 },
  { name: "Xerife",      tier: "aguia",   xpMin: 40000 },
  { name: "Águia I",     tier: "aguia",   xpMin: 55000 },
  { name: "Águia II",    tier: "aguia",   xpMin: 75000 },
  { name: "Supremo",     tier: "supremo", xpMin: 100000 },
  { name: "Global",      tier: "supremo", xpMin: 150000 },
];

export const RANKS: RankInfo[] = RAW_RANKS.map((r, i) => ({
  name: r.name,
  tier: r.tier,
  xpMin: r.xpMin,
  xpMax: i < RAW_RANKS.length - 1 ? RAW_RANKS[i + 1].xpMin - 1 : null,
  color: TIER_COLORS[r.tier],
}));

// ============================================================================
// Helpers
// ============================================================================

function getRankByXP(totalXp: number): RankInfo {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (totalXp >= rank.xpMin) current = rank;
    else break;
  }
  return current;
}

function getNextRank(current: RankInfo): RankInfo | null {
  const idx = RANKS.findIndex((r) => r.name === current.name);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

function calcProgressPercent(totalXp: number, current: RankInfo, next: RankInfo | null): number {
  if (!next) return 100;
  const range = next.xpMin - current.xpMin;
  if (range <= 0) return 100;
  const progress = ((totalXp - current.xpMin) / range) * 100;
  return Math.max(0, Math.min(100, progress));
}

function todayISO(): string {
  // YYYY-MM-DD em horário local
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffInDays(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// awardXP — chama RPC public.award_xp
// ============================================================================

export async function awardXP(source: string, amount: number, description: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Usuário não autenticado");

  const { data, error } = await (supabase.rpc as any)("award_xp", {
    p_user_id: userId,
    p_amount: amount,
    p_source: source,
    p_description: description,
  });

  if (error) {
    console.error("[awardXP] erro:", error);
    throw error;
  }
  return data;
}

// ============================================================================
// checkAndAwardAchievement
// ============================================================================

export async function checkAndAwardAchievement(
  key: string,
  xpAmount: number,
  description: string,
): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return false;

  const { data: existing, error: selErr } = await (supabase.from as any)("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_key", key)
    .maybeSingle();

  if (selErr) {
    console.error("[checkAndAwardAchievement] erro select:", selErr);
    return false;
  }
  if (existing) return false; // já concedido

  await awardXP(key, xpAmount, description);

  const { error: insErr } = await (supabase.from as any)("user_achievements").insert({
    user_id: userId,
    achievement_key: key,
  });

  if (insErr) {
    console.error("[checkAndAwardAchievement] erro insert:", insErr);
    return false;
  }
  return true;
}

// ============================================================================
// handleDailyLogin
// ============================================================================

export async function handleDailyLogin(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  const today = todayISO();

  const { data: row, error } = await (supabase.from as any)("user_xp")
    .select("last_login_date, streak_days")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[handleDailyLogin] erro select user_xp:", error);
    return;
  }

  const lastLogin: string | null = row?.last_login_date ?? null;
  const currentStreak: number = row?.streak_days ?? 0;

  if (lastLogin === today) return; // já contabilizado hoje

  // Calcula novo streak
  let newStreak = 1;
  if (lastLogin) {
    const diff = diffInDays(lastLogin, today);
    if (diff === 1) newStreak = currentStreak + 1;
    else newStreak = 1; // quebrou a sequência
  }

  // 1. XP de login diário
  await awardXP("daily_login", 10, "Login diário");

  // 2. Atualiza streak + last_login_date (upsert por segurança)
  const { error: upErr } = await (supabase.from as any)("user_xp").upsert(
    {
      user_id: userId,
      last_login_date: today,
      streak_days: newStreak,
    },
    { onConflict: "user_id" },
  );
  if (upErr) console.error("[handleDailyLogin] erro upsert streak:", upErr);

  // 3. Bônus de streak
  if (newStreak === 7) {
    await checkAndAwardAchievement("streak_7", 100, "Sequência de 7 dias");
  }
  if (newStreak === 30) {
    await checkAndAwardAchievement("streak_30", 500, "Sequência de 30 dias");
  }
}

// ============================================================================
// useUserXP — hook reativo
// ============================================================================

export function useUserXP() {
  const [data, setData] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setData(null);
        setLoading(false);
        return;
      }

      const { data: row, error: selErr } = await (supabase.from as any)("user_xp")
        .select("total_xp, score, season_xp, level, streak_days, current_rank")
        .eq("user_id", userId)
        .maybeSingle();

      if (selErr) throw selErr;

      const totalXp    = row?.total_xp   ?? 0;
      const score      = row?.score      ?? totalXp; // fallback para total_xp se coluna ainda não existe
      const seasonXp   = row?.season_xp  ?? 0;
      const level      = row?.level      ?? Math.max(1, Math.floor(Math.sqrt(totalXp / 50)) + 1);
      const streakDays = row?.streak_days ?? 0;
      // Rank é determinado por score
      const currentRank   = getRankByXP(score);
      const nextRank      = getNextRank(currentRank);
      const progressPercent = calcProgressPercent(score, currentRank, nextRank);

      setData({ totalXp, score, seasonXp, level, currentRank, nextRank, progressPercent, streakDays });
    } catch (e: any) {
      console.error("[useUserXP] erro:", e);
      setError(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
