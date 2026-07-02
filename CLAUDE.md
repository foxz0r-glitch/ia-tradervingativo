# IA Vingativa — CLAUDE.md (fonte canônica)

> SaaS afiliado CasaTrade (robô de trading IA), sob VektaCode. Site: tradervingativo.pro. PRÉ-LANÇAMENTO, zero usuários reais. Frontend React 18.3.1/Vite 5/TS/Tailwind 3.4.17/shadcn. Deploy: git push versiona; produção = Lovable (Update→Publish).

## ⚠️ Continuidade — LEIA ISTO PRIMEIRO
Estado atual, decisões, próximos passos e prompts prontos: **docs/DEMO-FLOW-PROGRESS.md** (fonte ÚNICA do estado, atualizada a cada sessão). Ler ANTES de qualquer tarefa. Este CLAUDE.md NÃO repete o estado — só contém o que é invariável (regras + o que nunca tocar) e aponta pro progress doc.

## Regras de workflow (invioláveis)
- Orquestração: Claude Chat escreve prompts → CC executa no Windows/PowerShell → Royal cola RECON/DOUBLE-CHECK.
- Todo prompt CC: `cd C:\Users\afili\ia-tradervingativo` na linha 1; PASSO 0 read-only; ⛔ lista do que não tocar; FIM com tsc+build verde + DIFF + relatório .md (sem truncar) em C:\Users\afili\Desktop\prompts\ia vingativa\; "NÃO commitar" (commit/deploy/SQL sempre gated).
- Money: SEMPRE Passo 0 + money-proof (grep VAZIO no fluxo real + iniciar() colado byte-idêntico).
- Fonte = código + .dc.html LIDOS (nunca de memória). Valores runtime (script) extraídos e cravados no prompt.
- BAR = solução mais correta/completa/definitiva sempre (nunca por ser mais rápida/menor-diff).
- Fim de sessão: ATUALIZAR docs/DEMO-FLOW-PROGRESS.md (committed) + push. Continuidade não mora no sandbox.

## ⛔ NUNCA TOCAR sem money-proof
- src/pages/Index.tsx: o FLUXO REAL (handleStart saldo>=2 → iniciar()/payload/clamp/cockpitLimits).
- O robô real (repo robo-tradervingativo; tratar host como compartilhado/sensível) — só Fase 2, via DIAG read-only primeiro.
- MAX_SESSIONS=1 (DEMO_MAX_SESSIONS), persistência da demo, regras do motor (win+445/loss−500, 6-8 ops, máx 2 perdas, 1ª win).
