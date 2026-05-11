/**
 * Templates A..E — todos com as MESMAS seções (header, ranking, performance,
 * score, badges, estratégias, comunidade, missões, privacidade), porém com
 * skins distintos para variar visualmente o perfil dos top 10.
 *
 * - A → ímpar #1 — Aurora Esmeralda (padrão do site)
 * - B → par   #2 — Noir Dourado (financeiro premium)
 * - C → ímpar #3,#5 ... — HUD Hexagonal Ciano
 * - D → par   #4,#6 ... — Editorial Magenta
 * - E → ímpar #7,#9 + par #8,#10 — Cockpit Vermelho/Laranja
 *
 * Mapeamento posição→template está em ProfileDialog.
 */
import {
  HeaderBlock, ProgressBlock, RankingBlock, PerformanceBlock, ScoreBreakdownBlock,
  BadgesBlock, StrategiesBlock, CommunityBlock, MissionsBlock,
  type TplProps,
} from "./_profileSections";

/* casca comum: define o background + accent + grid de seções */
function ProfileShell({
  children, accent, bg, frame,
}: { children: React.ReactNode; accent: string; bg: string; frame?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border backdrop-blur-md"
      style={{
        borderColor: `${accent}40`,
        background: bg,
        boxShadow: `0 0 60px -20px ${accent}aa, inset 0 1px 0 ${accent}33${frame ? `, ${frame}` : ""}`,
      }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)` }} />
      <div className="relative space-y-7 p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}

/* === A — Estrutura ChatGPT (ímpar #1, accent esmeralda padrão) === */
export function ProfileTemplateA(props: TplProps) {
  const accent = "hsl(160 84% 60%)";
  return (
    <ChatGPTShell accent={accent}>
      <ChatGPTBlock>
        <HeaderBlock {...props} accent={accent} />
        <ProgressBlock {...props} accent={accent} />
      </ChatGPTBlock>
      <ChatGPTBlock><RankingBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><PerformanceBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><ScoreBreakdownBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><BadgesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><StrategiesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><CommunityBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><MissionsBlock {...props} accent={accent} /></ChatGPTBlock>
      
    </ChatGPTShell>
  );
}

/* === B — Estrutura ChatGPT (par, sóbrio neutro) ===
   Inspirado na imagem-referência v2: fundo neutro escuro, cartões em
   blocos separados com leve borda, sem gradiente colorido. */
export function ProfileTemplateB(props: TplProps) {
  const accent = "hsl(160 70% 55%)";
  return (
    <ChatGPTShell accent={accent}>
      <ChatGPTBlock>
        <HeaderBlock {...props} accent={accent} />
        <ProgressBlock {...props} accent={accent} />
      </ChatGPTBlock>
      <ChatGPTBlock><RankingBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><PerformanceBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><ScoreBreakdownBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><BadgesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><StrategiesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><CommunityBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><MissionsBlock {...props} accent={accent} /></ChatGPTBlock>
      
    </ChatGPTShell>
  );
}

/* Casca "ChatGPT": fundo plano neutro, sem glow, blocos separados */
function ChatGPTShell({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      className="relative space-y-3 rounded-2xl border p-3 md:p-4"
      style={{
        borderColor: "hsl(220 10% 22%)",
        background: "hsl(220 12% 9%)",
        boxShadow: `0 0 40px -20px ${accent}44`,
      }}
    >
      {children}
    </div>
  );
}
function ChatGPTBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "hsl(220 10% 18%)", background: "hsl(220 12% 11%)" }}
    >
      {children}
    </div>
  );
}

/* === C — Estrutura ChatGPT (ímpar, accent violeta) === */
export function ProfileTemplateC(props: TplProps) {
  const accent = "hsl(265 85% 70%)";
  return (
    <ChatGPTShell accent={accent}>
      <ChatGPTBlock>
        <HeaderBlock {...props} accent={accent} />
        <ProgressBlock {...props} accent={accent} />
      </ChatGPTBlock>
      <ChatGPTBlock><RankingBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><PerformanceBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><ScoreBreakdownBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><BadgesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><StrategiesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><CommunityBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><MissionsBlock {...props} accent={accent} /></ChatGPTBlock>
      
    </ChatGPTShell>
  );
}

/* === D — Estrutura ChatGPT variação (par, mesma base sóbria, accent ciano) === */
export function ProfileTemplateD(props: TplProps) {
  const accent = "hsl(190 85% 60%)";
  return (
    <ChatGPTShell accent={accent}>
      <ChatGPTBlock>
        <HeaderBlock {...props} accent={accent} />
        <ProgressBlock {...props} accent={accent} />
      </ChatGPTBlock>
      <ChatGPTBlock><RankingBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><PerformanceBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><ScoreBreakdownBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><BadgesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><StrategiesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><CommunityBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><MissionsBlock {...props} accent={accent} /></ChatGPTBlock>
      
    </ChatGPTShell>
  );
}

/* === E — Estrutura ChatGPT (ímpar, accent âmbar) === */
export function ProfileTemplateE(props: TplProps) {
  const accent = "hsl(38 95% 60%)";
  return (
    <ChatGPTShell accent={accent}>
      <ChatGPTBlock>
        <HeaderBlock {...props} accent={accent} />
        <ProgressBlock {...props} accent={accent} />
      </ChatGPTBlock>
      <ChatGPTBlock><RankingBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><PerformanceBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><ScoreBreakdownBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><BadgesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><StrategiesBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><CommunityBlock {...props} accent={accent} /></ChatGPTBlock>
      <ChatGPTBlock><MissionsBlock {...props} accent={accent} /></ChatGPTBlock>
      
    </ChatGPTShell>
  );
}
