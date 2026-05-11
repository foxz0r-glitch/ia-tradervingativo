import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserStrategy {
  id: string;
  name: string;
  created_at: string;
  trades: number;
  wins: number;
  winrate: number | null; // null when 0 trades
}

export function useUserStrategies(userId: string | null) {
  const [data, setData]       = useState<UserStrategy[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setKey]   = useState(0);

  const reload = useCallback(() => setKey(k => k + 1), []);

  useEffect(() => {
    if (!userId) { setData(null); return; }
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const { data: strats } = await (supabase.from as any)("user_strategies")
          .select("id, name, created_at")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        const list = (strats ?? []) as Array<{ id: string; name: string; created_at: string }>;

        // Calcular winrate por estratégia em uma só query
        const ids = list.map(s => s.id);
        let countsMap: Record<string, { trades: number; wins: number }> = {};
        if (ids.length > 0) {
          const { data: ev } = await (supabase.from as any)("trade_events")
            .select("strategy_id, result")
            .eq("user_id", userId)
            .in("strategy_id", ids);

          for (const e of (ev ?? []) as Array<{ strategy_id: string; result: string | null }>) {
            const c = countsMap[e.strategy_id] ?? { trades: 0, wins: 0 };
            c.trades++;
            if (e.result === "win") c.wins++;
            countsMap[e.strategy_id] = c;
          }
        }

        const result: UserStrategy[] = list.map(s => {
          const c = countsMap[s.id] ?? { trades: 0, wins: 0 };
          return {
            ...s,
            trades: c.trades,
            wins: c.wins,
            winrate: c.trades > 0 ? Math.round((c.wins / c.trades) * 100) : null,
          };
        });

        if (mounted) setData(result);
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [userId, reloadKey]);

  const create = useCallback(async (name: string) => {
    if (!userId || !name.trim()) return;
    await (supabase.from as any)("user_strategies").insert({ user_id: userId, name: name.trim() });
    reload();
  }, [userId, reload]);

  const remove = useCallback(async (id: string) => {
    await (supabase.from as any)("user_strategies").delete().eq("id", id);
    reload();
  }, [reload]);

  return { data, loading, create, remove, reload };
}
