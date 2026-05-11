import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EarnedBadge {
  key: string;
  title: string;
  description: string | null;
  rarity: "comum" | "rara" | "epica" | "lendaria";
  badge_group: string;
  xp_reward: number;
  icon: string | null;
  earned_at: string;
  equipped: boolean;
}

export interface MissionProgress {
  id: string;
  title: string;
  description: string | null;
  type: "daily" | "weekly" | "permanent";
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  progress: number;
  completed_at: string | null;
}

export interface UserProfileData {
  user_id: string;
  display_name: string | null;
  // Perfil & Progresso
  total_xp: number;
  score: number;
  season_xp: number;
  level: number;
  current_rank: string;
  streak_days: number;
  // Status Competitivo
  rank_position: number;
  total_traders: number;
  top_pct: number;
  rank_change: number | null;
  // Estatísticas
  total_operations: number;
  wins: number;
  losses: number;
  win_rate: number;
  preferred_asset: string | null;
  score_variation: number;
  positive_days: number;
  best_gains_streak: number;
  best_goals_streak: number;     // precisa de dado de sessão — por enquanto 0
  best_financial_streak: number;
  // Badges
  earned_badges: EarnedBadge[];
  all_badges: Array<{             // catálogo completo (earned + locked)
    key: string;
    title: string;
    description: string | null;
    rarity: "comum" | "rara" | "epica" | "lendaria";
    badge_group: string;
    xp_reward: number;
    earned: boolean;
    equipped: boolean;
    earned_at: string | null;
  }>;
  // Missões (apenas perfil próprio)
  missions: MissionProgress[] | null;
}

