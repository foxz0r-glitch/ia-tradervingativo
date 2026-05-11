import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StatsPeriod = "Total" | "30 dias" | "7 dias";

export interface ProfileStats {
  trades: number;
  wins: number;
  losses: number;
  winrate: number;          // %
  preferredAsset: string | null;  // by sessions
  bestRunUp: number;        // R$ acumulado em maior sequência sem loss
}

/**
 * Hook que busca estatísticas reais do usuário em trade_events filtradas por período.
 * Retorna `null` enquanto carrega ou se não houver dados.
 *
 * Observações:
 * - Ativo preferido = ativo com maior nº de SESSÕES (uma sessão = trades do mesmo
 *   ativo agrupados se gap < 30min). Calculado apenas no período "Total" (não filtra),
 *   pois é uma característica do trader, não do recorte de tempo.
 * - Best run-up = maior soma contínua de pnl sem ocorrência de loss (pnl=0 NÃO quebra).
 */
export function useProfileStats(userId: string | null, period: StatsPeriod) {
  const [data, setData]       = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setData(null); return; }
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        // Período de filtro
        let sinceISO: string | null = null;
        if (period === "7 dias") {
          const d = new Date(); d.setDate(d.getDate() - 7);
          sinceISO = d.toISOString();
        } else if (period === "30 dias") {
          const d = new Date(); d.setDate(d.getDate() - 30);
          sinceISO = d.toISOString();
        }

        // Trades do período (winrate / ops / best run-up)
        let q = (supabase.from as any)("trade_events")
          .select("result, pnl, asset, happened_at")
          .eq("user_id", userId)
          .order("happened_at", { ascending: true });
        if (sinceISO) q = q.gte("happened_at", sinceISO);

        const { data: rows } = await q;
        const trades = (rows ?? []) as Array<{
          result: "win" | "loss" | "draw" | null;
          pnl: number | null;
          asset: string | null;
          happened_at: string;
        }>;

        const wins   = trades.filter(t => t.result === "win").length;
        const losses = trades.filter(t => t.result === "loss").length;
        const totalOps = wins + losses;
        const winrate = totalOps > 0 ? Math.round((wins / totalOps) * 100) : 0;

        // Best run-up monetário sem loss (draw/0 não quebra)
        let cur = 0, best = 0;
        for (const t of trades) {
          if (t.result === "loss") { cur = 0; continue; }
          cur += Number(t.pnl ?? 0);
          if (cur > best) best = cur;
        }

        // Ativo preferido — agrupa por sessões em TODOS os dados
        const { data: allRows } = await (supabase.from as any)("trade_events")
          .select("asset, happened_at")
          .eq("user_id", userId)
          .order("happened_at", { ascending: true });

        const allTrades = (allRows ?? []) as Array<{ asset: string | null; happened_at: string }>;
        const SESSION_GAP_MS = 30 * 60 * 1000;
        const lastSeen: Record<string, number> = {};
        const sessionCount: Record<string, number> = {};
        for (const t of allTrades) {
          if (!t.asset) continue;
          const ts = new Date(t.happened_at).getTime();
          const last = lastSeen[t.asset];
          if (last === undefined || ts - last > SESSION_GAP_MS) {
            sessionCount[t.asset] = (sessionCount[t.asset] ?? 0) + 1;
          }
          lastSeen[t.asset] = ts;
        }
        const preferredAsset = Object.entries(sessionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        if (!mounted) return;
        setData({
          trades: totalOps,
          wins, losses, winrate,
          preferredAsset,
          bestRunUp: Math.round(best * 100) / 100,
        });
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [userId, period]);

  return { data, loading };
}
