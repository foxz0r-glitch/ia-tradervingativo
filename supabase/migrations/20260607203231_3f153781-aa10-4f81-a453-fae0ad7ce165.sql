-- WRITE1 — Camada de banco para idempotência/atomicidade dos depósitos CasaTrade.
CREATE TABLE IF NOT EXISTS public.casatrade_postback_events (
  event_id     text        NOT NULL,
  event        text        NOT NULL,
  trader_id    text,
  amount       numeric,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, event)
);

ALTER TABLE public.casatrade_postback_events ENABLE ROW LEVEL SECURITY;

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
  IF p_trader_id IS NULL OR btrim(p_trader_id) = '' THEN
    RETURN 'no_trader';
  END IF;

  IF p_event IS NULL OR p_event NOT IN ('primeiro_deposito', 'redeposito') THEN
    RETURN 'not_deposit';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 'skipped_no_amount';
  END IF;

  IF p_event_id IS NOT NULL AND btrim(p_event_id) <> '' THEN
    INSERT INTO public.casatrade_postback_events (event_id, event, trader_id, amount)
    VALUES (p_event_id, p_event, p_trader_id, p_amount)
    ON CONFLICT (event_id, event) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
      RETURN 'duplicate';
    END IF;
  END IF;

  INSERT INTO public.casatrade_data (casatrade_user_id, total_deposited, deposit_count, updated_at)
  VALUES (p_trader_id, p_amount, 1, p_received_at)
  ON CONFLICT (casatrade_user_id) DO UPDATE SET
    total_deposited = COALESCE(casatrade_data.total_deposited, 0) + EXCLUDED.total_deposited,
    deposit_count   = COALESCE(casatrade_data.deposit_count, 0) + 1,
    updated_at      = EXCLUDED.updated_at;

  IF p_event = 'primeiro_deposito' THEN
    UPDATE public.casatrade_data
       SET ftd_date   = p_received_at::date,
           ftd_amount = p_amount
     WHERE casatrade_user_id = p_trader_id
       AND ftd_date IS NULL;
    GET DIAGNOSTICS v_ftd_first = ROW_COUNT;
  END IF;

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

  IF p_event = 'primeiro_deposito' AND v_ftd_first > 0 AND v_user_id IS NOT NULL THEN
    PERFORM public.award_xp(v_user_id, 100, 'ftd', 'Primeiro depósito na CasaTrade');
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.casatrade_balance_history
      (user_id, casatrade_user_id, saldo_real, valor_variacao, tipo_variacao, deposito_detectado)
    VALUES
      (v_user_id, p_trader_id, 0, p_amount, 'deposito', true);
    RETURN 'processed';
  ELSE
    RETURN 'processed_unmapped';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.process_casatrade_deposit(text, text, text, numeric, timestamptz) TO service_role;