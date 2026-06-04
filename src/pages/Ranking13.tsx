/**
 * Ranking 13 — clone visual do Ranking11 com variação ÚNICA na faixa
 * entre o título "Temporada · …" e o input "Buscar trader".
 *
 * Variante desta página: TICKER FINANCEIRO — fita horizontal estilo bolsa
 *
 * Todo o restante (header, top streaker, tabs, ranking rows, MVPs, hall)
 * é idêntico ao Ranking11 — para o usuário comparar apenas o estilo do
 * card de progresso da temporada.
 */
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Crown, RefreshCw, Award, Sparkles,
  ChevronLeft, ChevronRight, Flame, Calendar, Timer, TrendingUp,
} from "lucide-react";
import { rankImg } from "@/lib/rankImages";
import {
  useRankingData,
  useSeasonInfo,
  nameFor,
  fmt,
  rankProgress,
  rankInfo,
} from "./ranking/_shared";
import UserBadge from "./ranking/_UserBadge13";
import StreakFlame from "./ranking/_StreakFlame";
import LegendCard from "./ranking/_LegendCard";
import RankingBg from "./ranking/_RankingBg";

/** Gradiente da barra XP que evolui de vermelho → laranja → amarelo → verde */
function xpBarGradient(pct: number): string {
  if (pct < 25) return "linear-gradient(90deg, #ef4444, #f97316)";
  if (pct < 50) return "linear-gradient(90deg, #f97316, #eab308)";
  if (pct < 75) return "linear-gradient(90deg, #eab308, #84cc16, hsl(160 84% 50%))";
  return "linear-gradient(90deg, #f97316, #eab308, #84cc16, hsl(160 84% 55%))";
}

/** Cor da posição:
 *  - 1º ouro, 2º prata, 3º bronze (com glow)
 *  - 4-50 → cor da patente do trader
 */
function posColor(pos: number, rankName: string): { color: string; glow: boolean } {
  if (pos === 1) return { color: "#FBBF24", glow: true };
  if (pos === 2) return { color: "#D1D5DB", glow: true };
  if (pos === 3) return { color: "#F97316", glow: true };
  return { color: rankInfo(rankName).color, glow: false };
}

/** Deslocamento à esquerda do top 3 */
function podiumShiftClass(pos: number): string {
  if (pos === 1) return "md:-ml-6";
  if (pos === 2) return "md:-ml-4";
  if (pos === 3) return "md:-ml-2";
  return "";
}

