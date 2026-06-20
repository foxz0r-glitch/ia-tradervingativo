-- FIX — admin_ops_cross_check: unidade de timestamp de open_ts.
-- open_ts/close_ts em user_operations são gravados em SEGUNDOS (Math.floor(Date.now()/1000),
-- src/pages/Index.tsx:592 e INSERT :660-661); session_id em MILISSEGUNDOS (Date.now(), :664).
-- A definição anterior (20260508162050) usava to_timestamp(uo.open_ts / 1000.0), tratando
-- open_ts como ms → timestamp ~jan/1970 → o join de proximidade (±30s) contra te.happened_at
-- (real) nunca casava → status sempre 'sem_confirmacao_corretora' (cross-check não-funcional).
-- Correção: to_timestamp(uo.open_ts) SEM /1000 (open_ts já é segundos). Idêntica em tudo o mais
-- (assinatura, RETURNS TABLE, SECURITY DEFINER, search_path, joins/filtros/CASE/ORDER BY).
-- session_id NÃO é usado nesta função, então nada a ajustar lá. Sem GRANT/REVOKE (a função
-- não tinha; CREATE OR REPLACE preserva as permissões existentes). NÃO aplicar às cegas.

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
    to_timestamp(uo.open_ts) AS uo_open_at,
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
          te.happened_at - to_timestamp(uo.open_ts)
        ))) < 30
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY uo.open_ts DESC;
$$;
