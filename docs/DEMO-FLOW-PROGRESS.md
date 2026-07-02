# RESUMO S+ DE CONTINUIDADE — IA Vingativa (fluxo demo + reskin) — 2026-06-30

> **LEIA ESTE DOCUMENTO INTEIRO ANTES DE RESPONDER QUALQUER COISA.** Ele é a fonte de continuidade entre chats. O objetivo é zero perda de contexto: workflow, decisões travadas, estado do código, próximos passos e regras — tudo aqui. Se algo neste resumo conflitar com o código real, **o código vence** (leia-o antes de afirmar).

---

## 0. QUEM É O DONO E COMO ELE TRABALHA (CRÍTICO — ler primeiro)

- **Royal Trader** — fundador solo da **VektaCode** (estúdio fintech/SaaS). Fala **exclusivamente PT-BR**. Brasília (BRT/UTC-3).
- **Modelo de orquestração:** Claude Chat (você) = orquestrador que **escreve prompts** para o **Claude Code (CC)**; o Royal roda os prompts no **Windows/PowerShell** e cola os relatórios de volta. Você **nunca** tem acesso direto ao repo do app dele — só lê o que ele cola (RECON/DOUBLE-CHECK) e os arquivos de design no seu próprio ambiente.
- **Tom dele:** direto, técnico, e **fica MUITO abusivo/xingando** quando (a) o resultado não bate com o handoff/protótipo, ou (b) você pergunta algo que ele **já respondeu no texto**. Regra de ouro: **LEIA o que ele escreveu com atenção total antes de perguntar.** Se ele já cravou no texto, NÃO pergunte de novo — isso o enfurece com razão. Mantenha helpfulness firme: reconheça o erro real, **não** se rebaixe, **não** revide, e **execute**.
- **MAS:** em **dinheiro/lógica de concorrência**, confirmar contradições reais é correto mesmo sob pressão (ex.: ele oscilou gale 3 vs 4 — você confirmou a mudança de teto por ser risco de banca, e estava certo). Decisões de dinheiro são sempre **gated** (você propõe, ele aprova) com explicação leiga do risco.

---

## 1. O WORKFLOW (ele disse: "está EXCELENTE, siga EXATAMENTE") — NÃO DESVIAR

Este é o ciclo que funcionou a sessão inteira. Replicar fielmente:

### 1.1. Ciclo de cada mudança
1. **Você lê a fonte real** (arquivos `.dc.html` do handoff no seu ambiente, ou os RECON/DIAG que ele colou) — **nunca de memória**. Use `grep`/`python` para extrair valores exatos (cores, tamanhos, keyframes), não dite de cabeça.
2. **Você escreve um prompt para o CC** (formato na §1.3), **fatiado pequeno** (CC empaca em prompts grandes — os que ele executou de primeira foram os pequenos e isolados).
3. **Ele pede um REVIEW ADVERSARIAL** do seu próprio prompt antes de rodar (o texto-padrão dele está na §1.4). Você tenta **QUEBRAR** o prompt, acha 🔴/🟡/ℹ️, e corrige.
4. **Ele roda o prompt no CC** → o CC gera um `RECON-*.md` (relatório) + um `DOUBLE-CHECK-*.md` (verificação adversarial do próprio CC, às vezes com fanout de subagentes). Ele cola os dois.
5. **Você revisa os relatórios** contra a fonte, decide se convergiu, e **propõe o commit** (gated).
6. **Ele commita** (cola o resultado do `git push`).
7. **Em telas visuais:** ele sobe pro preview (Lovable Update→Publish) e **manda um print** — você compara com o protótipo.

### 1.2. Padrão de review observado (DITO A ELE, vale repetir)
- Cada prompt leva **~2 ciclos de review**: o **1º pega o achado real**, o **2º confirma (CONVERGIU)**.
- **Distinção importante que você cravou:** em **fatia puramente visual** (cor/espaçamento), depois do 1º review limpo, **RODAR vale mais que um 2º review** (o que falta só aparece no preview). Em **lógica com timing/estado/dinheiro/concorrência**, o 2º review **se paga** (raciocínio sobre event loop, race, etc.). Sugira **um review por prompt** em fatias visuais e **dois** onde há concorrência/dinheiro.
- **Round vazio (CONVERGIU) é resultado legítimo.** NUNCA invente um achado pra parecer diligente — isso viola a regra do review. Se está correto e sem pendência de fonte externa, escreva CONVERGIU e PARE.

