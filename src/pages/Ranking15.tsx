/**
 * Ranking 15 — clone visual do Ranking11 com variação ÚNICA na faixa
 * entre o título "Temporada · …" e o input "Buscar trader".
 *
 * Variante desta página: HUD HEXAGONAL — tags hexagonais flutuantes + barra com brilho
 *
 * Todo o restante (header, top streaker, tabs, ranking rows, MVPs, hall)
 * é idêntico ao Ranking11 — para o usuário comparar apenas o estilo do
 * card de progresso da temporada.
 */
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crown, RefreshCw, Award, Sparkles,
  ChevronLeft, ChevronRight, Flame, Calendar, Timer, Hexagon, User as UserIcon,
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
import UserBadge from "./ranking/_UserBadge";
import StreakFlame from "./ranking/_StreakFlame";
import LegendCard from "./ranking/_LegendCard";
import RankingBg from "./ranking/_RankingBg";
import ProfileDialog from "./ranking/_ProfileDialog";

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
function posColor(pos: number, _rankName: string): { color: string; glow: boolean } {
  if (pos === 1) return { color: "hsl(45 96% 58%)", glow: true };   // ouro
  if (pos === 2) return { color: "hsl(220 9% 78%)", glow: true };   // prata
  if (pos === 3) return { color: "hsl(28 70% 52%)", glow: true };   // bronze
  return { color: "hsl(152 60% 52%)", glow: false };
}

/** Deslocamento à esquerda do top 3 — #1 mais estendido, #2 médio, #3 leve */
function podiumShiftClass(pos: number): string {
  if (pos === 1) return "md:-ml-10 md:-mr-2";
  if (pos === 2) return "md:-ml-7 md:-mr-1";
  if (pos === 3) return "md:-ml-4";
  return "";
}

/** Linha do ranking */
function RankingRow({
  row, pos, isMe, name, above, onOpenProfile,
}: {
  row: any; pos: number; isMe: boolean; name: string; above: any | null; onOpenProfile?: () => void;
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

      {/* BOTÃO VER PERFIL */}
      {onOpenProfile && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-xl border border-[hsl(160_84%_45%/0.45)] bg-[hsl(160_84%_45%/0.10)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(160_84%_75%)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(160_84%_55%/0.7)] hover:bg-[hsl(160_84%_45%/0.18)] md:inline-flex"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px -8px hsl(160 84% 45% / 0.6)" }}
          aria-label={`Ver perfil de ${name}`}
        >
          <UserIcon className="h-3 w-3" />
          Perfil
        </button>
      )}
    </div>
  );
}

