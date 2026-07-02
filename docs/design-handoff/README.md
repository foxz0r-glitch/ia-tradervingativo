# Handoff: Trader Vingativa — App de Trading Automatizado com IA

## Overview
Redesign mobile-first (responsivo: desktop, tablet, mobile) do app **Trader Vingativa** (tradervingativo.pro) — um app de trading automatizado onde uma IA opera pares de Forex pelo usuário. Este pacote cobre o app inteiro, tela por tela: cockpit/painel de controle, histórico, navegação/sidebar, perfil, ranking, planos, modais de conta e financeiros, o fluxo do modal "IA operando ao vivo", a tela pós-compra e os overlays de loading.

Estética: **fundo quase preto, verde neon (#22c55e) como cor primária, cards "glass" com bordas verdes e leve glow, labels em maiúsculas com letter-spacing, tipografia Sora + JetBrains Mono**. Movimento e estados "ao vivo" são centrais — o usuário precisa sentir que "a IA está trabalhando", nunca que travou.

## About the Design Files
Os arquivos em `designs/` são **referências de design feitas em HTML** (protótipos que mostram aparência e comportamento pretendidos) — **não são código de produção para copiar diretamente**. Eles são "Design Components" (`.dc.html`): um pequeno runtime (`support.js`) renderiza um template + uma classe de lógica. Use-os como **a especificação visual e de interação**.

A tarefa é **recriar estes designs no ambiente do codebase de destino** (React, Vue, React Native, etc.) usando os padrões, o sistema de design e as bibliotecas já estabelecidos lá. Se ainda não existe um ambiente, escolha o framework mais apropriado (sugestão: **React + TypeScript + Tailwind** ou CSS-in-JS, dado o uso intenso de tokens e estados) e implemente os designs nele.

Cada tela de "frame" no HTML aparece em molduras rotuladas (Desktop · 1160 / Mobile · 390) lado a lado sobre um fundo cinza — isso é só o palco de apresentação. **No app real, cada moldura é uma viewport**; ignore o fundo cinza e as legendas.

## Fidelity
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos, raios, sombras, glows e interações são finais e devem ser reproduzidos fielmente, adaptados aos componentes do codebase. Os valores exatos estão na seção **Design Tokens**.

## Arquitetura responsiva
- **Mobile (390px ref)**: tela cheia, conteúdo empilhado, navegação por **drawer** (hambúrguer abre menu por cima) + header compacto. Modais viram **bottom-sheets** (cantos arredondados no topo, alça de arraste).
- **Tablet**: a fechar depois — herda do desktop reorganizando colunas para empilhar (não foi finalizado nestes mocks; trate como desktop estreito).
- **Desktop (1160px ref)**: **nav lateral fixa** (rail de 76px, colapsável só-ícones) + header de 62px + conteúdo multi-coluna. Modais centralizados com backdrop.
- Os frames de device no HTML (radius 46px mobile / 24px desktop, status bar fake) são **chrome de apresentação** — não implemente o bezel; só o conteúdo interno.

---

## Screens / Views

### 1. Cockpit + Painel de Controle (`Dashboard.dc.html`, `Cockpit Redesign.dc.html`)
Tela principal (direção **A · Cockpit linear**, oficial). O `Dashboard.dc.html` é a versão final unificada com a aba **COCKPIT | HISTÓRICO** no topo do conteúdo (abre no Cockpit; alterna o miolo sem sair do dashboard — nav e header permanecem). `Cockpit Redesign.dc.html` contém as 3 direções exploradas (A/B/C) — referência histórica; **a oficial é a A do Dashboard**.

- **Header (desktop)**: label "COCKPIT DO TRADER" (Sora 700, 12px, letter-spacing .26em, cor #5d8a70) à esquerda; à direita botão **+ Depositar** (verde sólido), **Ativar Plano** (outline), e **avatar** (círculo gradiente verde com iniciais "TM" + chevron ▾) que abre o menu do avatar.
- **Aba COCKPIT | HISTÓRICO**: pílulas (ativa = borda rgba(34,197,94,.5), fundo rgba(34,197,94,.14), texto #5dffa0; inativa = borda branca translúcida, texto #9bb0a5). Largura máx ~300px desktop, full no mobile.
- **Coluna esquerda (desktop) / topo (mobile)**:
  - **Card de saldo**: gradiente verde translúcido, borda rgba(34,197,94,.28), glow. "SALDO DA CONTA" (label upper) + valor `$ 55.175,76` (JetBrains Mono 700, 36px desktop). À direita "RESULTADO HOJE" `+$ 842,91` (verde #34d77a). No mobile, botões Depositar/Ativar Plano dentro do card.
  - **Gráfico** (`MiniChart` — ver componente): placeholder animado, altura 300px desktop / 170px mobile.
  - **Card Grupo VIP**: ícone "pessoas" SVG line verde, título + "Comunidade e sinais exclusivos", seta ↗.
- **Coluna direita (desktop) / abaixo (mobile) — painel de configuração**:
  - **Modelo de inteligência**: grid 2×2 de cards selecionáveis (Claude, GPT-5, Gemini, Grok 3 — **um por vez**). Card selecionado: borda rgba(34,197,94,.55), fundo rgba(34,197,94,.08), glow, radio preenchido. Cada card tem ícone (`icons/*.webp`), nome (Sora 700) e subtítulo (provedor).
  - **Sliders** (`SliderRow`): "Valor por operação", "Meta", "Stop loss" — cada um com label upper, valor em pílula (mono), trilho com preenchimento e thumb com glow. Stop loss usa accent vermelho (#ef4444). Prefixo `$`.
  - **Defesa Técnica** (antes "Proteção (gale)"): stepper − / + com valor central e 5 segmentos preenchíveis (2 ativos por padrão).
  - **Botão LIGAR IA**: full width, h~58px, borda+fundo verde translúcido, texto #5dffa0 (Sora 700, letter-spacing .16em), glow forte, ícone ▶. **Este botão dispara o fluxo "IA Operando" (item 9).**

### 2. Histórico de Operações (`Historico de Operacoes.dc.html`, `HistView.dc.html`, `OpDetail.dc.html`)
- **Duas abas**: "All-Time" (tudo) e "Sessão" (agrupado por sessão em **accordion**).
- **All-Time**: desktop = tabela (colunas Ativo / Resultado / Payout / Horário); mobile = lista empilhada. Cada op: par, badge WIN (verde) / LOSS (vermelho), valor `+$`/`-$` (mono colorido), horário. Borda/tint do card segue WIN/LOSS.
- **Sessão**: cards de sessão expansíveis (caret ▸/▾) com nome (#004), data·modelo, WR%, contagem W/L e total colorido. Expandido revela as ops dentro.
- **Detalhe da operação** (`OpDetail`): ao tocar uma op abre modal (desktop centralizado / mobile bottom-sheet) com par, badge, valor, payout %, horários abertura/fechamento, data.
- `HistView.dc.html` é o componente reutilizável da lista (prop `device: "desktop"|"mobile"`) embutido no Dashboard.

### 3. Sidebar / Navegação (`Sidebar Navegacao.dc.html`, `NavPanel.dc.html`, `DeskNav.dc.html`)
- **Itens** (nesta ordem): **IA Vingativa** (→ cockpit/dashboard), **Ranking**, **GRUPO VIP** (link externo ↗).
- **Rodapé**: card de rank do usuário (emblema **Prata I** + "Rank" + chip de streak "⚡ 18d", que só aparece com streak ≥ 3), card do **plano atual** (clicável → Planos), **Suporte**, **Sair**.
- **Colapsável**: desktop expandida (264px) ↔ colapsada (só ícones, 76px — o emblema de rank some quando colapsada). Mobile = **drawer** que abre por cima com backdrop.
- **Logo**: "V" verde (`symbol-v-solid` — ver Assets) com leve glow.
- `DeskNav.dc.html` = rail de ícones do desktop (bot/IA ativa com glow, grupo, troféu/ranking) — ícones **SVG line** no estilo do projeto (sem emoji). `NavPanel.dc.html` = painel expandido reutilizável.

### 4. Perfil + Menu do Avatar (`Perfil.dc.html`)
- **Menu do avatar** (dropdown desktop / bottom-sheet mobile): **Perfil**, **Enviar foto**, **Retirar fundos**, **Copiar ID** (mostra ID 193698534), **Contatar suporte**, **Sair** (vermelho). Cabeçalho com avatar + nome + "Plano Pro". (Depositar fica no header; não repetir aqui.)
- **Tela de Perfil** (aberta pelo "Perfil"): abas **Informações Pessoais** e **Plano & Uso** (estado "em breve").
  - Card de perfil: avatar com botão de câmera, nome + selo verificado, barras de **Nível (XP)** e **Rank — Prata I**, registro, **ID** copiável.
  - Campos: Nome completo (editável), **E-mail (somente leitura/consulta, não editável)**, País ("Brasil" — sem bandeira/emoji), Telefone. Botão **Salvar alterações**.
  - "Voltar ao Dashboard" no topo.

### 5. Ranking + Rank-up (`Ranking.dc.html`)
- **Duas abas**: "Temporada Atual" e "MVPs".
- **Temporada Atual**: banner da temporada (#01, LAP 21/30, 70%, dias restantes). **Pódio em destaque** para o Top 3: card #1 elevado (ouro, medalha de coroa, glow dourado), #2 (prata) e #3 (bronze) — cada um com emblema grande, nome, rank e chip de streak. Abaixo: "Demais posições" (4º+) em lista, com Top Streaker (⚡ raio) e Hall da Fama ao lado/abaixo.
- **MVPs**: navegação entre temporadas (‹ Junho 2026 ›), estado "aguardando vencedores", pódio Campeão/Vice placeholder.
- **Rank-up** (celebração de subida de rank): desktop = modal centralizado (emblema com anéis pulsantes, faíscas, "Você subiu para Prata II", botão Continuar); mobile = **toast** no topo ("▲ Rank up! Prata II · Você subiu de rank!").
- Usa os **emblemas reais de rank** em `assets/ranks/` (ver Assets). Nota: "patente" foi renomeado para "rank" em todo o app.

### 6. Planos (`Planos.dc.html`)
- **3 cards**: **Free** (R$ 0, conta demo, "Plano atual"), **Pro** em destaque ("Mais popular", elevado, glow verde, R$ 97/mês, CTA Assinar Pro), **Black** (accent dourado, R$ 297/mês). Cada card: nome, preço, tagline, lista de recursos (✓ verde / ✕ apagado), CTA.
- **Upsells "Turbine sua conta"**: Grupo VIP (R$ 47/mês), Sinais Premium (R$ 67/mês), Mentoria 1:1 (R$ 197/sessão) — cada um com ícone, preço e botão **Adquirir**.
- Mobile: Pro primeiro, depois Black, Free como linha "atual", upsells em lista.
- **Valores são placeholders** — confirmar com o produto.

### 7. Modais financeiros (`Modais.dc.html`)
Três modais (desktop centralizado / mobile bottom-sheet), todos com badge "AMBIENTE SEGURO · SSL" e **e-mail + senha copiáveis** (mesmos dados da conta IA → usados para acessar a corretora):
- **Depósito**: card de saldo (R$ 0,00) + instrução + campos copiáveis + botão **Depositar agora ↗** (externo) + "Ver tutoriais".
- **Saque**: disponível para saque + instrução + campos copiáveis + **Sacar agora ↗**.
- **Acessar Broker**: credenciais de exemplo copiáveis (e-mail `usuario@email.com`, senha mascarada com olho `Vingativa@2026`) com **feedback "Copiado"** + **Abrir traderoom ↗** + "Acessar grupo de operações".

### 8. Modais de conta (`Modais Conta.dc.html`)
- **Foto de perfil**: área de recorte **circular** com "arraste para reposicionar", slider de zoom, botões **Enviar foto** / **Remover** + **Salvar foto**.
- **Ativar plano**: input de **código de 4 dígitos** (caixas OTP, uma ativa com cursor piscando), botão **Ativar Plano** + **Lembrar mais tarde** (fecha sem ativar).

### 9. Fluxo "IA Operando ao vivo" (`Fluxo IA Operando.dc.html`, `Modal IA Operando.dc.html`)
Modal **full-screen** que aparece ao Ligar a IA. **Regras de comportamento (críticas):** ocupa a tela toda enquanto opera; **NÃO fecha ao clicar fora** (backdrop não dispensa); **sem botão minimizar** — sempre em primeiro plano; sempre tem **PAUSAR** e **PARAR** visíveis (ao pausar mostra estado "Pausado" e PAUSAR vira RETOMAR). Três estados em sequência:
1. **Procurando**: animação de scan/radar, "Procurando operações", "A IA está analisando o mercado em tempo real", pares sendo escaneados.
2. **Operando**: header com indicador pulsante "ao vivo" + "IA operando"; topo com 2 números (qtd de operações + resultado acumulado em R$); lista de operações conforme acontecem (par, badge WIN/LOSS, +R$/-R$); última linha "procurando próxima entrada…" para nunca parecer parado; entrada de cada nova op com fade+slide suave; stats operações/acerto/wins.
3. **Resultado**: sessão encerrada (fim natural OU clicou PARAR). Ícone de sucesso, saldo final grande (R$), 3 stats (operações, % de acerto, wins), botões no rodapé. **Conta DEMO** → oferece "Depositar"; **conta REAL** → só "Fechar".
- `Fluxo IA Operando.dc.html` = fluxo completo interativo (com painel de teclas para alternar estados — esse painel é só para revisão, não é UI do app). `Modal IA Operando.dc.html` = explorações iniciais (3 variações do estado Operando).

### 10. Pós-compra "Obrigado" (`Obrigado.dc.html`)
Tela **pública e curta** (sem nav lateral). Logo no topo, ícone de sucesso (check verde com anel pulsante), "Pagamento confirmado · Obrigado pela compra!", **código de ativação** em destaque (mono grande, valor `1337`) com botão **Copiar código** (feedback "Código copiado"), CTA **Criar minha conta →**, nota "também enviamos para o seu e-mail".

### 11. Loading — troca de modelo de IA (`Loading IA.dc.html`)
Overlay rápido (~1s) ao trocar o modelo no cockpit. O **"V" do logo se desenha** em neon (stroke animado), com **anel girando**, **glow pulsante**, "Aplicando modelo···" e "Reconfigurando a IA com [modelo]". Existe para **todas as IAs** (Claude, GPT-5, Gemini, Grok 3).

---

## Componentes compartilhados

### MiniChart (`MiniChart.dc.html`) — gráfico "ao vivo"
Gráfico de linha animado, **placeholder** (não é o gráfico real — será reconstruído à parte). Comportamento exigido:
- **Sem escala de preço** (sem eixo/valores).
- Comporta-se como **timeframe de 5s em linha**: o preço **se forma na ponta** (a linha jitter/forma em tempo real no ponto "ao vivo"), e a cada **5s o "candle" fecha** e o histórico **desliza um passo para a ESQUERDA** (como um gráfico real — dado novo na ponta, histórico saindo pela esquerda); o próximo começa a partir do fechamento.
- **Ponto "ao vivo"** (bolinha verde com glow) **pinado** no head, a **70% da largura** (os ~30% finais ficam vazios à direita). A linha termina exatamente na bolinha (bolinha por cima).
- Selo "ROBÔ CONECTADO" (pílula com dot pulsante) no topo; **ticker de ativos** rolando no rodapé ("Monitorando": EUR/USD, EUR/GBP, EUR/JPY, NZD/USD, GBP/USD, GBP/JPY, USD/JPY, AUD/CAD), centralizado verticalmente; faixa de varredura diagonal.
- **OBS importante**: o usuário **NÃO escolhe o ativo** — a IA escolhe quando vai operar. Não há seletor de ativo. O gráfico mostra só um par genérico de ilustração.
- Implementação de referência: random-walk com reversão à média; `setInterval` ~70ms (não rAF), grade de X fixa, valores escorrendo por interpolação. Veja a classe de lógica no arquivo.

### SliderRow (`SliderRow.dc.html`)
Linha de slider: label upper + valor em pílula (mono) + trilho com preenchimento (`fill` %) e thumb com glow. Props: `label`, `value`, `prefix` ($), `fill` (%), `accent` (cor), `value-color`.

### CopyField (`CopyField.dc.html`)
Campo copiável: ícone (email/lock), label upper, valor (mascarável com toggle de olho), botão **Copiar** → feedback **Copiado** (borda/botão ficam verdes ~1.6s). Props: `label`, `value`, `masked` (bool), `kind` ("email"|"lock").

---

## Interactions & Behavior
- **Seleção de modelo de IA**: clique troca o card ativo (um por vez) e dispara o **overlay de Loading** (~1s) reconfigurando a IA.
- **Ligar IA**: abre o **modal full-screen "IA Operando"** (estados Procurando → Operando → Resultado). PAUSAR/PARAR sempre visíveis; backdrop não dispensa; sem minimizar.
- **Aba Cockpit/Histórico**: troca o miolo do dashboard sem trocar de rota/header.
- **Accordion de sessões** (Histórico): expande/colapsa; tocar op abre detalhe.
- **Sidebar**: colapsar/expandir (desktop); drawer com backdrop (mobile).
- **Menu do avatar**: dropdown (desktop) / bottom-sheet (mobile).
- **Copiar** (CopyField, código de ativação, Copiar ID): `navigator.clipboard.writeText`, feedback visual ~1.6–1.8s.
- **Modais**: desktop centralizado com backdrop blur; mobile bottom-sheet com alça e animação `slide-up`.
- **Animações**: entrada de op (fade + slide de baixo); "ao vivo"/"buscando" pulsam; radar gira/pulsa; rank-up com anéis pulsantes + faíscas; loading "V" desenhando + anel girando; gráfico fluindo.

## State Management
- `aiModel`: modelo selecionado (Claude/GPT-5/Gemini/Grok 3).
- `params`: { valorPorOperacao, meta, stopLoss, defesaTecnica } (sliders/stepper).
- `botState`: idle | searching | operating | paused | result.
- `session`: { ops[], pnlAcumulado, count, winRate, wins }, `accountType`: demo|real.
- `dashboardTab`: cockpit | historico. `historyTab`: allTime | sessao. `profileTab`: info | plano. `rankingTab`: atual | mvp.
- UI: `sidebarCollapsed`, `avatarMenuOpen`, `activeModal`, `copiedField`, `loadingOverlay`.
- Saldo, histórico de ops e ranking viriam de fetch/realtime no app real.

## Design Tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| Verde primário | `#22c55e` | CTAs, acento, dots ao vivo |
| Verde claro (texto/realce) | `#34d77a` | valores positivos, labels acento |
| Verde neon (destaque) | `#5dffa0` | texto em botões/labels de destaque |
| Verde escuro (gradiente) | `#15924a` | gradientes de botão/avatar |
| Fundo base | `#060a08` / `#0c1f14` | radial gradient do app (quase preto → verde escuro) |
| Card glass | `rgba(255,255,255,.02–.04)` | fundo de cards |
| Borda glass | `rgba(34,197,94,.10–.32)` | bordas verdes translúcidas |
| Texto primário | `#eef5f0` | títulos/valores |
| Texto secundário | `#9bb0a5` | corpo |
| Texto terciário/mute | `#7d9488` / `#5d7167` / `#566c61` | labels, captions, desabilitado |
| Label acento | `#5d8a70` | labels de seção upper |
| Vermelho (loss/stop) | `#ef4444` / `#f0726a` / `#f87171` | LOSS, stop loss, negativos |
| Ouro (rank/Black) | `#f0bf63` (medalDark `#b8862f`) | pódio #1, plano Black, streak |
| Prata (rank) | `#cfd6dd` | pódio #2 |
| Bronze (rank) | `#d08a5a` | pódio #3 |
| Laranja (streak) | `#ff9a52` | chip de streak (⚡) |

### Tipografia
- **Sora** (400/500/600/700/800) — UI, títulos, labels. Labels de seção: 9–11px, **uppercase**, `letter-spacing` .14–.26em, peso 600–700.
- **JetBrains Mono** (500/600/700) — números, valores monetários, IDs, código, horários.
- Escala títulos: 36px (saldo), 26–30px (headings), 21px (modal title), 17px (section), 13–15px (corpo).

### Espaçamento / Raios / Sombras
- Raios: cards 16–20px, pílulas/botões 11–15px, chips 20px (pill), device desktop 24px / mobile 46px, bottom-sheet 26–28px no topo.
- Padding cards: 18–26px. Gaps: 8–18px.
- Sombra de card/device: `0 30px 60px -18px rgba(0,0,0,.5)`.
- Glow verde: `0 0 36px -8px rgba(34,197,94,.85)` (botões), `0 0 50px -22px rgba(34,197,94,.4)` (frames).
- Grid overlay de fundo: linhas `rgba(34,197,94,.04)` a cada 34–38px.

### Header/Nav
- Header altura: 62px (desktop) / 46px status + 52px nav (mobile).
- Nav rail desktop: 76px (colapsada) / 264px (expandida). Drawer mobile: full-height por cima com backdrop `rgba(2,6,4,.55)`.

## Assets
- **Logo "V"** (`symbol-v-solid.svg`): traço `M22 26 L50 74 L78 26`, verde `#22c55e`, stroke ~13. Inline SVG. Usado no nav (com glow), no loading (animado) e na tela Obrigado. (Original em `uploads/`; reproduzir como SVG inline.)
- **Ícones de modelos de IA** (`designs/icons/*.webp`): `claude_icon`, `chatgpt_icon`, `gemini_icon`, `grok_icon`. **São marcas de terceiros** — no app de produção, use os ícones oficiais/licenciados de cada provedor.
- **Emblemas de rank** (`designs/assets/ranks/*.svg`): estilo CS (Prata I/II/III, Ouro I/II/III, AK, Águia, Xerife, Supremo, Global). Usados na sidebar, no ranking (pódio/lista) e no rank-up.
- **Ícones de UI**: todos **SVG line** desenhados inline no estilo do projeto (bot, pessoas/VIP, troféu, headset/suporte, câmera, upload/download, copiar, olho, raio, coroa, etc.). Sem emoji.
- **Fotos/avatares**: placeholders (iniciais "TM" em círculo gradiente). Substituir por upload do usuário no app.

## Files (em `designs/`)
- **Telas**: `Dashboard.dc.html` (cockpit+histórico oficial), `Historico de Operacoes.dc.html`, `Sidebar Navegacao.dc.html`, `Perfil.dc.html`, `Ranking.dc.html`, `Planos.dc.html`, `Modais.dc.html` (financeiros), `Modais Conta.dc.html`, `Fluxo IA Operando.dc.html`, `Obrigado.dc.html`, `Loading IA.dc.html`.
- **Componentes**: `MiniChart.dc.html`, `SliderRow.dc.html`, `CopyField.dc.html`, `HistView.dc.html`, `OpDetail.dc.html`, `NavPanel.dc.html`, `DeskNav.dc.html`.
- **Exploração (referência)**: `Cockpit Redesign.dc.html` (3 direções), `Modal IA Operando.dc.html` (3 variações do estado Operando).
- **Runtime**: `support.js` (renderiza os `.dc.html`; **não portar** — é só para abrir os mocks no navegador). Abra qualquer `.dc.html` direto no browser para ver o design ao vivo.
- **Assets**: `icons/`, `assets/ranks/`.

## Notas finais
- **Idioma da UI**: Português (BR). Moeda: a UI usa **`$`** nos números do cockpit/sliders e **`R$`** nos modais financeiros e planos — confirmar a convenção final com o produto.
- "Patente" foi renomeado para **"rank"** em toda a UI.
- Valores monetários, preços de plano, nomes e dados são **placeholders/ilustrativos**.
- Os ícones de IA e emblemas de rank têm implicações de **marca/licença** — usar assets oficiais/licenciados na produção.
