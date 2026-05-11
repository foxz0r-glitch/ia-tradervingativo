ALTER TABLE public.user_operations
ADD COLUMN IF NOT EXISTS strategy_id uuid REFERENCES public.user_strategies(id);

CREATE INDEX IF NOT EXISTS user_operations_user_session_idx
ON public.user_operations(user_id, session_id);

CREATE OR REPLACE FUNCTION public.admin_ops_cross_check()
RETURNS TABLE (
  op_user_id      uuid,
  symbol          text,
  direction       text,
  uo_result       text,
  uo_pnl          numeric,
  uo_open_at      timestamptz,
  te_result       text,
  te_pnl          numeric,
  te_happened_at  timestamptz,
  status          text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    uo.user_id          AS op_user_id,
    uo.symbol,
    uo.direction,
    uo.result           AS uo_result,
    uo.pnl              AS uo_pnl,
    to_timestamp(uo.open_ts / 1000.0) AS uo_open_at,
    te.result           AS te_result,
    te.pnl              AS te_pnl,
    te.happened_at      AS te_happened_at,
    CASE
      WHEN te.id IS NULL          THEN 'sem_confirmacao_corretora'
      WHEN uo.result != te.result THEN 'resultado_diverge'
      ELSE 'ok'
    END AS status
  FROM public.user_operations uo
  LEFT JOIN public.trade_events te ON
    te.user_id  = uo.user_id
    AND te.asset      = uo.symbol
    AND te.direction  = uo.direction
    AND ABS(EXTRACT(EPOCH FROM (
          te.happened_at - to_timestamp(uo.open_ts / 1000.0)
        ))) < 30
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY uo.open_ts DESC;
$$;

CREATE OR REPLACE FUNCTION public._trigger_award_xp_on_win()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.result = 'win' THEN
    BEGIN
      PERFORM public.award_xp(NEW.user_id, 10, 'trade_win', 'Operação vencedora');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_on_win ON public.user_operations;
CREATE TRIGGER trg_award_xp_on_win
  AFTER INSERT ON public.user_operations
  FOR EACH ROW EXECUTE FUNCTION public._trigger_award_xp_on_win();