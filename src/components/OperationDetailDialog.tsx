import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Operation } from "@/components/OperationsHistory";

const MONTHS_PT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

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

function fmtTimeFull(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function fmtCloseMoment(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtExpiracao(secs: number): string {
  if (!secs || secs <= 0) return "—";
  if (secs < 60) return `${secs} segundo${secs !== 1 ? "s" : ""}`;
  const mins = Math.round(secs / 60);
  return `${mins} minuto${mins !== 1 ? "s" : ""}`;
}

function fmtBRL(v: number): string {
  return Math.abs(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  op: Operation | null;
}

export function OperationDetailDialog({ open, onOpenChange, op }: Props) {
  if (!op) return null;

  const isDraw = op.result === "draw";
  const isWin = op.result === "win";
  const [fa, fb] = pairFlags(op.symbol);
  const cleanSymbol = op.symbol.replace(/-OTC$/i, "");

  const pnlColor = isDraw ? "#9ca3af" : isWin ? "#3ddc97" : "#ff4d6d";
  const pnlSign  = isDraw ? ""        : isWin ? "+"       : "-";
  const payout   = op.payout ?? 0;
  const payoutStr = isDraw ? "(0%)" : `(${payout > 0 ? "+" : ""}${payout}%)`;

  const openDisplay  = op.openTimestamp  ? fmtTimeFull(op.openTimestamp)  : (op.openTimeFull || op.timeFull || "—");
  const closeDisplay = op.closeTimestamp ? fmtTimeFull(op.closeTimestamp) : (op.timeFull || "—");
  const momentoFecho = op.closeTimestamp
    ? fmtCloseMoment(op.closeTimestamp)
    : (op.timeFull && op.date) ? `${op.timeFull}, ${op.date}`
    : (op.timeFull || op.date || "—");

  const dirBg = op.direction === "call"
    ? "bg-[hsl(160_84%_25%/0.55)]"
    : "bg-[hsl(0_84%_30%/0.55)]";

  const rows: { label: string; value: string; color?: string; badge?: boolean }[] = [
    {
      label: "Direção",
      value: op.direction === "call" ? "CALL ▲" : "PUT ▼",
      badge: true,
    },
    { label: "Investido",    value: op.invest ? fmtBRL(op.invest) : "—" },
    { label: "Abertura",     value: openDisplay  },
    { label: "Fechamento",   value: closeDisplay },
    { label: "Expiração",    value: fmtExpiracao(op.expiracaoSeg ?? 0) },
    { label: "Data/hora",    value: momentoFecho },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border/60 bg-[#0d0d14] text-foreground">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex -space-x-1.5">
                <img
                  src={`https://flagcdn.com/w40/${fa}.png`}
                  alt={fa}
                  className="h-5 w-5 rounded-full object-cover ring-2 ring-[#0d0d14]"
                />
                <img
                  src={`https://flagcdn.com/w40/${fb}.png`}
                  alt={fb}
                  className="h-5 w-5 rounded-full object-cover ring-2 ring-[#0d0d14]"
                />
              </div>
              <span className="text-base font-bold">{cleanSymbol}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* P&L principal */}
        <div className="border-b border-border/40 py-5 text-center">
          <div
            className="text-3xl font-bold ct-mono tabular-nums"
            style={{ color: pnlColor }}
          >
            {pnlSign}{fmtBRL(op.pnl)}
          </div>
          <div
            className="mt-1 text-sm font-semibold ct-mono"
            style={{ color: pnlColor }}
          >
            {payoutStr}
          </div>
        </div>

        {/* Detalhes */}
        <div className="space-y-3 pt-1">
          {rows.map(({ label, value, color, badge }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              {badge ? (
                <span className={`rounded px-2 py-0.5 text-xs font-bold ct-mono text-foreground ${dirBg}`}>
                  {value}
                </span>
              ) : (
                <span
                  className="text-sm font-semibold ct-mono"
                  style={color ? { color } : undefined}
                >
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
