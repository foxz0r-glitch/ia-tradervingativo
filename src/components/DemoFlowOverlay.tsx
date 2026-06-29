// Overlay do fluxo DEMO (4 telas: Procurando → Operando → Pausado → Resultado).
// FATIA 2a = FUNDAÇÃO/esqueleto: container tela-cheia governado por `phase`, com PLACEHOLDER por fase.
// As telas reais (radar, lista ao vivo, pausado, resultado) entram nas Fatias 2b-5, substituindo o miolo.
// NÃO fecha ao clicar fora (sem onClick no backdrop). Some quando phase === "idle".
import type { Operation } from "@/components/OperationsHistory";

export type DemoPhase = "idle" | "procurando" | "operando" | "pausado" | "resultado";

interface Props {
  phase: DemoPhase;
  ops: Operation[];
  sessionPnl: number;
  wins: number;
  losses: number;
  endedManually: boolean;
  onPausar: () => void;
  onRetomar: () => void;
  onParar: () => void;
  onFechar: () => void;
}

const PHASE_LABEL: Record<DemoPhase, string> = {
  idle: "",
  procurando: "PROCURANDO ENTRADA",
  operando: "OPERANDO",
  pausado: "PAUSADO",
  resultado: "RESULTADO",
};

const BTN: React.CSSProperties = {
  height: 44,
  padding: "0 22px",
  borderRadius: 12,
  border: "1px solid rgba(34,197,94,.45)",
  background: "rgba(34,197,94,.10)",
  color: "#5dffa0",
  font: "700 12px 'Sora'",
  letterSpacing: ".08em",
  cursor: "pointer",
};
const BTN_RED: React.CSSProperties = {
  ...BTN,
  border: "1px solid rgba(239,68,68,.5)",
  background: "rgba(239,68,68,.1)",
  color: "#ff8a8a",
};

export function DemoFlowOverlay({
  phase, ops, sessionPnl, wins, losses, endedManually,
  onPausar, onRetomar, onParar, onFechar,
}: Props) {
  if (phase === "idle") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sessão demo"
      // tela-cheia; NÃO fecha ao clicar fora (sem handler no backdrop)
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "radial-gradient(120% 90% at 50% 0%, #0c1f14 0%, #060a08 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        fontFamily: "'Sora', sans-serif",
        color: "#eef5f0",
        padding: 24,
      }}
    >
      {/* ===== PLACEHOLDER por fase (substituído pelas telas reais nas Fatias 2b-5) ===== */}
      <div style={{ font: "700 12px 'Sora'", letterSpacing: ".28em", color: "#5d8a70" }}>
        {PHASE_LABEL[phase]}
        {phase === "resultado" && endedManually ? " · ENCERRADA MANUALMENTE" : ""}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#86a596" }}>
        ops {ops.length} · wins {wins} · losses {losses} · pnl {sessionPnl}
      </div>

      {/* Controles mínimos (placeholder) — substituídos pelas telas reais */}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {(phase === "procurando" || phase === "operando") && (
          <>
            <button type="button" onClick={onPausar} style={BTN}>PAUSAR</button>
            <button type="button" onClick={onParar} style={BTN_RED}>PARAR</button>
          </>
        )}
        {phase === "pausado" && (
          <>
            <button type="button" onClick={onRetomar} style={BTN}>RETOMAR</button>
            <button type="button" onClick={onParar} style={BTN_RED}>PARAR</button>
          </>
        )}
        {phase === "resultado" && (
          <button type="button" onClick={onFechar} style={BTN}>FECHAR</button>
        )}
      </div>
    </div>
  );
}
