DROP FUNCTION IF EXISTS public.admin_crm_report();

CREATE OR REPLACE FUNCTION public.admin_crm_report()
 RETURNS TABLE(user_id uuid, email text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, total_xp integer, current_rank text, streak_days integer, plan text, access_expires_at timestamp with time zone, casatrade_user_id text, total_deposited numeric, current_balance numeric, ftd_date date, aulas_assistidas bigint, whatsapp text, genero text, birth_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT
      u.id,
      u.email::text,
      u.created_at,
      u.last_sign_in_at,
      COALESCE(x.total_xp, 0),
      COALESCE(x.current_rank, 'Prata I'),
      COALESCE(x.streak_days, 0),
      COALESCE(a.plan, 'free'),
      a.access_expires_at,
      c.casatrade_user_id,
      COALESCE(c.total_deposited, 0),
      COALESCE(c.current_balance, 0),
      c.ftd_date,
      COALESCE((SELECT COUNT(*) FROM public.lesson_progress lp WHERE lp.user_id = u.id), 0),
      p.whatsapp,
      p.genero,
      p.birth_date
    FROM auth.users u
    LEFT JOIN public.user_xp x ON x.user_id = u.id
    LEFT JOIN public.user_access a ON a.user_id = u.id
    LEFT JOIN public.casatrade_data c ON lower(c.email) = lower(u.email::text)
    LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY u.created_at DESC;
END;
$function$;