export function useUserProfile(userId: string | null, isOwnProfile: boolean) {
  const [data, setData]       = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setData(null); return; }
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // ── 1. Dados XP do usuário ──────────────────────────────────────
        const { data: xp, error: xpErr } = await (supabase.from as any)("user_xp")
          .select("user_id, display_name, total_xp, score, season_xp, level, current_rank, streak_days")
          .eq("user_id", userId)
          .maybeSingle();
        if (xpErr) throw xpErr;

        // ── 2. Posição no ranking ──────────────────────────────────────
        const [rankTotal, rankAbove] = await Promise.all([
          (supabase.from as any)("user_xp").select("*", { count: "exact", head: true }).then((r: any) => r, () => ({ data: null, error: null, count: null })),
          (supabase.from as any)("user_xp")
            .select("*", { count: "exact", head: true })
            .gt("score", xp?.score ?? 0)
            .then((r: any) => r, () => ({ data: null, error: null, count: null })),
        ]);
        const total = rankTotal?.count ?? null;
        const above = rankAbove?.count ?? null;
        const rankPos  = (above ?? 0) + 1;
        const topPct   = total ? Math.max(1, Math.round((rankPos / total) * 100)) : 100;

        // ── 3. Variação de posição (ontem) ─────────────────────────────
        const yd = new Date();
        yd.setDate(yd.getDate() - 1);
        const ydStr = yd.toISOString().split("T")[0];
        const { data: hist } = await (supabase.from as any)("rank_history")
          .select("rank_position, score")
          .eq("user_id", userId)
          .eq("recorded_date", ydStr)
          .maybeSingle();
        const rankChange      = hist ? hist.rank_position - rankPos : null;
        const scoreVariation  = hist ? (xp?.score ?? 0) - hist.score : 0;

        // ── 4. Operações (trade_events) ────────────────────────────────
        const { data: trades } = await (supabase.from as any)("trade_events")
          .select("result, pnl, asset, happened_at")
          .eq("user_id", userId)
          .order("happened_at", { ascending: true });

        const tradeList = (trades ?? []) as Array<{
          result: "win" | "loss" | "draw" | null;
          pnl: number | null;
          asset: string | null;
          happened_at: string;
        }>;

        const wins   = tradeList.filter(t => t.result === "win").length;
        const losses = tradeList.filter(t => t.result === "loss").length;
        const totalOps = wins + losses;
        const winRate  = totalOps > 0 ? Math.round((wins / totalOps) * 100) : 0;

        // Ativo preferido
        const assetMap: Record<string, number> = {};
        for (const t of tradeList) {
          if (t.asset) assetMap[t.asset] = (assetMap[t.asset] ?? 0) + 1;
        }
        const preferredAsset = Object.entries(assetMap)
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        // Dias positivos (wins > losses naquele dia)
        const dayBucket: Record<string, { w: number; l: number }> = {};
        for (const t of tradeList) {
          const d = t.happened_at?.split("T")[0] ?? "";
          if (!dayBucket[d]) dayBucket[d] = { w: 0, l: 0 };
          if (t.result === "win")  dayBucket[d].w++;
          if (t.result === "loss") dayBucket[d].l++;
        }
        const positiveDays = Object.values(dayBucket).filter(d => d.w > d.l).length;

        // Maior sequência de gains seguidos
        let bestGains = 0, curGains = 0;
        for (const t of tradeList) {
          if (t.result === "win")  { curGains++; bestGains = Math.max(bestGains, curGains); }
          else curGains = 0;
        }

        // Melhor sequência financeira (soma PnL de wins consecutivos)
        let bestFin = 0, curFin = 0;
        for (const t of tradeList) {
          if (t.result === "win")  { curFin += t.pnl ?? 0; bestFin = Math.max(bestFin, curFin); }
          else curFin = 0;
        }

        // ── 5. Catálogo completo de badges ─────────────────────────────
        const { data: catalog } = await (supabase.from as any)("achievements_catalog")
          .select("key, title, description, rarity, badge_group, xp_reward")
          .order("badge_group", { ascending: true });

        // Badges conquistadas pelo usuário
        const { data: earned } = await (supabase.from as any)("user_achievements")
          .select("achievement_key, earned_at, equipped")
          .eq("user_id", userId);

        const earnedMap: Record<string, { earned_at: string; equipped: boolean }> = {};
        for (const e of (earned ?? [])) {
          earnedMap[e.achievement_key] = { earned_at: e.earned_at, equipped: e.equipped ?? false };
        }

        const allBadges = (catalog ?? []).map((c: any) => ({
          key:         c.key,
          title:       c.title,
          description: c.description ?? null,
          rarity:      c.rarity,
          badge_group: c.badge_group ?? "outros",
          xp_reward:   c.xp_reward,
          earned:      !!earnedMap[c.key],
          equipped:    earnedMap[c.key]?.equipped ?? false,
          earned_at:   earnedMap[c.key]?.earned_at ?? null,
        }));

        const earnedBadges: EarnedBadge[] = allBadges
          .filter((b: any) => b.earned)
          .map((b: any) => ({ ...b, icon: null }));

        // ── 6. Missões (somente perfil próprio — RLS blocks others) ────
        let missions: MissionProgress[] | null = null;
        if (isOwnProfile) {
          const [{ data: mCatalog }, { data: mUser }] = await Promise.all([
            (supabase.from as any)("missions_catalog")
              .select("id, title, description, type, requirement_type, requirement_value, xp_reward")
              .order("sort_order")
              .then(r => r, () => ({ data: null, error: null })),
            (supabase.from as any)("user_missions")
              .select("mission_id, progress, completed_at")
              .eq("user_id", userId)
              .then(r => r, () => ({ data: null, error: null })),
          ]);

          const uMap: Record<string, { progress: number; completed_at: string | null }> = {};
          for (const m of (mUser ?? [])) {
            uMap[m.mission_id] = { progress: m.progress, completed_at: m.completed_at ?? null };
          }

          missions = (mCatalog ?? []).map((c: any): MissionProgress => ({
            id:                c.id,
            title:             c.title,
            description:       c.description ?? null,
            type:              c.type,
            requirement_type:  c.requirement_type,
            requirement_value: c.requirement_value,
            xp_reward:         c.xp_reward,
            progress:          uMap[c.id]?.progress ?? 0,
            completed_at:      uMap[c.id]?.completed_at ?? null,
          }));
        }

        if (!mounted) return;
        setData({
          user_id:              userId,
          display_name:         xp?.display_name ?? null,
          total_xp:             xp?.total_xp     ?? 0,
          score:                xp?.score        ?? 0,
          season_xp:            xp?.season_xp    ?? 0,
          level:                xp?.level        ?? 1,
          current_rank:         xp?.current_rank ?? "Prata I",
          streak_days:          xp?.streak_days  ?? 0,
          rank_position:        rankPos,
          total_traders:        total ?? 0,
          top_pct:              topPct,
          rank_change:          rankChange,
          total_operations:     totalOps,
          wins,
          losses,
          win_rate:             winRate,
          preferred_asset:      preferredAsset,
          score_variation:      scoreVariation,
          positive_days:        positiveDays,
          best_gains_streak:    bestGains,
          best_goals_streak:    0,
          best_financial_streak: bestFin,
          earned_badges:        earnedBadges,
          all_badges:           allBadges,
          missions,
        });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Erro ao carregar perfil");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [userId, isOwnProfile]);

  return { data, loading, error };
}