### 1.3. FORMATO DO PROMPT PARA O CC (seguir à risca)
```
⚠️ WRITE — <arquivo(s) exatos> (escopo). ESCREVA O CÓDIGO AGORA, NÃO defira (escopo pequeno). NÃO commitar.
<contexto curto: o que é, por que, e o aviso de risco — ex.: "SIMULAÇÃO DEMO (fake), não toca dinheiro real/robô">

cd C:\Users\afili\ia-tradervingativo      ← SEMPRE linha 1 (cada terminal abre em C:\WINDOWS\system32)

PASSO 0 (READ / READ-ONLY) — o que ler e CONFIRMAR antes de escrever. Reportar achados.
PASSO 1..N (WRITE) — instruções cravadas, valores EXATOS (não "conferir no arquivo" se o valor é runtime — CRAVE).
⛔ NÃO tocar: <lista explícita do que preservar — dinheiro/real/motor/infra>.
FIM: tsc (-p tsconfig.app.json) + build VERDE. DIFF + relatório SEM TRUNCAR salvo em
  C:\Users\afili\Desktop\prompts\ia vingativa\RECON-<nome>.md. NÃO commitar.
‼️ PROVAS: <provas específicas — ex.: money-proof grep VAZIO + iniciar() colado idêntico; 5/10 amostras; etc.>
CHECKLIST (SIM/NÃO): <itens verificáveis numerados>. NÃO commite.
```
- **Cabeçalho de risco:** 👁️ READ-ONLY (diagnóstico) ou ⚠️ WRITE.
- **CC auto-accept é seguro** para: diagnósticos read-only; impl que termina com "mostrar diffs, NÃO commitar". Commit/deploy/SQL **sempre gated** (você só PROPÕE).
- **SSH = sempre manual** (nunca automatizar). Mas aqui o deploy é via **Lovable** (Update→Publish), não SSH.

### 1.4. O TEXTO-PADRÃO DE REVIEW QUE ELE COLA (reconhecer e executar)
Ele cola um bloco grande pedindo "review adversarial, tentar QUEBRAR, linha a linha contra a fonte real, 4 lentes (red-team/operador/mantenedor/advogado-do-diabo), severidade 🔴/🟡/ℹ️, honestidade dos dois lados, VEREDITO CONVERGIU ou PARCIAL, correções aplicadas ou propostas gated, e ao fim os prompts corrigidos + ordem exata". **Quando ele cola isso, execute exatamente esse protocolo.** Entregue: VEREDITO · o que foi conferido e contra qual fonte · correções · prompt(s) finais · ordem.

### 1.5. Estrutura de resposta (toda resposta)
- PT-BR, **conciso**, sem formatação excessiva.
- Explique status/achados em **linguagem leiga com analogias** quando útil.
- Termine com **AÇÕES/ORDEM numerada** + (quando aplicável) o semáforo de publish.
- **Decisões de produto/dinheiro:** use o tool de perguntas (botões) só quando a resposta **não está** no que ele já disse. Máximo de cautela pra não repetir pergunta já respondida.

---

## 2. O PRODUTO — visão completa do site (ele explicou; é a fonte da verdade do negócio)

**IA Vingativa** = SaaS afiliado da **CasaTrade** (robô de trading com IA), sob a **VektaCode**. Site: **tradervingativo.pro**. **Funciona APENAS com conta REAL.**

### 2.1. Funil completo (do anúncio à operação)
1. Tráfego pago (Meta Ads e outras) → "saiba mais".
2. Quiz → VSL → checkout → pagamento → **página de obrigado** (vídeo do Royal mostrando a ferramenta + o código **1337** + botão "acessar bot").
3. Cai em **tradervingativo.pro** → registro → "Criar Conta".
4. **Ao criar conta:** cria-se **paralelamente** uma conta na **CasaTrade** (link de afiliado do Royal) **e** na ferramenta IA Vingativa.
5. Usuário entra, preenche o código **1337**. ‼️ **O 1337 só "enche o saco" — NÃO restringe nenhuma função.** É teatro de ativação. (Já é assim no código.)
6. **DEMO (sem depósito):** clica "Ligar IA" → modal (foto 01) → "Iniciar Demo" → tela "Procurando" (radar) → **passa pelos ativos e seleciona UM ALEATORIAMENTE** → opera (operações **100% FICTÍCIAS**, não toca CasaTrade) → pode **PAUSAR/RETOMAR** → ao fim, **Resultado** (foto 05). Demo é **1× por conta**; depois disso, clicar de novo mostra o modal "esgotado" (foto 06: TUTORIAIS + DEPOSITAR).
7. **REAL (após depositar):** painel de configuração fica disponível. "Iniciar IA" → busca operações (foto 07), **escolha de ativo gira ATÉ achar setup** → trava no **primeiro ativo que bate o critério (setup de trade)** → **opera SÓ NELE até o fim** (foto 08) → encerra (foto 09). Dinheiro real na CasaTrade.

