DO $$
DECLARE
  alvo_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO alvo_ids
  FROM auth.users
  WHERE email IN (
    'suportenego@gmail.com',
    'jhonatan1337@gmail.com',
    'mastercontadoisvpa@gmail.com',
    'mastercontatresvpa@gmail.com'
  );

  IF alvo_ids IS NOT NULL AND array_length(alvo_ids, 1) > 0 THEN
    DELETE FROM public.user_xp                   WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.xp_transactions           WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.user_roles                WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.profiles                  WHERE id      = ANY(alvo_ids);
    DELETE FROM public.user_access               WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.user_credentials          WHERE id      = ANY(alvo_ids);
    DELETE FROM public.casatrade_balance_history WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.trade_events              WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.rank_history              WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.user_missions             WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.user_achievements         WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.lesson_progress           WHERE user_id = ANY(alvo_ids);
    DELETE FROM public.user_demo_state           WHERE user_id = ANY(alvo_ids);
    DELETE FROM auth.users                       WHERE id      = ANY(alvo_ids);
  END IF;
END;
$$;

TRUNCATE TABLE public.casatrade_balance_history;