/**
 * Ranking 06 — "Neon Arcade"
 * Leaderboard estilo fliperama anos 80: CRT scanlines, pixel font feel,
 * neon magenta/cyan, blinking cursor. Cada linha é um "high score".
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { Gamepad2, Zap } from "lucide-react";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const rankColor = (n: string) => RANKS.find((r) => r.name === n)?.color ?? "#888";
const shortId = (id: string) => `P${id.slice(0, 4).toUpperCase()}`;

export default function Ranking06() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);

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

  const nameFor = (r: Row) => {
    if (me?.id === r.user_id) return (me?.email?.split("@")[0] ?? "YOU").toUpperCase().slice(0, 10);
    if (r.display_name) return r.display_name.toUpperCase().slice(0, 10);
    return shortId(r.user_id);
  };

  return (
    <div className="relative min-h-screen px-4 py-8 text-fuchsia-100">
      <style>{`
        @keyframes r6-blink { 50% { opacity: 0; } }
        @keyframes r6-scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes r6-flicker { 0%,100%{opacity:1} 92%{opacity:.85} 95%{opacity:1} 97%{opacity:.7} }
        .r6-blink { animation: r6-blink 1s step-end infinite; }
        .r6-flicker { animation: r6-flicker 4s linear infinite; }
        .r6-crt::before {
          content:""; position:absolute; inset:0; pointer-events:none; z-index:1;
          background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.03) 3px, transparent 4px);
        }
        .r6-crt::after {
          content:""; position:absolute; inset:0; pointer-events:none; z-index:1;
          background: linear-gradient(180deg, transparent, rgba(236,72,153,0.04), transparent);
          height: 80px; animation: r6-scan 5s linear infinite;
        }
        .r6-text-shadow { text-shadow: 0 0 4px currentColor, 0 0 12px currentColor; }
        .r6-pixel { font-family: ui-monospace, "Courier New", monospace; letter-spacing: 0.15em; }
      `}</style>

      <div className="r6-crt relative mx-auto max-w-5xl overflow-hidden rounded-3xl border-2 border-fuchsia-500/60 bg-black/70 p-6 shadow-[0_0_60px_-10px_rgba(236,72,153,0.6),inset_0_0_80px_rgba(168,85,247,0.15)] backdrop-blur-sm md:p-10">
        {/* Header arcade */}
        <div className="r6-flicker relative z-10 mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-3 r6-pixel text-[10px] font-black uppercase tracking-[0.5em] text-cyan-300 r6-text-shadow">
            <Gamepad2 className="h-4 w-4" />
            INSERT · COIN · TO · CONTINUE
          </div>
          <h1 className="r6-pixel bg-gradient-to-b from-fuchsia-300 via-pink-400 to-fuchsia-600 bg-clip-text text-5xl font-black uppercase tracking-tighter text-transparent drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] md:text-7xl">
            HIGH&nbsp;SCORES
          </h1>
          <p className="mt-2 r6-pixel text-xs text-fuchsia-300/80 r6-text-shadow">
            ★ VIRTUS · PRO · IA · ARCADE · v1.984 ★
          </p>
        </div>

        {loading ? (
          <SkelArcade />
        ) : rows.length === 0 ? (
          <div className="relative z-10 r6-pixel py-20 text-center text-cyan-300 r6-text-shadow">
            &gt; NO_DATA_YET <span className="r6-blink">_</span>
          </div>
        ) : (
          <div className="relative z-10 space-y-1.5">
            {/* Header row */}
            <div className="r6-pixel grid grid-cols-[40px_1fr_120px_120px_70px] items-center gap-3 border-b-2 border-cyan-400/50 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 r6-text-shadow">
              <span>RNK</span>
              <span>PLAYER</span>
              <span className="text-right">PATENTE</span>
              <span className="text-right">SCORE</span>
              <span className="text-right">STRK</span>
            </div>

            {rows.map((r, i) => {
              const c = rankColor(r.current_rank);
              const isMe = me?.id === r.user_id;
              const isTop = i < 3;
              const accent = i === 0 ? "#FBBF24" : i === 1 ? "#E5E7EB" : i === 2 ? "#F97316" : c;
              return (
                <div
                  key={r.user_id}
                  className={`r6-pixel grid grid-cols-[40px_1fr_120px_120px_70px] items-center gap-3 rounded-sm border px-3 py-2.5 transition-all ${
                    isMe
                      ? "border-fuchsia-400 bg-fuchsia-500/15 shadow-[0_0_18px_-4px_rgba(236,72,153,0.8)]"
                      : "border-fuchsia-500/10 hover:border-cyan-400/40 hover:bg-cyan-400/5"
                  }`}
                >
                  <span className="text-base font-black r6-text-shadow" style={{ color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-2 truncate text-sm font-bold">
                    {isMe && <span className="r6-blink text-fuchsia-400">▶</span>}
                    <span className={isMe ? "text-fuchsia-200 r6-text-shadow" : "text-fuchsia-100"}>
                      {nameFor(r)}
                    </span>
                    {isTop && (
                      <span
                        className="text-xs r6-text-shadow"
                        style={{ color: accent }}
                      >
                        ★
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <img src={rankImg(r.current_rank)} alt="" className="h-7 w-7 object-contain drop-shadow-[0_0_4px_currentColor]" />
                    <span
                      className="hidden text-[10px] font-bold uppercase r6-text-shadow md:inline"
                      style={{ color: c }}
                    >
                      {r.current_rank}
                    </span>
                  </span>
                  <span
                    className="text-right font-black tabular-nums r6-text-shadow"
                    style={{ color: accent }}
                  >
                    {r.total_xp.toLocaleString().padStart(7, "0")}
                  </span>
                  <span className="flex items-center justify-end gap-1 text-orange-400 r6-text-shadow">
                    <Zap className="h-3 w-3" fill="currentColor" />
                    {r.streak_days}
                  </span>
                </div>
              );
            })}

            <div className="r6-pixel mt-6 flex items-center justify-between border-t-2 border-cyan-400/40 pt-4 text-[10px] uppercase text-cyan-300 r6-text-shadow">
              <span>©1984 VIRTUS·CORP</span>
              <span className="r6-blink">PRESS START</span>
              <span>{rows.length.toString().padStart(3, "0")} PLAYERS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkelArcade() {
  return (
    <div className="relative z-10 space-y-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[40px_1fr_120px_120px_70px] items-center gap-3 px-3 py-2.5">
          <div className="h-4 animate-pulse rounded-sm bg-fuchsia-500/15" />
          <div className="h-4 w-32 animate-pulse rounded-sm bg-fuchsia-500/15" />
          <div className="ml-auto h-7 w-20 animate-pulse rounded-sm bg-fuchsia-500/15" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded-sm bg-fuchsia-500/15" />
          <div className="ml-auto h-4 w-10 animate-pulse rounded-sm bg-fuchsia-500/15" />
        </div>
      ))}
    </div>
  );
}
