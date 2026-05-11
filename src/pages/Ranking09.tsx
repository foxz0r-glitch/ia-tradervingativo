/**
 * Ranking 09 — "Magazine Editorial"
 * Layout estilo revista premium (Vogue/Forbes): capa hero com #1, artigo
 * editorial, tipografia serif refinada, layout asymmetric grid.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS } from "@/hooks/useGamification";
import { rankImg } from "@/lib/rankImages";
import { Quote, Bookmark, Share2 } from "lucide-react";

interface Row {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
}

const rankColor = (n: string) => RANKS.find((r) => r.name === n)?.color ?? "#888";
const shortId = (id: string) => `Trader #${id.slice(0, 4)}`;

const ISSUE_DATE = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export default function Ranking09() {
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

  const cover = rows[0];
  const featured = rows.slice(1, 4);
  const editors = rows.slice(4, 12);
  const honorable = rows.slice(12);

  return (
    <div className="relative min-h-screen px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho da revista */}
        <div className="mb-8 border-y-2 border-amber-400/60 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 font-serif">
            <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300/80">
              Edição · {ISSUE_DATE}
            </span>
            <h1 className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-3xl font-black italic tracking-wider text-transparent md:text-5xl">
              VIRTUS&nbsp;TIMES
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300/80">
              No.&nbsp;42 · BRL
            </span>
          </div>
        </div>

        {loading ? (
          <SkelMag />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* CAPA — hero do #1 */}
            {cover && (
              <article className="relative mb-10 grid gap-6 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-zinc-900/80 via-amber-950/30 to-black/80 p-6 backdrop-blur-md md:grid-cols-[1.2fr_1fr] md:p-10">
                <div>
                  <span className="inline-block rounded-sm bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-black">
                    Capa · Pessoa do mês
                  </span>
                  <h2 className="mt-4 font-serif text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
                    "{nameFor(cover)}"
                    <span className="block text-amber-300 italic"> domina o mercado</span>
                  </h2>
                  <p className="mt-4 font-serif text-base leading-relaxed text-zinc-300 md:text-lg">
                    Com <span className="font-bold text-amber-300">{cover.total_xp.toLocaleString()} XP</span> acumulados
                    e um streak de <span className="font-bold text-orange-400">{cover.streak_days} dias</span>,
                    a patente <em className="not-italic font-semibold" style={{ color: rankColor(cover.current_rank) }}>{cover.current_rank}</em> consagra
                    o trader mais consistente da temporada Virtus Pro.
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-l-4 border-amber-400 pl-4">
                    <Quote className="h-5 w-5 shrink-0 text-amber-400" />
                    <p className="font-serif text-sm italic text-amber-100/80">
                      "Disciplina vence talento quando talento não tem disciplina."
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <button className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20">
                      <Bookmark className="h-3.5 w-3.5" /> Salvar
                    </button>
                    <button className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10">
                      <Share2 className="h-3.5 w-3.5" /> Compartilhar
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full opacity-50 blur-3xl" style={{ background: rankColor(cover.current_rank) }} />
                  <img
                    src={rankImg(cover.current_rank)}
                    alt={cover.current_rank}
                    className="relative h-64 w-64 object-contain drop-shadow-[0_20px_50px_rgba(251,191,36,0.4)] md:h-80 md:w-80"
                  />
                  <span className="absolute right-2 top-2 rounded-full border border-amber-400 bg-black/70 px-3 py-1 font-mono text-xs font-black text-amber-300 backdrop-blur">
                    #01
                  </span>
                </div>
              </article>
            )}

            {/* Featured stories — #2, #3, #4 */}
            <div className="mb-10 grid gap-5 md:grid-cols-3">
              {featured.map((r, i) => {
                const c = rankColor(r.current_rank);
                const isMe = me?.id === r.user_id;
                const tags = ["EM ALTA", "DESTAQUE", "REVELAÇÃO"];
                return (
                  <article
                    key={r.user_id}
                    className={`group flex flex-col rounded-xl border bg-zinc-900/50 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-amber-400/40 ${
                      isMe ? "border-emerald-400/60 ring-1 ring-emerald-400/40" : "border-white/10"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-sm bg-white/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-amber-300">
                        {tags[i]}
                      </span>
                      <span className="font-serif text-2xl font-black italic text-amber-300/40">
                        #{i + 2}
                      </span>
                    </div>
                    <div className="relative mx-auto my-3 h-28 w-28">
                      <div className="absolute inset-0 rounded-full opacity-40 blur-xl" style={{ background: c }} />
                      <img src={rankImg(r.current_rank)} alt="" className="relative h-28 w-28 object-contain" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white">{nameFor(r)}</h3>
                    <p className="mt-1 font-serif text-xs italic" style={{ color: c }}>
                      {r.current_rank}
                    </p>
                    <div className="mt-auto pt-4 flex items-end justify-between border-t border-white/5">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-zinc-500">XP</p>
                        <p className="font-serif text-2xl font-black text-amber-200">
                          {r.total_xp.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-zinc-500">Streak</p>
                        <p className="font-mono text-sm text-orange-400">{r.streak_days}d</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Editor's picks — coluna estilo jornal */}
            {editors.length > 0 && (
              <section className="mb-8 grid gap-6 md:grid-cols-[1fr_2fr]">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-400/70">
                    Seção
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-black italic text-white">
                    Escolhas
                    <br />
                    <span className="text-amber-300">do Editor</span>
                  </h2>
                  <p className="mt-3 font-serif text-sm text-zinc-400">
                    Os próximos talentos a observar nesta edição da Virtus Times.
                  </p>
                </div>
                <div className="divide-y divide-white/10 border-t border-b border-white/15">
                  {editors.map((r, i) => {
                    const c = rankColor(r.current_rank);
                    const isMe = me?.id === r.user_id;
                    return (
                      <div
                        key={r.user_id}
                        className={`flex items-center gap-4 py-3 ${isMe ? "bg-emerald-400/5" : ""}`}
                      >
                        <span className="w-10 font-serif text-2xl font-black italic text-amber-400/40">
                          {i + 5}
                        </span>
                        <img src={rankImg(r.current_rank)} alt="" className="h-10 w-10 shrink-0 object-contain" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-base font-semibold text-white">
                            {nameFor(r)}
                            {isMe && <span className="ml-2 rounded bg-emerald-400 px-1.5 py-0.5 font-mono text-[8px] font-black text-black">VOCÊ</span>}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: c }}>
                            {r.current_rank}
                          </p>
                        </div>
                        <p className="font-serif text-lg font-bold text-amber-200 tabular-nums">
                          {r.total_xp.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Honorable mentions — créditos finais */}
            {honorable.length > 0 && (
              <section className="border-t-2 border-amber-400/40 pt-6">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-amber-400/70">
                  Menções honrosas
                </p>
                <div className="flex flex-wrap gap-2 font-serif text-sm text-zinc-400">
                  {honorable.map((r, i) => {
                    const isMe = me?.id === r.user_id;
                    return (
                      <span
                        key={r.user_id}
                        className={`rounded-full border px-3 py-1 ${
                          isMe ? "border-emerald-400 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5"
                        }`}
                      >
                        #{i + 13} {nameFor(r)} <span className="text-amber-300/70">· {r.total_xp.toLocaleString()}</span>
                      </span>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkelMag() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-amber-400/20" />
          <div className="h-12 w-full animate-pulse rounded bg-white/10" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-full animate-pulse rounded bg-white/5" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
        </div>
        <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
            <div className="mx-auto h-28 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-4 w-32 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-zinc-900/40 p-16 text-center font-serif text-zinc-400">
      Edição em branco — comece a fazer história!
    </div>
  );
}
