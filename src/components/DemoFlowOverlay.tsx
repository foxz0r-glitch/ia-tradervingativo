// Overlay do fluxo DEMO (4 telas: Procurando → Operando → Pausado → Resultado).
// Procurando = tela real (da8d3df). Operando = tela real: hero (40bfabe) + lista ao vivo (85df0f2) + list header (14fde8b). Pausado = FEITO (38d4859, Fatia 4: EM ESPERA + card RETOMAR + badge ⏸ como estado do Operando via `paused`). Resultado = placeholder (Fatia 5 do roadmap §7).
// NÃO fecha ao clicar fora (sem onClick no backdrop). Some quando phase === "idle". Keyframes LOCAIS (não index.css).
import { useEffect, useState } from "react";
import type { Operation } from "@/components/OperationsHistory";
import { formatMoeda } from "@/lib/moeda";
import { RADAR_PAIRS } from "@/lib/demoConstants";

export type DemoPhase = "idle" | "procurando" | "operando" | "resultado";

interface Props {
  phase: DemoPhase;
  ops: Operation[];
  sessionPnl: number;
  wins: number;
  losses: number;
  paused: boolean;
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
const SEARCH_PAIRS = RADAR_PAIRS; // fonte única (src/lib/demoConstants) — mesmos 4 pares dos chips + sorteio do ativo

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

// ===================== Tela OPERANDO (hero) — Fatia 3a (lista = 3b) =====================
// Dinheiro formatado com o formatador REAL do app (formatMoeda), moeda BRL (demo em R$).
function OperandoScreen({ phase, paused, ops, sessionPnl, wins, losses }: { phase: DemoPhase; paused: boolean; ops: Operation[]; sessionPnl: number; wins: number; losses: number }) {
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0; // 0% se sem ops
  const pos = sessionPnl >= 0;
  const valueStr = `${pos ? "+" : "-"}${formatMoeda(Math.abs(sessionPnl), "BRL")}`; // ex.: +R$ 445,00

  return (
    <div style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column" }}>
      {/* Keyframes LOCAIS: reusa tv-radar (spinner) + tv-floatGlow/tv-livePulse + adiciona tv-opInA/tv-opInB (entrada das linhas) + tv-dotBlink (dot "buscando…" do list header) */}
      <style>{`
@keyframes tv-radar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes tv-floatGlow { 0%,100% { opacity: .45; transform: scale(.92); } 50% { opacity: 1; transform: scale(1); } }
@keyframes tv-livePulse { 0% { transform: scale(.9); opacity: .9; } 70% { transform: scale(2.4); opacity: 0; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes tv-opInA { 0% { opacity: 0; transform: translateY(15px) scale(.99); } 60% { opacity: 1; } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes tv-opInB { 0% { opacity: 0; transform: translateY(15px) scale(.99); } 60% { opacity: 1; } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes tv-dotBlink { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
`}</style>

      {/* ===== HERO ===== */}
      <div style={{ position: "relative", padding: "14px 2px 12px" }}>
        {/* mini-radar no canto */}
        <div style={{ position: "absolute", top: -2, right: -26, width: 128, height: 128, pointerEvents: "none", opacity: 0.8 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(34,197,94,.16)" }} />
          <span style={{ position: "absolute", inset: 26, borderRadius: "50%", border: "1px solid rgba(34,197,94,.12)" }} />
          <span style={{ position: "absolute", top: "50%", left: "50%", width: 8, height: 8, margin: "-4px 0 0 -4px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 12px #22c55e" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(34,197,94,0) 0deg, rgba(34,197,94,.22) 55deg, rgba(34,197,94,0) 90deg)", animation: "tv-radar 3.2s linear infinite" }} />
        </div>

        <div style={{ position: "relative" }}>
          {/* badge (Fatia 4): !paused = "IA OPERANDO AO VIVO" (dot + onda tv-livePulse); paused = "⏸ PAUSADO" (âmbar, SEM animação) — .dc.html L107 vs L111-113 */}
          {!paused ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 14px", borderRadius: 30, background: "rgba(6,12,8,.7)", border: "1px solid rgba(34,197,94,.4)", boxShadow: "0 0 20px -6px rgba(34,197,94,.6)" }}>
              <span style={{ position: "relative", width: 8, height: 8 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", animation: "tv-livePulse 1.8s ease-out infinite" }} />
              </span>
              <span style={{ font: "700 11px 'Sora'", letterSpacing: ".18em", color: "#5dffa0" }}>IA OPERANDO AO VIVO</span>
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 14px", borderRadius: 30, background: "rgba(224,169,60,.12)", border: "1px solid rgba(224,169,60,.5)" }}>
              <span style={{ font: "700 13px 'Sora'", color: "#f0bf63", lineHeight: 1 }}>⏸</span>
              <span style={{ font: "700 11px 'Sora'", letterSpacing: ".18em", color: "#f0bf63" }}>PAUSADO</span>
            </div>
          )}

          {/* label + número acumulado (sessionPnl em R$ via formatMoeda, com sinal e cor runtime) */}
          <div style={{ font: "600 11px 'Sora'", letterSpacing: ".22em", color: "#5d8a70", textTransform: "uppercase", marginTop: 16 }}>Resultado acumulado</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 50, lineHeight: 1, marginTop: 6, textAlign: "left", fontVariantNumeric: "tabular-nums", color: pos ? "#34d77a" : "#f0726a", textShadow: "0 0 34px rgba(34,197,94,.5)" }}>
            {valueStr}
          </div>
        </div>

        {/* ===== MÉTRICAS ===== */}
        <div style={{ display: "flex", marginTop: 18, borderTop: "1px solid rgba(34,197,94,.16)", paddingTop: 13 }}>
          <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(34,197,94,.14)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 23, color: "#eef5f0" }}>{ops.length}</div>
            <div style={{ font: "600 9px 'Sora'", letterSpacing: ".16em", color: "#5d7167", textTransform: "uppercase", marginTop: 3 }}>Operações</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(34,197,94,.14)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 23, color: "#34d77a" }}>{winRate}%</div>
            <div style={{ font: "600 9px 'Sora'", letterSpacing: ".16em", color: "#5d7167", textTransform: "uppercase", marginTop: 3 }}>Acerto</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 23, color: "#eef5f0" }}>{wins}</div>
            <div style={{ font: "600 9px 'Sora'", letterSpacing: ".16em", color: "#5d7167", textTransform: "uppercase", marginTop: 3 }}>Wins</div>
          </div>
        </div>

      </div>

      {/* ===== LIST HEADER (Fatia 3c) — entre métricas e lista; lado direito condicionado à fase (Fatia 4 troca por EM ESPERA) ===== */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px 10px" }}>
        <span style={{ font: "600 10px 'Sora'", letterSpacing: ".2em", color: "#4a5b52", textTransform: "uppercase" }}>Operações ao vivo</span>
        {phase === "operando" && !paused && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "tv-dotBlink 1s infinite" }} />
            <span style={{ font: "500 12px 'Sora'", letterSpacing: ".02em", color: "#86b59a" }}>buscando…</span>
          </span>
        )}
        {phase === "operando" && paused && (
          /* EM ESPERA (Fatia 4) — SEM dot tv-dotBlink; .dc.html L145 */
          <span style={{ font: "600 10px 'Sora'", letterSpacing: ".12em", color: "#e0a93c" }}>EM ESPERA</span>
        )}
      </div>

      {/* ===== LISTA AO VIVO (Fatia 3b) — só ela rola (flex:1 + overflow); hero acima é altura natural; espaçamento agora vem do padding do header (como no .dc.html) ===== */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(34,197,94,.35) transparent",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* 1º item do scroll (Fatia 4): !paused = "procurando próxima entrada…" (spinner tv-radar); paused = card "em espera" (SEM spinner) — .dc.html L156 vs L159-161 */}
        {phase === "operando" && !paused && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, padding: 14, borderRadius: 14, border: "1px dashed rgba(34,197,94,.25)", flex: "none" }}>
            <span style={{ position: "relative", width: 16, height: 16 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(34,197,94,.25)", borderTopColor: "#22c55e", animation: "tv-radar .9s linear infinite" }} />
            </span>
            <span style={{ font: "600 12px 'Sora'", letterSpacing: ".02em", color: "#86b59a" }}>procurando próxima entrada…</span>
          </div>
        )}
        {phase === "operando" && paused && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 14, borderRadius: 14, background: "rgba(224,169,60,.08)", border: "1px solid rgba(224,169,60,.3)", flex: "none" }}>
            <span style={{ font: "700 12px 'Sora'", letterSpacing: ".08em", color: "#f0bf63" }}>Operações em espera — toque RETOMAR</span>
          </div>
        )}

        {/* Linhas: mais recente no topo (ops já vem [novo,...antigo]); SÓ i===0 anima */}
        {ops.map((op, i) => {
          const win = op.result === "win";
          const amountColor = win ? "#34d77a" : "#f0726a";
          const badgeColor = win ? "#4ade80" : "#f87171";
          const cardBorder = win ? "rgba(34,197,94,.16)" : "rgba(239,68,68,.16)";
          const glowBg = win ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.07)";
          const amountText = `${win ? "+" : "-"}${formatMoeda(Math.abs(op.pnl), "BRL")}`; // formatador real, BRL
          const anim = i === 0 ? `${i % 2 === 0 ? "tv-opInA" : "tv-opInB"} .5s cubic-bezier(.2,.8,.3,1) both` : undefined;
          return (
            <div key={op.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: `linear-gradient(100deg, ${glowBg}, rgba(255,255,255,.02))`, border: `1px solid ${cardBorder}`, animation: anim, flex: "none" }}>
              <span style={{ width: 34, height: 34, flex: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,12,8,.6)", border: `1px solid ${cardBorder}`, font: "700 13px 'Sora'", color: amountColor }}>{win ? "▲" : "▼"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "700 14px 'Sora'", color: "#eef5f0" }}>{op.symbol}</div>
                <div style={{ font: "600 9px 'Sora'", letterSpacing: ".12em", textTransform: "uppercase", color: badgeColor, marginTop: 2 }}>{win ? "WIN" : "LOSS"}</div>
              </div>
              <span style={{ flex: "none", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: amountColor, fontVariantNumeric: "tabular-nums" }}>{amountText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DemoFlowOverlay({
  phase, paused, ops, sessionPnl, wins, losses, endedManually,
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
      ) : phase === "operando" ? (
        <OperandoScreen phase={phase} paused={paused} ops={ops} sessionPnl={sessionPnl} wins={wins} losses={losses} />
      ) : (
        /* ===== PLACEHOLDER por fase (substituído pelas telas reais nas Fatias 4-5) ===== */
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
        {/* D3: PAUSAR só no operando ao vivo (some no radar); RETOMAR no operando pausado; PARAR em radar+operando; FECHAR no resultado */}
        {phase === "operando" && !paused && (
          <button type="button" onClick={onPausar} style={BTN}>PAUSAR</button>
        )}
        {phase === "operando" && paused && (
          <button type="button" onClick={onRetomar} style={BTN}>RETOMAR</button>
        )}
        {(phase === "procurando" || phase === "operando") && (
          <button type="button" onClick={onParar} style={BTN_RED}>PARAR</button>
        )}
        {phase === "resultado" && (
          <button type="button" onClick={onFechar} style={BTN}>FECHAR</button>
        )}
      </div>
    </div>
  );
}
