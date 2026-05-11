/**
 * Shared helpers para os templates Ranking11–Ranking15.
 * Mantém a paleta esmeralda do app harmônica com o sidebar.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";

export interface RankingRow {
  user_id: string;
  total_xp: number;   // XP acumulado all-time → Hall da Fama
  score: number;      // Score de trading → determina patente
  season_xp: number;  // XP da temporada → ranking mensal
  level: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

export interface MeInfo {
  id: string;
  email: string | null;
}

const CACHE_TTL = 5 * 60 * 1000;
let sharedCache: { rows: RankingRow[]; me: MeInfo | null; cachedAt: number } | null = null;

export function useRankingData() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [me, setMe] = useState<MeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();
    (async () => {
      setError(null);
      const bust = reloadKey > 0;
      if (!bust && sharedCache && Date.now() - sharedCache.cachedAt < CACHE_TTL) {
        if (!mounted) return;
        setRows(sharedCache.rows);
        setMe(sharedCache.me);
        setLoading(false);
        return;
      }
      try {
        const [{ data, error }, sess] = await Promise.all([
          supabase
            .from("user_xp")
            .select("user_id, total_xp, score, season_xp, level, current_rank, streak_days, display_name")
            .order("score", { ascending: false })
            .range(0, 49)
            .abortSignal(ctrl.signal)
            .then(r => r, () => ({ data: null, error: null })),
          supabase.auth.getSession(),
        ]);
        if (!mounted) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        const u = sess.data.session?.user;
        const meVal: MeInfo | null = u ? { id: u.id, email: u.email ?? null } : null;
        const r = (data as RankingRow[]) ?? [];
        sharedCache = { rows: r, me: meVal, cachedAt: Date.now() };
        setRows(r);
        setMe(meVal);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Erro");
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [reloadKey]);

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return { rows, me, loading, error, reload };
}

export const rankInfo = (name: string) =>
  RANKS.find((r) => r.name === name) ?? RANKS[0];

export const shortId = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;
export const fmt = (n: number) => n.toLocaleString("pt-BR");

export function nameFor(row: RankingRow, me: MeInfo | null) {
  if (me?.id === row.user_id) return me?.email?.split("@")[0] ?? "Você";
  return row.display_name || shortId(row.user_id);
}

export function useSeasonInfo() {
  return useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleDateString("pt-BR", { month: "long" });
    return {
      day,
      total,
      remaining: total - day,
      pct: (day / total) * 100,
      monthName,
      year: now.getFullYear(),
    };
  }, []);
}

export function rankProgress(row: RankingRow) {
  const scoreVal = row.score ?? row.total_xp; // fallback pré-migração
  const info = rankInfo(row.current_rank);
  const idx = RANKS.findIndex((r) => r.name === info.name);
  const next = idx >= 0 && idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  if (!next) return { pct: 100, info, next: null };
  const range = next.xpMin - info.xpMin;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((scoreVal - info.xpMin) / range) * 100)) : 100;
  return { pct, info, next };
}
