import { useMemo, useState } from "react";
import { Clock, Calendar, Hexagon, ArrowUpRight, ArrowDownRight, TrendingUp, History, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatMoeda } from "@/lib/moeda";

// ── Interface ────────────────────────────────────────────────────────
export interface Operation {
  id: string;
  symbol: string;
  date: string;
  timeShort: string;
  timeFull: string;
  openTimeFull: string;
  time: string;
  direction: "call" | "put";
  result: "win" | "loss" | "draw";
  pnl: number;
  invest: number;
  payout: number;
  openTimestamp: number;
  closeTimestamp: number;
  expiracaoSeg: number;
  aiModel?: string;
}

const MONTHS_PT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const fmtBRL = (v: number, moeda: string | null) => formatMoeda(Math.abs(v), moeda);

const CURRENCY_FLAG: Record<string, string> = {
  EUR: "eu", USD: "us", GBP: "gb", JPY: "jp",
  AUD: "au", CAD: "ca", NZD: "nz", CHF: "ch",
  BRL: "br", CNY: "cn", MXN: "mx",
};

function pairFlags(symbol: string): [string, string] {
  const m = symbol.match(/^([A-Z]{3})[\/\-]([A-Z]{3})/);
  if (m) return [CURRENCY_FLAG[m[1]] ?? "us", CURRENCY_FLAG[m[2]] ?? "us"];
  return ["us", "us"];
}

function PairFlags({ a, b, ringClass = "ring-card" }: { a: string; b: string; ringClass?: string }) {
  return (
    <div className="relative flex -space-x-1.5">
      <img src={`https://flagcdn.com/w40/${a}.png`} srcSet={`https://flagcdn.com/w80/${a}.png 2x`} alt={a}
        className={cn("h-5 w-5 rounded-full object-cover ring-2", ringClass)} />
      <img src={`https://flagcdn.com/w40/${b}.png`} srcSet={`https://flagcdn.com/w80/${b}.png 2x`} alt={b}
        className={cn("h-5 w-5 rounded-full object-cover ring-2", ringClass)} />
    </div>
  );
}

function fmtTimeFull(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}

function fmtExpiracao(secs: number): string {
  if (!secs || secs <= 0) return "—";
  if (secs < 60) return `${secs} segundo${secs !== 1 ? "s" : ""}`;
  const mins = Math.round(secs / 60);
  return `${mins} minuto${mins !== 1 ? "s" : ""}`;
}

// ── Session grouping ─────────────────────────────────────────────────
export interface SessionEntry { ts: number; ai: string; }

const AI_LABELS: Record<string, string> = {
  claude: "Claude", gpt5: "GPT-5", gemini: "Gemini", grok3: "Grok 3",
};

interface SessionGroupData {
  sessionIndex: number;
  startTs: number;
  aiModel: string;
  ops: Operation[];
  totalPnl: number;
  wins: number;
  losses: number;
}

function groupBySession(ops: Operation[], sessionStarts: SessionEntry[]): SessionGroupData[] {
  const sorted = [...sessionStarts].sort((a, b) => a.ts - b.ts);
  if (sorted.length === 0) return [];

  const groups: SessionGroupData[] = sorted.map((entry, i) => ({
    sessionIndex: i + 1, startTs: entry.ts, aiModel: entry.ai, ops: [], totalPnl: 0, wins: 0, losses: 0,
  }));

  for (const op of ops) {
    const ts = op.closeTimestamp ? op.closeTimestamp * 1000 : Date.now();
    let gi = 0;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].startTs <= ts) gi = i;
      else break;
    }
    groups[gi].ops.push(op);
  }

  return groups
    .map(g => ({
      ...g,
      totalPnl: g.ops.reduce((sum, o) => sum + (o.result === "draw" ? 0 : o.pnl), 0),
      wins: g.ops.filter(o => o.result === "win").length,
      losses: g.ops.filter(o => o.result === "loss").length,
    }))
    .filter(g => g.ops.length > 0)
    .reverse();
}

