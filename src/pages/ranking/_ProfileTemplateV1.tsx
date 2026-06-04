/**
 * ProfileTemplateV1 — layout "Versão 1 — Minha estrutura (XP + Score)".
 * Reproduz fielmente a imagem-referência:
 *   • Header com avatar circular (iniciais), nome + badges Global/Trader Positivo,
 *     tags de estilo (Scalper/Consistente/Agressivo), streak + Lv + XP total,
 *     e um Score circular grande à direita.
 *   • DUAS barras separadas: "Progresso de nível (XP)" (verde) e
 *     "Patente (Score)" (gradient laranja→verde).
 *   • Pílulas de status (#ranking, #Hall of Fame, Top X%).
 *   • Bloco "RANKING E STATUS COMPETITIVO" + Histórico de temporadas.
 *   • PERFORMANCE em grid 6 KPIs.
 *   • SCORE BREAKDOWN com barra horizontal multi-cor segmentada.
 *   • CONQUISTAS — Coleção, com sub-seções (Streak, Trading, Financeiro, Estratégia & Social).
 *   • ESTRATÉGIAS, MISSÕES (diárias/semanais), COMUNIDADE, PRIVACIDADE.
 *
 * Usado pelas posições 1–5 do ranking (todas as 5 com o mesmo template).
 * Aceita um `accent` para variar a cor por posição mantendo a estrutura.
 */
import type { TplProps } from "./_profileSections";
import { fmt } from "./_shared";
import { rankImg } from "@/lib/rankImages";
import StreakFlame from "./_StreakFlame";
import { PRIVACY_PUBLIC, PRIVACY_PRIVATE } from "./_profileMockData";
import { Hexagon, User, X } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";

const withAlpha = (color: string, alpha: number) => {
  if (color.startsWith("hsl(")) return color.replace(/\)$/, ` / ${alpha})`);
  if (/^#[0-9a-f]{6}$/i.test(color)) return `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  return color;
};

const XP_ACCENT = "hsl(43 96% 56%)";
const TOP_ACCENT = "hsl(188 86% 53%)";
const STREAK_ACCENT = "hsl(25 95% 53%)";

/* ---- shell V1 ---- */
function V1Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative space-y-3 rounded-2xl border p-3 md:p-4"
      style={{ borderColor: "hsl(220 10% 22%)", background: "hsl(220 12% 9%)" }}
    >
      {children}
    </div>
  );
}
function V1Block({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ borderColor: "hsl(220 10% 18%)", background: "hsl(220 12% 11%)" }}
    >
      {children}
    </div>
  );
}

function Pill({
  children, color, variant = "soft",
}: { children: React.ReactNode; color: string; variant?: "soft" | "outline" }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{
        color,
        background: variant === "soft" ? withAlpha(color, 0.1) : "transparent",
        border: `1px solid ${withAlpha(color, 0.34)}`,
      }}
    >
      {children}
    </span>
  );
}

function MiniKpi({
  label, value, sub, valueColor = "hsl(220 14% 95%)", glowColor = "hsl(220 14% 50%)",
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; valueColor?: string; glowColor?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border px-3 py-2.5"
      style={{
        borderColor: withAlpha(glowColor, 0.4),
        background: "hsl(220 12% 13%)",
        boxShadow: `inset 0 1px 0 ${withAlpha(glowColor, 0.18)}, 0 0 22px -9px ${withAlpha(glowColor, 0.85)}`,
      }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(glowColor, 0.7)}, transparent)` }} />
      <div className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-black tabular-nums" style={{ color: valueColor, textShadow: `0 0 12px ${withAlpha(glowColor, 0.55)}` }}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function BlockTitle({ children, color = "hsl(139 80% 60%)", glow = false }: { children: React.ReactNode; color?: string; glow?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(color, 0.16)}, ${withAlpha(color, 0.04)})`,
          border: `1px solid ${withAlpha(color, 0.42)}`,
          boxShadow: glow
            ? `inset 0 1px 0 ${withAlpha(color, 0.22)}, 0 0 22px -9px ${withAlpha(color, 0.9)}`
            : `inset 0 1px 0 ${withAlpha(color, 0.18)}`,
        }}
      >
        <Hexagon className="h-2.5 w-2.5" fill={color} stroke={color} style={glow ? { filter: `drop-shadow(0 0 6px ${withAlpha(color, 0.8)})` } : undefined} />
        <span className="text-[11px] font-black uppercase tracking-[0.32em]" style={{ color, ...(glow ? { textShadow: `0 0 12px ${withAlpha(color, 0.55)}` } : {}) }}>{children}</span>
      </span>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${withAlpha(color, 0.5)}, transparent)` }} />
    </div>
  );
}

/* Score com anel de progresso */
function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const size = 88;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill={withAlpha(accent, 0.06)}
          stroke={withAlpha(accent, 0.15)}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${withAlpha(accent, 0.6)})`, transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-black" style={{ color: accent }}>
        <div className="text-2xl leading-none">{score}</div>
        <div className="text-[8px] uppercase tracking-widest opacity-70">Score</div>
      </div>
    </div>
  );
}