export default function Ranking15() {
  const { rows, me, loading, error, reload } = useRankingData();
  const season = useSeasonInfo();
  const [profileFor, setProfileFor] = useState<{ row: any; pos: number; name: string; userId: string } | null>(null);

  const mvpSeasons = useMemo(() => {
    // Maio (atual) — sem vencedores ainda, aguardando fim da temporada
    // Abril (passada) — 3 MVPs sorteados aleatoriamente da base
    const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, 3);
    return [
      {
        key: "abril-2026",
        label: "abril 2026",
        sublabel: "Temporada encerrada",
        ongoing: false,
        winners: shuffled,
      },
      {
        key: "atual",
        label: `${season.monthName} ${season.year}`,
        sublabel: "Em andamento",
        ongoing: true,
        winners: [] as any[],
      },
    ];
  }, [rows, season]);

  const [mvpIdx, setMvpIdx] = useState(1);
  const currentMvp = mvpSeasons[mvpIdx];

  const myPos = useMemo(
    () => (me ? rows.findIndex((r) => r.user_id === me.id) : -1),
    [rows, me],
  );
  const filtered = rows;

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
        {/* HEADER TEMPORADA */}
        <header className="mb-10">
          {/* Eyebrow — temporada com hex chips (largura igual ao painel HUD) */}
          <div className="mx-auto mb-5 flex max-w-5xl items-center gap-3 px-[12.5%]">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[hsl(160_84%_45%/0.6)]" />
            <span className="inline-flex items-center gap-2">
              <Hexagon className="h-2.5 w-2.5 text-[hsl(160_84%_60%)]" fill="currentColor" />
              <span className="text-[10px] font-bold uppercase tracking-[0.42em] text-[hsl(160_84%_65%)]">
                Temporada · {season.monthName} {season.year}
              </span>
              <Hexagon className="h-2.5 w-2.5 text-[hsl(160_84%_60%)]" fill="currentColor" />
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[hsl(160_84%_45%/0.6)]" />
          </div>

          {/* Título */}
          <h1 className="text-center text-5xl font-black tracking-tight text-foreground md:text-6xl">
            Ranking <span className="text-gradient-primary">Virtus</span>
          </h1>

          {/* Subtítulo refinado */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[hsl(160_84%_45%/0.4)]" />
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground md:text-xs">
              <span className="text-[hsl(160_84%_70%)]">[</span>
              <span className="mx-2">Top 50 Traders</span>
              <span className="text-[hsl(160_84%_45%)]">·</span>
              <span className="mx-2 text-foreground/80">A Elite do Mercado</span>
              <span className="text-[hsl(160_84%_70%)]">]</span>
            </p>
            <span className="h-px w-8 bg-[hsl(160_84%_45%/0.4)]" />
          </div>

          {/* Variante 15 — HUD com tags hexagonais flutuantes (proporcional) */}
          <div className="mx-auto mt-8 max-w-5xl">
            <div className="relative">
              <div
                className="absolute -top-3 left-3 z-10 flex items-center gap-2 px-4 py-2"
                style={{
                  clipPath: "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)",
                  background: "linear-gradient(135deg, hsl(160 84% 39% / 0.95), hsl(160 84% 25% / 0.85))",
                  boxShadow: "0 0 22px -4px hsl(160 84% 45% / 0.95), inset 0 1px 0 hsl(160 84% 70% / 0.35)",
                }}
              >
                <Hexagon className="h-3.5 w-3.5 text-white" fill="currentColor" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                  TEMPORADA #01
                </span>
              </div>

              <div
                className="absolute -top-3 right-3 z-10 flex items-center gap-2 px-4 py-2"
                style={{
                  clipPath: "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)",
                  background: "linear-gradient(135deg, rgba(251,191,36,0.95), rgba(217,119,6,0.85))",
                  boxShadow: "0 0 22px -4px rgba(251,191,36,0.95), inset 0 1px 0 rgba(254,243,199,0.40)",
                }}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black">
                  LAP {String(season.day).padStart(2, "0")}/{String(season.total).padStart(2, "0")}
                </span>
              </div>

              <div
                className="rounded-2xl border border-border/50 px-7 pb-5 pt-9 backdrop-blur-md"
                style={{
                  background: "linear-gradient(180deg, hsl(220 22% 9% / 0.88), hsl(220 25% 6% / 0.96))",
                  boxShadow: "inset 0 1px 0 hsl(160 84% 60% / 0.12), 0 0 32px -16px hsl(160 84% 45% / 0.55)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(160_84%_60%)]">
                    Progresso da Temporada
                  </span>
                  <span className="font-mono text-sm font-black tabular-nums text-[hsl(160_84%_70%)]">
                    <span className="text-[hsl(160_84%_70%)]">{Math.round(season.pct)}%</span>
                    <span className="ml-2 text-[12px] font-semibold uppercase text-amber-300/80">
                      <span className="text-foreground">·</span> {season.remaining} dias restantes
                    </span>
                  </span>
                </div>

                <div className="relative h-3 overflow-hidden rounded-full bg-[hsl(220_22%_12%)] ring-1 ring-inset ring-border/40">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${season.pct}%`,
                      background: "linear-gradient(90deg, hsl(160 84% 30%), hsl(160 84% 45%), hsl(150 90% 60%))",
                      boxShadow: "0 0 16px hsl(160 84% 45% / 0.7), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)" }}
                  />
                  {[25, 50, 75].map((p) => (
                    <div
                      key={p}
                      className="absolute top-0 h-full w-px bg-black/40"
                      style={{ left: `${p}%` }}
                    />
                  ))}
                </div>
              </div>
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
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-orange-500/40 px-5 py-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400/70"
                  style={{
                    background:
                      "linear-gradient(110deg, rgba(249,115,22,0.18) 0%, rgba(220,38,38,0.10) 35%, hsl(220 22% 8% / 0.85) 100%)",
                    boxShadow:
                      "0 0 32px -8px rgba(249,115,22,0.55), inset 0 1px 0 rgba(255,200,140,0.18), inset 0 -1px 0 rgba(220,38,38,0.18)",
                  }}
                >
                  {/* halo decorativo — mesmo posicionamento do Hall da Fama (canto superior direito), 50% menos intenso, na cor laranja do Top Streaker */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(249,115,22,0.225), transparent 65%)",
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
                      {" · "}Maior sequência ativa de logins
                    </div>
                  </div>

                  <div className="relative flex flex-col items-end gap-2">
                    <div
                      className="text-xl font-black tabular-nums leading-none"
                      style={{
                        color: "#f97316",
                        textShadow:
                          "0 0 10px rgba(249,115,22,0.75), 0 0 22px rgba(249,115,22,0.45)",
                      }}
                    >
                      {topStreaker.streak_days} dias
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-orange-300/70">
                      em chamas
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfileFor({ row: topStreaker, pos: rows.findIndex((r) => r.user_id === topStreaker.user_id) + 1 || 1, name: nameFor(topStreaker, me), userId: topStreaker.user_id })}
                      className="inline-flex items-center gap-1 rounded-lg border border-orange-400/40 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-orange-300 transition-all hover:border-orange-400/70 hover:bg-orange-500/20"
                    >
                      <UserIcon className="h-3 w-3" />
                      Perfil
                    </button>
                  </div>
                </div>
                {legend && (
                  <LegendCard
                    legend={legend}
                    displayName={nameFor(legend, me)}
                    onOpenProfile={() => setProfileFor({ row: legend, pos: 1, name: nameFor(legend, me), userId: legend.user_id })}
                  />
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
                        onOpenProfile={() => setProfileFor({ row: r, pos, name: nameFor(r, me), userId: r.user_id })}
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
                  <div className="mx-auto mb-8 max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-center uppercase tracking-widest text-amber-300/90">
                    <div className="text-[12px] font-bold">⏳ Aguardando ⏳</div>
                    <div className="mt-1 text-[10px] tracking-wider text-amber-300/75">vencedores definidos no fim da temporada</div>
                  </div>
                )}

                {currentMvp.winners.length >= 3 ? (
                  <div className="grid items-end gap-5 md:grid-cols-3">
                    {[
                      // Alturas: ouro maior, prata médio, bronze menor (alinhados pela base)
                      { p: 2, r: currentMvp.winners[1], color: "#D1D5DB", label: "Vice-Campeão", topPad: "pt-14", crownSize: 0 },
                      { p: 1, r: currentMvp.winners[0], color: "#FBBF24", label: "Campeão", topPad: "pt-20", crownSize: 32 },
                      { p: 3, r: currentMvp.winners[2], color: "#F97316", label: "Bronze", topPad: "pt-10", crownSize: 0 },
                    ].map(({ p, r, color, label, topPad, crownSize }) => {
                      const ri = rankInfo(r.current_rank);
                      return (
                        <div
                          key={p}
                          className={`group relative flex flex-col overflow-hidden rounded-3xl border backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 ${
                            p === 1 ? "md:order-2" : p === 2 ? "md:order-1" : "md:order-3"
                          }`}
                          style={{
                            borderColor: `${color}55`,
                            background: `linear-gradient(180deg, ${color}18 0%, hsl(220 22% 9% / 0.92) 55%, hsl(220 25% 5% / 0.96) 100%)`,
                            boxShadow: `0 0 50px -8px ${color}60, inset 0 1px 0 ${color}40, inset 0 -1px 0 ${color}15`,
                          }}
                        >
                          <div
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-px"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                            }}
                          />
                          {/* halo de fundo no topo */}
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${color}40, transparent 65%)`,
                              filter: "blur(28px)",
                            }}
                          />
                          {p === 1 && (
                            <div
                              className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full p-2"
                              style={{
                                background: `radial-gradient(circle at center, ${color}50, transparent 70%)`,
                              }}
                            >
                              <Crown
                                className="h-8 w-8"
                                style={{ color, filter: `drop-shadow(0 0 12px ${color})` }}
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

                          <div className={`relative flex flex-1 flex-col items-center px-7 pb-7 text-center ${topPad}`}>
                            <div className="relative">
                              <div
                                aria-hidden
                                className="absolute inset-0 -z-10 rounded-full blur-2xl"
                                style={{ background: `${color}55` }}
                              />
                              <img
                                src={rankImg(r.current_rank)}
                                alt=""
                                className={`object-contain transition-transform duration-500 group-hover:scale-110 ${
                                  p === 1 ? "h-36 w-36" : p === 2 ? "h-32 w-32" : "h-28 w-28"
                                }`}
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

                            <div className={`mt-3 font-black uppercase tracking-wide text-foreground ${p === 1 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"}`}>
                              {nameFor(r, me)}
                            </div>

                            <div
                              className="mt-1 text-xs font-bold uppercase tracking-widest"
                              style={{ color: ri.color }}
                            >
                              {r.current_rank}
                            </div>

                            <div className="mt-auto flex w-full items-center justify-center gap-5 pt-5">
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
                ) : currentMvp.ongoing ? (
                  // Estado: aguardando vencedores (temporada em andamento)
                  <div className="grid items-end gap-5 md:grid-cols-3">
                    {[
                      { p: 2, color: "#D1D5DB", label: "Vice-Campeão", topPad: "pt-14" },
                      { p: 1, color: "#FBBF24", label: "Campeão", topPad: "pt-20" },
                      { p: 3, color: "#F97316", label: "Bronze", topPad: "pt-10" },
                    ].map(({ p, color, label, topPad }) => (
                      <div
                        key={p}
                        className={`relative flex flex-col overflow-hidden rounded-3xl border border-dashed backdrop-blur-md ${
                          p === 1 ? "md:order-2" : p === 2 ? "md:order-1" : "md:order-3"
                        }`}
                        style={{
                          borderColor: `${color}40`,
                          background: `linear-gradient(180deg, ${color}08 0%, hsl(220 22% 9% / 0.85) 60%, hsl(220 25% 5% / 0.92) 100%)`,
                          boxShadow: `inset 0 1px 0 ${color}25`,
                        }}
                      >
                        {p === 1 && (
                          <div className="absolute left-1/2 top-4 -translate-x-1/2 opacity-40">
                            <Crown className="h-8 w-8" style={{ color }} fill={color} />
                          </div>
                        )}
                        <div
                          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 font-black opacity-60"
                          style={{ borderColor: color, color }}
                        >
                          {p}
                        </div>
                        <div className={`relative flex flex-1 flex-col items-center px-7 pb-7 text-center ${topPad}`}>
                          <div
                            className={`flex items-center justify-center rounded-full border-2 border-dashed ${
                              p === 1 ? "h-36 w-36" : p === 2 ? "h-32 w-32" : "h-28 w-28"
                            }`}
                            style={{
                              borderColor: `${color}50`,
                              background: `radial-gradient(circle, ${color}10, transparent 70%)`,
                            }}
                          >
                            <Timer className="h-10 w-10 opacity-60" style={{ color }} />
                          </div>
                          <div
                            className="mt-4 rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-80"
                            style={{ borderColor: `${color}55`, color, background: `${color}12` }}
                          >
                            {label}
                          </div>
                          <div className={`mt-3 font-black uppercase tracking-wide text-muted-foreground ${p === 1 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"}`}>
                            ?????
                          </div>
                          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                            A definir
                          </div>
                          <div className="mt-auto pt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
                            Aguardando…
                          </div>
                        </div>
                      </div>
                    ))}
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

      <ProfileDialog
        open={!!profileFor}
        onOpenChange={(v) => { if (!v) setProfileFor(null); }}
        row={profileFor?.row ?? null}
        position={profileFor?.pos ?? 1}
        name={profileFor?.name ?? ""}
        userId={profileFor?.userId ?? ""}
      />
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
