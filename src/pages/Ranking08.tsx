/**
 * Ranking 08 — "Galactic Empire"
 * Mapa estelar interativo: traders são planetas orbitando, top 3 são sóis,
 * resto formam constelações. Visual cinematográfico cósmico.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { Sparkles, Star, Orbit } from "lucide-react";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const rankColor = (n: string) => RANKS.find((r) => r.name === n)?.color ?? "#888";
const shortId = (id: string) => `Trader #${id.slice(0, 4)}`;

export default function Ranking08() {
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
    if (me?.id === r.user_id) return me?.email?.split("@")[0] ?? "Você";
    if (r.display_name) return r.display_name;
    return shortId(r.user_id);
  };

  const top3 = rows.slice(0, 3);
  const orbit = rows.slice(3, 11); // 8 planetas em órbita
  const distantStars = rows.slice(11);

  return (
    <div className="relative min-h-screen px-4 py-8 text-violet-50">
      <style>{`
        @keyframes r8-twinkle { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes r8-orbit { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes r8-orbit-rev { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
        @keyframes r8-pulse-sun { 0%,100%{filter:drop-shadow(0 0 30px rgba(168,85,247,.6))} 50%{filter:drop-shadow(0 0 60px rgba(236,72,153,.9))} }
        @keyframes r8-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .r8-twinkle { animation: r8-twinkle 3s ease-in-out infinite; }
        .r8-pulse-sun { animation: r8-pulse-sun 4s ease-in-out infinite; }
        .r8-float { animation: r8-float 6s ease-in-out infinite; }
        .r8-stars-bg {
          background-image:
            radial-gradient(1px 1px at 10% 20%, white, transparent),
            radial-gradient(1px 1px at 80% 30%, white, transparent),
            radial-gradient(1.5px 1.5px at 30% 70%, white, transparent),
            radial-gradient(1px 1px at 60% 80%, white, transparent),
            radial-gradient(1px 1px at 90% 10%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 20% 90%, white, transparent);
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.55em] text-violet-300/80">
            <Star className="h-3 w-3 r8-twinkle" fill="currentColor" /> Sistema · Virtus · 9
          </p>
          <h1 className="mt-3 bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_4px_30px_rgba(168,85,247,0.4)] md:text-6xl">
            Império Galáctico
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-violet-300/70">
            Os traders mais luminosos da via láctea Virtus Pro.
          </p>
        </header>

        {loading ? (
          <SkelGalaxy />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* Sistema solar central */}
            <div className="relative mx-auto mb-12 h-[480px] w-full max-w-3xl overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-b from-indigo-950/60 via-violet-950/40 to-black/60 backdrop-blur-md">
              {/* Background estelar */}
              <div className="r8-stars-bg absolute inset-0 r8-twinkle" style={{ backgroundSize: "200px 200px" }} />

              {/* Órbitas concêntricas */}
              {[140, 200, 260].map((r, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15"
                  style={{ width: r * 2, height: r * 2 }}
                />
              ))}

              {/* Sol central — #1 */}
              {top3[0] && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="r8-pulse-sun relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-fuchsia-500 blur-3xl opacity-70" />
                    <img
                      src={rankImg(top3[0].current_rank)}
                      alt={top3[0].current_rank}
                      className="relative h-32 w-32 object-contain drop-shadow-[0_0_30px_rgba(251,191,36,1)]"
                    />
                  </div>
                  <div className="mt-2 inline-block rounded-full border border-amber-300/60 bg-black/60 px-3 py-1 backdrop-blur">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-300">
                      ★ Sol Supremo
                    </p>
                    <p className="font-bold text-amber-100">{nameFor(top3[0])}</p>
                    <p className="text-[10px] text-amber-300/80">
                      {top3[0].total_xp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
              )}

              {/* #2 e #3 como luas brilhantes */}
              {[top3[1], top3[2]].map((r, i) => {
                if (!r) return null;
                const angle = i === 0 ? -45 : 135;
                const radius = 200;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const c = rankColor(r.current_rank);
                const isMe = me?.id === r.user_id;
                return (
                  <div
                    key={r.user_id}
                    className="r8-float absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, animationDelay: `${i * 1.5}s` }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-2xl opacity-60" style={{ background: c }} />
                      <img src={rankImg(r.current_rank)} alt="" className="relative h-20 w-20 object-contain" />
                    </div>
                    <div className={`mt-1 rounded-md border px-2 py-0.5 text-[10px] font-bold backdrop-blur ${isMe ? "border-emerald-400 bg-emerald-400/20 text-emerald-200" : "border-white/20 bg-black/50 text-white"}`}>
                      #{i + 2} · {nameFor(r)}
                    </div>
                  </div>
                );
              })}

              {/* Planetas em órbita externa */}
              {orbit.map((r, i) => {
                const angle = (i / orbit.length) * 360;
                const radius = 260;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                const c = rankColor(r.current_rank);
                const isMe = me?.id === r.user_id;
                return (
                  <div
                    key={r.user_id}
                    className="group absolute left-1/2 top-1/2"
                    style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                  >
                    <div className="relative cursor-pointer transition-transform hover:scale-125">
                      <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{ background: c }} />
                      <img src={rankImg(r.current_rank)} alt="" className="relative h-10 w-10 object-contain" />
                      {isMe && (
                        <span className="absolute -inset-2 rounded-full ring-2 ring-emerald-400 animate-pulse" />
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/20 bg-black/90 px-2 py-1 text-[10px] opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <div className="font-bold">#{i + 4} {nameFor(r)}</div>
                      <div className="text-violet-300">{r.total_xp.toLocaleString()} XP</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lista de estrelas distantes */}
            {distantStars.length > 0 && (
              <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-b from-indigo-950/40 to-black/40 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Orbit className="h-4 w-4 text-violet-300" />
                    <h2 className="font-black uppercase tracking-[0.3em] text-violet-200 text-sm">
                      Estrelas Distantes
                    </h2>
                  </div>
                  <span className="text-xs text-violet-400/70">
                    {distantStars.length} sistemas detectados
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {distantStars.map((r, i) => {
                    const c = rankColor(r.current_rank);
                    const isMe = me?.id === r.user_id;
                    return (
                      <div
                        key={r.user_id}
                        className={`flex items-center gap-3 rounded-xl border bg-violet-950/30 px-3 py-2.5 backdrop-blur transition hover:border-violet-400/50 hover:bg-violet-900/30 ${
                          isMe ? "border-emerald-400/70 ring-1 ring-emerald-400/40" : "border-violet-500/15"
                        }`}
                      >
                        <span className="w-8 text-center font-mono text-xs text-violet-400/70">
                          #{i + 12}
                        </span>
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 rounded-full opacity-40 blur-sm" style={{ background: c }} />
                          <img src={rankImg(r.current_rank)} alt="" className="relative h-8 w-8 object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-violet-50">{nameFor(r)}</p>
                          <p className="text-[10px]" style={{ color: c }}>
                            {r.current_rank}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold tabular-nums text-fuchsia-200 text-sm">
                            {r.total_xp.toLocaleString()}
                          </p>
                          <p className="flex items-center justify-end gap-0.5 text-[9px] text-amber-300">
                            <Sparkles className="h-2.5 w-2.5" /> {r.streak_days}d
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkelGalaxy() {
  return (
    <div className="mx-auto h-[480px] max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-b from-indigo-950/60 to-black/60 backdrop-blur-md">
      <div className="flex h-full items-center justify-center">
        <div className="h-32 w-32 animate-pulse rounded-full bg-violet-500/20" />
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-3xl border border-violet-500/30 bg-black/40 p-16 text-center text-violet-200/70 backdrop-blur-md">
      Universo vazio — explore a galáxia!
    </div>
  );
}
