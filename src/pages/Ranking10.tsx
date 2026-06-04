/**
 * Ranking 10 — "Crypto Trading Floor"
 * Estilo exchange (Binance/Coinbase): tickers em rolagem, candles minimalistas,
 * variação % verde/vermelha, sidebar de "ordens de XP".
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { TrendingUp, TrendingDown, Activity, ArrowUpDown, Wallet } from "lucide-react";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const rankColor = (n: string) => RANKS.find((r) => r.name === n)?.color ?? "#888";
const shortId = (id: string) => `${id.slice(0, 4).toUpperCase()}`;

// pseudo-random determinístico baseado no user_id
function hashFloat(s: string, seed: number) {
  let h = seed;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(Math.sin(h) * 10000) % 1;
}

export default function Ranking10() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const [{ data }, userRes] = await Promise.all([
          supabase
            .from("user_xp")
            .select("user_id, total_xp, current_rank, streak_days, display_name")
            .order("total_xp", { ascending: false })
            .range(0, 49)
            .abortSignal(ctrl.signal)
            .then(r => r, () => ({ data: null, error: null })),
          supabase.auth.getUser(),
        ]);
        if (ctrl.signal.aborted) return;
        setRows((data as Row[]) ?? []);
        setMe(userRes.data.user ? { id: userRes.data.user.id, email: userRes.data.user.email ?? null } : null);
        setLoading(false);
      } catch {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
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

  // Atualiza tickers visualmente a cada 3s (apenas decorativo)
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const nameFor = (r: Row) => {
    if (me?.id === r.user_id) return me?.email?.split("@")[0] ?? "VOCÊ";
    if (r.display_name) return r.display_name.toUpperCase();
    return `TRD${shortId(r.user_id)}`;
  };

  const symbolOf = (r: Row) => `${nameFor(r).slice(0, 4).toUpperCase().replace(/\s/g, "")}/XP`;

  const tickerStrip = useMemo(() => {
    return rows.slice(0, 20).map((r) => {
      const change = (hashFloat(r.user_id, tick) * 20 - 10).toFixed(2);
      const positive = parseFloat(change) >= 0;
      return { r, change, positive };
    });
  }, [rows, tick]);

  return (
    <div className="relative min-h-screen text-zinc-100">
      <style>{`
        @keyframes r10-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .r10-marquee { animation: r10-marquee 60s linear infinite; }
        @keyframes r10-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .r10-pulse-dot { animation: r10-pulse-dot 1.2s ease-in-out infinite; }
      `}</style>

      {/* Ticker tape */}
      <div className="sticky top-0 z-20 overflow-hidden border-y border-emerald-500/30 bg-black/80 py-2 backdrop-blur-md">
        <div className="r10-marquee flex gap-8 whitespace-nowrap font-mono text-[11px]">
          {[...tickerStrip, ...tickerStrip].map((t, i) => (
            <span key={i} className="flex items-center gap-2 text-zinc-300">
              <span className="font-bold">{symbolOf(t.r)}</span>
              <span className="tabular-nums text-amber-300">{t.r.total_xp.toLocaleString()}</span>
              <span className={`flex items-center gap-0.5 font-bold ${t.positive ? "text-emerald-400" : "text-red-400"}`}>
                {t.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {t.positive ? "+" : ""}
                {t.change}%
              </span>
              <span className="text-zinc-700">|</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="r10-pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-400">
                Mercado · Aberto
              </span>
            </div>
            <h1 className="mt-1 font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
              VINGATIVA<span className="text-emerald-400">·EX</span>
              <span className="ml-2 text-base font-normal text-zinc-500">· trading floor</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "Vol 24h", val: rows.reduce((a, r) => a + r.total_xp, 0).toLocaleString(), c: "text-emerald-400" },
              { label: "Trades", val: rows.length.toString(), c: "text-cyan-400" },
              { label: "Top streak", val: (rows[0]?.streak_days ?? 0) + "d", c: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-white/10 bg-black/50 px-3 py-1.5 font-mono backdrop-blur-md">
                <div className="text-[9px] uppercase tracking-widest text-zinc-500">{s.label}</div>
                <div className={`text-sm font-black ${s.c}`}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <SkelEx />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Order book central */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur-md">
              <div className="grid grid-cols-[50px_1fr_140px_120px_100px_100px] items-center gap-3 border-b border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest text-emerald-300">
                <span>#</span>
                <span className="flex items-center gap-1">Trader / Símbolo <ArrowUpDown className="h-2.5 w-2.5" /></span>
                <span>Patente</span>
                <span className="text-right">Last (XP)</span>
                <span className="text-right">24h%</span>
                <span className="text-right">Streak</span>
              </div>

              <div className="max-h-[680px] overflow-y-auto">
                {rows.map((r, i) => {
                  const c = rankColor(r.current_rank);
                  const isMe = me?.id === r.user_id;
                  const change = (hashFloat(r.user_id, tick + 1) * 20 - 5).toFixed(2);
                  const positive = parseFloat(change) >= 0;
                  // Mini sparkline determinística (12 pontos)
                  const spark = Array.from({ length: 12 }, (_, k) =>
                    8 + hashFloat(r.user_id, k * 7 + tick) * 16
                  );
                  const sparkPath = spark.map((y, k) => `${k === 0 ? "M" : "L"}${k * 8},${24 - y}`).join(" ");

                  return (
                    <div
                      key={r.user_id}
                      className={`grid grid-cols-[50px_1fr_140px_120px_100px_100px] items-center gap-3 border-b border-white/5 px-4 py-2.5 font-mono text-sm transition-all hover:bg-emerald-500/5 ${
                        isMe ? "bg-emerald-400/10" : i % 2 === 1 ? "bg-white/[0.015]" : ""
                      }`}
                    >
                      <span className={`tabular-nums font-bold ${i < 3 ? "text-amber-400" : "text-zinc-500"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-white font-bold">{nameFor(r)}</span>
                        <span className="hidden text-xs text-zinc-500 sm:inline">{symbolOf(r)}</span>
                        {isMe && (
                          <span className="rounded bg-emerald-400 px-1.5 py-0.5 text-[8px] font-black text-black">VOCÊ</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img src={rankImg(r.current_rank)} alt="" className="h-6 w-6 object-contain" />
                        <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: c }}>
                          {r.current_rank}
                        </span>
                      </div>
                      <span className="text-right tabular-nums text-amber-300 font-bold">
                        {r.total_xp.toLocaleString()}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <svg width="48" height="20" viewBox="0 0 88 24" className="opacity-70">
                          <path d={sparkPath} fill="none" stroke={positive ? "#10B981" : "#EF4444"} strokeWidth="1.5" />
                        </svg>
                        <span className={`text-xs font-black tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                          {positive ? "+" : ""}
                          {change}%
                        </span>
                      </div>
                      <span className="text-right text-orange-400 tabular-nums">
                        🔥 {r.streak_days}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar — Wallet + Trade panel */}
            <aside className="space-y-4">
              {/* My wallet */}
              {me && (() => {
                const myRow = rows.find((r) => r.user_id === me.id);
                const myIdx = rows.findIndex((r) => r.user_id === me.id);
                if (!myRow) return null;
                const c = rankColor(myRow.current_rank);
                return (
                  <div className="overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 via-black/60 to-black/80 p-4 backdrop-blur-md shadow-[0_0_30px_-12px_rgba(16,185,129,0.6)]">
                    <div className="mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-400" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                        Sua Carteira
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full opacity-50 blur-md" style={{ background: c }} />
                        <img src={rankImg(myRow.current_rank)} alt="" className="relative h-16 w-16 object-contain" />
                      </div>
                      <div>
                        <p className="font-mono text-xs uppercase text-zinc-400">Saldo</p>
                        <p className="font-mono text-2xl font-black text-amber-300">
                          {myRow.total_xp.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: c }}>
                          {myRow.current_rank} · Rank #{myIdx + 1}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="rounded-md bg-emerald-500 py-2 font-mono text-xs font-black uppercase text-black hover:bg-emerald-400 transition">
                        ▲ COMPRAR XP
                      </button>
                      <button className="rounded-md border border-red-500/50 bg-red-500/10 py-2 font-mono text-xs font-black uppercase text-red-300 hover:bg-red-500/20 transition">
                        ▼ STAKE
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Top movers */}
              <div className="rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300">
                    Top Movers
                  </span>
                </div>
                <div className="space-y-2">
                  {rows.slice(0, 5).map((r) => {
                    const c = rankColor(r.current_rank);
                    const change = (hashFloat(r.user_id, tick + 2) * 30).toFixed(2);
                    return (
                      <div key={r.user_id} className="flex items-center gap-2 font-mono text-xs">
                        <img src={rankImg(r.current_rank)} alt="" className="h-6 w-6 shrink-0 object-contain" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-white">{nameFor(r)}</p>
                          <p className="text-[9px]" style={{ color: c }}>{r.current_rank}</p>
                        </div>
                        <span className="font-black text-emerald-400">+{change}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function SkelEx() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 items-center gap-3 border-b border-white/5 px-2 py-3">
          <div className="h-3 w-6 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-6 w-6 animate-pulse rounded-full bg-white/10" />
          <div className="ml-auto h-3 w-16 animate-pulse rounded bg-white/10" />
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-white/10" />
          <div className="ml-auto h-3 w-10 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-black/40 p-16 text-center font-mono text-zinc-400">
      Mercado fechado — sem ordens ativas
    </div>
  );
}
