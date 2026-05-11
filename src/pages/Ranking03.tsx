/**
 * Ranking 03 — "Bloomberg Terminal"
 * Tabela densa estilo terminal financeiro, números tabulares, sparkline de
 * progresso, linhas zebradas com hover. Visual data-driven sério.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { Loader2, Trophy, Flame, ArrowUpRight, Search } from "lucide-react";
import { rankImg } from "@/lib/rankImages";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const rankColor = (name: string) =>
  RANKS.find((r) => r.name === name)?.color ?? "#888";
const shortId = (id: string) => `Trader #${id.slice(0, 4)}`;

function progressToNext(xp: number, currentRankName: string) {
  const idx = RANKS.findIndex((r) => r.name === currentRankName);
  const cur = RANKS[idx];
  const next = RANKS[idx + 1];
  if (!cur || !next) return 100;
  const span = next.xpMin - cur.xpMin;
  return Math.min(100, Math.max(0, ((xp - cur.xpMin) / span) * 100));
}

export default function Ranking03() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [{ data }, userRes] = await Promise.all([
          supabase
            .from("user_xp")
            .select("user_id, total_xp, current_rank, streak_days, display_name")
            .order("total_xp", { ascending: false })
            .range(0, 49)
            .abortSignal(controller.signal)
            .then(r => r, () => ({ data: null, error: null })),
          supabase.auth.getUser(),
        ]);
        if (controller.signal.aborted) return;
        setRows((data as Row[]) ?? []);
        setMe(
          userRes.data.user
            ? { id: userRes.data.user.id, email: userRes.data.user.email ?? null }
            : null,
        );
        setLoading(false);
      } catch (e) {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const fetchRanking = async () => {
      const [{ data }, userRes] = await Promise.all([
        supabase
          .from("user_xp")
          .select("user_id, total_xp, current_rank, streak_days, display_name")
          .order("total_xp", { ascending: false })
          .range(0, 49)
          .then(r => r, () => ({ data: null, error: null })),
        supabase.auth.getUser(),
      ]);
      setRows((data as Row[]) ?? []);
      setMe(userRes.data.user ? { id: userRes.data.user.id, email: userRes.data.user.email ?? null } : null);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchRanking();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const nameFor = (r: Row) => {
    if (me?.id === r.user_id) return me?.email?.split("@")[0] ?? "Você";
    if (r.display_name) return r.display_name;
    return shortId(r.user_id);
  };

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => nameFor(r).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, me]);

  const trophyColors = ["#FBBF24", "#D1D5DB", "#B45309"];

  return (
    <div className="relative min-h-screen px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-400/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live · Markets
            </p>
            <h1 className="mt-2 font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
              LEADERBOARD<span className="text-emerald-400">.TERMINAL</span>
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Top {rows.length} traders · ordenado por XP total
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="filtrar trader…"
              className="w-48 bg-transparent font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-[0_0_60px_-30px_rgba(16,185,129,0.6)] backdrop-blur-md">
          {loading ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead className="border-b border-white/10 bg-emerald-500/5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Pos</th>
                    <th className="px-4 py-3 text-left">Trader</th>
                    <th className="px-4 py-3 text-left">Patente</th>
                    <th className="px-4 py-3 text-right">XP</th>
                    <th className="px-4 py-3 text-center">Streak</th>
                    <th className="px-4 py-3 text-left">Progresso</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const c = rankColor(r.current_rank);
                    const pct = progressToNext(r.total_xp, r.current_rank);
                    const isMe = me?.id === r.user_id;
                    return (
                      <tr
                        key={r.user_id}
                        className={`border-t border-white/5 transition hover:bg-emerald-500/5 ${
                          isMe ? "bg-emerald-400/10" : i % 2 === 1 ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-bold tabular-nums text-zinc-300">
                          {i < 3 ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Trophy className="h-4 w-4" style={{ color: trophyColors[i] }} fill={trophyColors[i]} />
                              <span style={{ color: trophyColors[i] }}>{(i + 1).toString().padStart(2, "0")}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-500">#{(i + 1).toString().padStart(2, "0")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-white">{nameFor(r)}</span>
                          {isMe && (
                            <span className="ml-2 rounded bg-emerald-400 px-1.5 py-0.5 text-[9px] font-black text-black">
                              VOCÊ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <img
                              src={rankImg(r.current_rank)}
                              alt={r.current_rank}
                              className="h-7 w-7 object-contain drop-shadow-[0_0_4px_currentColor]"
                              style={{ color: c }}
                            />
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: c }}>
                              {r.current_rank}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-300">
                          {r.total_xp.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-orange-400">
                            <Flame className="h-3.5 w-3.5" /> {r.streak_days}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: `linear-gradient(90deg, ${c}, ${c}cc)`,
                                  boxShadow: `0 0 6px ${c}80`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums text-zinc-500">
                              {Math.round(pct)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-zinc-500 transition hover:text-emerald-300">
                            <ArrowUpRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-right font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          ⟶ atualizado em tempo real · virtus pro ia
        </p>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="divide-y divide-white/5">
      <div className="grid grid-cols-7 gap-3 bg-emerald-500/5 px-4 py-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-zinc-700/40" />
        ))}
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 items-center gap-3 px-4 py-3">
          <div className="h-3 w-8 animate-pulse rounded bg-zinc-700/40" />
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-700/40" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-700/40" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-700/40" />
          <div className="h-3 w-10 animate-pulse rounded bg-zinc-700/40" />
          <div className="h-1.5 w-28 animate-pulse rounded bg-zinc-700/40" />
          <div className="h-3 w-4 animate-pulse rounded bg-zinc-700/40" />
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="p-16 text-center font-mono text-sm text-zinc-500">
      Nenhum dado ainda — comece a acumular XP!
    </div>
  );
}