### 2.2. REGRA CENTRAL DO ATIVO (ele cravou 2× e se irritou ao repetir)
> **"Embora nas fotos apareçam vários ativos na operação, depois de selecionar o ativo, VAMOS operar APENAS com ele."**
- Demo e real: **passa pelos ativos → trava em UM → todas as operações são nesse mesmo ativo.**
- Diferença demo vs real = só **COMO escolhe**: demo = aleatório; real = o 1º com setup. Resultado idêntico: 1 ativo só.
- As fotos do protótipo com pares variados (USD/JPY, GBP/USD, EUR/JPY…) = **designer enchendo a lista, NÃO valem.**
- Os **4 ativos do radar** = **EUR/USD, GBP/USD, AUD/USD, USD/JPY** (a IA "analisa" esses 4 e trava em 1 deles).

### 2.3. Observações dele (travadas)
- **Painel de operações inacessível antes de depositar** (demo disponível ou não, ou sem saldo): de forma **bonita/inteligente** mantendo a UI premium. **Sugestão recomendada (você propôs, ele ainda não cravou): painel borrado (blur) + cadeado + "Deposite para configurar" + botão Depositar** — mostra o painel (cria desejo), bloqueia interação. Alternativas: campos disabled + selo; estado vazio com CTA. **Decisão ainda ABERTA — confirmar com ele quando chegar a fatia.**
- **Gráfico do cockpit: EXATAMENTE igual ao protótipo** (pendente — fatia posterior; hoje o cockpit tem candlestick, o protótipo quer linha simples / o que estiver no protótipo).
- **Admin: deixar de lado.** **Ranking: arrumar depois.**

---

## 3. AMBIENTE / FONTES / CAMINHOS (decorar)

### 3.1. Repo do APP (frontend)
- GitHub: **`foxz0r-glitch/ia-tradervingativo`** · local **`C:\Users\afili\ia-tradervingativo`**.
- Stack: React 18.3.1 / Vite 5 / TS / Tailwind 3.4.17 / shadcn / lightweight-charts v5.
- Deploy: `git push` versiona; **produção = Lovable (Update→Publish manual)**. Lovable Cloud/Supabase ref: `apkctisbeycjlxjjzmqr`.
- **Pré-lançamento: ZERO usuários reais.** Publicar não expõe ninguém.
- **GOTCHA PowerShell:** cada terminal novo abre em `C:\WINDOWS\system32` → **`cd C:\Users\afili\ia-tradervingativo` SEMPRE na linha 1**. Blocos "confira se aparece isto:" são pra LER/comparar, **não colar no terminal**.

### 3.2. Repo do ROBÔ (backend real — Fase 2)
- GitHub: **`foxz0r-glitch/robo-tradervingativo`** · local **`C:\Users\afili\robo-tradervingativo`** · servidor: **`/opt/robo-tradervingativo`** no Hetzner, Docker.
- ‼️ **DADOS A RE-VERIFICAR (vêm da memória de sessões anteriores, NÃO foram confirmados no transcript desta sessão):** Hetzner host **`5.161.85.179`** (hostname `tapelab`, supostamente **COMPARTILHADO com o TapeLab — NUNCA tocar o host**), source `server.ts` (~1203 linhas), HEAD `dd4a9f1`. **No início da Fase 2, rodar um DIAG read-only no repo do robô pra reconfirmar tudo isto antes de qualquer mudança** (é dinheiro — não afirmar infra de memória).
- CasaTrade via SDK **`@tradecodehub/client-sdk-js`** (v1.3.0): cotação WebSocket, candles OHLCV, `buy()`/`sell()` + early-exit, saldo+demo, comissão. (confirmado nesta sessão)
- **Registro de afiliado JÁ existe no backend** (confirmado nesta sessão): app → proxy `/api/register` com cookie/Referer de afiliado (`AFF_ID`/`BRAND_ID`/`AFF_TRACK` via env) → SSID salvo em `user_credentials` → dashboard puxa saldo → "Ligar IA" opera na conta real. O Login/Registro novo **só religa nesse endpoint existente** — não reconstruir a lógica.
- Deploy robô = rebuild Docker (passo cuidadoso, gated, **demo-antes-de-real**).

