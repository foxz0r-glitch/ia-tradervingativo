/**
 * Ranking 05 — "Social Feed Mobile-first"
 * Layout focado, card sticky com a posição do usuário, medalhas para top 3,
 * gradientes esmeralda. Mantém background global IA Vingativa.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { Loader2, Flame, TrendingUp } from "lucide-react";
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

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Ranking05() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);

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

  const myIndex = me ? rows.findIndex((r) => r.user_id === me.id) : -1;
  const myRow = myIndex >= 0 ? rows[myIndex] : null;
  const totalXp = useMemo(() => rows.reduce((a, r) => a + r.total_xp, 0), [rows]);

  return (
    <div className="relative min-h-screen px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-400/80">
            Comunidade · Live
          </p>
          <h1 className="mt-1 bg-gradient-to-r from-white to-emerald-300 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Ranking
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Traders</p>
              <p className="text-lg font-bold text-white">{rows.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">XP total</p>
              <p className="text-lg font-bold text-emerald-300">{(totalXp / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </header>

        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {myRow && (
              <div className="sticky top-2 z-10 mb-4 overflow-hidden rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-br from-emerald-500/20 via-emerald-700/10 to-transparent p-4 backdrop-blur-xl shadow-[0_0_40px_-12px_rgba(16,185,129,0.7)]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={rankImg(myRow.current_rank)}
                      alt={myRow.current_rank}
                      className="h-16 w-16 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-lg bg-emerald-400 px-1.5 py-0.5 text-[10px] font-black text-black ring-2 ring-black/60">
                      #{myIndex + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Sua posição
                    </p>
                    <p className="truncate font-bold text-white">{nameFor(myRow)}</p>
                    <p className="text-xs" style={{ color: rankColor(myRow.current_rank) }}>
                      {myRow.current_rank} • {myRow.total_xp.toLocaleString()} XP
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm font-bold">{myRow.streak_days}d</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] text-emerald-300">
                      <TrendingUp className="h-3 w-3" /> em alta
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {rows.map((r, i) => {
                const c = rankColor(r.current_rank);
                const isMe = me?.id === r.user_id;
                const isTop = i < 3;
                return (
                  <div
                    key={r.user_id}
                    className={`group relative overflow-hidden rounded-2xl border bg-white/[0.04] p-4 backdrop-blur-md transition ${
                      isMe
                        ? "border-emerald-400/60 ring-1 ring-emerald-400/40"
                        : isTop
                          ? "border-white/15"
                          : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {isTop && (
                      <div
                        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl"
                        style={{ background: c }}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={rankImg(r.current_rank)}
                          alt={r.current_rank}
                          className="h-14 w-14 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
                        />
                        {isTop ? (
                          <span className="absolute -bottom-1.5 -right-1.5 text-2xl drop-shadow">
                            {MEDALS[i]}
                          </span>
                        ) : (
                          <span className="absolute -bottom-1.5 -right-1.5 rounded-lg bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 ring-2 ring-black/60">
                            #{i + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                          {nameFor(r)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: `${c}25`, color: c }}
                          >
                            {r.current_rank}
                          </span>
                          <span className="tabular-nums text-zinc-300">
                            {r.total_xp.toLocaleString()} XP
                          </span>
                          <span className="flex items-center gap-0.5 text-orange-400">
                            <Flame className="h-3 w-3" />
                            {r.streak_days}d
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-emerald-400/60 hover:text-emerald-300"
                      >
                        Perfil
                      </button>
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
    <div className="space-y-2.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 animate-pulse rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-7 w-14 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-zinc-400 backdrop-blur-md">
      Nenhum dado ainda — comece a acumular XP!
    </div>
  );
}
