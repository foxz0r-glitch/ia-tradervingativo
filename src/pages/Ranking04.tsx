/**
 * Ranking 04 — "Hall of Legends" (RPG cinematográfico)
 * Pódio com SVGs de patentes, gradientes âmbar/violeta, brilhos animados,
 * tipografia serif. Mantém background global IA Vingativa.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { Loader2, Crown, Zap, Flame, Shield } from "lucide-react";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const RANK_IMAGES: Record<string, string> = {
  "Prata I": "/ranks/rank-prata-1.svg",
  "Prata II": "/ranks/rank-prata-2.svg",
  "Prata III": "/ranks/rank-prata-3.svg",
  "Ouro I": "/ranks/rank-ouro-1.svg",
  "Ouro II": "/ranks/rank-ouro-2.svg",
  "Ouro III": "/ranks/rank-ouro-3.svg",
  "AK I": "/ranks/rank-ak-1.svg",
  "AK II": "/ranks/rank-ak-2.svg",
  "AK Cruzada": "/ranks/rank-ak-cruzada.svg",
  Xerife: "/ranks/rank-xerife.svg",
  "Águia I": "/ranks/rank-aguia-1.svg",
  "Águia II": "/ranks/rank-aguia-2.svg",
  Supremo: "/ranks/rank-supremo.svg",
  Global: "/ranks/rank-global.svg",
};

const rankColor = (name: string) =>
  RANKS.find((r) => r.name === name)?.color ?? "#888";
const rankImg = (name: string) =>
  RANK_IMAGES[name] ?? "/ranks/rank-prata-1.svg";
const shortId = (id: string) => `Trader #${id.slice(0, 4)}`;

export default function Ranking04() {
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

  return (
    <div className="relative min-h-screen px-6 py-10 text-amber-50">
      <style>{`
        @keyframes r4-shine {
          0%,100% { filter: drop-shadow(0 0 18px rgba(250,199,117,0.55)); }
          50%     { filter: drop-shadow(0 0 36px rgba(250,199,117,1)); }
        }
        .r4-glow { animation: r4-shine 2.6s ease-in-out infinite; }
        @keyframes r4-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        .r4-float { animation: r4-float 3.4s ease-in-out infinite; }
        @keyframes r4-spin { to { transform: rotate(360deg); } }
        .r4-aura {
          background: conic-gradient(from 0deg, rgba(251,191,36,0.4), rgba(168,85,247,0.2), rgba(251,191,36,0.4));
          animation: r4-spin 12s linear infinite;
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="font-serif text-xs uppercase tracking-[0.55em] text-amber-400/80">
            ⚔ Salão dos Heróis ⚔
          </p>
          <h1 className="mt-3 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text font-serif text-5xl font-black tracking-tight text-transparent md:text-6xl drop-shadow-[0_2px_20px_rgba(251,191,36,0.3)]">
            Lendas do Mercado
          </h1>
          <p className="mx-auto mt-3 max-w-md font-serif text-sm italic text-amber-200/60">
            "Apenas os mais bravos traders gravam seus nomes nesta tábua eterna."
          </p>
        </header>

        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* Pódio cinematográfico */}
            <div className="mb-12 grid items-end gap-6 md:grid-cols-3">
              {[1, 0, 2].map((idx, col) => {
                const r = rows[idx];
                if (!r) return <div key={col} />;
                const c = rankColor(r.current_rank);
                const isFirst = col === 1;
                const place = [2, 1, 3][col];
                return (
                  <div
                    key={r.user_id}
                    className={`relative overflow-hidden rounded-3xl border-2 p-6 text-center backdrop-blur-md ${
                      isFirst
                        ? "border-amber-400/80 bg-gradient-to-b from-amber-900/40 via-purple-900/20 to-black/40 md:scale-110"
                        : "border-purple-500/40 bg-gradient-to-b from-purple-900/30 to-black/40"
                    }`}
                    style={{
                      boxShadow: isFirst
                        ? "0 0 60px -10px rgba(251,191,36,0.55), inset 0 0 40px rgba(251,191,36,0.12)"
                        : `0 0 30px -12px ${c}80`,
                    }}
                  >
                    {isFirst && (
                      <>
                        <div className="r4-aura pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-2xl" />
                        <Crown
                          className="r4-float absolute left-1/2 top-3 h-8 w-8 -translate-x-1/2 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                          fill="currentColor"
                        />
                      </>
                    )}

                    <div className="relative mt-5 mb-3 flex justify-center">
                      <img
                        src={rankImg(r.current_rank)}
                        alt={r.current_rank}
                        className={`h-28 w-28 object-contain ${isFirst ? "r4-glow" : "r4-float"}`}
                      />
                    </div>

                    <div className="font-serif text-xs uppercase tracking-[0.4em] text-amber-400/70">
                      Posição #{place}
                    </div>
                    <p className="mt-1 truncate font-serif text-xl font-bold text-amber-100">
                      {nameFor(r)}
                    </p>
                    <p className="mt-1 font-serif text-sm italic" style={{ color: c }}>
                      ✧ {r.current_rank} ✧
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm font-bold text-amber-200">
                        <Zap className="h-3.5 w-3.5" fill="currentColor" />
                        {r.total_xp.toLocaleString()}
                      </div>
                      <div className="inline-flex items-center gap-1 text-orange-300">
                        <Flame className="h-4 w-4" />
                        <span className="font-bold">{r.streak_days}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pergaminho dos demais */}
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-purple-950/30 to-black/40 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2 px-2 font-serif text-xs uppercase tracking-[0.4em] text-amber-400/70">
                <Shield className="h-3.5 w-3.5" /> Demais campeões
              </div>
              <div className="space-y-2">
                {rows.slice(3).map((r, i) => {
                  const c = rankColor(r.current_rank);
                  const isMe = me?.id === r.user_id;
                  return (
                    <div
                      key={r.user_id}
                      className={`flex items-center gap-4 rounded-xl border bg-gradient-to-r from-purple-950/40 via-black/30 to-black/40 px-4 py-3 transition hover:border-amber-400/40 ${
                        isMe
                          ? "border-amber-400/70 shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)]"
                          : "border-purple-700/30"
                      }`}
                    >
                      <span className="w-10 text-center font-serif text-xl font-black text-amber-500/70">
                        {i + 4}
                      </span>
                      <img
                        src={rankImg(r.current_rank)}
                        alt={r.current_rank}
                        className="h-12 w-12 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-base font-semibold text-amber-100">
                          {nameFor(r)}
                          {isMe && (
                            <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 font-sans text-[9px] font-black text-black">
                              VOCÊ
                            </span>
                          )}
                        </p>
                        <p className="text-xs italic" style={{ color: c }}>
                          {r.current_rank}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-300">
                        <Zap className="h-3.5 w-3.5" fill="currentColor" />
                        <span className="font-bold tabular-nums">
                          {r.total_xp.toLocaleString()}
                        </span>
                      </div>
                      <div className="hidden items-center gap-1 text-orange-300 sm:flex">
                        <Flame className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">{r.streak_days}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
      <div className="grid items-end gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border-2 border-amber-500/20 bg-black/30 p-6 backdrop-blur-md">
            <div className="mx-auto h-28 w-28 animate-pulse rounded-full bg-amber-500/10" />
            <div className="mx-auto mt-4 h-3 w-24 animate-pulse rounded bg-amber-500/10" />
            <div className="mx-auto mt-2 h-5 w-32 animate-pulse rounded bg-amber-500/10" />
            <div className="mx-auto mt-3 h-4 w-20 animate-pulse rounded bg-amber-500/10" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-purple-700/30 bg-black/30 px-4 py-3">
            <div className="h-5 w-5 animate-pulse rounded bg-amber-500/10" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-amber-500/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-amber-500/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-amber-500/10" />
            </div>
            <div className="h-3 w-16 animate-pulse rounded bg-amber-500/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-3xl border border-amber-500/30 bg-black/40 p-16 text-center font-serif text-amber-200/70 backdrop-blur-md">
      Nenhum dado ainda — comece a acumular XP!
    </div>
  );
}
