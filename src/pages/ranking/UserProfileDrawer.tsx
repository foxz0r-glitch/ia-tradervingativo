import { useState } from "react";
import {
  X, Loader2, Star, Lock, CheckCircle2, Circle,
  TrendingUp, TrendingDown, Minus, Trophy, Target, Zap,
  Shield, Flame, Crown, Award, BarChart3, BookOpen,
} from "lucide-react";
import { rankImg } from "@/lib/rankImages";
import { RANKS } from "@/hooks/useGamification";
import { useUserProfile } from "@/hooks/useUserProfile";
import { fmt, rankInfo, rankProgress } from "./_shared";
import StreakFlame from "./_StreakFlame";

// ── helpers ────────────────────────────────────────────────────────────────

const RARITY_LABEL: Record<string, string> = {
  comum:    "Comum",
  rara:     "Rara",
  epica:    "Épica",
  lendaria: "Lendária",
};

const RARITY_COLOR: Record<string, string> = {
  comum:    "#9CA3AF",
  rara:     "#60A5FA",
  epica:    "#A78BFA",
  lendaria: "#FBBF24",
};

const GROUP_LABEL: Record<string, string> = {
  streak:    "Streak",
  trading:   "Trading",
  patente:   "Patente",
  financeiro:"Financeiro",
  outros:    "Outros",
};

const GROUP_ICON: Record<string, React.ReactNode> = {
  streak:    <Flame  className="h-3.5 w-3.5" />,
  trading:   <BarChart3 className="h-3.5 w-3.5" />,
  patente:   <Crown  className="h-3.5 w-3.5" />,
  financeiro:<TrendingUp className="h-3.5 w-3.5" />,
  outros:    <Star   className="h-3.5 w-3.5" />,
};

const MISSION_TYPE_LABEL: Record<string, string> = {
  daily:     "Diária",
  weekly:    "Semanal",
  permanent: "Permanente",
};

const MISSION_TYPE_COLOR: Record<string, string> = {
  daily:     "hsl(139 80% 45%)",
  weekly:    "#60A5FA",
  permanent: "#FBBF24",
};

function calcLevel(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1);
}
function xpForLevel(lv: number) {
  return Math.pow(lv - 1, 2) * 50;
}

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  const c = color ?? "hsl(139 80% 45%)";
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: `linear-gradient(135deg, ${c}14 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${c}30`,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
        {icon && <span style={{ color: c }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color, height = 5 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ position: "relative", flex: 1, height, background: "rgba(255,255,255,0.10)", borderRadius: height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: height, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)", boxShadow: `0 0 8px ${color}99` }} />
    </div>
  );
}

