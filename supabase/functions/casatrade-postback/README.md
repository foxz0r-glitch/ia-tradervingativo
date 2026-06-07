# casatrade-postback — contrato do postback

Edge function que recebe os postbacks server-to-server da CasaTrade (GET) e **delega o
processamento de depósito** para a RPC atômica `process_casatrade_deposit`
(migration `supabase/migrations/20260607000000_casatrade_postback_idempotency.sql`).

## URL / Auth
- Rota: `…/functions/v1/casatrade-postback/<POSTBACK_SECRET>` — o **token é o último segmento do path**.
- **Fail-closed:** sem `POSTBACK_SECRET` setado **ou** token errado → `401`. Nada é processado.
- `verify_jwt = false` (config.toml) — a function é pública; a auth é o token no path.
- Chama o banco com **service role** (`SUPABASE_SERVICE_ROLE_KEY`); a RPC só dá `EXECUTE` ao `service_role`.

## Query params (macros)
| Param | Uso |
|---|---|
| `postback_name` | tipo do evento; normalizado com `.toLowerCase().trim()` |
| `trader_id` | id do trader na CasaTrade (string) |
| `amount` | valor do depósito (ver formato abaixo) |
| `event_id` | id único do evento p/ dedup; **se ausente/vazio → sem dedup** |
| `instrument` | ativo; usado só no evento `transacao` |

## Eventos aceitos
- **Contam como depósito** (vão pra RPC e somam): `primeiro_deposito`, `redeposito`.
  - `primeiro_deposito` = FTD: além de somar, grava `ftd_date`/`ftd_amount` (1ª vez) e concede 100 XP (`award_xp` source `ftd`).
  - `redeposito` = redepósito: soma `total_deposited` e incrementa `deposit_count`.
- **NÃO contam como depósito:** `deposito` (genérico) e qualquer outro → a RPC retorna `not_deposit` (sem soma). [decisão de design: só FTD e redepósito somam]
- `transacao` (com `instrument`) → grava em `trade_events` (fluxo separado, **não** idempotente).
- Qualquer evento: carimba `postback_evento`/`postback_recebido_em` em `casatrade_data` (upsert genérico).

## Formato de `amount`
Normalizador US+BR (`normalizeAmount`):
- `"50"` → 50 · `"1234.56"` → 1234.56 · `"50,00"` → 50 · `"1.234,56"` (BR) → 1234.56 · `"1,234.56"` (US) → 1234.56.
- Regra: se tem `.` **e** `,`, o separador decimal é o que aparece por **último**.
- Inválido/ausente → `null` (a function loga `console.error` com o valor cru e a RPC retorna `skipped_no_amount`). **Não** é tratado como 0 silencioso.
- ⚠️ Ambíguo: `"1.234"` (sem vírgula) vira `1.234`. O formato/unidade real (inteiro vs centavos) é confirmado pelos `console.log` (cru → normalizado) durante o teste.

## Dedup / idempotência
- A RPC deduplica por **`(event_id, event)`** na tabela `casatrade_postback_events`
  (`PRIMARY KEY (event_id, event)`): o **mesmo** evento (mesmo id + mesmo tipo) só conta uma vez → retorno `duplicate`.
- **Requer que a CasaTrade envie um `event_id` único por evento.** Sem `event_id`, não há proteção contra reenvio (cada postback conta).
- A RPC é **atômica** (uma transação): erro → rollback total → a function retorna `500` e o retry processa exatamente uma vez.

## Retornos da RPC (`process_casatrade_deposit`) — todos respondem HTTP 200
| Retorno | Significado |
|---|---|
| `no_trader` | `trader_id` ausente |
| `not_deposit` | evento não é `primeiro_deposito`/`redeposito` (inclui `deposito` genérico e nulo) |
| `skipped_no_amount` | `amount` null ou ≤ 0 |
| `duplicate` | `(event_id, event)` já processado |
| `processed` | somou e gravou histórico (e XP se 1º FTD) |
| `processed_unmapped` | somou, mas trader sem `user_credentials` → sem histórico/XP |

## Status HTTP
- `401` — auth (sem secret ou token errado).
- `500` — **só** quando a chamada da RPC retorna `error` (caminho de depósito; retry seguro pela atomicidade).
- `200` — todo o resto, incluindo todos os retornos da RPC acima e o fluxo `transacao`. O `catch` global também responde `200` (o bloco `transacao`/`trade_events` **não** é idempotente; um retry duplicaria `trade_events`).