/** Linha do ranking */
function RankingRow({
  row, pos, isMe, name, above,
}: {
  row: any; pos: number; isMe: boolean; name: string; above: any | null;
}) {
  const { pct, info } = rankProgress(row);
  const toPass = above ? above.total_xp - row.total_xp + 1 : 0;
  const { color, glow } = posColor(pos, row.current_rank);
  const isLeader = pos === 1;

  return (
    <div
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-gradient-to-r from-card/85 via-card/55 to-card/25 px-4 py-3.5 backdrop-blur-md transition-all duration-300 ease-out hover:translate-x-2 hover:shadow-[0_8px_30px_-12px_hsl(160_84%_45%/0.5)] ${podiumShiftClass(pos)} ${
        isMe
          ? "border-[hsl(160_84%_50%/0.6)] shadow-[0_0_30px_-10px_hsl(160_84%_45%/0.7)]"
          : "border-border/50 hover:border-[hsl(160_84%_45%/0.4)]"
      }`}
      style={{ boxShadow: `inset 4px 0 0 ${color}` }}
    >
      {/* POS card */}
      <div
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border-2 font-black tabular-nums transition-transform duration-300 group-hover:scale-105"
        style={{
          borderColor: color,
          background: `linear-gradient(135deg, ${color}25, transparent)`,
          color,
          boxShadow: glow ? `0 0 18px -2px ${color}, 0 0 32px -8px ${color}` : undefined,
          textShadow: glow ? `0 0 10px ${color}cc` : undefined,
        }}
      >
        <span className="text-[8px] uppercase opacity-60">POS</span>
        <span className="text-xl leading-none">{pos}</span>
      </div>

      {/* Badge do rank */}
      <img
        src={rankImg(row.current_rank)}
        alt={row.current_rank}
        className="h-16 w-16 shrink-0 object-contain"
        style={{ filter: `drop-shadow(0 0 12px ${info.color}80)` }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-bold uppercase tracking-wide text-foreground">
            {name}
          </span>
          {isMe && (
            <span className="rounded-md bg-[hsl(160_84%_39%)] px-1.5 py-0.5 text-[9px] font-black uppercase text-primary-foreground">
              VOCÊ
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] uppercase tracking-wider">
          <span style={{ color: info.color }}>{row.current_rank}</span>
          {row.streak_days > 0 && (
            <span className="normal-case tracking-normal">
              <StreakFlame days={row.streak_days} size="sm" />
            </span>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${pct}%`,
              background: xpBarGradient(pct),
              boxShadow: `0 0 10px ${info.color}66`,
            }}
          />
        </div>
      </div>

      {/* COLUNA XP — largura fixa, alinhada entre #1 e demais */}
      <div className="hidden w-[200px] shrink-0 text-right md:block">
        <div className="flex items-center justify-end gap-1.5 leading-none">
          {!isLeader ? (
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="tabular-nums">+{fmt(toPass)} XP</span> PARA SUBIR
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-300/90">
              LÍDER
            </span>
          )}
        </div>
        <div className="mt-1 text-2xl font-black leading-none tabular-nums text-[hsl(160_84%_70%)]">
          {fmt(row.total_xp)}
        </div>
      </div>
    </div>
  );
}

