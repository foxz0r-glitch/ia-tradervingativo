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
  session_id: number | string | null;
}

const _PAD = (n: number) => String(n).padStart(2, "0");
const _MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/**
 * Mapeia uma row de public.user_operations -> Operation (tipo da UI),
 * reconstruindo os campos de EXIBIÇÃO (date/timeShort/timeFull/openTimeFull/time)
 * a partir de close_ts/open_ts — MESMA derivação do handler WS "operacao_fechada"
 * em Index.tsx (~:634-653).
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

/**
 * Chave de CONTEÚDO estável p/ casar uma Operation local com uma row do banco.
 * O `id` NÃO serve (esquemas distintos: live `${Date.now()}-…`, banco `db_…`, demo `demo_…`).
 * Campos em SEGUNDOS (open_ts/close_ts). `close_ts=0`/`open_ts=0` (closeTime ausente, caso raro)
 * enfraquece a chave — risco residual aceito (não bloqueia).
 */
export function operationContentKey(o: {
  closeTimestamp: number;
  openTimestamp: number;
  symbol: string;
  direction: string;
  invest: number;
}): string {
  return `${o.closeTimestamp}|${o.openTimestamp}|${o.symbol}|${o.direction}|${o.invest}`;
}

/**
 * Reconstrói os marcadores de sessão (p/ a aba "Sessão" cross-device) a partir das rows do banco.
 * `session_id` é gravado como `Date.now()` = MILISSEGUNDOS — MESMA unidade de `sessionStarts.ts` →
 * usado DIRETO, sem conversão. Agrupa por `session_id` não-nulo/não-zero; `ai` = 1º `ai_model`
 * não-nulo daquela sessão (se todos nulos, "claude"); dedup por `ts` (ordem de 1ª aparição).
 */
export function reconstructSessionStarts(rows: UserOperationRow[]): { ts: number; ai: string }[] {
  const aiByTs = new Map<number, string | null>(); // ts(ms) -> 1º ai_model não-nulo (null = nenhum ainda)
  for (const row of rows) {
    const ts = Number(row.session_id ?? 0);
    if (!ts) continue; // ignora session_id null/0/NaN
    if (!aiByTs.has(ts)) aiByTs.set(ts, null);
    if (aiByTs.get(ts) == null && row.ai_model) aiByTs.set(ts, row.ai_model);
  }
  return Array.from(aiByTs.keys()).map((ts) => ({ ts, ai: aiByTs.get(ts) ?? "claude" }));
}
