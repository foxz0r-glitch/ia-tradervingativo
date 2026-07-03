// IA Vingativa — Dark trading dashboard wired to live WebSocket robot.
// Connects to wss://kilobyte-romp-veto.ngrok-free.app via useRoboBot hook.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Sparkles,
  Plus,
  ArrowUpRight,
  Key,
  UsersRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoboBot, type Vela } from "@/hooks/useRoboBot";
import { useIsMobile } from "@/hooks/use-mobile";
import LiveChart from "@/components/LiveChart";
import { AssetCombobox, DEFAULT_ASSETS } from "@/components/AssetCombobox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OperationsHistory, type Operation, type SessionEntry } from "@/components/OperationsHistory";
import { DemoFlowOverlay } from "@/components/DemoFlowOverlay";
import { CockpitVariants } from "@/components/CockpitVariants";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { IAStatusBanner } from "@/components/IAStatusBanner";
import { OperationSummaryDialog, type SummaryReason } from "@/components/OperationSummaryDialog";

import { loadActiveStrategy } from "@/components/StrategyBuilder";
import claudeIcon from "@/assets/ai/claude_icon.webp";
import gptIcon from "@/assets/ai/chatgpt_icon.webp";
import geminiIcon from "@/assets/ai/gemini_icon.webp";
import grokIcon from "@/assets/ai/grok_icon.webp";
import { supabase } from "@/integrations/supabase/client";
import { formatMoeda, simboloMoeda } from "@/lib/moeda";
import { cockpitLimits, clampRange } from "@/lib/cockpitLimits";
import { mapRowToOperation, operationContentKey, reconstructSessionStarts, deriveOperationDisplay } from "@/lib/operations";
import { DepositButton } from "@/components/DepositButton";
import { toast } from "sonner";
import { RankUpToast } from "@/components/RankUpToast";
import { useUserXP, handleDailyLogin } from "@/hooks/useGamification";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoModeModal } from "@/components/DemoModeModal";

const RANK_IMAGES: Record<string, string> = {
  "Prata I": "/ranks/rank-prata-1.svg",
  "Prata II": "/ranks/rank-prata-2.svg",
  "Prata III": "/ranks/rank-prata-3.svg",
  "Ouro I": "/ranks/rank-ouro-1.svg",
  "Ouro II": "/ranks/rank-ouro-2.svg",
  "Ouro III": "/ranks/rank-ouro-3.svg",
  "AK I": "/ranks/rank-ak-1.svg",
  "AK II": "/ranks/rank-ak-2.svg",
  "AK Cruzada": "/ranks/rank-ak-cruzada.svg",
  "Xerife": "/ranks/rank-xerife.svg",
  "Águia I": "/ranks/rank-aguia-1.svg",
  "Águia II": "/ranks/rank-aguia-2.svg",
  "Supremo": "/ranks/rank-supremo.svg",
  "Global": "/ranks/rank-global.svg",
};

import { getCredsCache, setCredsCache } from "@/lib/credsCache";

// ── Cockpit prefs: localStorage per user ─────────────────────────────────────
interface CockpitPrefs { valorEntrada: number; meta: number; stopLoss: number; }

function loadCockpitPrefs(uid: string): CockpitPrefs | null {
  try {
    const raw = localStorage.getItem(`virtuspro_cockpit_${uid}`);
    if (!raw) return null;
    const p = JSON.parse(raw) as CockpitPrefs;
    if (typeof p.valorEntrada === "number" && typeof p.meta === "number" && typeof p.stopLoss === "number") return p;
  } catch {}
  return null;
}

// Rounds to nearest integer for values < 50, nearest 5 for values >= 50.
// Keeps result within [min, max].
function smartCockpitDefault(pct: number, saldo: number, min: number, max: number): number {
  const raw = saldo * pct;
  const v = raw >= 50 ? Math.round(raw / 5) * 5 : Math.round(raw);
  return Math.max(min, Math.min(max, v));
}

// Split "R$ 55.175,76" → { main:"R$ 55.175", cents:",76" } p/ colorir os centavos (#86b59a) como no handoff.
// Display-only: NÃO altera o valor (formatMoeda é a fonte); fallback = string inteira em `main`.
function splitMoedaCentavos(s: string): { main: string; cents: string } {
  const m = s.match(/^(.*?)([.,]\d{2})$/);
  return m ? { main: m[1], cents: m[2] } : { main: s, cents: "" };
}

