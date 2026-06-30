import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Operation } from "@/components/OperationsHistory";
import { RADAR_PAIRS } from "@/lib/demoConstants";

type Scenario = "A" | "B" | "C";
type OpResult = "win" | "loss";

// Tipo A: V/V/V | Tipo B: V/P/V | Tipo C: V/V/P
const SCENARIO_RESULTS: Record<Scenario, OpResult[]> = {
  A: ["win", "win", "win"],
  B: ["win", "loss", "win"],
  C: ["win", "win", "loss"],
};

export const DEMO_MAX_SESSIONS = 1;

// ── Geração de valores ────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const WIN_PNL = 445;   // win  pnl = +445 EXATO (decisão do dono)
const LOSS_PNL = -500; // loss pnl = -500 EXATO

/**
 * Gera 6-8 operações da sessão demo (decisão do dono). SIMULAÇÃO local (não opera na corretora).
 * - `pnl` é o valor CANÔNICO: win=+445 / loss=-500 EXATOS. A lista (OperationsHistory) exibe `pnl`
 *   e o acumulado no Index soma `pnl` → cada linha (+R$445/-R$500) bate com o "Resultado acumulado".
 * - 1ª op SEMPRE win; no máximo 2 perdas; resto wins → saldo final SEMPRE positivo
 *   (pior caso 4w+2l = +780; melhor 8w = +3560).
 * - invest/payout = |pnl|/±100 (cosméticos; a lista nunca mostra número ≠ 445/500).
 */
function generateSessionOps(sessionResult: OpResult): Operation[] {
  const nOps = 6 + Math.floor(Math.random() * 3); // 6, 7 ou 8

  // A demo SEMPRE fecha positiva. Com MAX_SESSIONS=1 o sessionResult é sempre "win"; um "loss"
  // hipotético cai em 0 perdas (sessão all-win) — a demo nunca fecha negativa.
  const nLosses = sessionResult === "loss" ? 0 : Math.floor(Math.random() * 3); // 0, 1 ou 2

  // 1ª op SEMPRE win; as perdas só caem entre a 2ª e a última op (índices 1..nOps-1).
  const results: OpResult[] = Array.from({ length: nOps }, () => "win" as OpResult);
  const losablePositions = Array.from({ length: nOps - 1 }, (_, i) => i + 1);
  for (const p of shuffle(losablePositions).slice(0, nLosses)) results[p] = "loss";

  // Constrói objetos Operation com horários sequenciais
  const base = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const MONTHS_PT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const DEMO_EXPIRACAO = 5; // segundos — expiração fixa demo (5s)

  // ‼️ Regra do dono: a IA escolhe UM ativo e opera SÓ nele até o fim da sessão.
  // Sorteia 1 ativo UMA vez (não por-op) → TODAS as ops usam o MESMO symbol.
  const sessionAsset = RADAR_PAIRS[Math.floor(Math.random() * RADAR_PAIRS.length)];

  return results.map((result, i) => {
    const closeDate = new Date(base.getTime() + i * 8000);
    const openDate  = new Date(closeDate.getTime() - DEMO_EXPIRACAO * 1000);
    const closeTs = Math.floor(closeDate.getTime() / 1000);
    const openTs  = Math.floor(openDate.getTime() / 1000);

    const fmtHMS = (d: Date) =>
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const fmtHM  = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const fmtDt  = (d: Date) =>
      `${pad(d.getDate())} ${MONTHS_PT[d.getMonth()]}`;

    // pnl CANÔNICO: +445 (win) / -500 (loss) EXATOS. invest/payout = mesma magnitude (lista só mostra 445/500).
    const pnl = result === "win" ? WIN_PNL : LOSS_PNL;
    const invest = Math.abs(pnl);
    const payout = result === "win" ? 100 : -100;

    return {
      id: `demo_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
      symbol: sessionAsset, // mesmo ativo em toda a sessão (1 ativo por sessão)
      time:          fmtHMS(closeDate),
      date:          fmtDt(closeDate),
      timeShort:     fmtHM(closeDate),
      timeFull:      fmtHMS(closeDate),
      openTimeFull:  fmtHMS(openDate),
      direction:     (Math.random() > 0.5 ? "call" : "put") as "call" | "put",
      result,
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
   * Consome uma sessão e retorna as 6-8 operações individuais que a compõem.
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
