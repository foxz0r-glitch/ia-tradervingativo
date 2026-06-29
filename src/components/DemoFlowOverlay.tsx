// Overlay do fluxo DEMO (4 telas: Procurando → Operando → Pausado → Resultado).
// FATIA 2b: tela "procurando" REAL (radar) portada do protótipo. Operando/Pausado/Resultado seguem placeholder.
// NÃO fecha ao clicar fora (sem onClick no backdrop). Some quando phase === "idle". Keyframes LOCAIS (não index.css).
import { useEffect, useState } from "react";
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

// ===================== Tela PROCURANDO (radar) — estilos inline exatos do protótipo =====================
const SEARCH_PAIRS = ["EUR/USD", "GBP/USD", "AUD/USD", "USD/JPY"];

function ProcurandoScreen() {
  // Um chip aceso girando 0→1→2→3→0 a cada 1.2s (interval LOCAL, limpo no unmount).
  const [chipIdx, setChipIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setChipIdx((i) => (i + 1) % SEARCH_PAIRS.length), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Keyframes LOCAIS (não index.css / não ui/) */}
      <style>{`
@keyframes tv-radar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes tv-ringExpand { 0% { transform: scale(.35); opacity: .55; } 100% { transform: scale(1.55); opacity: 0; } }
@keyframes tv-floatGlow { 0%,100% { opacity: .45; transform: scale(.92); } 50% { opacity: 1; transform: scale(1); } }
`}</style>

      {/* ===== RADAR ===== */}
      <div style={{ position: "relative", width: 238, height: 238, marginBottom: 40 }}>
        {/* 3 anéis */}
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(34,197,94,.16)" }} />
        <span style={{ position: "absolute", inset: 40, borderRadius: "50%", border: "1px solid rgba(34,197,94,.13)" }} />
        <span style={{ position: "absolute", inset: 80, borderRadius: "50%", border: "1px solid rgba(34,197,94,.10)" }} />
        {/* cruz */}
        <span style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "rgba(34,197,94,.1)" }} />
        <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(34,197,94,.1)" }} />
        {/* sweep girando */}
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(34,197,94,0) 0deg, rgba(34,197,94,.28) 50deg, rgba(34,197,94,0) 85deg)", animation: "tv-radar 2.8s linear infinite" }} />
        {/* 2 anéis expandindo */}
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(34,197,94,.45)", animation: "tv-ringExpand 2.8s ease-out infinite" }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(34,197,94,.45)", animation: "tv-ringExpand 2.8s ease-out infinite", animationDelay: "1.4s" }} />
        {/* dot central + 2 satélites */}
        <span style={{ position: "absolute", top: "50%", left: "50%", width: 14, height: 14, margin: "-7px 0 0 -7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 18px #22c55e" }} />
        <span style={{ position: "absolute", top: "30%", left: "64%", width: 7, height: 7, borderRadius: "50%", background: "#5dffa0", boxShadow: "0 0 10px #22c55e", animation: "tv-floatGlow 1.6s infinite" }} />
        <span style={{ position: "absolute", top: "62%", left: "34%", width: 6, height: 6, borderRadius: "50%", background: "#5dffa0", boxShadow: "0 0 8px #22c55e", animation: "tv-floatGlow 1.6s infinite", animationDelay: ".7s" }} />
      </div>

      {/* ===== BADGE "IA ANALISANDO" ===== */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 14px", borderRadius: 30, background: "rgba(6,12,8,.7)", border: "1px solid rgba(34,197,94,.4)", boxShadow: "0 0 20px -6px rgba(34,197,94,.6)", marginBottom: 24 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "tv-floatGlow 1.4s infinite" }} />
        <span style={{ font: "700 11px 'Sora'", letterSpacing: ".18em", color: "#5dffa0" }}>IA ANALISANDO</span>
      </div>

      {/* ===== TÍTULO + SUBTÍTULO ===== */}
      <div style={{ font: "700 27px 'Sora'", color: "#eef5f0", letterSpacing: "-.01em" }}>Procurando operações</div>
      <div style={{ font: "400 14px 'Sora'", color: "#8fb6a1", marginTop: 10, lineHeight: 1.5, maxWidth: 280, textAlign: "center" }}>
        A IA está analisando o mercado em tempo real
      </div>

      {/* ===== CHIPS (4 fixos, um aceso girando) ===== */}
      <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 9 }}>
        {SEARCH_PAIRS.map((pair, i) => {
          const on = i === chipIdx;
          return (
            <div
              key={pair}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                borderRadius: 11,
                transition: "background .35s, border-color .35s",
                background: on ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.02)",
                border: on ? "1px solid rgba(34,197,94,.5)" : "1px solid rgba(255,255,255,.08)",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#22c55e" : "rgba(255,255,255,.2)", boxShadow: on ? "0 0 8px #22c55e" : "none", transition: "background .35s" }} />
              <span style={{ font: "600 12px 'JetBrains Mono'", letterSpacing: ".02em", color: on ? "#5dffa0" : "#8a9b91", transition: "color .35s" }}>{pair}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      {phase === "procurando" ? (
        <ProcurandoScreen />
      ) : (
        /* ===== PLACEHOLDER por fase (substituído pelas telas reais nas Fatias 2c-5) ===== */
        <>
          <div style={{ font: "700 12px 'Sora'", letterSpacing: ".28em", color: "#5d8a70" }}>
            {PHASE_LABEL[phase]}
            {phase === "resultado" && endedManually ? " · ENCERRADA MANUALMENTE" : ""}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#86a596" }}>
            ops {ops.length} · wins {wins} · losses {losses} · pnl {sessionPnl}
          </div>
        </>
      )}

      {/* Controles (PAUSAR/PARAR/RETOMAR/FECHAR) — infra da Fatia 2a, NÃO alterada */}
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
