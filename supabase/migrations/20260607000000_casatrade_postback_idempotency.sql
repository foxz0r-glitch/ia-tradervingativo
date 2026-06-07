-- WRITE1 — Camada de banco para idempotência/atomicidade dos depósitos CasaTrade.
-- Additiva e segura: cria 1 tabela nova + 1 RPC. NÃO altera colunas/linhas existentes.
-- deposit_count e ftd_amount JÁ existem (migration 20260509120914) — não recriados aqui.
-- A edge function NÃO é tocada neste passo (vem depois).

-- =========================================================================
-- Tabela de idempotência: impede contar o MESMO evento (mesmo id + tipo) 2x.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.casatrade_postback_events (
  event_id     text        NOT NULL,
  event        text        NOT NULL,
  trader_id    text,
  amount       numeric,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, event)
);

-- Decisão de segurança (consistente com casatrade_data / casatrade_balance_history):
-- liga RLS sem policy → PostgREST (anon/authenticated) não acessa; service_role faz bypass.
ALTER TABLE public.casatrade_postback_events ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RPC: process_casatrade_deposit
-- Toda a lógica numa única transação (atômico por natureza).
-- SECURITY INVOKER — a edge function chama com service role.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.process_casatrade_deposit(
  p_trader_id   text,
  p_event_id    text,
  p_event       text,
  p_amount      numeric,
  p_received_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_ftd_first integer := 0;
  v_inserted  integer := 0;
BEGIN
  -- (1) trader obrigatório
  IF p_trader_id IS NULL OR btrim(p_trader_id) = '' THEN
    RETURN 'no_trader';
  END IF;

  -- (2) GATE (antes do dedup, de propósito): só conta primeiro_deposito/redeposito
  --     com amount > 0. Tira o 'deposito' genérico (e qualquer outro) da soma.
  --     O gate vem ANTES do dedup para um evento que NÃO soma não consumir o slot
  --     de idempotência (senão um reenvio corrigido do mesmo event_id seria barrado).
  IF p_event IS NULL OR p_event NOT IN ('primeiro_deposito', 'redeposito') THEN
    RETURN 'not_deposit';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 'skipped_no_amount';
  END IF;

  -- (3) DEDUP (só para depósito válido). Sem event_id => não deduplica (comportamento atual).
  IF p_event_id IS NOT NULL AND btrim(p_event_id) <> '' THEN
    INSERT INTO public.casatrade_postback_events (event_id, event, trader_id, amount)
    VALUES (p_event_id, p_event, p_trader_id, p_amount)
    ON CONFLICT (event_id, event) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
      RETURN 'duplicate';
    END IF;
  END IF;

  -- (4) Incremento ATÔMICO em casatrade_data por casatrade_user_id (upsert).
  --     total_deposited e deposit_count somados no próprio statement (NÃO read-modify-write).
  --     deposit_count incrementa nos DOIS casos (primeiro_deposito e redeposito).
  --     NÃO mexe em ftd_date (passo 5) nem em postback_evento/postback_recebido_em (segue na função).
  INSERT INTO public.casatrade_data (casatrade_user_id, total_deposited, deposit_count, updated_at)
  VALUES (p_trader_id, p_amount, 1, p_received_at)
  ON CONFLICT (casatrade_user_id) DO UPDATE SET
    total_deposited = COALESCE(casatrade_data.total_deposited, 0) + EXCLUDED.total_deposited,
    deposit_count   = COALESCE(casatrade_data.deposit_count, 0) + 1,
    updated_at      = EXCLUDED.updated_at;

  -- (5) FTD idempotente e à prova de corrida: WHERE ftd_date IS NULL garante que só
  --     o 1º FTD seta a data; retry/2º FTD afeta 0 linhas. ftd_amount = atribuição direta
  --     (coluna existe: numeric(15,2) na 20260509120914) — branch já gateado por ftd_date IS NULL.
  IF p_event = 'primeiro_deposito' THEN
    UPDATE public.casatrade_data
       SET ftd_date   = p_received_at::date,
           ftd_amount = p_amount
     WHERE casatrade_user_id = p_trader_id
       AND ftd_date IS NULL;
    GET DIAGNOSTICS v_ftd_first = ROW_COUNT;
  END IF;

  -- (6) Resolve user_id via user_credentials.
  --     Tipos divergem: casatrade_data.casatrade_user_id = text;
  --     user_credentials.casatrade_user_id = bigint. Cast com guarda: só converte
  --     p_trader_id (text) para bigint quando for só-dígitos; senão user_id fica null.
  --     Nunca deixar cast cru abortar a transação (perda silenciosa do depósito válido).
  IF p_trader_id ~ '^[0-9]+$' THEN
    BEGIN
      SELECT uc.id INTO v_user_id
      FROM public.user_credentials uc
      WHERE uc.casatrade_user_id = p_trader_id::bigint
      LIMIT 1;
    EXCEPTION WHEN numeric_value_out_of_range THEN
      v_user_id := NULL;
    END;
  END IF;

  -- (7) XP idempotente: só no 1º FTD (v_ftd_first > 0) e com user_id resolvido.
  --     Mesma chamada da edge function (index.ts:89-96): award_xp(user_id, 100, 'ftd', '...').
  IF p_event = 'primeiro_deposito' AND v_ftd_first > 0 AND v_user_id IS NOT NULL THEN
    PERFORM public.award_xp(v_user_id, 100, 'ftd', 'Primeiro depósito na CasaTrade');
  END IF;

  -- (8) Histórico: réplica fiel do INSERT atual (index.ts:80-87). registrado_em fica
  --     no default (a edge function não seta explicitamente).
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.casatrade_balance_history
      (user_id, casatrade_user_id, saldo_real, valor_variacao, tipo_variacao, deposito_detectado)
    VALUES
      (v_user_id, p_trader_id, 0, p_amount, 'deposito', true);
    RETURN 'processed';
  ELSE
    -- total_deposited/deposit_count já somados; só não há mapeamento de usuário.
    RETURN 'processed_unmapped';
  END IF;
END;
$$;

-- =========================================================================
-- Segurança: só service_role pode executar a RPC (a edge function usa service role).
-- Sem isto, qualquer cliente via PostgREST poderia inflar total_deposited/XP.
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) TO service_role;
