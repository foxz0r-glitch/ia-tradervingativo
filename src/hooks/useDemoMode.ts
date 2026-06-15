import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Operation } from "@/components/OperationsHistory";

type Scenario = "A" | "B" | "C";
type OpResult = "win" | "loss";

// Tipo A: V/V/V | Tipo B: V/P/V | Tipo C: V/V/P
const SCENARIO_RESULTS: Record<Scenario, OpResult[]> = {
  A: ["win", "win", "win"],
  B: ["win", "loss", "win"],
  C: ["win", "win", "loss"],
};

const DEMO_ASSETS = [
  "EUR/USD-OTC",
  "GBP/USD-OTC",
  "AUD/USD-OTC",
  "USD/JPY-OTC",
  "EUR/GBP-OTC",
  "EUR/USD",
  "GBP/USD",
];

export const DEMO_MAX_SESSIONS = 3;

// ── Geração de valores ────────────────────────────────────────────────────────

function randFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function distributeAmong(total: number, count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [parseFloat(total.toFixed(2))];
  const base = total / count;
  const variance = Math.abs(base) * 0.25;
  const vals: number[] = [];
  let rem = total;
  for (let i = 0; i < count - 1; i++) {
    const v = parseFloat((base + (Math.random() * 2 - 1) * variance).toFixed(2));
    vals.push(v);
    rem = parseFloat((rem - v).toFixed(2));
  }
  vals.push(parseFloat(rem.toFixed(2)));
  return vals;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Gera 3-5 operações individuais que, somadas, atingem o resultado da sessão.
 * Sessão vencedora: total entre R$594,22 e R$783,42
 * Sessão perdedora: total entre -R$372,92 e -R$237,27
 */
function generateSessionOps(sessionResult: OpResult): Operation[] {
  const nOps = 3 + Math.floor(Math.random() * 3); // 3, 4 ou 5

  const sessionTotal =
    sessionResult === "win"
      ? randFloat(594.22, 783.42)
      : -randFloat(237.27, 372.92);

  let entries: { result: OpResult; pnl: number }[];

  if (sessionResult === "win") {
    // 0 ou 1 perda dependendo de quantas ops
    const nLosses = nOps === 3 ? (Math.random() > 0.55 ? 1 : 0) : 1;
    const nWins = nOps - nLosses;
    const losses = Array.from({ length: nLosses }, () => -randFloat(50, 135));
    const lossSum = losses.reduce((s, v) => s + v, 0);
    const winsTotal = parseFloat((sessionTotal - lossSum).toFixed(2));
    const wins = distributeAmong(winsTotal, nWins);
    entries = shuffle([
      ...wins.map((pnl) => ({ result: "win" as OpResult, pnl })),
      ...losses.map((pnl) => ({ result: "loss" as OpResult, pnl })),
    ]);
  } else {
    // 0 ou 1 ganho dependendo de quantas ops
    const nWins = nOps === 3 ? (Math.random() > 0.55 ? 1 : 0) : 1;
    const nLosses = nOps - nWins;
    const wins = Array.from({ length: nWins }, () => randFloat(45, 115));
    const winSum = wins.reduce((s, v) => s + v, 0);
    const lossesTotal = parseFloat((sessionTotal - winSum).toFixed(2));
    const losses = distributeAmong(lossesTotal, nLosses);
    entries = shuffle([
      ...wins.map((pnl) => ({ result: "win" as OpResult, pnl })),
      ...losses.map((pnl) => ({ result: "loss" as OpResult, pnl })),
    ]);
  }

  // Constrói objetos Operation com horários sequenciais
  const base = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const MONTHS_PT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const DEMO_EXPIRACAO = 5; // segundos — expiração fixa demo (5s)

  return entries.map((e, i) => {
    const closeDate = new Date(base.getTime() + i * 8000);
    const openDate  = new Date(closeDate.getTime() - DEMO_EXPIRACAO * 1000);
    const closeTs = Math.floor(closeDate.getTime() / 1000);
    const openTs  = Math.floor(openDate.getTime() / 1000);

    const fmtHMS = (d: Date) =>
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const fmtHM  = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const fmtDt  = (d: Date) =>
      `${pad(d.getDate())} ${MONTHS_PT[d.getMonth()]}`;

    const pnl = parseFloat(e.pnl.toFixed(2));
    // Calcula invest e payout de forma realista para blitz:
    // WIN: payout 85-93%; invest = pnl / payoutRate
    // LOSS: invest = |pnl|; payout = -100
    let invest: number;
    let payout: number;
    if (e.result === "win") {
      invest = parseFloat((Math.abs(pnl) / 0.92).toFixed(2));
      payout = 92;
    } else {
      invest = parseFloat(Math.abs(pnl).toFixed(2));
      payout = -100;
    }

    return {
      id: `demo_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
      symbol: DEMO_ASSETS[Math.floor(Math.random() * DEMO_ASSETS.length)],
      time:          fmtHMS(closeDate),
      date:          fmtDt(closeDate),
      timeShort:     fmtHM(closeDate),
      timeFull:      fmtHMS(closeDate),
      openTimeFull:  fmtHMS(openDate),
      direction:     (Math.random() > 0.5 ? "call" : "put") as "call" | "put",
      result:        e.result,
      pnl,
      invest,
      payout,
      openTimestamp:  openTs,
      closeTimestamp: closeTs,
      expiracaoSeg:   DEMO_EXPIRACAO,
    };
  });
}

// ── Cache local (otimista) ────────────────────────────────────────────────────
// Fallback quando o DB não está acessível.
// localStorage é compartilhado entre abas do mesmo browser —
// não substitui o DB para multi-device, mas evita re-exibição na mesma sessão.

interface LocalCache {
  sessionsUsed: number;
  scenario: Scenario | null;
}

function cacheKey(userId: string) {
  return `virtuspro_demo_cache_${userId}`;
}
function readCache(userId: string): LocalCache {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return { sessionsUsed: 0, scenario: null };
    return JSON.parse(raw) as LocalCache;
  } catch {
    return { sessionsUsed: 0, scenario: null };
  }
}
function writeCache(userId: string, data: LocalCache) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(data));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface DemoState {
  sessionsUsed: number;
  scenario: Scenario | null;
}

export function useDemoMode(userId: string) {
  const [hasDeposit, setHasDeposit] = useState(false);
  const [demoState, setDemoState] = useState<DemoState>({ sessionsUsed: 0, scenario: null });
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!userId || userId === "anonimo") {
      setLoading(false);
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      // ── 1. Verificar depósito ─────────────────────────────────────────────
      let deposited = false;
      const { data: dep } = await (supabase.rpc as any)("user_has_deposit");
      deposited = dep === true;
      setHasDeposit(deposited);

      // ── 2. Buscar estado demo no banco ────────────────────────────────────
      // IMPORTANTE: só sobrescreve o cache/estado se o DB responder com sucesso.
      // Se a tabela não existir ou houver erro, usa localStorage sem modificá-lo.
      const { data: dbDemo, error: dbError } = await (supabase.from as any)(
        "user_demo_state"
      )
        .select("sessions_used, scenario")
        .eq("user_id", userId)
        .maybeSingle();

      if (!dbError) {
        if (dbDemo) {
          // DB tem linha — é a fonte de verdade
          const fromDb: DemoState = {
            sessionsUsed: dbDemo.sessions_used ?? 0,
            scenario: dbDemo.scenario ?? null,
          };
          writeCache(userId, { sessionsUsed: fromDb.sessionsUsed, scenario: fromDb.scenario });
          setDemoState(fromDb);
        } else {
          // DB acessível mas sem linha ainda (usuário novo) — usa cache local
          // (pode ter valor se a gravação assíncrona anterior ainda não chegou)
          setDemoState(readCache(userId));
        }
      } else {
        // DB inacessível ou tabela inexistente — usa cache local sem sobrescrever
        setDemoState(readCache(userId));
      }
    } catch {
      // Qualquer exceção inesperada — usa cache local como fallback
      setDemoState(readCache(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Re-verifica ao voltar para a aba (para detectar postback de depósito)
  useEffect(() => {
    const onFocus = () => {
      if (!hasDeposit && userId && userId !== "anonimo") checkStatus();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hasDeposit, userId, checkStatus]);

  const sessionsLeft = Math.max(0, DEMO_MAX_SESSIONS - demoState.sessionsUsed);
  const isDemoEligible = !loading && !hasDeposit;
  const isExhausted = isDemoEligible && demoState.sessionsUsed >= DEMO_MAX_SESSIONS;

  /**
   * Consome uma sessão e retorna as 3–5 operações individuais que a compõem.
   * Retorna null se as sessões estiverem esgotadas.
   */
  const runNextOp = useCallback(async (): Promise<Operation[] | null> => {
    if (demoState.sessionsUsed >= DEMO_MAX_SESSIONS) return null;

    const scenario: Scenario =
      demoState.scenario ??
      (["A", "B", "C"] as Scenario[])[Math.floor(Math.random() * 3)];

    const sessionResult = SCENARIO_RESULTS[scenario][demoState.sessionsUsed];
    const ops = generateSessionOps(sessionResult);

    const next: DemoState = {
      sessionsUsed: demoState.sessionsUsed + 1,
      scenario,
    };

    // Atualiza estado local imediatamente (otimista)
    setDemoState(next);
    writeCache(userId, { sessionsUsed: next.sessionsUsed, scenario: next.scenario });

    // Persiste no banco (fire-and-forget)
    (supabase.from as any)("user_demo_state")
      .upsert(
        {
          user_id: userId,
          sessions_used: next.sessionsUsed,
          scenario: next.scenario,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .then(({ error }: any) => {
        if (error) console.warn("[useDemoMode] falha ao salvar no banco:", error.message);
      });

    return ops;
  }, [userId, demoState]);

  return {
    loading,
    hasDeposit,
    sessionsLeft,
    sessionsUsed: demoState.sessionsUsed,
    isDemoEligible,
    isExhausted,
    runNextOp,
    refresh: checkStatus,
  };
}