/* ============== TEMPLATE V1 ============== */
export default function ProfileTemplateV1({ row, name, mock, position, accent = "hsl(139 80% 60%)" }: TplProps) {
  const xpPctLevel = Math.min(100, Math.max(0, Math.round(((mock.xp_to_next_level - 1200) / mock.xp_to_next_level) * 100)));
  const remainingXp = Math.max(0, mock.xp_to_next_level - Math.floor(mock.xp_to_next_level * (xpPctLevel / 100)));

  return (
    <V1Shell>
      {/* ============ HEADER ============ */}
      <V1Block className="relative">
        <DialogClose
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/70 text-muted-foreground backdrop-blur-md transition hover:border-border hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </DialogClose>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5">
          {/* avatar redondo */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border-2"
            style={{
              borderColor: withAlpha(accent, 0.45),
              background: `linear-gradient(135deg, ${withAlpha(accent, 0.16)}, hsl(220 12% 12%))`,
              color: accent,
              boxShadow: `0 0 14px -8px ${withAlpha(accent, 0.55)}, inset 0 1px 0 ${withAlpha(accent, 0.18)}`,
            }}
          >
            <User className="h-10 w-10" strokeWidth={1.75} />
          </div>

          {/* rank badge acima + nome + meta */}
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center">
              <img
                src={rankImg(row.current_rank)}
                alt={row.current_rank}
                className="h-9 w-auto"
                style={{ filter: `drop-shadow(0 0 6px ${withAlpha(accent, 0.34)})` }}
              />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wide text-foreground">{name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill color="hsl(220 14% 92%)">Level {mock.level}</Pill>
              <Pill color={accent}>{row.current_rank}</Pill>
              <Pill color={TOP_ACCENT}>Posição - Top {mock.percentil_top}% trader</Pill>
              {row.streak_days > 0 && (
                <Pill color={STREAK_ACCENT}><StreakFlame days={row.streak_days} size="sm" /> streak</Pill>
              )}
            </div>
          </div>

          {/* score ring */}
          <ScoreRing score={mock.score} accent={accent} />
        </div>

        {/* duas barras */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Nível (XP) — Lv {mock.level}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground/90">
                {fmt(row.total_xp)} XP · {fmt(remainingXp)} para Lv {mock.level + 1}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${xpPctLevel}%`,
                  background: "linear-gradient(90deg, hsl(220 90% 60%), hsl(265 85% 65%), hsl(310 80% 65%))",
                  boxShadow: "0 0 10px hsl(265 85% 60% / 0.55)",
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Patente (Score) — {row.current_rank}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground/90">
                Score {mock.score}/100 · patente máxima
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${mock.score}%`,
                  background: "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e)",
                  boxShadow: "0 0 10px #f9731688",
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Pill color="hsl(139 80% 60%)">#{mock.global_pos} Rank na Temporada</Pill>
            <Pill color={XP_ACCENT}>{fmt(row.total_xp)} XP acumulada</Pill>
            <Pill color={TOP_ACCENT}>Top {mock.percentil_top}% trader</Pill>
          </div>

        </div>
      </V1Block>

      {/* ============ RANKING E STATUS COMPETITIVO ============ */}
      <V1Block>
        <BlockTitle color={accent} glow>Status Competitivo</BlockTitle>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <MiniKpi label="Rank na Temporada" value={`#${mock.global_pos}`} sub="↑ 2 posições" valueColor="hsl(220 14% 95%)" glowColor={accent} />
          <MiniKpi label="XP temporada" value={fmt(mock.season_xp)} sub="maio 2026" valueColor="hsl(220 14% 95%)" glowColor={accent} />
          <MiniKpi label="XP Acumulada" value={fmt(row.total_xp)} sub="XP total" valueColor="hsl(220 14% 95%)" glowColor={XP_ACCENT} />
          <MiniKpi label="Top" value={`${mock.percentil_top}%`} sub="trader" valueColor="hsl(220 14% 95%)" glowColor={TOP_ACCENT} />
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Histórico de temporadas
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {mock.history.slice(0, 3).map((h) => (
              <div key={h.label}
                className="rounded-lg border px-3 py-2.5"
                style={{ borderColor: "hsl(220 10% 18%)", background: "hsl(220 12% 13%)" }}>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Temporada {h.label.replace(/^T(\d+).*$/, "$1")}
                </div>
                <div className="mt-0.5 text-xl font-black tabular-nums text-foreground">#{h.pos}</div>
                <div className="text-[10px] text-muted-foreground">{h.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </V1Block>

      {/* ============ PERFORMANCE ============ */}
      <V1Block>
        <BlockTitle>Performance</BlockTitle>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6">
          <MiniKpi label="Winrate" value={`${mock.winrate}%`} sub="últimos 30 dias" valueColor="#22c55e" />
          <MiniKpi label="Operações" value={fmt(mock.trades)} sub="total acumulado" />
          <MiniKpi label="Gains seguidos" value={mock.best_streak_gains} sub={`recorde: ${mock.best_streak_record}`} valueColor="#f59e0b" />
          <MiniKpi label="Dias positivos" value={mock.positive_days} sub={`vs ${mock.negative_days} negativos`} valueColor="#22c55e" />
          <MiniKpi label="Metas batidas" value={mock.goals_hit} sub="sessões" valueColor="#22d3ee" />
          <MiniKpi label="Drawdown máx." value={`-R$${Math.abs(mock.drawdown_max)}`} sub="controlado" valueColor="#ef4444" />
        </div>
      </V1Block>

      {/* ============ SCORE BREAKDOWN ============ */}
      <V1Block>
        <BlockTitle>Score Breakdown — como chegou em {mock.score}/100</BlockTitle>
        {(() => {
          const items = [
            { label: "Winrate", v: mock.score_winrate, color: "#22c55e" },
            { label: "Financeiro", v: mock.score_financeiro, color: "#8b5cf6" },
            { label: "Consistência", v: mock.score_consistencia, color: "#d97706" },
            { label: "Engajamento", v: mock.score_engajamento, color: "hsl(220 14% 70%)" },
            { label: "Volume", v: mock.score_volume, color: "#ef4444" },
          ];
          const total = items.reduce((a, b) => a + b.v[1], 0);
          return (
            <>
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
                {items.map((it) => (
                  <div key={it.label}
                    style={{
                      width: `${(it.v[1] / total) * 100}%`,
                      background: it.color,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
                    }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                {items.map((it) => (
                  <div key={it.label}
                    className="rounded-lg border px-3 py-2.5"
                    style={{ borderColor: "hsl(220 10% 18%)", background: "hsl(220 12% 13%)" }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: it.color }}>
                      {it.label}
                    </div>
                    <div className="mt-0.5 text-2xl font-black tabular-nums text-foreground">
                      {it.v[0]}<span className="text-sm text-muted-foreground">/{it.v[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </V1Block>

      {/* ============ CONQUISTAS — COLEÇÃO ============ */}
      <V1Block>
        <BlockTitle>Conquistas — Coleção</BlockTitle>

        {/* destaques equipados */}
        <div className="mb-4 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Destaques equipados
        </div>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {mock.equipped.map((b) => (
            <div key={b.name}
              className="flex flex-col items-center gap-1 rounded-xl border px-3 py-4 text-center"
              style={{ borderColor: "hsl(220 10% 20%)", background: "hsl(220 12% 13%)" }}>
              <div className="text-3xl">{b.icon}</div>
              <div className="text-[11px] font-black uppercase tracking-wide text-foreground">{b.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{b.rarity}</div>
            </div>
          ))}
        </div>

        {/* sub-seções */}
        {[
          { title: "🔥 Streak", filter: (n: string) => n.startsWith("Streak") },
          { title: "📈 Trading", filter: (n: string) => ["1º Trade", "Sniper", "Centurião", "500 Ops"].includes(n) },
          { title: "💰 Financeiro", filter: (n: string) => ["FTD", "Fiel à Banca", "Banca R$5k"].includes(n) },
          { title: "🧠 Estratégia e social", filter: (n: string) => ["Estrategista", "Comunidade", "Influente", "MVP"].includes(n) },
        ].map((cat) => {
          // Para "completar a vitrine" garantimos sempre 4 cells por sub-seção; se não há badge no pool, usamos placeholders.
          const PLACEHOLDERS: Record<string, { name: string; icon: string }[]> = {
            "🔥 Streak": [{ name: "Streak 7", icon: "🔥" }, { name: "Streak 30", icon: "🔥" }, { name: "Streak 90", icon: "🔥" }],
            "📈 Trading": [{ name: "1º Trade", icon: "🏆" }, { name: "Sniper", icon: "🎯" }, { name: "Centurião", icon: "🚀" }, { name: "500 Ops", icon: "📊" }],
            "💰 Financeiro": [{ name: "FTD", icon: "💰" }, { name: "Fiel à Banca", icon: "🔄" }, { name: "Banca R$5k", icon: "💵" }],
            "🧠 Estratégia e social": [{ name: "Estrategista", icon: "🧠" }, { name: "Comunidade", icon: "👥" }, { name: "Influente", icon: "✨" }, { name: "MVP", icon: "👑" }],
          };
          const cells = PLACEHOLDERS[cat.title].map((p) => {
            const owned = mock.collection.find((c) => c.badge.name === p.name && c.owned);
            return { ...p, owned: !!owned };
          });
          return (
            <div key={cat.title} className="mb-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
                {cat.title}
              </div>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {cells.map((c) => (
                  <div key={c.name}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition ${
                      c.owned ? "" : "opacity-30 grayscale"
                    }`}
                    style={{ borderColor: "hsl(220 10% 20%)", background: "hsl(220 12% 13%)" }}>
                    <div className="text-2xl leading-none">{c.icon}</div>
                    <div className="truncate text-[10px] font-bold uppercase text-foreground/85">{c.name}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </V1Block>

      {/* ============ ESTRATÉGIAS ============ */}
      <V1Block>
        <BlockTitle>Estratégias</BlockTitle>
        <div className="space-y-2">
          {mock.strategies.map((s) => (
            <div key={s.name}
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              style={{ borderColor: "hsl(220 10% 18%)", background: "hsl(220 12% 13%)" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-md text-lg"
                style={{ background: withAlpha(accent, 0.15), color: accent }}>
                {s.top ? "🎯" : "📊"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-foreground">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {s.uses} usos {s.top && "· estratégia principal"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black tabular-nums" style={{ color: "#22c55e" }}>{s.winrate}%</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">winrate</div>
              </div>
            </div>
          ))}
        </div>
      </V1Block>

      {/* ============ MISSÕES ATIVAS ============ */}
      <V1Block>
        <BlockTitle>Missões Ativas</BlockTitle>
        <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Diárias</div>
        {mock.daily.map((m) => (
          <div key={m.title} className="flex items-center gap-3 py-1.5">
            <div className="min-w-0 flex-1 truncate text-sm text-foreground">{m.title}</div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
              <div className="h-full rounded-full"
                style={{
                  width: `${m.pct}%`,
                  background: m.pct >= 100 ? "hsl(139 80% 50%)" : `linear-gradient(90deg, ${accent}, hsl(139 80% 60%))`,
                }} />
            </div>
            <div className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">{m.status}</div>
          </div>
        ))}
        <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Semanais</div>
        {mock.weekly.map((m) => (
          <div key={m.title} className="flex items-center gap-3 py-1.5">
            <div className="min-w-0 flex-1 truncate text-sm text-foreground">{m.title}</div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
              <div className="h-full rounded-full"
                style={{
                  width: `${m.pct}%`,
                  background: m.pct >= 100 ? "hsl(139 80% 50%)" : `linear-gradient(90deg, ${accent}, hsl(139 80% 60%))`,
                }} />
            </div>
            <div className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">{m.status}</div>
          </div>
        ))}
      </V1Block>

      {/* ============ COMUNIDADE ============ */}
      <V1Block>
        <BlockTitle>Comunidade</BlockTitle>
        <div className="mb-4 grid grid-cols-3 gap-2.5">
          <MiniKpi label="Postagens" value={mock.posts} valueColor={accent} />
          <MiniKpi label="Respostas" value={mock.replies} valueColor={accent} />
          <MiniKpi label="Curtidas" value={mock.likes} valueColor={accent} />
        </div>
        <div className="space-y-3">
          {mock.threads.map((t) => (
            <div key={t.title}>
              <div className="text-sm font-bold text-foreground">{t.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {t.cat} · {t.ago} · {t.replies} respostas
              </div>
            </div>
          ))}
        </div>
      </V1Block>

      {/* ============ PRIVACIDADE ============ */}
      <V1Block>
        <BlockTitle>Privacidade</BlockTitle>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PRIVACY_PUBLIC.map((p) => (
            <Pill key={p} color="#22c55e" variant="soft">público: {p}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRIVACY_PRIVATE.map((p) => (
            <Pill key={p} color="hsl(220 14% 60%)" variant="outline">privado: {p}</Pill>
          ))}
        </div>
      </V1Block>
    </V1Shell>
  );
}
