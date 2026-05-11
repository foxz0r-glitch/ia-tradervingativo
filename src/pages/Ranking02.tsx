/**
 * Ranking 02 — "Glassmorphism Premium"
 * Cards de vidro fosco, gradientes esmeralda/cyan, halos animados, barra de
 * progresso para o próximo rank. Mantém o background global Virtus Pro IA.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { Loader2, Sparkles, TrendingUp, Trophy } from "lucide-react";
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
  if (!cur || !next) return { pct: 100, next: null as null | string };
  const span = next.xpMin - cur.xpMin;
  const pct = Math.min(100, Math.max(0, ((xp - cur.xpMin) / span) * 100));
  return { pct, next: next.name };
}

const FILTERS = ["Geral", "Semanal", "Mensal"] as const;

export default function Ranking02() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Geral");

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

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  return (
    <div className="relative min-h-screen px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-emerald-400/80">
              <Sparkles className="h-3.5 w-3.5" /> Comunidade Virtus Pro
            </p>
            <h1 className="mt-2 bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Ranking
            </h1>
            <p className="mt-1 text-sm text-zinc-400">Top traders por XP acumulado</p>
          </div>

          <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-[0_0_20px_-4px_rgba(16,185,129,0.6)]"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* Top 3 cards */}
            <div className="mb-8 grid gap-5 md:grid-cols-3">
              {top3.map((r, i) => {
                const c = rankColor(r.current_rank);
                const isMe = me?.id === r.user_id;
                const podium = ["from-amber-400/30 to-amber-600/0", "from-zinc-300/30 to-zinc-500/0", "from-orange-500/25 to-orange-700/0"][i];
                const ring = ["ring-amber-400/60", "ring-zinc-300/50", "ring-orange-500/50"][i];
                return (
                  <div
                    key={r.user_id}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 ${
                      isMe ? "ring-2 ring-emerald-400/70" : ""
                    } ${i === 0 ? "md:scale-105" : ""}`}
                  >
                    {/* Halo */}
                    <div className={`pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-gradient-to-b ${podium} blur-2xl`} />

                    <div className={`absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-black tracking-wider ring-1 ${ring}`}>
                      #{i + 1}
                    </div>

                    <div className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full opacity-50 blur-2xl"
                        style={{ background: c }}
                      />
                      <img
                        src={rankImg(r.current_rank)}
                        alt={r.current_rank}
                        className="relative h-28 w-28 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                      />
                      {i === 0 && (
                        <Trophy className="absolute -top-2 -right-2 h-7 w-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" fill="currentColor" />
                      )}
                    </div>
                    <p className="truncate text-base font-semibold text-white">{nameFor(r)}</p>
                    <span
                      className="mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold text-black"
                      style={{ background: c }}
                    >
                      {r.current_rank}
                    </span>
                    <p className="mt-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-3xl font-black tabular-nums text-transparent">
                      {r.total_xp.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">XP total</p>
                  </div>
                );
              })}
            </div>

            {/* Lista */}
            <div className="space-y-2.5">
              {rest.map((r, i) => {
                const c = rankColor(r.current_rank);
                const { pct, next } = progressToNext(r.total_xp, r.current_rank);
                const isMe = me?.id === r.user_id;
                return (
                  <div
                    key={r.user_id}
                    className={`group flex items-center gap-4 rounded-2xl border bg-white/[0.04] p-4 backdrop-blur-md transition hover:bg-white/[0.07] ${
                      isMe ? "border-emerald-400/60 ring-1 ring-emerald-400/40" : "border-white/10"
                    }`}
                  >
                    <div className="w-10 text-center text-sm font-bold tabular-nums text-zinc-500">
                      {i + 4}
                    </div>
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                      <div className="absolute inset-0 rounded-full opacity-30 blur-md" style={{ background: c }} />
                      <img
                        src={rankImg(r.current_rank)}
                        alt={r.current_rank}
                        className="relative h-12 w-12 object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-white">
                          {nameFor(r)}
                        </span>
                        {isMe && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">VOCÊ</span>}
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-black"
                          style={{ background: c }}
                        >
                          {r.current_rank}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${c}, ${c}cc)`,
                            boxShadow: `0 0 10px ${c}80`,
                          }}
                        />
                      </div>
                      {next && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                          <TrendingUp className="h-3 w-3" /> {Math.round(pct)}% rumo a {next}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums text-white">
                        {r.total_xp.toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mx-auto mb-4 h-28 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="mx-auto mt-3 h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="mx-auto mt-4 h-8 w-28 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="h-4 w-6 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-1.5 w-full animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center text-zinc-400 backdrop-blur-md">
      Nenhum dado ainda — comece a acumular XP!
    </div>
  );
}
