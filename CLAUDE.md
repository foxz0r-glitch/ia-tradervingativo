# CLAUDE.md — Virtus Pro Analytics (VPA)

> Contexto permanente do projeto. O Claude Code lê este arquivo automaticamente ao abrir o repo.
> Para o estado da sessão (o que está pendente AGORA), ver o handoff mais recente `VPA-RESUMO-SESSAO-*.md`.

---

## O QUE É

SaaS de daytrading automatizado com IA. O usuário conecta a conta da corretora, configura uma estratégia, e o robô opera sozinho. Modelo: afiliado **CasaTrade** (revenue share), **`aff_id=791551`** — o lead entra pelo VPA e é direcionado à corretora.

**Este projeto NÃO tem relação com a Velora.** É 100% standalone — nenhum repo, workflow ou convenção da Velora se aplica.

---

## INFRAESTRUTURA

| Item | Valor |
|---|---|
| Repo GitHub | `foxz0r-glitch/casa-trade-hub` (privado) |
| Pasta local | `C:\Users\afili\casa-trade-hub` |
| Frontend | React + TS + Tailwind, feito no **Lovable** → **virtuspro.online** |
| Projeto Lovable | `lovable.dev/projects/26a787de-aa26-4849-a77b-2c0e08f5c4b1` |
| Backend | Node + TS no **VPS Hostinger** `root@177.7.51.11` → **bot.virtuspro.online** (WebSocket via Cloudflare Tunnel) |
| Chave SSH | `C:\Users\afili\.ssh\id_ed25519` |
| Banco | **Supabase** `afymchiizdzpxubwhhbn` |
| PM2 (VPS) | `robo-casatrade` · `cloudflare-tunnel` · `bot-telegram` |
| Conta | `mesquitaftw@gmail.com` |
| Robô (VPS) | `/root/robo-casatrade/server.ts` |
| SDK corretora | TradeCodeHub (`/root/robo-casatrade/client-sdk-js-main/dist/index.js`) |

Existem **137 usuários "fake"** no banco (popular ranking). Têm `score` simulado, mas estatísticas reais (trade_events / win_rate / ativo preferido) zeradas — perfis deles aparecem em branco, e isso é esperado.

---

## REGRAS INVIOLÁVEIS

1. ❌ **NUNCA** usar `supabase.auth.getUser()` → **SEMPRE** `supabase.auth.getSession()`.
   `getUser()` faz request HTTP e trava durante reconexões de WS. `getSession()` lê do localStorage (instantâneo).
2. **Lovable é a fonte de verdade.** Todo `git push` externo exige depois sincronizar/publicar no Lovable. Conflitos de rebase são comuns → resolver **mantendo AMBAS as mudanças** (as nossas + as do Lovable).
3. **SSH = manual.** O usuário cola os comandos. O Claude Code não toca produção sem confirmação.
4. **Logout** deve limpar as chaves `sb-*` do localStorage de forma síncrona ANTES do `window.location.href = "/"`.

---

## ARQUIVOS CRÍTICOS — não alterar a lógica (só visual, se necessário)

| Arquivo | Por quê |
|---|---|
| `src/hooks/useRoboBot.ts` | `destroyedRef` impede WebSocket órfão ao trocar de página |
| `src/pages/Index.tsx` | fast path de cache de credenciais no `onConnect`; `startingRef` (guard anti-duplo-clique no start) |
| `src/components/LiveChart.tsx` | handler `candle_closed`; `scrollToRealTime` (auto-follow do gráfico mantendo zoom) |
| `src/components/AppSidebar.tsx` | logout limpa localStorage; barra de XP/Nível/Score |
| `src/components/UserMenu.tsx` | mesmo logout do sidebar |
| `src/pages/Ranking07.tsx` / `Ranking15.tsx` | getSession + fetch com `mounted` ref + cache 5 min |
| `server.ts` (VPS) | guards do SDK (`doRequest` checa `this.connection`; `setInterval` 60s em try/catch) |

---

## GAMIFICAÇÃO (modelo de dados)

| Campo | Representa | Determina |
|---|---|---|
| `total_xp` | XP acumulado all-time (nunca reseta) | **Nível** (`floor(sqrt(xp/50))+1`) |
| `score` | Performance de trading | **Patente** (`current_rank`) |
| `season_xp` | XP da temporada (mensal, reseta dia 1) | **Ranking da temporada** |

**14 patentes (threshold de score):** Prata I (0) · Prata II (500) · Prata III (1.200) · Ouro I (2.500) · Ouro II (4.500) · Ouro III (7.500) · AK I (12.000) · AK II (19.000) · AK Cruzada (28.000) · **Xerife (40.000, tier Águia)** · Águia I (55.000) · Águia II (75.000) · Supremo (100.000) · Global (150.000).

**Cores por tier:** Prata `#B4B2A9` · Ouro `#FAC775` · AK `#5DCAA5` · Águia `#AFA9EC` · Supremo `#D85A30`.

**Badges:** 4 raridades — comum / rara / épica / lendária (`achievements_catalog`, agrupadas por `badge_group`).

**Temporadas:** mensais. **Hall da Fama** = 1 usuário com maior `total_xp` all-time. **MVPs** = top 3 de cada temporada encerrada.

**Perfil do trader (UserProfileDrawer):** modelo ÚNICO para todos os usuários (incluindo o #1 e novos cadastros). Só o conteúdo muda, nunca o design.

**XP ganho:** login diário +10 (roda no mount do dashboard) · streak 7 +100 · streak 30 +500. Streak reseta se o usuário não logar no dia seguinte. A Edge Function `daily-xp-increment` mexe só em `score`/`current_rank`/`season_xp` — NUNCA em streak/last_login.

---

## FLUXO DO LEAD → AFILIADO

`signup no VPA` → "Acessar Broker" com login CasaTrade → SDK devolve ID numérico → salvar `email → CasaTrade ID` → cruzar com CSV de depósitos do painel CasaTrade.

---

## CHECKLIST AO RETOMAR (após `git push` externo)

1. Resolver qualquer rebase pendente mantendo ambas as mudanças.
2. **Publicar no Lovable** (botão Publish) — sem isso o site não atualiza.
3. Se mexeu no banco: aplicar migrations via `supabase db push` (ou deixar o Lovable aplicar).
4. Validar no `virtuspro.online` com F12 aberto.

## COMO REPORTAR BUG (template para o usuário)

Console F12 completo (All levels, limpo antes de reproduzir) + aba Network (Fetch/XHR, requests pendentes) + Application → Local Storage (`sb-*-auth-token` existe?) + sequência exata do que fez + **"funciona após dar refresh?"** (sim → estado/auth travado; não → bug estrutural/servidor).