### 3.3. HANDOFF ClaudeDesign (FONTE DA VERDADE VISUAL)
- Local do Royal: **`C:\Users\afili\Desktop\prompts\ia vingativa\design_handoff_trader_vingativa\designs\`**
- No SEU ambiente (extraído): **`/home/claude/design_a/design_handoff_trader_vingativa/designs/`** ← desde `8a12d84` o handoff está VERSIONADO no repo em `docs/design-handoff/` (o CC lê de lá nos PASSO 0; re-anexar ao chat é opcional, só pro Claude Chat ler fora do repo).
- Arquivo-chave do fluxo demo: **`Fluxo IA Operando.dc.html`** (os 4 estados: Procurando/Operando/Pausado/Resultado, via `sc-if`/`sc-for`, com um `<script>` que tem a máquina de estados `run()`).
- Outros: `Dashboard.dc.html`, `DeskNav.dc.html`, `SliderRow.dc.html`, `Perfil.dc.html`, `Modal IA Operando.dc.html`.

### 3.4. Pasta de relatórios (SEMPRE salvar aqui, sem subpasta)
**`C:\Users\afili\Desktop\prompts\ia vingativa\`** — todos os `RECON-*.md` e `DOUBLE-CHECK-*.md` vão aqui, **sem truncar**.

---

## 4. ESTADO ATUAL DO CÓDIGO — commits no ar (sequência)

Repo do app, branch `main`. **Último commit de CÓDIGO = `14fde8b`.** (Commits de docs podem existir por cima — ex.: 2819f1b/6b8dcb8/8a12d84; `git log -1` mostrar hash de docs é ESPERADO.)

| # | Hash | O que é |
|---|------|---------|
| 1 | `b7dab45` | Fase 0 |
| 2 | `3ff098d` | COCKPIT-A |
| 3 | `bff72b2` | COCKPIT-B (gale 1→5 + clamp defensivo) |
| 4 | `e7591ba` | RECON-1 App.tsx (rail 76px + header único; removeu sidebar/Broker/Admin) |
| 5 | `7cc96c9` | RECON-2 UserMenu (dropdown 6 itens do Perfil.dc.html) |
| 6 | `ad0fa24` | RECON-3 Index (saldo/tabs/Grupo VIP/Modelo IA 2×2 + event bus `tv:open-activation`; lógica robô/clamp/1337 intacta) |
| 7 | `90859ed` | RECON-4 CockpitVariants (sliders SliderRow + Defesa Técnica + LIGAR IA) |
| 8 | `7fd885d` | gale teto 5→4 + remove AIConfigPanel morto |
| 9 | `fdd2888` | **motor demo** (valores: win +445/loss −500, 6-8 ops, máx 2 perdas, 1ª win, sempre positivo) |
| 10 | `98991c6` | **fundação fluxo demo** (estado de fase + lista/agregados próprios isolados do cockpit + overlay tela-cheia + loop cancelável) |
| 11 | `da8d3df` | **tela Procurando** (radar + IA ANALISANDO + chips de pares) — VALIDADA com print |
| 12 | `40bfabe` | **hero da tela Operando** (badge IA OPERANDO AO VIVO + acumulado R$ + métricas Operações/Acerto/Wins) |
| 13 | `85df0f2` | **ativo único por sessão** (sorteado dos 4 do radar, fonte única `RADAR_PAIRS` em `src/lib/demoConstants.ts`) + **lista de operações ao vivo** (3b) na tela Operando |
| 14 | `650c781` | **loop Modelo B** (radar só na abertura → operando fixo, sem voltar; `demoOperatingRef` síncrono; `handleDemoParar` decide por ref: radar→idle sem queimar sessão, operando→resultado) — **fluxo real intacto, money-proof vazio** |
| 15 | `14fde8b` | **fatia 3c**: list header "Operações ao vivo" + indicador "buscando…" (`tv-dotBlink`) + linha "procurando próxima entrada…" recondicionada pra fase operando (era código morto em "procurando"); `marginTop:16` provisório da lista REMOVIDO (espaçamento agora = padding do header, fiel ao .dc.html L136/L150) |

**Dashboard reconstruído = COMPLETO** (4 peças commitadas, validado com print, idêntico ao handoff). Diferenças restantes do dashboard são só no GRÁFICO (cabeçalho "Euro→Dólar"+bandeiras+"AO VIVO", candlestick vs linha, selo "ROBÔ CONECTADO") → mapeadas pra fatia do gráfico.

**Telas Procurando e hero+lista Operando: VALIDADAS no preview** (prints batem com o protótipo).

---

## 5. ARQUITETURA DO FLUXO DEMO (como está montado no código)

### 5.1. Arquivos
- **`src/hooks/useDemoMode.ts`** — o "motor": `generateSessionOps` gera o lote de operações fake. `runNextOp()` (export real do hook; `runNextDemoOp` é o alias no destructure do Index) consome a sessão (MAX_SESSIONS=1, persiste em `user_demo_state` + localStorage) e retorna as ops. Elegibilidade: `isDemoEligible` (sem depósito), `isExhausted`, `sessionsLeft`.
- **`src/pages/Index.tsx`** — orquestra. Tem `handleStartDemoSession` (o loop das fases), os estados/refs da demo, e o `canStart` do "Ligar IA". **Também tem a lógica do FLUXO REAL** (handleStart com saldo≥2 → `iniciar()`/payload/clamp) — **NUNCA TOCAR sem money-proof**.
- **`src/components/DemoFlowOverlay.tsx`** — o overlay tela-cheia com as 4 telas (Procurando feita; Operando hero+lista feita; Pausado/Resultado = placeholders).
- **`src/lib/demoConstants.ts`** — `export const RADAR_PAIRS = ["EUR/USD","GBP/USD","AUD/USD","USD/JPY"] as const;` **fonte única** dos 4 pares (usada pelo motor pra sortear o ativo E pelos chips do radar). NÃO duplicar essa lista em outro lugar.

### 5.2. Estados/refs da demo (no Index, isolados do cockpit)
- `demoPhase`: `"idle"|"procurando"|"operando"|"pausado"|"resultado"` — governa qual tela aparece.
- `demoOps` (lista PRÓPRIA, separada de `operations` do cockpit — op fake NUNCA vaza pro histórico real).
- Agregados PRÓPRIOS: `demoSessionPnl`, `demoWins`, `demoLosses` (NÃO usar `sessionPnl`/`ganhos`/`perdas`, que são do cockpit).
- `demoEndedManually` (pra tela Resultado distinguir "Encerrada manualmente" vs "Meta concluída").
- `demoCancelRef` + `demoTimersRef` + `cancelDemoTimers()` = cancelamento de timers (PARAR não deixa timer órfão).
- `demoSleep(ms)` = sleep CANCELÁVEL (resolve `false` no cancel → o loop aborta sem setState órfão).
- **`canStart` do Ligar IA** inclui `&& demoPhase==="idle"` → impossível reabrir o modal por cima do overlay.
- `demoRunning=false` acontece em: `handleDemoFechar` (FECHAR do Resultado), no catch do motor, no caso ops vazio/null e no PARAR durante o radar (radar→idle, liberando o LIGAR IA) — Modelo B (`650c781`). (Comentário estale no Index ~L810 flagado para correção na micro-fatia comment-sync.)

### 5.3. Motor (`generateSessionOps`) — regras TRAVADAS (commit `fdd2888` + `85df0f2`)
- **win = pnl +R$445 EXATO; loss = pnl −R$500 EXATO** (constantes; `pnl` é o valor canônico que a lista exibe E que o acumulado soma — linha=acumulado batem).
- **6 a 8 operações** por sessão.
- **Máx 2 perdas** por sessão; **1ª operação SEMPRE win**; ordem das perdas embaralhada entre 2ª e última.
- **Saldo final SEMPRE positivo** (pior caso 4w+2l = +780; melhor 8w = +3560). Garantido por construção.
- **1 ativo por sessão** (`sessionAsset` sorteado 1× de `RADAR_PAIRS`, repetido em TODAS as ops via `symbol`). Direção call/put pode variar por op (só o ativo trava). `DEMO_ASSETS` foi **removida** (era a lista antiga com "-OTC"/EUR/GBP, ficou órfã).
- **Nota:** `invest`/`payout` existem no tipo `Operation` mas são cosméticos — a tela mostra **só o lucro** (`pnl`), sem linha "investido". As ops demo são **EFÊMERAS** (somem ao fechar, via `demoOps` separada — não vão pro histórico do cockpit).
- **MAX_SESSIONS=1** (1×/conta) — NUNCA mudar.

### 5.4. Modelo de fluxo escolhido: **MODELO B (protótipo fiel)** ‼️
O Royal escolheu **Modelo B** (espelha o `run()` do protótipo):
- **Radar (fase "procurando") aparece SÓ na abertura** (~3.4s) → transição ÚNICA → **fase "operando" fixa até o fim** (empilha as ops uma a uma, ~1.5-2s entre elas), **NUNCA volta pro radar**.
- O "procurando próxima entrada" é um **cabeçalho permanente no topo da lista** durante o operando (não uma volta ao radar).
- Derivações do protótipo: `isLive = phase==='operando' && !paused` (mostra "buscando…" + "procurando próxima"); `isPaused = phase==='operando' && paused` (mostra "EM ESPERA", esconde "procurando próxima").
- **CONTRASTE:** o código tinha **Modelo A** (alternava procurando↔operando, voltando ao radar entre trades) — isso FOI **substituído** pelo loop Modelo B (`650c781`).

---

## 6. ✅ Prompt 2 (loop Modelo B) — FEITO E COMMITADO (`650c781`)

**Status:** o loop Modelo B foi implementado, revisado (money-proof vazio + race fechada por ref síncrono) e **commitado em `650c781`**. O próximo passo do fluxo demo é a **Fatia 4 — Pausado** (§7).

### 6.1. O que o Prompt 2 entregou (já no código, `Index.tsx`)
- Abertura: fase "procurando" + `demoSleep(3400)` (radar) **antes** de consumir a sessão.
- `runNextDemoOp()` consumido **só depois** do radar (PARAR no radar NÃO queima a sessão única).
- **Ref síncrono `demoOperatingRef`** setado `true` **imediatamente após** ops válidas, **sem `await` no meio** (JS single-thread → janela de race ZERO).
- Transição única pra "operando" + empilha as 6-8 ops do motor (~1.5-2s entre elas), sem voltar pro radar.
- `handleDemoParar` decide por `demoOperatingRef`: `false` (radar) → "idle" (fecha limpo, sem Resultado vazio, sem queimar sessão); `true` (operando) → "resultado" (manual).
- **Money-proof VAZIO:** nenhuma linha do fluxo real (`handleStart` saldo≥2 / `iniciar()` / clamp) foi tocada.
- Confirmado por **fanout real de 2 agentes** (race-agent R1-R6 + money-agent M1-M5, convergência total, eslint baseline, tsc=0).

### 6.1.1. ⚠️ PENDÊNCIA CONHECIDA E PARKEADA — burn-on-idle (recomendação Claude; blindagem sob demanda)
**O quê:** se o usuário clicar PARAR no exato instante do `await runNextDemoOp()` (a janelinha de poucos ms logo após o radar), a sessão única é **consumida** (MAX_SESSIONS=1, `sessionsUsed++` síncrono no motor) mas cai em "idle" sem mostrar nada — a demo é "gasta" sem o usuário ver. **Não é dinheiro real** (é a sessão demo). Janela ínfima (milissegundos); os 2 agentes do fanout classificaram como não-defeito inerente.
**Status:** PARKEADO por recomendação do Claude (30/06), apresentada ao Royal no chat — blindar exigiria mexer no `useDemoMode` (o motor, área protegida e já provada) pra mover o `sessionsUsed++` pra depois do "operando" ou tornar o consumo cancelável; desproporcional agora (janela de ms, fluxo de demo). **O Royal pode pedir a blindagem a qualquer momento** — prompt cirúrgico no motor com money-proof + review. Candidato natural: quando tocarmos o motor de novo (ex.: Fase 2).

### 6.2. O PROMPT 2 (arquivado — já rodado, não rodar de novo)
> Mantido aqui só como registro histórico do que foi aplicado em `650c781`. **NÃO re-executar.**

```
[Prompt 2 — loop Modelo B — já aplicado em 650c781. Ver o diff do commit se precisar do detalhe.
Pontos cravados: demoOperatingRef síncrono sem await; runNextDemoOp pós-radar; handleDemoParar por ref;
empilha 6-8 do motor sem voltar ao radar; money-proof vazio.]
```

---

## 7. ROADMAP DAS FATIAS RESTANTES (ordem)

1. ✅ **FEITO:** Dashboard · gale teto 4 · motor demo (valores) · fundação (fase+overlay+lista própria+cancelamento) · tela Procurando · hero Operando · ativo único + fonte única + lista ao vivo (`85df0f2`) · **loop Modelo B** (`650c781`). fatia 3c (`14fde8b`). **Último commit de código: `14fde8b`.**
2. ✅ **FEITO: Prompt 2 — loop Modelo B** (`650c781`, radar só na abertura → operando fixo, PARAR por ref síncrono).
3. ✅ **FEITO (`14fde8b`): Fatia 3c** — list header "Operações ao vivo" + "buscando…" (`tv-dotBlink`) + linha "procurando próxima entrada…" no operando (valores na tabela §4 linha 15 e no .dc.html).
4. ➡️ **PRÓXIMO: Fatia 4 — Pausar/Retomar + tela Pausado** (foto 04): liga os stubs `handleDemoPausar`/`handleDemoRetomar` (precisa pausar o loop de empilhamento — provavelmente um flag `demoPausedRef` que o loop checa, ou reestruturar o sleep). Tela Pausado: badge "❚❚ PAUSADO" âmbar `#f0bf63`/`#e0a93c` + "Operações em espera — toque RETOMAR" + lista congelada + botões RETOMAR/PARAR. Lado direito do list header vira "EM ESPERA" `600 10px 'Sora' .12em #e0a93c` (.dc.html L144-146); a linha "procurando" some e entra o card "Operações em espera — toque RETOMAR" (.dc.html L159-163); os dois pontos de troca já estão prontos nas condições `phase === "operando"` da 3c. **É lógica com timing → review duplo.**
5. ⏳ **Fatia 5 — tela Resultado** (fotos 05 e 09): ✓ verde + "SESSÃO ENCERRADA" + **2 textos por `demoEndedManually`**: "Encerrada manualmente" (PARAR) / "Meta da sessão concluída" (fim natural) + "SALDO FINAL DA SESSÃO" + número grande + 3 métricas + botões **FECHAR** + **+ DEPOSITAR** (via `demoDepositRef` que já existe). Keyframe do ✓: `tv-pop` (cubic-bezier `.2,1.2,.4,1`).
6. ⏳ **Painel travado sem saldo** (decisão de UI ABERTA — recomende borrado+cadeado, confirme com ele).
7. ⏳ **Gráfico do cockpit = EXATAMENTE igual ao protótipo** (linha simples no lugar do candlestick; tirar "Euro→Dólar"; ver `Dashboard.dc.html`).
8. ⏳ **FASE 2 (dinheiro real, gated):** mudanças no robô (`server.ts`): (a) **caça-ativos** (girar entre os 4 até achar setup → travar) — hoje é ativo FIXO; (b) **travar teto de gale 4 no robô** — hoje é gale ×2 sem cap; (c) ligar as telas Operando/Resultado no stream real que o robô JÁ emite (`operacao_fechada`). Tudo via DIAG read-only → prova → demo-antes-de-real → deploy Docker gated (host compartilhado com TapeLab — cuidado).
9. ⏳ Testes do motor demo (invariantes do generateSessionOps: 6-8 ops, máx 2 perdas, 1ª win, sempre positivo, 1 ativo do RADAR_PAIRS, MAX_SESSIONS=1) — candidato pós-Fatia 5 / antes da Fase 2; decisão do dono (cobertura atual ~zero, vitest só com teste de exemplo).