export default function Ranking13() {
  const { rows, me, loading, error, reload } = useRankingData();
  const season = useSeasonInfo();
  const [q, setQ] = useState("");

  const mvpSeasons = useMemo(() => {
    return [
      {
        key: "atual",
        label: `${season.monthName} ${season.year}`,
        sublabel: "Em andamento",
        ongoing: true,
        winners: rows.slice(0, 3),
      },
    ];
  }, [rows, season]);

  const [mvpIdx, setMvpIdx] = useState(0);
  const currentMvp = mvpSeasons[mvpIdx];

  const myPos = useMemo(
    () => (me ? rows.findIndex((r) => r.user_id === me.id) : -1),
    [rows, me],
  );
  const filtered = rows.filter((r) =>
    !q || nameFor(r, me).toLowerCase().includes(q.toLowerCase()),
  );

  const legend = rows[0];
  const topStreaker = useMemo(
    () => [...rows].sort((a, b) => b.streak_days - a.streak_days)[0],
    [rows],
  );

  return (
    <div className="relative min-h-screen px-4 py-10 md:px-8">
      {/* fundo premium harmônico */}
      <RankingBg />

      <div className="mx-auto max-w-6xl">
        {/* TERMINAL — header em estilo bolsa: barra de status + título mono + ticker */}
        <header className="mb-7">
          <div
            className="relative overflow-hidden rounded-2xl backdrop-blur-md"
            style={{
              background:
                "linear-gradient(180deg, hsl(220 25% 6% / 0.96), hsl(220 22% 8% / 0.92))",
              border: "1px solid hsl(160 84% 45% / 0.3)",
              boxShadow:
                "inset 0 1px 0 hsl(160 84% 60% / 0.15), 0 0 36px -14px hsl(160 84% 45% / 0.55)",
            }}
          >
            {/* status bar terminal */}
            <div className="flex items-center gap-3 border-b border-border/40 bg-[hsl(220_22%_5%/0.7)] px-4 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400/70" />
                <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-300">
                VINGATIVA://RANKING.TERMINAL
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-300">LIVE</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  · {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} BRT
                </span>
              </span>
            </div>

            {/* Bloco título */}
            <div className="grid grid-cols-1 items-end gap-4 px-5 py-5 md:grid-cols-[1fr_auto] md:px-7">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-[hsl(160_84%_60%)]">
                  &gt; SEASON.LOAD( "{season.monthName}_{season.year}" )
                </div>
                <h1 className="mt-1 font-mono text-4xl font-black uppercase tracking-tight text-foreground md:text-5xl">
                  RANKING<span className="text-[hsl(160_84%_60%)]">_</span><span className="text-gradient-primary">VINGATIVA</span>
                </h1>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground md:text-[11px]">
                  // TOP 50 TRADERS · A ELITE DO MERCADO
                </p>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  T#01
                </span>
                <span className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  D-{season.remaining}
                </span>
              </div>
            </div>

            {/* Ticker grid 4 colunas */}
            <div className="grid grid-cols-4 divide-x divide-border/40 border-y border-border/40 bg-[hsl(220_22%_5%/0.4)]">
              <div className="px-4 py-2.5">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">SEASON</div>
                <div className="mt-0.5 font-mono text-lg font-black tabular-nums text-[hsl(160_84%_70%)]">#01</div>
              </div>
              <div className="px-4 py-2.5">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">LAP</div>
                <div className="mt-0.5 font-mono text-lg font-black tabular-nums text-foreground">
                  {String(season.day).padStart(2, "0")}<span className="text-muted-foreground/40">/</span>{String(season.total).padStart(2, "0")}
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">PROGR</div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="font-mono text-lg font-black tabular-nums text-emerald-300">
                    {season.pct.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-emerald-400">%</span>
                  <TrendingUp className="ml-1 h-3 w-3 text-emerald-400" />
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground">RESTAM</div>
                <div className="mt-0.5 font-mono text-lg font-black tabular-nums text-amber-300">
                  {season.remaining}<span className="ml-1 text-[9px] font-bold text-amber-300/70">DIAS</span>
                </div>
              </div>
            </div>

            {/* barra slim */}
            <div className="h-[3px] bg-[hsl(220_22%_12%)]">
              <div
                className="h-full"
                style={{
                  width: `${season.pct}%`,
                  background: "linear-gradient(90deg, #10b981, #34d399, #6ee7b7)",
                  boxShadow: "0 0 10px #10b981",
                }}
              />
            </div>
          </div>
        </header>


        {loading ? (
          <SkelList />
        ) : error ? (
          <ErrBox msg={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* TOP STREAKER + HALL DA FAMA — lado a lado */}
            {topStreaker && topStreaker.streak_days > 0 && (
              <div className="mx-auto mb-6 grid max-w-5xl gap-4 md:grid-cols-2">
                <div
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-orange-500/40 px-5 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-orange-400/70"
                  style={{
                    background:
                      "linear-gradient(110deg, rgba(249,115,22,0.18) 0%, rgba(220,38,38,0.10) 35%, hsl(220 22% 8% / 0.85) 100%)",
                    boxShadow:
                      "0 0 32px -8px rgba(249,115,22,0.55), inset 0 1px 0 rgba(255,200,140,0.18), inset 0 -1px 0 rgba(220,38,38,0.18)",
                  }}
                >
                  {/* halo decorativo */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(249,115,22,0.45), transparent 65%)",
                      filter: "blur(20px)",
                    }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(251,146,60,0.85), transparent)",
                    }}
                  />

                  <div
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/60"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(249,115,22,0.45), rgba(220,38,38,0.30))",
                      boxShadow:
                        "0 0 18px -2px rgba(249,115,22,0.85), inset 0 1px 0 rgba(255,220,160,0.45)",
                    }}
                  >
                    <Flame
                      className="h-7 w-7"
                      fill="#FFFFFF"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                      style={{ filter: "drop-shadow(0 0 8px rgba(255,200,140,0.95))" }}
                    />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-300">
                      TOP STREAKER
                    </div>
                    <div className="truncate text-lg font-black uppercase text-foreground">
                      {nameFor(topStreaker, me)}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span style={{ color: rankInfo(topStreaker.current_rank).color }}>
                        {topStreaker.current_rank}
                      </span>
                      {" · "}Maior sequência de logins
                    </div>
                  </div>

                  <div className="relative flex flex-col items-end gap-1">
                    <StreakFlame days={topStreaker.streak_days} size="lg" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-orange-300/70">
                      em chamas
                    </span>
                  </div>
                </div>
                {legend && (
                  <LegendCard legend={legend} displayName={nameFor(legend, me)} />
                )}
              </div>
            )}

            <Tabs defaultValue="ranking" className="w-full">
              <TabsList className="mx-auto mb-6 grid w-full max-w-md grid-cols-2 bg-card/60 backdrop-blur-md">
                <TabsTrigger value="ranking" className="gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                  <Flame className="h-3.5 w-3.5" /> TEMPORADA ATUAL
                </TabsTrigger>
                <TabsTrigger value="mvp" className="gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                  <Award className="h-3.5 w-3.5" /> MVPS
                </TabsTrigger>