// ── Detail Popover ───────────────────────────────────────────────────
function OperationDetailPopover({ op, moeda }: { op: Operation; moeda: string | null }) {
  const isDraw = op.result === "draw";
  const isWin = op.result === "win";
  const [fa, fb] = pairFlags(op.symbol);
  const cleanSymbol = op.symbol.replace(/-OTC$/i, "");
  const isCall = op.direction === "call";
  const pnlColor = isDraw ? "#9ca3af" : isWin ? "hsl(139 80% 70%)" : "hsl(0 84% 72%)";
  const pnlGlow  = isDraw ? "rgba(156,163,175,0.4)" : isWin ? "hsl(139 80% 50%)" : "hsl(0 84% 55%)";
  const pnlSign  = isDraw ? "" : isWin ? "+" : "-";
  const payout   = op.payout ?? 0;
  const payoutStr = isDraw ? "(0%)" : `(${payout > 0 ? "+" : ""}${payout}%)`;
  const resultLabel = isDraw ? "EMPATE" : isWin ? "GAIN" : "LOSS";
  const openDisplay  = op.openTimestamp  ? fmtTimeFull(op.openTimestamp)  : (op.openTimeFull || op.timeFull || "—");
  const closeDisplay = op.closeTimestamp ? fmtTimeFull(op.closeTimestamp) : (op.timeFull || "—");
  const momentoFecho = op.closeTimestamp
    ? (() => { const d = new Date(op.closeTimestamp * 1000); return `${String(d.getDate()).padStart(2,"0")} ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`; })()
    : (op.date || "—");

  return (
    <div className="overflow-hidden rounded-2xl border border-[hsl(139_80%_45%/0.25)]"
      style={{ background: "linear-gradient(180deg, hsl(220 22% 9% / 0.98), hsl(220 25% 6% / 0.99))", boxShadow: "0 0 40px -12px hsl(139 80% 45% / 0.4), inset 0 1px 0 hsl(139 80% 60% / 0.1)" }}>
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-gradient-to-r from-card/80 via-card/40 to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PairFlags a={fa} b={fb} ringClass="ring-[#0d0d14]" />
          <div className="leading-tight">
            <div className="text-sm font-black tracking-tight text-foreground">{cleanSymbol}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Hexagon className="h-2 w-2 text-[hsl(139_80%_60%)]" fill="currentColor" /> Operação Encerrada
            </div>
          </div>
        </div>
        <div className="rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: pnlColor, borderColor: `${pnlGlow}55`, background: `${pnlGlow}15`, boxShadow: `0 0 12px -4px ${pnlGlow}88` }}>
          {resultLabel}
        </div>
      </div>
      <div className="border-b border-border/30 px-4 py-5 text-center">
        <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">Resultado</div>
        <div className="ct-mono mt-1 text-3xl font-black tabular-nums leading-none"
          style={{ color: pnlColor, textShadow: `0 0 22px ${pnlGlow}88` }}>
          {pnlSign}{fmtBRL(op.pnl, moeda)}
        </div>
        <div className="ct-mono mt-1.5 text-[11px] font-bold tabular-nums" style={{ color: pnlColor, opacity: 0.85 }}>
          payout {payoutStr}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-border/30 p-3">
        <div className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Direção</div>
          <div className="ct-mono mt-1 flex items-center gap-1.5 text-sm font-black uppercase tabular-nums text-foreground">
            {isCall ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {isCall ? "CALL" : "PUT"}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Investido</div>
          <div className="ct-mono mt-1 text-sm font-black tabular-nums text-foreground">
            {op.invest ? fmtBRL(op.invest, moeda) : "—"}
          </div>
        </div>
      </div>
      <div className="space-y-0 p-3">
        <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Abertura"          value={openDisplay}              mono />
        <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Fechamento"        value={closeDisplay}             mono />
        <DetailRow icon={<TrendingUp className="h-3.5 w-3.5" />} label="Expiração"    value={fmtExpiracao(op.expiracaoSeg ?? 0)} />
        <DetailRow icon={<Calendar className="h-3.5 w-3.5" />}   label="Data"         value={momentoFecho}             mono />
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, mono, accent }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/20 py-2 last:border-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <span className={cn(accent ? "text-[hsl(139_80%_60%)]" : "text-muted-foreground/70")}>{icon}</span>
        {label}
      </div>
      <span className={cn("text-[12px] font-bold text-foreground", mono && "ct-mono tabular-nums", accent && "text-[hsl(139_80%_75%)]")}>
        {value}
      </span>
    </div>
  );
}

