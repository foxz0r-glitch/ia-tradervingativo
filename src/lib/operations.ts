import type { Operation } from "@/components/OperationsHistory";

/** Row de public.user_operations (campos usados na hidratação do histórico). */
export interface UserOperationRow {
  id: string;
  symbol: string | null;
  direction: string | null;
  result: string | null;
  pnl: number | string | null;
  invest: number | string | null;
  payout: number | string | null;
  open_ts: number | string | null;
  close_ts: number | string | null;
  expiracao_seg: number | string | null;
  ai_model: string | null;
}

const _PAD = (n: number) => String(n).padStart(2, "0");
const _MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/**
 * Mapeia uma row de public.user_operations -> Operation (tipo da UI),
 * reconstruindo os campos de EXIBIÇÃO (date/timeShort/timeFull/openTimeFull/time)
 * a partir de close_ts/open_ts — MESMA derivação do handler WS "operacao_fechada"
 * em Index.tsx (~:586-605).
 *
 * NÃO recalcula dinheiro: pnl/invest/payout/result vêm prontos do banco (o app só
 * exibe; o payout já foi calculado no momento do INSERT). O id recebe o prefixo
 * "db_" para distinguir das ops ao vivo (`${Date.now()}-…`) e das demo (`demo_…`).
 */
export function mapRowToOperation(row: UserOperationRow): Operation {
  const closeTs = Number(row.close_ts ?? 0);
  const openTs = Number(row.open_ts ?? 0);
  const closeDate = closeTs ? new Date(closeTs * 1000) : new Date();
  const openDate = openTs ? new Date(openTs * 1000) : null;
  const hms = (d: Date) => `${_PAD(d.getHours())}:${_PAD(d.getMinutes())}:${_PAD(d.getSeconds())}`;

  const direction: "call" | "put" = row.direction === "put" ? "put" : "call";
  const result: "win" | "loss" | "draw" =
    row.result === "win" || row.result === "loss" || row.result === "draw" ? row.result : "draw";

  return {
    id: `db_${row.id}`,
    symbol: row.symbol ?? "",
    date: `${_PAD(closeDate.getDate())} ${_MONTHS[closeDate.getMonth()]}`,
    timeShort: `${_PAD(closeDate.getHours())}:${_PAD(closeDate.getMinutes())}`,
    timeFull: hms(closeDate),
    openTimeFull: openDate ? hms(openDate) : "",
    time: openDate ? hms(openDate) : hms(closeDate),
    direction,
    result,
    pnl: Number(row.pnl ?? 0),
    invest: Number(row.invest ?? 0),
    payout: Number(row.payout ?? 0),
    openTimestamp: openTs,
    closeTimestamp: closeTs,
    expiracaoSeg: Number(row.expiracao_seg ?? 0),
    aiModel: row.ai_model ?? undefined,
  };
}
