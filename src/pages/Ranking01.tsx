/**
 * Ranking 01 — "Command Center"
 * HUD militar/tactical: pódio holográfico, painéis com cantos chanfrados,
 * tipografia mono, scanlines e glow ciano/âmbar. Fundo global preservado.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { Loader2, Crown, Flame, Radar, Activity, Target } from "lucide-react";
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

let rankingCache: { rows: any[]; me: any; cachedAt: number } | null = null;
const getNextUpdateTime = () => {
  const agora = new Date();
  const horasUTC = [3, 9, 15, 21]; // 00h, 06h, 12h, 18h BRT
  const proximaHora = horasUTC.find((h) => agora.getUTCHours() < h) ?? 27;
  const proxima = new Date(agora);
  proxima.setUTCHours(proximaHora === 27 ? 3 : proximaHora, 0, 0, 0);
  if (proximaHora === 27) proxima.setUTCDate(proxima.getUTCDate() + 1);
  return proxima.getTime() - agora.getTime();
};
const CACHE_TTL = getNextUpdateTime();

export default function Ranking01() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);

  useEffect(() => {
    if (rankingCache && Date.now() - rankingCache.cachedAt < CACHE_TTL) {
      setRows(rankingCache.rows);
      setMe(rankingCache.me);
      setLoading(false);
      return;
    }
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
        rankingCache = {
          rows: (data as any[]) ?? [],
          me: userRes.data.user
            ? { id: userRes.data.user.id, email: userRes.data.user.email ?? null }
            : null,
          cachedAt: Date.now(),
        };
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
      setMe(
        userRes.data.user
          ? { id: userRes.data.user.id, email: userRes.data.user.email ?? null }
          : null,
      );
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
    <div className="relative min-h-screen px-6 py-8 text-zinc-100">
      {/* Cantos HUD */}
      <style>{`
        @keyframes r1-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        .r1-scan::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, transparent, hsl(160 84% 50% / 0.06), transparent);
          height: 120px; animation: r1-scan 6s linear infinite; mix-blend-mode: screen;
        }
        .clip-hud { clip-path: polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px); }
      `}</style>

      <div className="relative mx-auto max-w-6xl r1-scan">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.45em] text-emerald-400/80">
              <Radar className="h-3 w-3 animate-pulse" /> Command Center · Live
            </p>
            <h1 className="mt-2 font-mono text-4xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              RANKING <span className="text-emerald-400">// 01</span>
            </h1>
            <p className="mt-2 max-w-md text-xs text-zinc-400">
              Painel tático em tempo real dos traders mais letais da IA Vingativa.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] uppercase">
            {[
              { icon: Activity, label: "Ativos", val: rows.length.toString().padStart(3, "0"), color: "text-emerald-400" },
              { icon: Target, label: "XP total", val: (totalXp / 1000).toFixed(1) + "k", color: "text-cyan-300" },
              { icon: Flame, label: "Top streak", val: (rows[0]?.streak_days ?? 0) + "d", color: "text-amber-400" },
            ].map((s, i) => (
              <div key={i} className="clip-hud border border-emerald-500/30 bg-black/40 px-3 py-2 backdrop-blur-sm">
                <s.icon className={`h-3 w-3 ${s.color}`} />
                <div className="mt-1 text-[9px] tracking-widest text-zinc-500">{s.label}</div>
                <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
              </div>
            ))}
          </div>
        </header>

        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* Pódio holográfico */}
            <div className="mb-10 grid grid-cols-3 items-end gap-4">
              {[1, 0, 2].map((idx, col) => {
                const r = rows[idx];
                if (!r) return <div key={col} />;
                const heights = ["h-36", "h-52", "h-28"];
                const colors = ["#9CA3AF", "#FBBF24", "#B45309"];
                const place = [2, 1, 3];
                const isMe = me?.id === r.user_id;
                return (
                  <div key={r.user_id} className="flex flex-col items-center text-center">
                    <img
                      src={rankImg(r.current_rank)}
                      alt={r.current_rank}
                      className={`mb-2 ${col === 1 ? "h-20 w-20" : "h-14 w-14"} object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]`}
                    />
                    <div
                      className="font-mono text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: rankColor(r.current_rank) }}
                    >
                      {r.current_rank}
                    </div>
                    <div className={`mt-1 truncate text-sm font-bold uppercase ${isMe ? "text-emerald-300" : "text-white"}`}>
                      {nameFor(r)}
                    </div>
                    <div className="font-mono text-2xl font-black" style={{ color: colors[col] }}>
                      {r.total_xp.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-500">XP</div>
                    <div
                      className={`clip-hud relative mt-3 w-full ${heights[col]} flex items-center justify-center border bg-gradient-to-b from-black/60 to-black/20 backdrop-blur`}
                      style={{
                        borderColor: colors[col] + "80",
                        boxShadow: `0 0 32px -8px ${colors[col]}80, inset 0 0 24px ${colors[col]}20`,
                      }}
                    >
                      <span
                        className="font-mono text-6xl font-black drop-shadow-[0_0_12px_currentColor]"
                        style={{ color: colors[col] }}
                      >
                        {place[col]}
                      </span>
                      {col === 1 && (
                        <Crown className="absolute -top-5 left-1/2 h-7 w-7 -translate-x-1/2 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" fill="currentColor" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lista densa estilo radar */}
            <div className="clip-hud border border-emerald-500/20 bg-black/45 backdrop-blur-sm">
              <div className="grid grid-cols-[60px_1fr_140px_140px_80px] gap-3 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                <span>Pos</span>
                <span>Operador</span>
                <span>Patente</span>
                <span className="text-right">XP</span>
                <span className="text-right">Streak</span>
              </div>
              {rows.slice(3).map((r, i) => {
                const pos = i + 4;
                const isMe = me?.id === r.user_id;
                return (
                  <div
                    key={r.user_id}
                    className={`grid grid-cols-[60px_1fr_140px_140px_80px] items-center gap-3 border-b border-emerald-500/5 px-4 py-2 font-mono text-sm transition hover:bg-emerald-500/5 ${
                      isMe ? "bg-amber-400/10 text-amber-200" : "text-zinc-300"
                    }`}
                  >
                    <span className="text-base font-black text-zinc-500">
                      #{pos.toString().padStart(2, "0")}
                    </span>
                    <span className="truncate font-bold uppercase">
                      {nameFor(r)}
                      {isMe && <span className="ml-2 rounded bg-amber-400 px-1.5 text-[9px] font-black text-black">VOCÊ</span>}
                    </span>
                    <span
                      className="flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ borderColor: rankColor(r.current_rank), color: rankColor(r.current_rank) }}
                    >
                      <img src={rankImg(r.current_rank)} alt="" className="h-4 w-4 object-contain" />
                      <span className="truncate">{r.current_rank}</span>
                    </span>
                    <span className="text-right text-emerald-300">
                      {r.total_xp.toLocaleString()}
                    </span>
                    <span className="flex items-center justify-end gap-1 text-orange-400">
                      <Flame className="h-3.5 w-3.5" /> {r.streak_days}
                    </span>
                  </div>
                );
              })}
            </div>

            {myRow && (
              <div className="clip-hud sticky bottom-4 mt-6 border-2 border-amber-400 bg-amber-400/15 px-4 py-3 font-mono text-sm shadow-[0_0_40px_-10px_rgba(251,191,36,0.7)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="flex items-center gap-2 font-black uppercase text-amber-300">
                    <Crown className="h-4 w-4" />
                    Sua Posição: #{(myIndex + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="font-bold uppercase text-white">{nameFor(myRow)}</span>
                  <span className="text-amber-200">{myRow.total_xp.toLocaleString()} XP</span>
                  <span className="flex items-center gap-1 text-orange-300">
                    <Flame className="h-4 w-4" /> {myRow.streak_days}d
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="space-y-3">
      <div className="mb-10 grid grid-cols-3 items-end gap-4">
        {[36, 52, 28].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 animate-pulse rounded-full bg-emerald-500/10" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-700/40" />
            <div className={`clip-hud w-full animate-pulse bg-zinc-800/40`} style={{ height: `${h * 4}px` }} />
          </div>
        ))}
      </div>
      <div className="clip-hud border border-emerald-500/20 bg-black/30">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[60px_1fr_140px_140px_80px] items-center gap-3 border-b border-emerald-500/5 px-4 py-3">
            <div className="h-3 w-8 animate-pulse rounded bg-zinc-700/40" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-700/40" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-700/40" />
            <div className="ml-auto h-3 w-16 animate-pulse rounded bg-zinc-700/40" />
            <div className="ml-auto h-3 w-10 animate-pulse rounded bg-zinc-700/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="clip-hud border border-dashed border-emerald-500/30 bg-black/40 px-6 py-16 text-center">
      <p className="font-mono text-sm text-zinc-400">
        Nenhum dado ainda — comece a acumular XP!
      </p>
    </div>
  );
}