// ── Operation row (reusable for both flat and nested use) ────────────
function OperationRow({ op, nested = false, moeda }: { op: Operation; nested?: boolean; moeda: string | null }) {
  const isDraw = op.result === "draw";
  const isWin  = op.result === "win";
  const [fa, fb] = pairFlags(op.symbol);
  const resultBadge = isDraw
    ? "bg-[hsl(220_10%_25%/0.7)] text-[#9ca3af]"
    : isWin
    ? "bg-[hsl(139_80%_25%/0.55)] text-[#3ddc97]"
    : "bg-[hsl(0_84%_30%/0.55)] text-[#ff4d6d]";
  const resultLabel = isDraw ? "EMPATE" : isWin ? "GAIN" : "LOSS";
  const valueColor  = isDraw ? "text-[#9ca3af]" : isWin ? "text-[#3ddc97]" : "text-[#ff4d6d]";
  const pnlSign     = isDraw ? "" : isWin ? "+" : "-";
  const payout      = op.payout ?? 0;
  const payoutStr   = isDraw ? "(0%)" : `(${payout > 0 ? "+" : ""}${payout}%)`;
  const dateLabel   = op.date || "";
  const timeLabel   = op.timeShort || op.time?.slice(0, 5) || "";
  const cleanSymbol = op.symbol.replace(/-OTC$/i, "");

  const accentHex = isDraw ? "#9ca3af" : isWin ? "#3ddc97" : "#ff4d6d";

  return (
    <li className="group/op animate-fade-in">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative flex w-full cursor-pointer items-stretch gap-3 py-3 text-left transition-colors hover:bg-muted/10 focus:bg-muted/15 focus:outline-none",
              nested ? "px-8" : "px-5",
            )}
          >
            {/* Accent bar */}
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-[60%] w-[2px] -translate-y-1/2 rounded-r-full transition-all group-hover/op:h-[78%]"
              style={{ background: accentHex, boxShadow: `0 0 8px ${accentHex}` }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <PairFlags a={fa} b={fb} />
                <span className="truncate text-sm font-bold text-foreground">{cleanSymbol}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${resultBadge}`}>
                  {resultLabel}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="ct-mono text-xs text-muted-foreground">
                  {dateLabel && timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel || timeLabel || "—"}
                </span>
              </div>
            </div>
            <div className={`shrink-0 self-center text-right ${valueColor}`}>
              <div className="ct-mono text-sm font-bold tabular-nums">{pnlSign}{fmtBRL(op.pnl, moeda)}</div>
              <div className="ct-mono mt-0.5 text-[11px] font-semibold tabular-nums opacity-80">{payoutStr}</div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={12} className="w-[min(340px,calc(100vw-1rem))] border-0 bg-transparent p-0 shadow-none">
          <OperationDetailPopover op={op} moeda={moeda} />
        </PopoverContent>
      </Popover>
    </li>
  );
}

// ── Session accordion row ────────────────────────────────────────────
function SessionGroupRow({ group, open, onToggle, moeda }: { group: SessionGroupData; open: boolean; onToggle: () => void; moeda: string | null }) {
  const setOpen = (_v: boolean | ((p: boolean) => boolean)) => onToggle();
  const isPositive  = group.totalPnl >= 0;
  const wr          = group.ops.length > 0 ? Math.round((group.wins / group.ops.length) * 100) : 0;
  const pnlColor    = isPositive ? "text-[#3ddc97]" : "text-[#ff4d6d]";
  const wrHex       = isPositive ? "#3ddc97" : "#ff4d6d";
  const accentHsl   = isPositive ? "hsl(139 80% 50%)" : "hsl(0 84% 55%)";
  const pnlSign     = group.totalPnl >= 0 ? "+" : "-";
  const d           = new Date(group.startTs);
  const sessionDate = `${String(d.getDate()).padStart(2,"0")} ${MONTHS_PT[d.getMonth()]}`;
  const sessionTime = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

  return (
    <li className={cn("group/session", open && "bg-gradient-to-b from-muted/[0.05] to-transparent")}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "relative flex w-full items-center gap-3 border-b px-5 py-3 text-left transition-all hover:bg-muted/10",
          open
            ? "border-border/50 bg-[hsl(220_22%_11%/0.6)] backdrop-blur-sm"
            : "border-border/30",
        )}
        style={open ? { boxShadow: `inset 0 -1px 0 ${accentHsl}30` } : undefined}
      >
        {/* Accent bar */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-r-full transition-all",
            open ? "h-[80%]" : "h-[60%] group-hover/session:h-[78%]",
          )}
          style={{ background: wrHex, boxShadow: `0 0 8px ${wrHex}` }}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">SESSÃO #{String(group.sessionIndex).padStart(3, "0")}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums" style={{ color: wrHex }}>
              {wr}% WR
            </span>
          </div>
          <div className="ct-mono mt-1 flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground tabular-nums">
            <span>{sessionDate}</span>
            <span className="opacity-30">·</span>
            <span>{sessionTime}</span>
            {group.aiModel && (
              <>
                <span className="opacity-30">·</span>
                <span className="font-semibold" style={{ color: "hsl(139 80% 62%)" }}>
                  {AI_LABELS[group.aiModel] ?? group.aiModel}
                </span>
              </>
            )}
            <span className="opacity-30">·</span>
            <span>{group.ops.length} op{group.ops.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* PnL + W/L + chevron */}
        <div className="flex shrink-0 items-start gap-2">
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn("ct-mono text-sm font-black tabular-nums leading-none", pnlColor)}
              style={{ textShadow: `0 0 14px ${accentHsl}55` }}
            >
              {pnlSign}{fmtBRL(Math.abs(group.totalPnl), moeda)}
            </span>
            <span className="ct-mono text-[10.5px] font-medium tabular-nums leading-none">
              <span className="text-[#3ddc97]">{group.wins}W</span>
              <span className="text-muted-foreground opacity-30"> / </span>
              <span className="text-[#ff4d6d]">{group.losses}L</span>
            </span>
          </div>
          {open
            ? <ChevronUp  className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronDown className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="relative border-b border-border/40 bg-[hsl(220_25%_5%/0.55)]">
          {/* Subtle accent gradient overlay */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${accentHsl}55, transparent)` }}
          />
          <ul className="divide-y divide-border/15">
            {group.ops.map(op => <OperationRow key={op.id} op={op} nested moeda={moeda} />)}
          </ul>
        </div>
      )}
    </li>
  );
}