---

## 8. O ROBÔ REAL HOJE (relevante só pra Fase 2)

> ‼️ Fonte: `DIAG-ROBO-fluxo-ia.md` (DIAG read-only do `server.ts`) **foi feito em SESSÃO ANTERIOR, não nesta**. Os números abaixo (HEAD `dd4a9f1`, ~1203 linhas, linhas específicas) **devem ser reconfirmados com um novo DIAG read-only no início da Fase 2** — não tratar como verificado agora. **A DEMO atual NÃO usa o robô** — é tudo fake no app.

Contrato (do DIAG anterior) = 14 eventos / 5 comandos / 4 rotas HTTP. Achados:
- 🔴 **REAL-only, sem modo DEMO** (`BalanceType.Real` fixo). → contornado: demo é no app.
- 🔴 **Sem PAUSAR/RETOMAR** (só start/stop; `parar` encerra).
- 🔴 **Sem estado "Procurando"** (espera em silêncio, não emite).
- 🔴 **Ativo FIXO** (default 76), **NÃO caça vários** → mudar na Fase 2 (caça-ativos por setup, girando entre os 4 até achar).
- 🔴 **Gale ×2 SEM cap, all-in** (dobra até `maxPerdasSeguidas`, reset no win) → travar teto 4 na Fase 2.
- ✅ **JÁ emite cada operação** (`operacao_fechada`) **e auto-para server-side** (lucro = delta do saldo real). → telas Operando/Resultado em real ficam perto de funcionar.

