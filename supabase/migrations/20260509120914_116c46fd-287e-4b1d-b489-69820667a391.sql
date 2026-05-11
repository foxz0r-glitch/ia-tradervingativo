ALTER TABLE public.casatrade_data
  ADD COLUMN IF NOT EXISTS deposit_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ftd_amount    numeric(15,2);

DROP FUNCTION IF EXISTS public.admin_crm_report();

CREATE OR REPLACE FUNCTION public.admin_crm_report()
RETURNS TABLE (
  user_id              uuid,
  email                text,
  display_name         text,
  created_at           timestamptz,
  last_sign_in_at      timestamptz,
  total_xp             integer,
  current_rank         text,
  streak_days          integer,
  plan                 text,
  access_expires_at    timestamptz,
  casatrade_user_id    text,
  total_deposited      numeric,
  deposit_count        integer,
  ftd_date             timestamptz,
  ftd_amount           numeric,
  current_balance      numeric,
  ws_total_deposited   numeric,
  ws_deposit_count     bigint,
  ws_ftd_date          timestamptz,
  ws_ftd_amount        numeric,
  aulas_assistidas     bigint,
  whatsapp             text,
  genero               text,
  birth_date           date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    xp.display_name,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(xp.total_xp, 0),
    COALESCE(xp.current_rank, 'Prata I'),
    COALESCE(xp.streak_days, 0),
    COALESCE(ua.plan, 'free'),
    ua.access_expires_at,
    cd.casatrade_user_id,
    COALESCE(cd.total_deposited, 0),
    COALESCE(cd.deposit_count, 0),
    cd.ftd_date::timestamptz,
    cd.ftd_amount,
    COALESCE(cd.current_balance, 0),
    ws.ws_total_deposited,
    ws.ws_deposit_count,
    ws.ws_ftd_date,
    ws.ws_ftd_amount,
    COALESCE(lp.aulas_assistidas, 0),
    pr.whatsapp,
    pr.genero,
    pr.birth_date
  FROM auth.users u
  LEFT JOIN public.user_xp        xp ON xp.user_id = u.id
  LEFT JOIN public.user_access    ua ON ua.user_id = u.id
  LEFT JOIN public.casatrade_data cd ON lower(cd.email) = lower(u.email::text)
  LEFT JOIN public.profiles       pr ON pr.id = u.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS aulas_assistidas
    FROM public.lesson_progress lpp
    WHERE lpp.user_id = u.id
  ) lp ON true
  LEFT JOIN LATERAL (
    SELECT
      SUM(bh.valor_variacao)                   AS ws_total_deposited,
      COUNT(*)                                 AS ws_deposit_count,
      MIN(bh.registrado_em)                    AS ws_ftd_date,
      (ARRAY_AGG(bh.valor_variacao ORDER BY bh.registrado_em ASC))[1] AS ws_ftd_amount
    FROM public.casatrade_balance_history bh
    WHERE bh.user_id = u.id
      AND bh.deposito_detectado = true
  ) ws ON true
  ORDER BY u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_crm_report() TO authenticated;