// ── Filter Tabs ──────────────────────────────────────────────────────
type Tab = "all" | "session" | "day";

function filterOps(ops: Operation[], tab: Tab, sessionStart: number | null): Operation[] {
  if (tab === "all") return ops;
  if (tab === "day") {
    const today = new Date(); today.setHours(0,0,0,0);
    const t0 = today.getTime();
    return ops.filter(op => {
      if (op.closeTimestamp) return op.closeTimestamp * 1000 >= t0;
      const [hh, mm, ss] = (op.time || "0:0:0").split(":").map(Number);
      const d = new Date(); d.setHours(hh ?? 0, mm ?? 0, ss ?? 0, 0);
      return d.getTime() >= t0;
    });
  }
  if (!sessionStart) return [];
  return ops.filter(op => {
    if (op.closeTimestamp) return op.closeTimestamp * 1000 >= sessionStart;
    const [hh, mm, ss] = (op.time || "0:0:0").split(":").map(Number);
    const d = new Date(); d.setHours(hh ?? 0, mm ?? 0, ss ?? 0, 0);
    return d.getTime() >= sessionStart;
  });
}

// ── Componente principal ─────────────────────────────────────────────
interface Props {
  operations: Operation[];
  moeda: string | null;
  sessionStart?: number | null;
  sessionStarts?: SessionEntry[];
}