**Confirmado NESTA sessão (mais firme que o DIAG antigo):**
- O robô recebe `maxPerdasSeguidas` via WebSocket; **range nativo de gale = 1–8** (confirmado 14/06) → o teto 4 está dentro do range (seguro).
- A "conta CasaTrade em paralelo" e o registro de afiliado **já existem** no backend (`/api/register`, ver §3.2).

---

## 9. DECISÕES DE PRODUTO/DINHEIRO TRAVADAS (não reabrir sem ordem dele)

- **GALE: teto 4** (1–4 segmentos), default 2. Confirmado após você alertar do risco de banca (4 perdas = aposta 8× a inicial). Setter vivo único = GaleControl (clamp 1..4); AIConfigPanel morto foi removido.
- **DEMO = simulação fake no app**, não no robô, não opera CasaTrade. Gatilho: saldo<2 → Ligar IA → fluxo fake.
- **Valores demo:** win +445 / loss −500 (o número EXIBIDO, = `pnl`), 6-8 ops, máx 2 perdas, 1ª win, saldo final sempre positivo, % acerto alto (~67-87% nas fotos — coerente com máx 2 perdas).
- **Demo "sempre vence":** o Royal está ciente do risco regulatório (CVM/CasaTrade) e **assumiu explicitamente** após você alertar.
- **1 ativo por sessão** (demo e real), sorteado dos 4 do radar (EUR/USD, GBP/USD, AUD/USD, USD/JPY).
- **Modelo B** (radar só na abertura → operando fixo).
- **Pausar/Retomar funcional na demo** (Fatia 4).
- **Resultado: 2 textos** (manual vs meta).
- **1337 não bloqueia nada** (teatro).
- **Admin/Ranking: adiados.**