const Index = () => {
  // ---- Live state from WebSocket ----
  const [connected, setConnected] = useState(false);
  const [rodando, setRodando] = useState(false);
  const onConnectProcessandoRef = useRef(false);
  const [firstName, setFirstName] = useState("Trader");
  const [userId, setUserId] = useState<string>("anonimo");
  const isMobile = useIsMobile();

  // Neutraliza estratégia legada do StrategyBuilder (componente desmontado): sem isso,
  // um valor antigo em "virtuspro_estrategia_ativa" seria lido por loadActiveStrategy()
  // e enviado ao robô. Limpa na montagem => loadActiveStrategy() retorna null.
  useEffect(() => {
    try {
      localStorage.removeItem("virtuspro_estrategia_ativa");
    } catch { /* ignora: chave pode não existir */ }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const name = user?.user_metadata?.first_name;
      if (name) setFirstName(name);
      if (user?.id) setUserId(user.id);
    });
  }, []);

  // Safety net: reset the per-instance flag on unmount so stale async callbacks
  // from a previous mount cannot block a fresh connection.
  useEffect(() => {
    return () => {
      onConnectProcessandoRef.current = false;
    };
  }, []);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [moedaConta, setMoedaConta] = useState<string | null>(null);
  const [ganhos, setGanhos] = useState(0);
  const [perdas, setPerdas] = useState(0);
  const velasRef = useRef<Vela[]>([]); // candles capturados em ref — nunca lidos no render (gráfico = LiveChart/wsRef) → sem re-render por tick

  // ---- Demo mode ----
  const {
    isDemoEligible,
    isExhausted: isDemoExhausted,
    sessionsLeft,
    runNextOp: runNextDemoOp,
    hasDeposit,
  } = useDemoMode(userId);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoModalMode, setDemoModalMode] = useState<"available" | "exhausted">("available");
  // Trigger oculto p/ abrir o depósito ao fim da demo (reusa o DepositButton; mesmo padrão do UserMenu)
  const demoDepositRef = useRef<HTMLDivElement>(null);

  // ---- Fluxo DEMO (4 telas) — FASE + lista/agregados PRÓPRIOS (isolados do cockpit) + cancelamento ----
  const [demoPhase, setDemoPhase] = useState<"idle" | "procurando" | "operando" | "pausado" | "resultado">("idle");
  const [demoOps, setDemoOps] = useState<Operation[]>([]);
  const [demoSessionPnl, setDemoSessionPnl] = useState(0);
  const [demoWins, setDemoWins] = useState(0);
  const [demoLosses, setDemoLosses] = useState(0);
  const [demoEndedManually, setDemoEndedManually] = useState(false);
  const [demoPaused, setDemoPaused] = useState(false); // Fatia 4: pausa PRÓPRIA da demo (≠ paused real de :255)
  const demoCancelRef = useRef(false); // PARAR/FECHAR setam true → o loop aborta sem mais setState
  const demoTimersRef = useRef<Array<{ id: ReturnType<typeof setTimeout>; resolve: (done: boolean) => void }>>([]);
  const demoOperatingRef = useRef(false); // true só quando JÁ passou do radar e tem ops válidas (está operando) → decide idle-vs-resultado no PARAR
  const demoPausedRef = useRef(false); // Fatia 4: espelho síncrono de demoPaused (o loop lê o ref, não o state do closure)
  const demoResumeRef = useRef<((done: boolean) => void) | null>(null); // Fatia 4: resolve do gate de pausa (RETOMAR→true, PARAR/FECHAR→false)

  // ---- Ativação de plano ----
  const [hasActivePlan, setHasActivePlan] = useState<boolean | null>(null);
  const [activationOpen, setActivationOpen] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);

  // ---- View local (aba Cockpit | Histórico) — só troca o miolo, sem tocar lógica ----
  const [view, setView] = useState<"cockpit" | "historico">("cockpit");

  // ---- Gamificação ----
  const { data: userXP, refresh: refreshUserXP } = useUserXP();
  const userXPRef = useRef(userXP);
  useEffect(() => { userXPRef.current = userXP; }, [userXP]);

  // Login diário: deve rodar ao abrir o dashboard, não ao iniciar automação
  useEffect(() => {
    handleDailyLogin().catch((e) =>
      console.error('[mount] handleDailyLogin erro:', e)
    );
  }, []);

  useEffect(() => {
    if (userId === "anonimo") return;
    supabase.from("user_access").select("plan").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        const hasPlan = !!data?.plan;
        setHasActivePlan(hasPlan);
        if (!hasPlan) setActivationOpen(true);
      });
  }, [userId]);

  // Event bus: o header do layout (App.tsx) dispara "tv:open-activation" → abre o modal de ativação aqui.
  useEffect(() => {
    const open = () => setActivationOpen(true);
    window.addEventListener("tv:open-activation", open);
    return () => window.removeEventListener("tv:open-activation", open);
  }, []);

  const handleClaimCode = async () => {
    if (!activationCode.trim()) return;
    setActivationLoading(true);
    const { data, error } = await (supabase.rpc as any)("claim_activation_code", {
      p_code: activationCode.trim(),
      p_user_id: userId,
    });
    setActivationLoading(false);
    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || "Código inválido ou já utilizado");
      return;
    }
    toast.success("Plano ativado com sucesso! Bem-vindo!");
    setHasActivePlan(true);
    setActivationOpen(false);
    setActivationCode("");
  };

  const [rankUpData, setRankUpData] = useState<{ rank: string; image: string } | null>(null);

  // ---- Form (config) ----
  const [valorEntrada, setValorEntrada] = useState(2);
  const [expiracao, setExpiracao] = useState(5);
  const [minVal, setMinVal] = useState(2);
  const [maxLoss, setMaxLoss] = useState(2);
  const [meta, setMeta] = useState(2);
  const [stopLoss, setStopLoss] = useState(2);
  const [cockpitReady, setCockpitReady] = useState(false);

  // Apply saved prefs or % defaults once userId + saldo are both available
  useEffect(() => {
    if (cockpitReady || userId === "anonimo" || saldo === null) return;
    const floor = Math.max(2, Math.floor(saldo));
    const maxMeta = Math.max(10, floor * 5);
    const saved = loadCockpitPrefs(userId);
    if (saved) {
      setValorEntrada(Math.max(2, Math.min(floor, saved.valorEntrada)));
      setMeta(Math.max(2, Math.min(maxMeta, saved.meta)));
      setStopLoss(Math.max(2, Math.min(floor, saved.stopLoss)));
    } else {
      setValorEntrada(smartCockpitDefault(0.08, saldo, 2, floor));
      setMeta(smartCockpitDefault(0.20, saldo, 2, maxMeta));
      setStopLoss(smartCockpitDefault(0.40, saldo, 2, floor));
    }
    setCockpitReady(true);
  }, [userId, saldo, cockpitReady]);

  // Persist on every change (after init)
  useEffect(() => {
    if (!cockpitReady || userId === "anonimo") return;
    try {
      localStorage.setItem(`virtuspro_cockpit_${userId}`, JSON.stringify({ valorEntrada, meta, stopLoss }));
    } catch {}
  }, [valorEntrada, meta, stopLoss, userId, cockpitReady]);
  const [paused, setPaused] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryReason, setSummaryReason] = useState<SummaryReason>("manual");
  const [ativo, setAtivo] = useState<string>(() => {
    if (typeof window === "undefined") return "76";
    return localStorage.getItem("virtuspro_ativo") ?? "76";
  });

  const handleAtivoChange = (novoAtivo: string) => {
    setAtivo(novoAtivo);
    setStats(null);
    setSentiment(null);
    localStorage.setItem("virtuspro_ativo", novoAtivo);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ tipo: "trocar_ativo", ativoId: Number(novoAtivo) }));
      } catch {}
    }
  };

  const [stats, setStats] = useState<any>(null);
  const [sentiment, setSentiment] = useState<boolean | null>(null);
  const [aiModel, setAiModel] = useState<"claude" | "gpt5" | "gemini" | "grok3">(() => {
    if (typeof window === "undefined") return "claude";
    return (localStorage.getItem("virtuspro_ia_modelo") as any) ?? "claude";
  });
  const [aiModelLoading, setAiModelLoading] = useState(false);
  const aiModelLoadingTimeoutRef = useRef<number | null>(null);
  const aiModelRef = useRef(aiModel);
  useEffect(() => { aiModelRef.current = aiModel; }, [aiModel]);
  useEffect(() => { localStorage.setItem("virtuspro_ia_modelo", aiModel); }, [aiModel]);

  const handleAiModelChange = (nextModel: typeof aiModel) => {
    if (nextModel === aiModel || aiModelLoading) return;

    setAiModelLoading(true);
    if (aiModelLoadingTimeoutRef.current) {
      window.clearTimeout(aiModelLoadingTimeoutRef.current);
    }
    aiModelLoadingTimeoutRef.current = window.setTimeout(() => {
      setAiModel(nextModel);
      setAiModelLoading(false);
      aiModelLoadingTimeoutRef.current = null;
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (aiModelLoadingTimeoutRef.current) {
        window.clearTimeout(aiModelLoadingTimeoutRef.current);
      }
    };
  }, []);
  const saveUserIdRef = useRef(userId);
  const [operations, setOperations] = useState<Operation[]>([]);

  useEffect(() => {
    saveUserIdRef.current = userId;
    if (userId === "anonimo") {
      try {
        const salvo = localStorage.getItem("virtuspro_ops_v4_anonimo");
        setOperations(salvo ? JSON.parse(salvo) : []);
      } catch { setOperations([]); }
      return;
    }
    try { localStorage.removeItem("virtuspro_ops_v4_anonimo"); } catch {}
    try {
      const salvo = localStorage.getItem(`virtuspro_ops_v4_${userId}`);
      setOperations(salvo ? JSON.parse(salvo) : []);
    } catch { setOperations([]); }

    // Hidratação cross-device: DEPOIS do localStorage (mantém a UX instantânea), busca as
    // ops REAIS no banco (verdade cross-device). Sucesso → substitui as reais locais pelas
    // do banco e preserva as demo locais. Falha (offline/erro) → mantém o que já carregou.
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_operations")
          .select("*")
          .eq("user_id", userId)
          .order("close_ts", { ascending: false })
          .limit(50);
        if (cancelled) return;
        if (error || !data) {
          console.warn("[ops] hidratação do banco falhou:", error?.message);
          return;
        }
        const dbOps = data.map((r) => mapRowToOperation(r));
        // Merge por CHAVE DE CONTEÚDO (o id não casa entre esquemas live/db/demo): reais do banco
        // substituem as reais locais já gravadas; reais locais AUSENTES no banco (race da janela /
        // gravação falha NO PRÓPRIO aparelho) são PRESERVADAS; demo (local-only) sempre preservada.
        // close_ts=0/open_ts=0 enfraquece a chave (caso raro) — risco residual aceito.
        const dbKeys = new Set(dbOps.map(operationContentKey));
        setOperations((prev) => {
          const preservados = prev.filter((op) => {
            if (op.id.startsWith("demo_")) return true;        // demo sempre
            return !dbKeys.has(operationContentKey(op));        // real: só se NÃO está no banco
          });
          return [...dbOps, ...preservados].sort((a, b) => b.closeTimestamp - a.closeTimestamp);
        });
        // Aba "Sessão" cross-device: reconstrói os marcadores a partir do session_id (ms) das rows.
        const sessoesBanco = reconstructSessionStarts(data);
        setSessionStarts((prev) => {
          const byTs = new Map<number, SessionEntry>();
          for (const s of [...sessoesBanco, ...prev]) {
            if (!byTs.has(s.ts)) byTs.set(s.ts, s);             // dedup por ts; banco (1º) tem prioridade
          }
          return Array.from(byTs.values());
        });
      } catch (e) {
        if (!cancelled) console.warn("[ops] hidratação do banco erro:", e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const key = saveUserIdRef.current === "anonimo"
        ? "virtuspro_ops_v4_anonimo"
        : `virtuspro_ops_v4_${saveUserIdRef.current}`;
      localStorage.setItem(key, JSON.stringify(operations.slice(0, 20)));
    } catch {}
  }, [operations]);

  // When deposit detected, clear demo operations
  useEffect(() => {
    if (hasDeposit) {
      setOperations((prev) => prev.filter((op) => !op.id.startsWith("demo_")));
    }
  }, [hasDeposit]);

  const openOpRef = useRef<{ symbol: string; time: string; direction: "call" | "put"; openTimestamp?: number; invest?: number } | null>(null);
  const [sessionPnl, setSessionPnl] = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  useEffect(() => { sessionStartRef.current = sessionStart; }, [sessionStart]);
  const [sessionStarts, setSessionStarts] = useState<SessionEntry[]>([]);

  // Load session history from localStorage when userId is known (migrates old number[] format)
  useEffect(() => {
    if (userId === "anonimo") return;
    try {
      const raw = localStorage.getItem(`virtuspro_sessions_${userId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      if (typeof parsed[0] === "number") {
        setSessionStarts((parsed as number[]).map(ts => ({ ts, ai: "claude" })));
      } else {
        setSessionStarts(parsed as SessionEntry[]);
      }
    } catch {}
  }, [userId]);

  // Persist session history
  useEffect(() => {
    if (userId === "anonimo") return;
    try {
      localStorage.setItem(`virtuspro_sessions_${userId}`, JSON.stringify(sessionStarts.slice(-30)));
    } catch {}
  }, [sessionStarts, userId]);

  // ---- Refs ----
  const balanceFetchedRef = useRef(false);
  const dashboardEnviadoRef = useRef(false);
  const startingRef = useRef(false);
  

  // Fetch balance once using current user's stored credentials
  const fetchBalance = useCallback(
    async (
      buscar: (c: { email: string; password: string; ssid?: string }) => void,
    ) => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: creds } = await supabase
        .from("user_credentials")
        .select("casatrade_email, casatrade_password, casatrade_ssid")
        .eq("id", user.id)
        .single();
      if (creds) {
        buscar({
          email: creds.casatrade_email,
          password: creds.casatrade_password,
          ssid: creds.casatrade_ssid ?? undefined,
        });
      }
    },
    [],
  );

  // ---- Hook wiring ----
  const { iniciar, parar, buscarSaldo, entrarDashboard, wsRef } = useRoboBot({
    onConnect: async () => {
      const agora = Date.now();
      console.log(`[onConnect] chamado em ${agora}, processando=${onConnectProcessandoRef.current}`);
      if (onConnectProcessandoRef.current) {
        console.log('[onConnect] já processando — ignorando');
        return;
      }
      onConnectProcessandoRef.current = true;
      console.log('[onConnect] WebSocket conectado');
      setConnected(true);

      const dispatchEntrar = (
        credsObj: { email: string; password: string; ssid?: string },
        token?: string,
      ) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.log('[onConnect] WS fechado antes de entrarDashboard');
          onConnectProcessandoRef.current = false;
          return;
        }
        entrarDashboard(
          credsObj,
          {
            percentualBanca: 0.02,
            valorMinimo: 2,
            maxPerdasSeguidas: 2,
            ativoId: Number(localStorage.getItem("virtuspro_ativo") ?? "76"),
          },
          token,
        );
        console.log('[onConnect] entrarDashboard enviado');
        const previousRank = userXPRef.current?.currentRank.name;
        setTimeout(async () => {
          await refreshUserXP();
          const current = userXPRef.current;
          if (current && previousRank && current.currentRank.name !== previousRank) {
            setRankUpData({
              rank: current.currentRank.name,
              image: RANK_IMAGES[current.currentRank.name] ?? "/ranks/rank-prata-1.svg",
            });
          }
        }, 2000);
      };

      // Fast path: cached credentials — skip all Supabase async calls.
      // This prevents the ~10s server timeout that occurs when getUser()/getSession()
      // hang on reconnects and entrarDashboard is never sent.
      const cached = getCredsCache();
      if (cached) {
        console.log('[onConnect] usando credenciais em cache — entrarDashboard imediato');
        dispatchEntrar(cached);
        return;
      }

      // Slow path: first connection — fetch credentials from Supabase.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          console.log('[onConnect] usuário não autenticado');
          onConnectProcessandoRef.current = false;
          balanceFetchedRef.current = false;
          return;
        }
        const token = session?.access_token;
        console.log('[onConnect] token obtido:', !!token);
        const { data: creds } = await supabase
          .from("user_credentials")
          .select("casatrade_email, casatrade_password, casatrade_ssid")
          .eq("id", user.id)
          .single();
        console.log('[onConnect] credenciais:', !!creds);
        if (creds) {
          const credsObj = {
            email: creds.casatrade_email,
            password: creds.casatrade_password,
            ssid: creds.casatrade_ssid ?? undefined,
          };
          setCredsCache(credsObj);
          dispatchEntrar(credsObj, token);
        }
      } catch (e) {
        console.error('[onConnect] erro nas chamadas Supabase:', e);
        onConnectProcessandoRef.current = false;
      }
    },
    onDisconnect: () => {
      console.log(`[onDisconnect] chamado em ${Date.now()}, resetando onConnectProcessando`);
      onConnectProcessandoRef.current = false;
      setConnected(false);
      balanceFetchedRef.current = false;
    },
    onLog: () => {
      // Logs are intentionally not displayed in the UI anymore.
    },
    onStatus: (r) => {
      setRodando((prev) => {
        // When robot transitions from running -> stopped, fetch final balance once
        if (prev && !r && balanceFetchedRef.current) {
          fetchBalance(buscarSaldo);
        }
        return r;
      });
    },
    onSaldo: (v, m) => { setSaldo(v); if (m) setMoedaConta(m); },
    onPlacar: (g, p) => {
      setGanhos(g);
      setPerdas(p);
    },
    onVelas: (v) => {
      velasRef.current = v;
    },
    onEstatisticas: (s) => {
      setStats(s);
      if (typeof s?.bullish === "boolean") setSentiment(s.bullish);
    },
  });

  // Polling de segurança: garante que `connected` reflita o readyState real do WS
  useEffect(() => {
    const interval = setInterval(() => {
      const isOpen = wsRef.current?.readyState === WebSocket.OPEN;
      setConnected((prev) => (prev !== isOpen ? isOpen : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [wsRef]);

  useEffect(() => {
    const handleVisibility = async () => {
      const state = document.visibilityState
      const wsState = wsRef.current?.readyState
      console.log(`[visibility] state=${state} wsReadyState=${wsState}`)

      if (state !== 'visible') return

      console.log('[visibility] aba voltou ao foco')
      console.log('[visibility] WS state:', wsState, '(1=OPEN, 0=CONNECTING, 2=CLOSING, 3=CLOSED)')

      // Não envia entrar_dashboard aqui — o onConnect cuida disso automaticamente
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [wsRef])

  // ---- Listener for operation lifecycle messages ----
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const symbolFromId = (id: string | number) => {
      const found = DEFAULT_ASSETS.find((a) => String(a.id) === String(id));
      return found?.symbol ?? `Ativo ${id}`;
    };

    const fmtTime = (d = new Date()) =>
      d.toLocaleTimeString("pt-BR", { hour12: false });

    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.tipo === "operacao_aberta_local") {
          const dirRaw = data.direction ?? data.direcao;
          const direction: "call" | "put" = dirRaw === "put" ? "put" : "call";
          openOpRef.current = {
            symbol: symbolFromId(data.ativoId ?? data.ativo ?? ativo),
            time: fmtTime(),
            direction,
            openTimestamp: data.openTime ?? Math.floor(Date.now() / 1000),
            invest: data.invest,
          };
        }
        if (data.tipo === "operacao_fechada") {
          const open = openOpRef.current;
          const symbol =
            data.symbol ??
            (data.ativoId ? symbolFromId(data.ativoId) : open?.symbol ?? symbolFromId(ativo));
          const time = open?.time ?? fmtTime();
          const pnlRaw = data.pnl ?? data.valor ?? data.lucro;
          const pnl = Number(pnlRaw ?? 0);
          const isDraw =
            pnlRaw === null ||
            pnlRaw === undefined ||
            data.win === null ||
            data.resultado === "draw" ||
            data.resultado === "empate" ||
            (Number.isFinite(pnl) && pnl === 0);
          const isWin =
            !isDraw &&
            (data.resultado === "win" ||
              data.win === true ||
              data.result === "win" ||
              (Number.isFinite(pnl) && pnl > 0));
          const closeDirRaw = data.direcao ?? data.direction;
          const direction: "call" | "put" =
            open?.direction ??
            (closeDirRaw === "put" ? "put" : closeDirRaw === "call" ? "call" : "call");


          const closeTs: number = data.closeTime ?? 0;
          const openTs: number = data.openTime ?? open?.openTimestamp ?? 0;
          const investAmt: number = data.invest ?? open?.invest ?? 0;
          const payoutCalc = isDraw ? 0 : isWin && investAmt > 0 ? Math.round((pnl / investAmt) * 100) : -100;

          const newOp: Operation = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            symbol,
            ...deriveOperationDisplay(closeTs, openTs, { time, openTimeFallback: open?.time ?? "" }),
            direction,
            result: isDraw ? "draw" : isWin ? "win" : "loss",
            pnl: isDraw ? 0 : pnl,
            invest: investAmt,
            payout: payoutCalc,
            openTimestamp: openTs,
            closeTimestamp: closeTs,
            expiracaoSeg: expiracao,
            aiModel: aiModelRef.current,
          };

          setOperations((prev) => [newOp, ...prev].slice(0, 50));
          setSessionPnl((prev) => prev + (isDraw ? 0 : pnl));
          openOpRef.current = null;

          // Persist to database (fire-and-forget)
          const uid = saveUserIdRef.current;
          if (uid && uid !== "anonimo") {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (!session) return;
              (supabase.from as any)("user_operations").insert({
                user_id: uid,
                symbol: newOp.symbol,
                direction: newOp.direction,
                result: newOp.result,
                pnl: newOp.pnl,
                invest: newOp.invest,
                payout: newOp.payout,
                open_ts: newOp.openTimestamp,
                close_ts: newOp.closeTimestamp,
                expiracao_seg: newOp.expiracaoSeg,
                ai_model: newOp.aiModel,
                session_id: sessionStartRef.current,
              }).then(({ error }: any) => {
                if (error) {
                  console.warn("[op] falha ao salvar no banco:", error.message);
                  toast.error(`[DB] ${error.message}`, { duration: 8000 });
                }
              });
            });
          }
        }
        if (data.tipo === "meta_atingida") {
          setRodando(false);
          toast.success("🎯 Meta atingida! Robô pausado automaticamente.", {
            duration: 5000,
            style: { background: "hsl(139 80% 18%)", color: "hsl(139 80% 85%)", border: "1px solid hsl(139 80% 35%)" },
          });
          setSummaryReason("meta");
          setSummaryOpen(true);
        }
        if (data.tipo === "stop_loss_atingido") {
          setRodando(false);
          toast.error("🛑 Stop Loss atingido! Robô pausado.", {
            duration: 5000,
            style: { background: "hsl(0 60% 18%)", color: "hsl(0 84% 85%)", border: "1px solid hsl(0 84% 40%)" },
          });
          setSummaryReason("stop");
          setSummaryOpen(true);
        }
      } catch {}
    };

    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [wsRef, ativo, connected]);

  // Sleep CANCELÁVEL: resolve(true) ao disparar naturalmente; cancelDemoTimers() resolve(false)
  // imediatamente no PARAR/FECHAR → o `await` retorna false e o loop aborta (sem timer órfão, sem hang).
  const demoSleep = (ms: number) =>
    new Promise<boolean>((resolve) => {
      const id = setTimeout(() => {
        demoTimersRef.current = demoTimersRef.current.filter((t) => t.id !== id);
        resolve(true);
      }, ms);
      demoTimersRef.current.push({ id, resolve });
    });
  const cancelDemoTimers = () => {
    demoTimersRef.current.forEach(({ id, resolve }) => { clearTimeout(id); resolve(false); });
    demoTimersRef.current = [];
  };

  // Fatia 4 — GATE de pausa: segura o loop enquanto a DEMO estiver pausada. resolve(true) no RETOMAR;
  // resolve(false) se PARAR/FECHAR durante a pausa (abort). NÃO reusa/altera o demoSleep (que é cancel-only).
  const demoWaitWhilePaused = () => new Promise<boolean>((resolve) => {
    if (!demoPausedRef.current) { resolve(true); return; }
    demoResumeRef.current = resolve;
  });

  const handleStartDemoSession = async () => {
    // Início SÍNCRONO no clique: fecha o gate, liga a sessão, reseta o estado PRÓPRIO da demo.
    // (NÃO toca operations/sessionPnl/ganhos/perdas do cockpit — a demo tem lista/agregados isolados.)
    setDemoModalOpen(false);
    setDemoRunning(true);
    demoCancelRef.current = false;
    demoOperatingRef.current = false; // ainda não passou do radar → PARAR no radar vai pra idle
    demoPausedRef.current = false; demoResumeRef.current = null; setDemoPaused(false); // Fatia 4: nova sessão nunca começa pausada
    cancelDemoTimers();
    setDemoEndedManually(false);
    setDemoOps([]);
    setDemoSessionPnl(0);
    setDemoWins(0);
    setDemoLosses(0);
    setDemoPhase("procurando");

    // ── ABERTURA (Modelo B): radar UMA vez (~3.4s) ANTES de consumir a sessão.
    // PARAR aqui → demoOperatingRef ainda false → handleDemoParar leva a idle, sessão NÃO consumida.
    if (!(await demoSleep(3400))) return;          // cancelado no radar → aborta (sem mais setState)
    if (demoCancelRef.current) return;

    // ── Consome a sessão (motor useDemoMode — NÃO alterado) SÓ DEPOIS do radar.
    let ops: Operation[] | null;
    try {
      ops = await runNextDemoOp();
    } catch (e) {
      if (!demoCancelRef.current) { setDemoRunning(false); setDemoPhase("idle"); }
      console.warn("[demo] falha ao iniciar sessão:", e instanceof Error ? e.message : String(e));
      return;
    }
    if (!ops || ops.length === 0) { setDemoRunning(false); setDemoPhase("idle"); return; }
    if (demoCancelRef.current) return; // PARAR durante o await do motor (janela pequena): bail limpo (sync, sem await até o set)

    // ‼️ MARCA "operando" SÍNCRONO: entre runNextDemoOp e estas 2 linhas NÃO há await → janela zero de race
    // (JS single-thread; nenhum clique de PARAR roda no meio). demoOperatingRef passa a decidir o PARAR.
    demoOperatingRef.current = true;
    setDemoPhase("operando");

    // ── EMPILHA as ops DO MOTOR (6-8) na MESMA tela "operando", sem voltar pro radar, ~1.5-2s entre elas.
    for (let i = 0; i < ops.length; i++) {
      // Fatia 4 — gate de pausa (2a): se pausado, segura ANTES de empilhar op[i]. Ao retomar, novo intervalo (D4) se i>0.
      // Nenhuma op nova empilha enquanto pausado; PARAR/FECHAR na pausa → abort (resolve false) → return limpo.
      while (demoPausedRef.current) {
        if (!(await demoWaitWhilePaused())) return;
        if (demoCancelRef.current) return;
        if (i > 0) {
          if (!(await demoSleep(1500 + Math.random() * 500))) return;
          if (demoCancelRef.current) return;
        }
      }
      const op = ops[i];
      setDemoOps((prev) => [op, ...prev]);
      setDemoSessionPnl((prev) => prev + op.pnl);
      if (op.result === "win") setDemoWins((p) => p + 1);
      else if (op.result === "loss") setDemoLosses((p) => p + 1);
      if (i < ops.length - 1) {
        if (!(await demoSleep(1500 + Math.random() * 500))) return; // cancelado → aborta (sem mais setState)
        if (demoCancelRef.current) return;
      }
    }

    // Fatia 4 — gate de pausa (2b): pausar na ÚLTIMA op segura a tela Pausado; NÃO pula pro Resultado.
    // SEM novo intervalo (não há próxima op). RETOMAR → segue pra resultado; PARAR/FECHAR → abort (return).
    while (demoPausedRef.current) {
      if (!(await demoWaitWhilePaused())) return;
      if (demoCancelRef.current) return;
    }
    // Fim NATURAL do lote → tela Resultado; demoRunning NÃO zera aqui (só em 4 sítios: FECHAR, catch do motor, ops vazio/null, PARAR no radar) — Modelo B.
    setDemoPhase("resultado");
  };

  // PARAR: decide pelo ref SÍNCRONO demoOperatingRef (NÃO por demoOps.length, que é state → race no handler).
  // radar/transição (nada operado) → idle limpo (sem Resultado vazio, sem queimar a sessão).
  // operando (já há ops) → tela Resultado (manual). cancelDemoTimers + demoCancelRef abortam o loop.
  const handleDemoParar = () => {
    demoCancelRef.current = true;
    cancelDemoTimers();
    // Fatia 4: se pausado, solta o gate com abort (resolve false) → o loop retorna sem empilhar/flip. (idle-vs-resultado por demoOperatingRef intacto.)
    demoResumeRef.current?.(false); demoResumeRef.current = null;
    demoPausedRef.current = false; setDemoPaused(false);
    if (!demoOperatingRef.current) {
      setDemoPhase("idle");
      setDemoRunning(false);
    } else {
      setDemoEndedManually(true);
      setDemoPhase("resultado");
    }
  };

  // demoRunning=false: aqui (FECHAR do Resultado), no catch do motor, em ops vazio/null e no PARAR
  // durante o radar (radar→idle) — Modelo B. (p/ o LIGAR IA não reabilitar com o overlay aberto).
  const handleDemoFechar = () => {
    demoCancelRef.current = true;
    cancelDemoTimers();
    // Fatia 4: solta o gate com abort se estiver pausado.
    demoResumeRef.current?.(false); demoResumeRef.current = null;
    demoPausedRef.current = false; setDemoPaused(false);
    setDemoPhase("idle");
    setDemoRunning(false);
  };

  // Fatia 4 — Pausar/Retomar da DEMO (fictício; NÃO toca dinheiro/paused real).
  const handleDemoPausar = () => {
    if (!demoOperatingRef.current || demoPhase !== "operando") return; // D3: só no operando (nunca radar/resultado/idle)
    demoPausedRef.current = true;
    setDemoPaused(true);
  };
  const handleDemoRetomar = () => {
    demoPausedRef.current = false;
    setDemoPaused(false);
    demoResumeRef.current?.(true); // solta o gate → o loop segue (novo intervalo via gate 2a se i>0)
    demoResumeRef.current = null;
  };

  const handleStart = async () => {
    if (startingRef.current) return;

    // Robô ainda não conectou (saldo null)
    if (saldo === null) {
      toast("Robô desconectado. Aguarde alguns segundos.", {
        duration: 4000,
        style: { background: "hsl(220 22% 12%)", color: "hsl(0 0% 85%)", border: "1px solid hsl(220 15% 25%)" },
      });
      return;
    }

    // Saldo insuficiente → fluxo demo
    if (saldo < 2) {
      if (isDemoExhausted) {
        setDemoModalMode("exhausted");
        setDemoModalOpen(true);
      } else {
        setDemoModalMode("available");
        setDemoModalOpen(true);
      }
      return;
    }

    startingRef.current = true;
    try {
    const isResuming = paused;
    if (!isResuming) {
      const sessionTs = Date.now();
      setSessionStart(sessionTs);
      setSessionStarts(prev => [...prev, { ts: sessionTs, ai: aiModel }].slice(-30));
    }
    console.log('[handleStart] iniciando...')
    setGanhos(0);
    setPerdas(0);
    if (!paused) setSessionPnl(0);

    // Buscar credenciais do usuário logado
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      console.error("Usuário não autenticado");
      return;
    }

    const { data: credsData } = await supabase
      .from("user_credentials")
      .select("casatrade_email, casatrade_password, casatrade_ssid")
      .eq("id", user.id)
      .single();

    if (!credsData?.casatrade_email) {
      toast.error("Credenciais da corretora não encontradas. Configure seu acesso em Perfil.");
      return;
    }

    const creds = credsData;

    console.log('Credenciais enviadas ao robô:', {
      email: creds.casatrade_email,
      password: creds.casatrade_password,
      ssid: creds.casatrade_ssid,
    })

    const estrategia = loadActiveStrategy();
    console.log('[handleStart] estrategia carregada:', JSON.stringify(estrategia));

    const ruleMap: Record<string, string> = {
      CRUZAMENTO: 'cruzamento',
      CONFLUENCIA: 'confluencia',
      REVERSAO: 'reversao',
      MOMENTUM: 'momentum',
    };
    const dirMap: Record<string, string> = {
      AMBAS: 'ambas',
      CALL: 'call',
      PUT: 'put',
    };
    const tipoMap: Record<string, string> = {
      sma: 'SMA',
      ema: 'EMA',
      rsi: 'RSI',
      macd: 'MACD',
      bollinger: 'Bollinger',
      estocastico: 'Estocastico',
      stoch: 'Estocastico',
      atr: 'ATR',
    };
    const estrategiaPayload = estrategia
      ? {
          nome: estrategia.name,
          regra: ruleMap[estrategia.entryRule] ?? 'confluencia',
          minConfluencia: estrategia.minConfluence,
          aguardarConfirmacao: estrategia.awaitConfirmation,
          direcaoPermitida: dirMap[estrategia.direction] ?? 'ambas',
          indicadores: (estrategia.indicators ?? []).map((i: any) => ({
            tipo: tipoMap[String(i.type ?? '').toLowerCase()] ?? String(i.type ?? '').toUpperCase(),
            ...(i.params ?? {}),
          })),
        }
      : null;
    console.log('[handleStart] estrategia payload:', JSON.stringify(estrategiaPayload));

    // Clamp defensivo (money-safety): os inputs editáveis (EditableValue) commitam pré-clamp
    // (clamp só no blur). Garante que valorEntrada/meta/stopLoss não vão ao robô fora do range.
    // Limites = MESMA fórmula do CockpitVariants/Sliders3 (src/lib/cockpitLimits), com o saldo VIVO.
    // No 1º start (rodando=false) saldoBase=saldo → bate com os limites exibidos na UI.
    // Na retomada-de-pausa (janela curta com rodando ainda true) o saldoBase da UI está congelado;
    // se o saldo caiu, o clamp pode reduzir meta/valor/stop abaixo do max exibido — divergência
    // APENAS p/ baixo (nunca acima do saldo), logo segura (não gasta a mais). Ver double-check COCKPIT-B.
    const { maxEntrada, maxMeta, maxStopLoss } = cockpitLimits(saldo);
    const valorMinimoSafe = clampRange(Number(valorEntrada), 2, maxEntrada);
    const metaGainSafe = clampRange(Number(meta), 2, maxMeta);
    const stopLossSafe = clampRange(Number(stopLoss), 2, maxStopLoss);

    iniciar(
      {
        percentualBanca: 0,
        valorMinimo: valorMinimoSafe,
        expiracaoSegundos: Number(expiracao),
        maxPerdasSeguidas: Number(maxLoss),
        ativoId: Number(ativo),
        metaGain: metaGainSafe,
        stopLoss: stopLossSafe,
        ...(estrategiaPayload ? { estrategia: estrategiaPayload } : {}),
      } as any,
      {
        email: creds.casatrade_email,
        password: creds.casatrade_password,
        ssid: creds.casatrade_ssid ?? undefined,
      },
    );
    } finally {
      startingRef.current = false;
    }
  };

  // Auto-stop when meta de lucro is reached (client-side fallback)
  const metaReachedRef = useRef(false);
  useEffect(() => {
    if (!rodando) {
      metaReachedRef.current = false;
      return;
    }
    if (meta > 0 && sessionPnl >= meta && !metaReachedRef.current) {
      metaReachedRef.current = true;
      parar();
      toast.success("🎯 Meta atingida! Robô pausado automaticamente.", { duration: 5000 });
      setSummaryReason("meta");
      setSummaryOpen(true);
    }
  }, [sessionPnl, meta, rodando, parar]);

  // Auto-stop when stop loss reached (client-side fallback)
  const stopReachedRef = useRef(false);
  useEffect(() => {
    if (!rodando) {
      stopReachedRef.current = false;
      return;
    }
    if (stopLoss > 0 && sessionPnl <= -stopLoss && !stopReachedRef.current) {
      stopReachedRef.current = true;
      parar();
      toast.error("🛑 Stop Loss atingido! Robô pausado.", { duration: 5000 });
      setSummaryReason("stop");
      setSummaryOpen(true);
    }
  }, [sessionPnl, stopLoss, rodando, parar]);

  return (
    <div className="min-h-screen w-full text-foreground">
      <div className="mx-auto w-full max-w-[1520px] px-4 py-5 sm:px-6 md:py-8">
        {/* Header (título + Depositar + Ativar) agora vive no DashboardLayout (App.tsx).
            Ativação: o botão "Ativar Plano" do layout dispara "tv:open-activation" → escutado acima. */}

        {/* ============== ABA Cockpit | Histórico (alterna só o miolo) ============== */}
        <div className="mb-5 flex gap-2" style={{ maxWidth: 300 }}>
          {([
            { id: "cockpit", label: "COCKPIT" },
            { id: "historico", label: "HISTÓRICO" },
          ] as const).map((t) => {
            const active = view === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                className="flex-1 transition-colors"
                style={{
                  padding: 10,
                  borderRadius: 11,
                  textAlign: "center",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: ".14em",
                  border: active ? "1px solid rgba(34,197,94,.5)" : "1px solid rgba(255,255,255,.08)",
                  background: active ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.02)",
                  color: active ? "#5dffa0" : "#9bb0a5",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ============== MIOLO: Cockpit | Histórico ==============
            Ambos miolos ficam MONTADOS (toggle via `hidden`) — não desmonta o LiveChart
            (remontar = chart.remove()+reattach WS, custoso) nem o estado interno do histórico. */}

        {/* ----- COCKPIT ----- */}
        <div className={view === "cockpit" ? "" : "hidden"}>
          {/* Banner IA Operando — FULL-WIDTH logo acima do grid (some quando !rodando, como antes) */}
          {rodando && (
            <div className="mb-4">
              <IAStatusBanner
                rodando={rodando}
                paused={paused}
                sessionPnl={sessionPnl}
                meta={meta}
                stopLoss={stopLoss}
                moeda={moedaConta}
                onTogglePause={() => {
                  if (paused) {
                    setPaused(false);
                    handleStart();
                  } else {
                    setPaused(true);
                    parar();
                  }
                }}
                onFinish={() => {
                  parar();
                  setPaused(false);
                  setSummaryReason("manual");
                  setSummaryOpen(true);
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.7fr_1fr] lg:gap-[22px]">
            {/* ===== ESQUERDA ===== */}
            <div className="flex min-w-0 flex-col gap-[18px]">
              {/* Card SALDO */}
              <div
                className="rounded-[18px] border border-[rgba(34,197,94,0.28)]"
                style={{
                  padding: "20px 22px",
                  background: "linear-gradient(120deg, rgba(34,197,94,.12), rgba(6,14,9,.4))",
                  boxShadow: "0 0 36px -16px rgba(34,197,94,.5)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: ".22em", color: "#5d8a70", textTransform: "uppercase" }}>
                      Saldo da conta
                    </div>
                    {/* PRESERVA o branch saldo==null ? Loader2 : valor (formatMoeda c/ moedaConta — sem hardcode de moeda).
                        splitMoedaCentavos colore só os centavos (#86b59a); o valor vem do formatMoeda REAL. */}
                    <div className="mt-1.5 flex h-10 items-center gap-2">
                      {saldo == null ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[#22c55e]" />
                      ) : (() => {
                        const { main, cents } = splitMoedaCentavos(formatMoeda(saldo, moedaConta));
                        return (
                          <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 36, lineHeight: 1, color: "#eef5f0" }}>
                            {main}<span style={{ color: "#86b59a" }}>{cents}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: ".2em", color: "#5d7167", textTransform: "uppercase" }}>
                      Resultado hoje
                    </div>
                    {/* TODO: PnL real do DIA — hoje só existe sessionPnl (por-SESSÃO), não por-dia. Placeholder. */}
                    <div className="mt-1.5 tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color: "#34d77a" }}>
                      +{formatMoeda(0, moedaConta)}
                    </div>
                  </div>
                </div>
                {/* Mobile: Depositar/Ativar dentro do card (no desktop ficam no header) */}
                <div className="mt-4 flex flex-wrap items-center gap-2 lg:hidden">
                  <DepositButton label="Depositar" />
                  {hasActivePlan === false && (
                    <button
                      type="button"
                      onClick={() => setActivationOpen(true)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[rgba(34,197,94,0.5)] bg-[rgba(34,197,94,0.08)] px-3.5 text-sm font-semibold text-[#5dffa0] transition-colors hover:bg-[rgba(34,197,94,0.14)]"
                    >
                      <Key className="h-4 w-4" />
                      Ativar Plano
                    </button>
                  )}
                </div>
              </div>

              {/* Card Gráfico — AssetCombobox (preservado) + LiveChart (fundo #0c1f14 casando com o chart) */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(34,197,94,0.14)] bg-[#060a08]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
                  <AssetCombobox
                    value={ativo}
                    onChange={handleAtivoChange}
                    options={DEFAULT_ASSETS}
                    variant="inline"
                    accessory={
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.10)] px-1.5 py-0.5 text-[10px] font-bold text-[#5dffa0]">
                        <span className="h-1 w-1 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
                        AO VIVO
                      </span>
                    }
                  />
                </div>
                {/* ‼️ container do gráfico: bg #0c1f14 (casa com o LiveChart). height 300/170 — o ResizeObserver redimensiona. */}
                <div className="relative bg-[#0c1f14]" style={{ height: isMobile ? 170 : 300 }}>
                  <LiveChart wsRef={wsRef} ativoId={Number(ativo)} candleSize={5} height={isMobile ? 170 : 300} />
                </div>
              </div>

              {/* Card GRUPO VIP — PRESERVA o onClick do WhatsApp */}
              <button
                type="button"
                onClick={() => window.open("https://chat.whatsapp.com/L2O5siAHJQlDcc3DWtwYUZ", "_blank", "noopener,noreferrer")}
                className="group flex w-full items-center border border-[rgba(34,197,94,0.14)] text-left transition-colors hover:border-[rgba(34,197,94,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,197,94,0.5)]"
                style={{ gap: 14, padding: "15px 16px", borderRadius: 16, background: "rgba(255,255,255,.025)" }}
              >
                <span className="flex shrink-0 items-center justify-center text-[#34d77a]" style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)" }}>
                  <UsersRound className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15, color: "#eef5f0" }}>Grupo VIP</span>
                  <span className="truncate" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 400, fontSize: 12, color: "#7d9488" }}>Comunidade e sinais exclusivos</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#5d8a70] transition-colors group-hover:text-[#5dffa0]" />
              </button>
            </div>

            {/* ===== DIREITA ===== */}
            <div className="flex min-w-0 flex-col gap-[18px]">
              {/* Modelo de inteligência — 2x2 (lock preservado: pointer-events-none/opacity + Tooltip quando rodando) */}
              <div className="rounded-[18px] border border-[rgba(34,197,94,0.16)] p-5" style={{ background: "linear-gradient(180deg, rgba(14,26,18,.5), rgba(6,12,8,.3))" }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: ".18em", color: "#5d7167", textTransform: "uppercase", marginBottom: 11 }}>
                  Modelo de inteligência
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "claude", label: "Claude", sub: "Anthropic", icon: claudeIcon },
                    { key: "gpt5", label: "GPT-5", sub: "OpenAI", icon: gptIcon },
                    { key: "gemini", label: "Gemini", sub: "Google", icon: geminiIcon },
                    { key: "grok3", label: "Grok 3", sub: "xAI", icon: grokIcon },
                  ].map((m) => {
                    const selected = aiModel === (m.key as any);
                    const blocked = rodando;
                    const button = (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          if (blocked) return;
                          handleAiModelChange(m.key as typeof aiModel);
                        }}
                        disabled={aiModelLoading || blocked}
                        aria-disabled={blocked}
                        className={`flex min-w-0 items-center gap-2.5 text-left transition-all ${
                          blocked ? "cursor-not-allowed pointer-events-none" : ""
                        } ${blocked && !selected ? "opacity-50" : ""}`}
                        style={{
                          padding: 11,
                          borderRadius: 13,
                          border: selected ? "1px solid rgba(34,197,94,.55)" : "1px solid rgba(255,255,255,.07)",
                          background: selected ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.02)",
                          boxShadow: selected ? "0 0 22px -8px rgba(34,197,94,.7)" : "none",
                        }}
                      >
                        <span className="shrink-0 overflow-hidden" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,.04)" }}>
                          <img src={m.icon} alt={m.label} className="h-full w-full object-cover" loading="lazy" />
                        </span>
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="truncate" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12, color: "#eef5f0" }}>{m.label}</div>
                          <div className="truncate" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 500, fontSize: 9, color: "#7d9488" }}>{m.sub}</div>
                        </div>
                        <span
                          className="shrink-0"
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: selected ? "#22c55e" : "transparent",
                            border: selected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,.2)",
                          }}
                        />
                      </button>
                    );
                    if (!blocked) return button;
                    return (
                      <Tooltip key={m.key}>
                        <TooltipTrigger asChild>
                          <span className="block w-full cursor-not-allowed [&>button]:w-full">{button}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Não é possível trocar a IA durante uma operação ativa.
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* CockpitVariants — INTACTO (todas as props de antes). Visual antigo até o 2B. */}
              <div className="min-h-0 flex-1">
                <CockpitVariants
                  valorEntrada={valorEntrada}
                  setValorEntrada={setValorEntrada}
                  saldo={saldo}
                  simbolo={simboloMoeda(moedaConta)}
                  expiracao={expiracao}
                  setExpiracao={setExpiracao}
                  maxLoss={maxLoss}
                  setMaxLoss={setMaxLoss}
                  meta={meta}
                  setMeta={setMeta}
                  stopLoss={stopLoss}
                  setStopLoss={setStopLoss}
                  onStart={handleStart}
                  onStop={parar}
                  canStart={(connected || isDemoEligible) && !rodando && !demoRunning && demoPhase === "idle"}
                  canStop={connected && rodando}
                  rodando={rodando}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ----- HISTÓRICO (sempre montado; hidden no cockpit) ----- */}
        <div className={view === "historico" ? "" : "hidden"}>
          <OperationsHistory operations={operations} moeda={moedaConta} sessionStart={sessionStart} sessionStarts={sessionStarts} />
        </div>

        <Dialog open={activationOpen} onOpenChange={setActivationOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Ativar seu Plano
              </DialogTitle>
              <DialogDescription>
                Insira o código de ativação recebido após a compra.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="1234"
                value={activationCode}
                onChange={e => setActivationCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="font-mono text-center text-3xl tracking-[0.5em] h-14"
                inputMode="numeric"
                maxLength={4}
                onKeyDown={e => e.key === "Enter" && handleClaimCode()}
              />
              <p className="text-center text-xs text-muted-foreground">
                O código foi exibido na página de obrigado após a confirmação do pagamento.
              </p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setActivationOpen(false)}>
                Lembrar mais tarde
              </Button>
              <Button
                onClick={handleClaimCode}
                disabled={!activationCode.trim() || activationLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {activationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar Plano"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <OperationSummaryDialog
          open={summaryOpen}
          onOpenChange={setSummaryOpen}
          moeda={moedaConta}
          totalPnl={sessionPnl}
          ganhos={ganhos}
          perdas={perdas}
          symbol={DEFAULT_ASSETS.find((a) => a.id === ativo)?.symbol ?? `Ativo ${ativo}`}
          reason={summaryReason}
          onNewOperation={() => {
            setOperations([]);
            setSessionPnl(0);
            setGanhos(0);
            setPerdas(0);
            setSummaryReason("manual");
            try {
              localStorage.removeItem(`virtuspro_ops_v4_${userId}`);
            } catch {}
          }}
        />

        <DemoModeModal
          open={demoModalOpen}
          onOpenChange={setDemoModalOpen}
          mode={demoModalMode}
          sessionsLeft={sessionsLeft}
          onStartDemo={handleStartDemoSession}
          running={demoRunning}
        />

        {/* Trigger oculto de depósito — reusa o DepositButton (padrão do UserMenu); usado pela tela Resultado (Fatia 5) */}
        <div ref={demoDepositRef} className="hidden">
          <DepositButton variant="default" />
        </div>

        {/* Overlay do fluxo DEMO (4 telas) — montado só quando a sessão demo está ativa (fase ≠ idle) */}
        <DemoFlowOverlay
          phase={demoPhase}
          paused={demoPaused}
          ops={demoOps}
          sessionPnl={demoSessionPnl}
          wins={demoWins}
          losses={demoLosses}
          endedManually={demoEndedManually}
          onPausar={handleDemoPausar}
          onRetomar={handleDemoRetomar}
          onParar={handleDemoParar}
          onFechar={handleDemoFechar}
        />

        {aiModelLoading && <LoadingSpinner />}

        {rankUpData && (
          <RankUpToast
            newRank={rankUpData.rank}
            rankImage={rankUpData.image}
            onClose={() => setRankUpData(null)}
          />
        )}

      </div>
    </div>
  );
};


function StatsSummary({ stats, sentiment }: { stats: any; sentiment: boolean | null }) {
  if (!stats) {
    return (
      <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
        <span>Aguardando dados de mercado…</span>
      </div>
    );
  }
  const fmtPct = (n: number) =>
    `${n > 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
  const colorOf = (n: number) =>
    n > 0
      ? "text-[hsl(139_80%_45%)]"
      : n < 0
      ? "text-[hsl(0_84%_60%)]"
      : "text-muted-foreground";
  const sentimentColor = sentiment === true ? "#3ddc97" : sentiment === false ? "#ff4d6d" : "#9ca3af";
  const sentimentLabel = sentiment === true ? "Bullish" : sentiment === false ? "Bearish" : "—";
  return (
    <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground ct-mono tabular-nums">
      <span>
        Trader Sentiment:{" "}
        <span className="font-semibold" style={{ color: sentimentColor }}>
          ● {sentimentLabel}
        </span>
      </span>
      <span className="text-border">|</span>
      <span>
        Sessão:{" "}
        <span className={`font-semibold ${colorOf(stats.sessionChange)}`}>
          {fmtPct(stats.sessionChange)}
        </span>
      </span>
      <span className="text-border">|</span>
      <span>
        5min:{" "}
        <span className={`font-semibold ${colorOf(stats.change5min)}`}>
          {fmtPct(stats.change5min)}
        </span>
      </span>
    </div>
  );
}

export default Index;