export function OperationsHistory({ operations, moeda, sessionStart = null, sessionStarts }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [openSession, setOpenSession] = useState<number | null>(null);

  // For "session" tab: group by sessionStarts if available
  const sessionGroups = useMemo(() => {
    if (tab !== "session" || !sessionStarts?.length) return null;
    return groupBySession(operations, sessionStarts);
  }, [operations, tab, sessionStarts]);

  // For all other tabs (and "session" fallback): flat filtered list
  const filtered = useMemo(() => filterOps(operations, tab, sessionStart), [operations, tab, sessionStart]);

  // Header stats
  const displayOps = sessionGroups ? sessionGroups.flatMap(g => g.ops) : filtered;
  const wins = displayOps.filter(o => o.result === "win").length;
  const wr   = displayOps.length > 0 ? Math.round((wins / displayOps.length) * 100) : 0;

  return (
    <div className="ct-card flex h-full flex-col p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(139_80%_50%/0.28)] via-[hsl(139_80%_40%/0.14)] to-[hsl(139_80%_30%/0.04)] text-[hsl(139_80%_75%)] ring-1 ring-[hsl(139_80%_55%/0.45)] shadow-[inset_0_1px_0_hsl(139_80%_85%/0.20),0_0_14px_-4px_hsl(139_80%_50%/0.8)]">
            <History className="h-[15px] w-[15px]" strokeWidth={2.2} />
            <span aria-hidden className="absolute -right-[2px] -top-[2px] h-1.5 w-1.5 rounded-full bg-[hsl(139_80%_60%)] shadow-[0_0_6px_hsl(139_80%_55%)]" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[8.5px] font-bold uppercase tracking-[0.32em] text-[hsl(139_80%_60%)]">Trades</span>
            <h2 className="mt-1 text-[15px] font-black tracking-tight text-foreground">Histórico</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
          <span>{displayOps.length} ops</span>
          {displayOps.length > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-[hsl(139_80%_65%)]">{wr}% WR</span>
            </>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-border/40 px-3 py-2">
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
          {([["all","All-Time"],["session","Sessão"],["day","Dia"]] as const).map(([k, label]) => {
            const active = tab === k;
            return (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-all",
                  active
                    ? "text-[hsl(220_25%_8%)] shadow-[0_0_14px_-4px_hsl(139_80%_50%/0.7),inset_0_1px_0_rgba(255,255,255,0.2)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
                style={active ? { background: "linear-gradient(135deg, hsl(139 80% 60%), hsl(139 80% 50%))" } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="ops-scroll flex-1 overflow-y-auto">
        {tab === "session" && sessionGroups !== null ? (
          /* ── Session accordion ── */
          sessionGroups.length === 0 ? (
            <EmptyState tab="session" />
          ) : (
            <ul>
              {sessionGroups.map(g => (
                <SessionGroupRow
                  key={g.startTs}
                  group={g}
                  moeda={moeda}
                  open={openSession === g.startTs}
                  onToggle={() => setOpenSession(prev => prev === g.startTs ? null : g.startTs)}
                />
              ))}
            </ul>
          )
        ) : (
          /* ── Flat list (All-Time / Dia / Session fallback) ── */
          filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map(op => <OperationRow key={op.id} op={op} moeda={moeda} />)}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/20 text-muted-foreground">
        <Clock className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">
        {tab === "session"
          ? "Nenhuma sessão registrada. Inicie a IA para começar."
          : tab === "day"
          ? "Sem operações hoje."
          : "Nenhuma operação registrada."}
      </p>
    </div>
  );
}
