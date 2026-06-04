/**
 * Ranking 07 — "F1 Grid"
 * Largada de Fórmula 1: posições como grid de largada, pista asfáltica
 * com listras checkered, gap em segundos entre traders, vermelho/dourado.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { Flag, Timer, Gauge, RefreshCw } from "lucide-react";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let rankingCache: { rows: Row[]; me: { id: string; email: string | null } | null; cachedAt: number } | null = null;

const rankColor = (n: string) => RANKS.find((r) => r.name === n)?.color ?? "#888";
const shortId = (id: string) => `#${id.slice(0, 4).toUpperCase()}`;

export default function Ranking07() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadRanking = (bust = false) => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      console.log('[ranking] iniciando fetch, bust=', bust);
      setFetchError(null);

      if (!bust && rankingCache && Date.now() - rankingCache.cachedAt < CACHE_TTL) {
        console.log('[ranking] cache hit —', rankingCache.rows.length, 'rows');
        if (mounted) { setRows(rankingCache.rows); setMe(rankingCache.me); setLoading(false); }
        return;
      }

      console.log('[ranking] buscando do Supabase');
      try {
        const [{ data, error }, sessionRes] = await Promise.all([
          supabase
            .from('user_xp')
            .select('user_id, total_xp, current_rank, streak_days, display_name')
            .order('total_xp', { ascending: false })
            .range(0, 49)
            .abortSignal(controller.signal)
            .then(r => r, () => ({ data: null, error: null })),
          supabase.auth.getSession(),
        ]);

        if (!mounted) return;

        if (error) {
          console.error('[ranking] erro na query:', error.message);
          setFetchError(error.message);
          setLoading(false);
          return;
        }

        const fetchedRows = (data as Row[]) ?? [];
        const sessionUser = sessionRes.data.session?.user;
        const meVal = sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? null } : null;
        console.log('[ranking] carregados:', fetchedRows.length, 'rows');
        rankingCache = { rows: fetchedRows, me: meVal, cachedAt: Date.now() };
        setRows(fetchedRows);
        setMe(meVal);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        console.error('[ranking] erro inesperado:', e);
        setFetchError(e?.message ?? 'Erro desconhecido');
        setLoading(false);
      }
    })();

    return () => { mounted = false; controller.abort(); };
  };

  useEffect(() => {
    return loadRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameFor = (r: Row) => {
    if (me?.id === r.user_id) return me?.email?.split("@")[0] ?? "VOCÊ";
    if (r.display_name) return r.display_name;
    return shortId(r.user_id);
  };

  const leaderXp = rows[0]?.total_xp ?? 0;
  const gap = (xp: number) => ((leaderXp - xp) / 1000).toFixed(3);

  return (
    <div className="relative min-h-screen px-4 py-8 text-zinc-100">
      <style>{`
        @keyframes r7-stripes { 0% { background-position: 0 0; } 100% { background-position: 80px 0; } }
        .r7-track-stripes {
          background-image: repeating-linear-gradient(90deg, transparent 0 36px, rgba(255,255,255,0.06) 36px 40px);
          animation: r7-stripes 1.5s linear infinite;
        }
        .r7-checker {
          background-image:
            linear-gradient(45deg, #fff 25%, transparent 25%),
            linear-gradient(-45deg, #fff 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #fff 75%),
            linear-gradient(-45deg, transparent 75%, #fff 75%);
          background-size: 14px 14px;
          background-position: 0 0, 0 7px, 7px -7px, -7px 0;
          background-color: #000;
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="r7-checker h-5 w-12 rounded-sm" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-red-400">
                Race · Day · 27
              </span>
            </div>
            <h1 className="font-mono text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              VINGATIVA <span className="text-red-500">GRAND PRIX</span>
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-400">
              Grid de largada · Top {rows.length} pilotos
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-black/50 px-4 py-3 backdrop-blur-md">
            <Timer className="h-5 w-5 text-red-400" />
            <div className="font-mono">
              <div className="text-[9px] uppercase tracking-widest text-zinc-500">Volta</div>
              <div className="text-lg font-black text-red-400">LAP&nbsp;42/58</div>
            </div>
            <div className="h-8 w-px bg-zinc-700" />
            <Flag className="h-5 w-5 text-amber-400" />
            <div className="font-mono">
              <div className="text-[9px] uppercase tracking-widest text-zinc-500">Líder</div>
              <div className="text-lg font-black text-amber-400">P1</div>
            </div>
          </div>
        </div>

        {loading ? (
          <SkelGrid />
        ) : fetchError ? (
          <div className="rounded-2xl border-2 border-dashed border-red-500/40 bg-black/40 p-12 text-center backdrop-blur-md">
            <p className="mb-4 font-mono text-sm text-red-400">Erro ao carregar ranking: {fetchError}</p>
            <button
              onClick={() => { setLoading(true); loadRanking(true); }}
              className="flex items-center gap-2 mx-auto rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 font-mono text-sm text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {/* Linha de largada */}
            <div className="r7-checker mb-3 h-3 rounded-full opacity-80" />

            {rows.map((r, i) => {
              const c = rankColor(r.current_rank);
              const isMe = me?.id === r.user_id;
              const pos = i + 1;
              const podium = pos === 1 ? "#FBBF24" : pos === 2 ? "#D1D5DB" : pos === 3 ? "#F97316" : null;
              const offset = Math.min(i * 8, 48); // efeito grid escalonado

              return (
                <div
                  key={r.user_id}
                  className="relative"
                  style={{ marginLeft: `${offset}px` }}
                >
                  <div
                    className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border-l-[6px] bg-gradient-to-r from-black/70 via-zinc-900/50 to-black/30 px-4 py-3 backdrop-blur-md transition-all hover:translate-x-1 ${
                      isMe ? "border-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_30px_-8px_rgba(16,185,129,0.7)]" : ""
                    }`}
                    style={{
                      borderLeftColor: podium ?? c,
                      boxShadow: podium ? `0 0 30px -10px ${podium}80` : undefined,
                    }}
                  >
                    {/* Pista listrada animada no hover */}
                    <span className="r7-track-stripes pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />

                    {/* Número do carro */}
                    <div
                      className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 font-mono text-2xl font-black tabular-nums"
                      style={{
                        borderColor: podium ?? c,
                        color: podium ?? c,
                        background: `linear-gradient(135deg, ${(podium ?? c)}20, transparent)`,
                        boxShadow: `inset 0 0 12px ${(podium ?? c)}40`,
                      }}
                    >
                      {pos}
                    </div>

                    {/* Badge patente */}
                    <img
                      src={rankImg(r.current_rank)}
                      alt={r.current_rank}
                      className="relative z-10 h-12 w-12 shrink-0 object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                    />

                    {/* Nome + escuderia (rank) */}
                    <div className="relative z-10 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-lg font-black uppercase text-white">
                          {nameFor(r)}
                        </span>
                        {isMe && (
                          <span className="rounded-md bg-emerald-400 px-1.5 py-0.5 font-mono text-[9px] font-black text-black">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
                        <span style={{ color: c }}>{r.current_rank}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1 text-orange-400">
                          <Gauge className="h-3 w-3" /> {280 + (r.streak_days % 60)} km/h
                        </span>
                      </div>
                    </div>

                    {/* Tempo / Gap */}
                    <div className="relative z-10 hidden text-right font-mono sm:block">
                      <div className="text-[9px] uppercase tracking-widest text-zinc-500">
                        {pos === 1 ? "Líder" : "Gap"}
                      </div>
                      <div className="text-base font-black text-amber-300">
                        {pos === 1 ? "INTERVAL" : `+${gap(r.total_xp)}`}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="relative z-10 text-right font-mono">
                      <div className="text-[9px] uppercase tracking-widest text-zinc-500">XP</div>
                      <div className="text-xl font-black tabular-nums text-emerald-300">
                        {r.total_xp.toLocaleString()}
                      </div>
                    </div>

                    {/* Estela traseira */}
                    {pos === 1 && (
                      <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-amber-400/20 to-transparent" />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="r7-checker mt-6 h-3 rounded-full opacity-80" />
          </div>
        )}
      </div>
    </div>
  );
}

function SkelGrid() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border-l-[6px] border-zinc-700 bg-black/40 px-4 py-3" style={{ marginLeft: `${i * 8}px` }}>
          <div className="h-14 w-14 animate-pulse rounded-xl bg-zinc-800/60" />
          <div className="h-12 w-12 animate-pulse rounded-full bg-zinc-800/60" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-800/60" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-red-500/30 bg-black/40 p-16 text-center font-mono text-zinc-400 backdrop-blur-md">
      Nenhum piloto na pista — comece a correr!
    </div>
  );
}