</TabsList>

              {/* TAB: TEMPORADA ATUAL */}
              <TabsContent value="ranking" className="space-y-3">

                <div className="space-y-2.5">
                  {filtered.map((r) => {
                    const pos = rows.findIndex((x) => x.user_id === r.user_id) + 1;
                    const above = pos > 1 ? rows[pos - 2] : null;
                    return (
                      <RankingRow
                        key={r.user_id}
                        row={r}
                        pos={pos}
                        isMe={me?.id === r.user_id}
                        name={nameFor(r, me)}
                        above={above}
                      />
                    );
                  })}
                </div>
              </TabsContent>

              {/* TAB: MVPs */}
              <TabsContent value="mvp">
                <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setMvpIdx((i) => Math.max(0, i - 1))}
                    disabled={mvpIdx === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-colors hover:border-[hsl(160_84%_45%/0.5)] hover:text-[hsl(160_84%_70%)] disabled:opacity-30 disabled:hover:border-border/50"
                    aria-label="Temporada anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(160_84%_60%)]">
                      Temporada
                    </div>
                    <div className="text-base font-bold capitalize text-foreground">
                      {currentMvp.label}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {currentMvp.sublabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMvpIdx((i) => Math.min(mvpSeasons.length - 1, i + 1))}
                    disabled={mvpIdx >= mvpSeasons.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card/40 text-muted-foreground transition-colors hover:border-[hsl(160_84%_45%/0.5)] hover:text-[hsl(160_84%_70%)] disabled:opacity-30 disabled:hover:border-border/50"
                    aria-label="Próxima temporada"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {currentMvp.ongoing && (
                  <div className="mx-auto mb-8 max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-center text-[11px] uppercase tracking-widest text-amber-300/90">
                    ⚡ Prévia ao vivo — vencedores definidos no fim da temporada
                  </div>
                )}

                {currentMvp.winners.length >= 3 ? (
                  <div className="grid items-end gap-5 md:grid-cols-3">
                    {[
                      { p: 2, r: currentMvp.winners[1], color: "#D1D5DB", label: "Vice-Campeão", h: "scale-100" },
                      { p: 1, r: currentMvp.winners[0], color: "#FBBF24", label: "Campeão", h: "md:scale-110 md:-translate-y-2" },
                      { p: 3, r: currentMvp.winners[2], color: "#F97316", label: "Bronze", h: "scale-100" },
                    ].map(({ p, r, color, label, h }) => {
                      const ri = rankInfo(r.current_rank);
                      return (
                        <div
                          key={p}
                          className={`group relative overflow-hidden rounded-3xl border backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 ${
                            p === 1 ? `md:order-2 ${h}` : p === 2 ? "md:order-1" : "md:order-3"
                          }`}
                          style={{
                            borderColor: `${color}55`,
                            background: `linear-gradient(180deg, ${color}10 0%, hsl(220 22% 9% / 0.92) 60%, hsl(220 25% 5% / 0.96) 100%)`,
                            boxShadow: `0 0 50px -8px ${color}50, inset 0 1px 0 ${color}40, inset 0 -1px 0 ${color}15`,
                          }}
                        >
                          <div
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-px"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                            }}
                          />
                          {p === 1 && (
                            <div
                              className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full p-2"
                              style={{
                                background: `radial-gradient(circle at center, ${color}40, transparent 70%)`,
                              }}
                            >
                              <Crown
                                className="h-7 w-7"
                                style={{ color, filter: `drop-shadow(0 0 10px ${color})` }}
                                fill={color}
                              />
                            </div>
                          )}
                          <div
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 font-black"
                            style={{
                              borderColor: color,
                              color,
                              background: `radial-gradient(circle, ${color}25, transparent 70%)`,
                              textShadow: `0 0 8px ${color}`,
                            }}
                          >
                            {p}
                          </div>

                          <div className="relative flex flex-col items-center px-7 pb-7 pt-12 text-center">
                            <div className="relative">
                              <div
                                aria-hidden
                                className="absolute inset-0 -z-10 rounded-full blur-2xl"
                                style={{ background: `${color}55` }}
                              />
                              <img
                                src={rankImg(r.current_rank)}
                                alt=""
                                className="h-32 w-32 object-contain transition-transform duration-500 group-hover:scale-110"
                                style={{ filter: `drop-shadow(0 0 22px ${color}cc)` }}
                              />
                            </div>

                            <div
                              className="mt-4 rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em]"
                              style={{
                                borderColor: `${color}55`,
                                color,
                                background: `${color}12`,
                                textShadow: `0 0 8px ${color}80`,
                              }}
                            >
                              {label}
                            </div>

                            <div className="mt-3 text-xl font-black uppercase tracking-wide text-foreground md:text-2xl">
                              {nameFor(r, me)}
                            </div>

                            <div
                              className="mt-1 text-xs font-bold uppercase tracking-widest"
                              style={{ color: ri.color }}
                            >
                              {r.current_rank}
                            </div>

                            <div className="mt-5 flex w-full items-center justify-center gap-5">
                              <div className="text-center">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  XP
                                </div>
                                <div
                                  className="text-2xl font-black tabular-nums"
                                  style={{ color: "#6EE7B7", textShadow: "0 0 10px hsl(160 84% 45% / 0.55)" }}
                                >
                                  {fmt(r.total_xp)}
                                </div>
                              </div>
                              {r.streak_days > 0 && (
                                <>
                                  <div className="h-9 w-px bg-border/40" />
                                  <div className="text-center">
                                    <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                      Streak
                                    </div>
                                    <StreakFlame days={r.streak_days} size="md" />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div
                            aria-hidden
                            className="absolute inset-x-0 bottom-0 h-1"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                              boxShadow: `0 0 16px ${color}`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-border/50 bg-card/30 p-12 text-center text-muted-foreground">
                    MVPs desta temporada ainda não foram definidos.
                  </div>
                )}
              </TabsContent>
</Tabs>
          </>
        )}
      </div>
    </div>
  );
}

function SkelList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl border border-border/40 bg-card/40"
        />
      ))}
    </div>
  );
}
function ErrBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-12 text-center">
      <p className="mb-4 text-sm text-destructive">Erro: {msg}</p>
      <button
        onClick={onRetry}
        className="mx-auto flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/20"
      >
        <RefreshCw className="h-4 w-4" /> Tentar novamente
      </button>
    </div>
  );
}
function Empty() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/50 bg-card/30 p-16 text-center text-muted-foreground">
      Nenhum trader no ranking ainda — seja o primeiro!
    </div>
  );
}