---

## 10. REGRAS DE WORKFLOW PERMANENTES (carregar em todo chat)

- **PORTAR do `.dc.html` LENDO o arquivo, não de memória.** Seguir o RENDER desenhado, não a legenda em prosa (ex.: o menu do avatar tinha 6 itens no render vs 5 na legenda — render venceu).
- **Valores runtime (`{{ }}`/script) NÃO estão no HTML como literais** — quando o valor vem do `<script>` (ex.: cores de win/loss, `totalColor`), **EXTRAIA do script e CRAVE no prompt**, não mande o CC "conferir no arquivo" (ele não acha). Lição cara: você inventou `#f0656e` pro número negativo; o real era `#f0726a` (no `totalColor` do script) — o CC corrigiu.
- **Dados do mockup são EXEMPLO** (saldo "$55.175,76", valores variados, 3 perdas). A moeda/valores reais vêm do app/regra. **Não hardcodar "$"** — usar `formatMoeda(valor, "BRL")` (sem moeda → fallback "$", então SEMPRE passar "BRL" na demo).
- **Consistência linha=acumulado:** o que a lista exibe (`pnl`) tem que ser o que o acumulado soma. Não deixar a tela mostrar números que não batem.
- **Timers/setTimeout precisam de cancelamento no PARAR** (senão timer órfão reabre o overlay). Padrão: `demoSleep` cancelável + `cancelDemoTimers` + `demoCancelRef`.
- **Estados/agregados compartilhados (cockpit) → a demo usa os PRÓPRIOS** (não poluir o cockpit; op fake não vaza pro histórico).
- **React: ler estado em handler → usar REF síncrono**, não o state do closure (que é do render onde o handler foi criado). Lição: decidir PARAR por `demoOps.length` (state) dava leitura velha → trocado por `demoOperatingRef`.
- **Money sempre com Passo 0 read-only + money-proof** (grep VAZIO no fluxo real + `iniciar()` colado byte-idêntico).
- **Ao remover arquivo:** `git rm` + `Test-Path`=False + git status `D` (não esvaziar).
- **FATIAR sempre** (CC empaca em prompt grande). Se a fatia toca o Index (lógica), isolar e provar dinheiro intacto.
- **DOUBLE-CHECK / docs dos repos atualizados:** ‼️ ELE ENFATIZOU — os relatórios `RECON`/`DOUBLE-CHECK` devem ser salvos **completos, sem truncar**, na pasta de prompts, e refletir o código real. O `CLAUDE.md` (se houver no repo) é fonte canônica — manter doc-sync. Não deixar doc divergir do código. **Cada `RECON` deve ter:** âncora de estado (HEAD, sujos), diff, provas, checklist SIM/NÃO, flags/não-100%, e continuidade.
- **BAR = solução mais correta/completa/definitiva SEMPRE.** Nunca recomendar opção por ser mais rápida/simples/menor-diff. (Foi a regra que decidiu usar fonte única `RADAR_PAIRS` em vez de duplicar a lista.)
- **Default = fechar tudo agora.** Só ordem explícita dele estaciona um item.
- **Session end:** gere um resumo de continuidade como ESTE (com commits, estado, pendências, prompt de continuidade).
- **ERRATUM conhecido:** `docs/design-handoff/README.md` §9 (L90) chama a linha "procurando" de "última linha"; o RENDER congelado (L151-158) a põe como 1º filho do scroll — RENDER vence; snapshot congelado NÃO editado.

