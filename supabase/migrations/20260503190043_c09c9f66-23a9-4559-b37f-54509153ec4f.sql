DO $$
DECLARE
  v_emails text[] := ARRAY[
    'tiagotestedaferramenta@gmail.com',
    'testeversaovinal@gmail.com',
    'ferramenta2012teste@gmail.com',
    'paulotraderpro293@gmail.com',
    'testedeia2026@gmail.com',
    'testeia2026ftw@gmail.com',
    'victorpaulino23@hotmail.com',
    'testedeia29321@gmail.com',
    'testandonovaia2023@hotmail.com',
    'ccontatesteia@gmail.com',
    'testiaapi@gmail.com',
    'testeapitrade2005@gmail.com',
    'tuliomaravilha293@gmail.com',
    'jnascimento10983@gmail.com',
    'rtestandoapi@gmail.com'
  ];
  v_email text;
  v_uid uuid;
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
    IF v_uid IS NOT NULL THEN
      DELETE FROM public.user_xp WHERE user_id = v_uid;
      DELETE FROM public.user_credentials WHERE id = v_uid;
      DELETE FROM public.user_achievements WHERE user_id = v_uid;
      DELETE FROM public.user_missions WHERE user_id = v_uid;
      DELETE FROM public.user_demo_state WHERE user_id = v_uid;
      DELETE FROM public.casatrade_balance_history WHERE user_id = v_uid;
      DELETE FROM public.trade_events WHERE user_id = v_uid;
      DELETE FROM public.rank_history WHERE user_id = v_uid;
      DELETE FROM public.xp_transactions WHERE user_id = v_uid;
      DELETE FROM public.lesson_progress WHERE user_id = v_uid;
      DELETE FROM public.user_access WHERE user_id = v_uid;
      DELETE FROM public.user_roles WHERE user_id = v_uid;
      DELETE FROM public.profiles WHERE id = v_uid;
    END IF;
    DELETE FROM public.casatrade_data WHERE lower(email) = lower(v_email);
    IF v_uid IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = v_uid;
    END IF;
  END LOOP;
END $$;