function BadgeChip({ b, size = "md" }: { b: any; size?: "sm" | "md" }) {
  const c = RARITY_COLOR[b.rarity] ?? "#9CA3AF";
  const locked = !b.earned;
  const sz = size === "sm" ? { box: 44, img: 24, font: 8 } : { box: 56, img: 32, font: 9 };

  return (
    <div
      title={`${b.title}${locked ? " (bloqueado)" : ""} · ${RARITY_LABEL[b.rarity]}`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 6px 6px",
        borderRadius: 10,
        background: locked ? "rgba(255,255,255,0.03)" : `${c}12`,
        border: `1px solid ${locked ? "rgba(255,255,255,0.08)" : c + "44"}`,
        boxShadow: locked ? "none" : `0 0 12px -4px ${c}55`,
        opacity: locked ? 0.45 : 1,
        cursor: "default",
        minWidth: sz.box,
      }}
    >
      {b.equipped && (
        <span style={{ position: "absolute", top: -4, right: -4, background: "#FBBF24", borderRadius: 4, padding: "1px 3px", fontSize: 7, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          ★
        </span>
      )}
      <div style={{ width: sz.img, height: sz.img, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: locked ? "rgba(255,255,255,0.06)" : `${c}22` }}>
        {locked
          ? <Lock style={{ width: sz.img * 0.55, height: sz.img * 0.55, color: "rgba(255,255,255,0.3)" }} />
          : <Award style={{ width: sz.img * 0.65, height: sz.img * 0.65, color: c }} />
        }
      </div>
      <span style={{ fontSize: sz.font, fontWeight: 700, color: locked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.2, maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {b.title}
      </span>
      <span style={{ fontSize: sz.font - 1, color: locked ? "rgba(255,255,255,0.2)" : c, fontWeight: 700 }}>
        {RARITY_LABEL[b.rarity]}
      </span>
    </div>
  );
}

// ── Main Drawer ─────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  displayName: string;
  meId: string | null;
  onClose: () => void;
  modal?: boolean;
}

type Tab = "perfil" | "stats" | "badges" | "missoes";

export default function UserProfileDrawer({ userId, displayName, meId, onClose, modal = false }: Props) {
  const isOwn = meId === userId;
  const { data, loading, error } = useUserProfile(userId, isOwn);
  const [tab, setTab] = useState<Tab>("perfil");

  const c = data ? rankInfo(data.current_rank).color : "hsl(139 80% 45%)";
  const img = data ? rankImg(data.current_rank) : "";

  // Level progress
  const lvl      = data?.level ?? 1;
  const lvlXpMin = xpForLevel(lvl);
  const lvlXpMax = xpForLevel(lvl + 1);
  const lvlPct   = lvlXpMax > lvlXpMin
    ? Math.min(100, Math.max(0, ((data?.total_xp ?? 0) - lvlXpMin) / (lvlXpMax - lvlXpMin) * 100))
    : 100;

  // Score/rank progress
  const fakeRow = data ? { user_id: userId, total_xp: data.total_xp, score: data.score, season_xp: data.season_xp, level: data.level, current_rank: data.current_rank, streak_days: data.streak_days, display_name: data.display_name } : null;
  const rp = fakeRow ? rankProgress(fakeRow) : { pct: 0, info: rankInfo("Prata I"), next: null };

  // Tabs available
  const allTabs: Array<{ id: Tab; label: string; icon: React.ReactNode; hidden?: boolean }> = [
    { id: "perfil",  label: "Perfil",       icon: <Shield  className="h-3.5 w-3.5" /> },
    { id: "stats",   label: "Estatísticas", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "badges",  label: "Badges",       icon: <Star    className="h-3.5 w-3.5" /> },
    { id: "missoes", label: "Missões",      icon: <Target  className="h-3.5 w-3.5" />, hidden: !isOwn },
  ];
  const tabs = allTabs.filter(t => !t.hidden);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, backdropFilter: "blur(4px)" }}
      />

      {/* Panel */}
      <div
        style={modal ? {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(640px, 95vw)",
          maxHeight: "90vh",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, hsl(220 25% 8% / 0.98), hsl(220 25% 5% / 0.99))",
          border: `1px solid ${c}30`,
          borderRadius: 16,
          boxShadow: `0 24px 80px -12px rgba(0,0,0,0.8), 0 0 40px -8px ${c}30`,
          overflowY: "auto",
        } : {
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(600px, 100vw)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, hsl(220 25% 8% / 0.98), hsl(220 25% 5% / 0.99))",
          borderLeft: `1px solid ${c}30`,
          boxShadow: `-8px 0 40px -8px ${c}30`,
          overflowY: "auto",
        }}
      >
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: 0.5 }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12, zIndex: 10, padding: 6, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex" }}
        >
          <X className="h-4 w-4" />
        </button>

        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.5)" }}>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: c }} />
            <span style={{ fontSize: 14 }}>Carregando perfil…</span>
          </div>
        )}

        {error && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "#f87171", fontSize: 14 }}>
            Erro ao carregar: {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── HEADER ── */}
            <div
              style={{
                padding: "28px 24px 16px",
                background: `linear-gradient(160deg, ${c}18 0%, transparent 60%)`,
                borderBottom: `1px solid ${c}18`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={img}
                    alt={data.current_rank}
                    style={{ width: 72, height: 72, objectFit: "contain", filter: `drop-shadow(0 0 16px ${c}99)` }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: c, textTransform: "uppercase", marginBottom: 4 }}>
                    {data.current_rank}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.95)", letterSpacing: "0.02em", lineHeight: 1.1 }}>
                    {displayName}
                  </div>
                  {isOwn && (
                    <span style={{ fontSize: 9, fontWeight: 800, background: "hsl(139 80% 39%)", color: "#fff", borderRadius: 4, padding: "1px 6px", marginTop: 4, display: "inline-block" }}>
                      VOCÊ
                    </span>
                  )}
                </div>
                {data.rank_position && (
                  <div
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: `${c}14`,
                      border: `1px solid ${c}30`,
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 900, color: c, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>#{data.rank_position}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>RANK</span>
                  </div>
                )}
              </div>

              {/* Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {[
                  { label: `Nível ${data.level}`, color: "hsl(139 80% 45%)", icon: <Zap className="h-3 w-3" /> },
                  { label: data.current_rank, color: c, icon: <Crown className="h-3 w-3" /> },
                  { label: `Top ${data.top_pct}% trader`, color: "#FBBF24", icon: <Trophy className="h-3 w-3" /> },
                  ...(data.streak_days > 0 ? [{ label: `${data.streak_days} dias streak`, color: "#F97316", icon: <Flame className="h-3 w-3" /> }] : []),
                ].map((chip, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: `${chip.color}14`,
                      border: `1px solid ${chip.color}44`,
                      color: chip.color,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {chip.icon}{chip.label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── TAB NAV ── */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, overflowX: "auto" }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: tab === t.id ? `2px solid ${c}` : "2px solid transparent",
                    color: tab === t.id ? c : "rgba(255,255,255,0.4)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "color 0.2s, border-color 0.2s",
                  }}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ padding: "20px 24px 32px", overflowY: "auto", flex: 1 }}>

              {/* ═══ TAB: PERFIL ═══════════════════════════════════════════ */}
              {tab === "perfil" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Perfil & Progresso */}
                  <section>
                    <SectionTitle icon={<Shield className="h-3.5 w-3.5" />} label="Perfil & Progresso" color={c} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>

                      {/* XP / Nível */}
                      <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "baseline" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            Nível (XP)
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "hsl(139 80% 55%)", fontVariantNumeric: "tabular-nums" }}>
                            Lv {lvl}
                          </span>
                        </div>
                        <ProgressBar pct={lvlPct} color="hsl(139 80% 45%)" height={6} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>
                          <span>{Math.round(lvlPct)}% · {fmt(data.total_xp - lvlXpMin)} XP</span>
                          <span>{fmt(lvlXpMax - data.total_xp)} XP restantes</span>
                        </div>
                      </div>

                      {/* Score / Patente */}
                      <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "baseline" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            Patente (Score)
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: c, fontVariantNumeric: "tabular-nums" }}>
                            {data.current_rank}
                          </span>
                        </div>
                        <ProgressBar pct={rp.pct} color={c} height={6} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>
                          <span>{Math.round(rp.pct)}% · {fmt(data.score)} pts</span>
                          {rp.next && <span>{fmt(rp.next.xpMin - data.score)} pts restantes → {rp.next.name}</span>}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Status Competitivo */}
                  <section>
                    <SectionTitle icon={<Trophy className="h-3.5 w-3.5" />} label="Status Competitivo" color="#FBBF24" />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 12 }}>
                      <StatCard
                        label="XP Temporada"
                        value={fmt(data.season_xp)}
                        color="hsl(139 80% 45%)"
                        icon={<Zap className="h-3 w-3" />}
                      />
                      <StatCard
                        label="XP Acumulada"
                        value={fmt(data.total_xp)}
                        color="hsl(139 80% 45%)"
                        icon={<Zap className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Rank Temporada"
                        value={`#${data.rank_position}`}
                        color="#FBBF24"
                        icon={<Crown className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Posição (Top)"
                        value={`${data.top_pct}%`}
                        sub={`de ${fmt(data.total_traders)} traders`}
                        color="#A78BFA"
                        icon={<Trophy className="h-3 w-3" />}
                      />
                      <div style={{ gridColumn: "1 / -1" }}>
                        <StatCard
                          label="Variação de Posição"
                          value={
                            data.rank_change === null
                              ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>— sem histórico</span>
                              : data.rank_change > 0
                              ? <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#4ADE80" }}><TrendingUp className="h-5 w-5" />↑ {data.rank_change} posições</span>
                              : data.rank_change < 0
                              ? <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#F87171" }}><TrendingDown className="h-5 w-5" />↓ {Math.abs(data.rank_change)} posições</span>
                              : <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)" }}><Minus className="h-5 w-5" />Sem variação</span>
                          }
                          color={data.rank_change === null ? "rgba(255,255,255,0.2)" : data.rank_change > 0 ? "#4ADE80" : data.rank_change < 0 ? "#F87171" : "rgba(255,255,255,0.4)"}
                          sub="vs. dia anterior"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* ═══ TAB: ESTATÍSTICAS ════════════════════════════════════ */}
              {tab === "stats" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <section>
                    <SectionTitle icon={<BarChart3 className="h-3.5 w-3.5" />} label="Estatísticas" color="#60A5FA" />

                    {data.total_operations === 0 && (
                      <div style={{ marginTop: 12, padding: "16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.10)", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                        Sem operações registradas ainda
                      </div>
                    )}

                    {/* Overview */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 12 }}>
                      <StatCard
                        label="Win Rate"
                        value={`${data.win_rate}%`}
                        sub={`${data.wins}W · ${data.losses}L`}
                        color={data.win_rate >= 60 ? "#4ADE80" : data.win_rate >= 45 ? "#FBBF24" : "#F87171"}
                        icon={<Target className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Operações"
                        value={fmt(data.total_operations)}
                        color="#60A5FA"
                        icon={<BarChart3 className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Ativo Preferido"
                        value={data.preferred_asset ?? "—"}
                        color="#A78BFA"
                        icon={<TrendingUp className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Variação Score"
                        value={
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {data.score_variation > 0
                              ? <TrendingUp className="h-4 w-4" style={{ color: "#4ADE80" }} />
                              : data.score_variation < 0
                              ? <TrendingDown className="h-4 w-4" style={{ color: "#F87171" }} />
                              : <Minus className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                            }
                            {data.score_variation !== 0 ? `${data.score_variation > 0 ? "+" : ""}${data.score_variation} pts` : "—"}
                          </span>
                        }
                        color={data.score_variation > 0 ? "#4ADE80" : data.score_variation < 0 ? "#F87171" : "rgba(255,255,255,0.3)"}
                        sub="últimos 7 dias"
                      />
                    </div>

                    {/* Consistência */}
                    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                      <StatCard
                        label="Dias Positivos"
                        value={data.positive_days}
                        sub="fechados no positivo"
                        color="#4ADE80"
                        icon={<CheckCircle2 className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Maior Seq. Gains"
                        value={data.best_gains_streak}
                        sub="wins seguidos"
                        color="#FBBF24"
                        icon={<Flame className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Maior Seq. Metas"
                        value={data.best_goals_streak || "—"}
                        sub="sessões com meta atingida"
                        color="#A78BFA"
                        icon={<Target className="h-3 w-3" />}
                      />
                      <StatCard
                        label="Melhor Sequência"
                        value={data.best_financial_streak > 0 ? `R$ ${data.best_financial_streak.toFixed(2)}` : "—"}
                        sub="ganhos consecutivos"
                        color="#60A5FA"
                        icon={<TrendingUp className="h-3 w-3" />}
                      />
                    </div>
                  </section>
                </div>
              )}

              {/* ═══ TAB: BADGES ══════════════════════════════════════════ */}
              {tab === "badges" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Destaques Equipados */}
                  {data.earned_badges.some(b => b.equipped) && (
                    <section>
                      <SectionTitle icon={<Star className="h-3.5 w-3.5" />} label="Destaques Equipados" color="#FBBF24" />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        {data.all_badges.filter(b => b.equipped).map(b => (
                          <BadgeChip key={b.key} b={b} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Coleção completa por grupo */}
                  {Object.entries(GROUP_LABEL).map(([groupKey, groupLabel]) => {
                    const groupBadges = data.all_badges.filter(b => b.badge_group === groupKey);
                    if (groupBadges.length === 0) return null;
                    const groupColor = groupBadges.find(b => b.earned)
                      ? RARITY_COLOR[groupBadges.find(b => b.earned)!.rarity]
                      : "rgba(255,255,255,0.25)";
                    return (
                      <section key={groupKey}>
                        <SectionTitle icon={GROUP_ICON[groupKey]} label={`Grupo: ${groupLabel}`} color={groupColor} sub={`${groupBadges.filter(b => b.earned).length}/${groupBadges.length} conquistados`} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                          {groupBadges.map(b => (
                            <BadgeChip key={b.key} b={b} />
                          ))}
                        </div>
                      </section>
                    );
                  })}

                  {data.all_badges.length === 0 && (
                    <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                      Catálogo de badges em carregamento…
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: MISSÕES (apenas próprio perfil) ═════════════════ */}
              {tab === "missoes" && isOwn && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {(["daily", "weekly", "permanent"] as const).map(mType => {
                    const group = (data.missions ?? []).filter(m => m.type === mType);
                    if (group.length === 0) return null;
                    const mColor = MISSION_TYPE_COLOR[mType];
                    return (
                      <section key={mType}>
                        <SectionTitle icon={<BookOpen className="h-3.5 w-3.5" />} label={`Missões ${MISSION_TYPE_LABEL[mType]}s`} color={mColor} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                          {group.map(m => {
                            const done = !!m.completed_at;
                            const pct  = m.requirement_value > 0
                              ? Math.min(100, Math.round((m.progress / m.requirement_value) * 100))
                              : done ? 100 : 0;
                            return (
                              <div
                                key={m.id}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: 10,
                                  background: done ? `${mColor}10` : "rgba(255,255,255,0.03)",
                                  border: `1px solid ${done ? mColor + "44" : "rgba(255,255,255,0.08)"}`,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {done
                                      ? <CheckCircle2 className="h-4 w-4" style={{ color: mColor, flexShrink: 0 }} />
                                      : <Circle       className="h-4 w-4" style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                                    }
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)" }}>
                                        {m.title}
                                      </div>
                                      {m.description && (
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                                          {m.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: mColor, flexShrink: 0, marginLeft: 8 }}>
                                    +{m.xp_reward} XP
                                  </span>
                                </div>
                                {!done && (
                                  <>
                                    <ProgressBar pct={pct} color={mColor} height={4} />
                                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
                                      {m.progress}/{m.requirement_value} · {pct}%
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}

                  {(!data.missions || data.missions.length === 0) && (
                    <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                      Nenhuma missão ativa encontrada.
                    </div>
                  )}
                </div>
              )}

              {/* Score Breakdown, Estratégias, Comunidade — pendentes */}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SectionTitle({ icon, label, color, sub }: { icon?: React.ReactNode; label: string; color: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ color, display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.20em", color, textTransform: "uppercase" }}>{label}</span>
      {sub && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.30)", marginLeft: 4 }}>{sub}</span>}
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}30, transparent)`, marginLeft: 4 }} />
    </div>
  );
}