---

## 11. 📡 SEMÁFORO DE PUBLISH

Sem usuários, publicar não expõe ninguém. Republicar a cada marco conferido. Recomendação: commitar cada fatia gated → preview → print quando houver tela nova → fechar visual. Telas já validadas no preview: Procurando, Operando (hero+lista). Próximo print: Operando completa pós-3c = PENDENTE (1ª validação visual do Modelo B em runtime). Observar no print: a última op renderiza junto do flip pro resultado (batch React 18, pré-existente no Index — fora do 3c).

---

## 12. COMO COMEÇAR O PRÓXIMO CHAT (checklist pro Royal)

1. Cole este resumo (o progress doc).
2. **Re-anexe o handoff** `Fluxo IA Operando.dc.html` (e o resto do `design_handoff_trader_vingativa/designs/`) — OU aponte pra `docs/design-handoff/` no próprio repo, onde o handoff está versionado desde `8a12d84`.
3. Estado: **Fatia 3c commitada (`14fde8b`)**; print da Operando completa (Modelo B em runtime) = **PENDENTE**.
4. Próximo = **Fatia 4 (Pausado — review duplo)** → depois **Fatia 5 (Resultado)**.

> **Estado num cartão:** último commit de código = `14fde8b`. Motor demo fechado (1 ativo dos 4 do radar, +445/−500, 6-8 ops, máx 2 perdas, 1ª win, sempre positivo) + **loop Modelo B FEITO** (radar só na abertura → operando fixo; PARAR por ref síncrono: radar→idle sem queimar sessão, operando→resultado) + **Fatia 3c FEITA** (list header "Operações ao vivo" + "buscando…" + linha "procurando próxima entrada…" no operando). Telas Procurando + Operando(hero+lista) validadas no preview (inalteradas); o **Modelo B em runtime ainda não foi previewado** (print da Operando completa pós-3c = PENDENTE). **PRÓXIMO: Fatia 4 (Pausado)**, depois Fatia 5 (Resultado), painel travado, gráfico, e Fase 2 (robô real). Workflow: você escreve prompts pro CC, ele roda no Windows, review adversarial em cada um, commit gated, fonte = `.dc.html` lido (não memória).
