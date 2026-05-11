CREATE TABLE IF NOT EXISTS public.casatrade_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  casatrade_user_id text,
  total_deposited numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  ftd_date date,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.casatrade_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins gerenciam casatrade_data" ON public.casatrade_data
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  watched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios registram proprio progresso" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins veem tudo lesson_progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin RPC: cross-table CRM report
CREATE OR REPLACE FUNCTION public.admin_crm_report()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_xp integer,
  current_rank text,
  streak_days integer,
  plan text,
  access_expires_at timestamptz,
  casatrade_user_id text,
  total_deposited numeric,
  current_balance numeric,
  ftd_date date,
  aulas_assistidas bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
      COALESCE((SELECT COUNT(*) FROM public.lesson_progress lp WHERE lp.user_id = u.id), 0)
    FROM auth.users u
    LEFT JOIN public.user_xp x ON x.user_id = u.id
    LEFT JOIN public.user_access a ON a.user_id = u.id
    LEFT JOIN public.casatrade_data c ON lower(c.email) = lower(u.email::text)
    ORDER BY u.created_at DESC;
END;
$$;

-- Admin RPC: bulk upsert CasaTrade rows
CREATE OR REPLACE FUNCTION public.admin_upsert_casatrade(rows jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer := 0;
  v_row jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  FOR v_row IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    INSERT INTO public.casatrade_data (email, casatrade_user_id, total_deposited, current_balance, ftd_date, updated_at)
    VALUES (
      lower(v_row->>'email'),
      NULLIF(v_row->>'casatrade_user_id', ''),
      COALESCE((v_row->>'total_deposited')::numeric, 0),
      COALESCE((v_row->>'current_balance')::numeric, 0),
      NULLIF(v_row->>'ftd_date', '')::date,
      now()
    )
    ON CONFLICT (email) DO UPDATE SET
      casatrade_user_id = EXCLUDED.casatrade_user_id,
      total_deposited = EXCLUDED.total_deposited,
      current_balance = EXCLUDED.current_balance,
      ftd_date = EXCLUDED.ftd_date,
      updated_at = now();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;