-- Tabela de cursos/aulas gerenciada pelos admins
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  panda_video_id text NOT NULL,
  thumbnail_url text,
  module text DEFAULT 'Geral',
  ordem integer DEFAULT 0,
  published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins gerenciam cursos"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuarios autenticados veem cursos publicados"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (published = true);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de controle manual de acesso/assinaturas
CREATE TABLE IF NOT EXISTS public.user_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  access_expires_at timestamptz,
  notes text,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins gerenciam acesso"
  ON public.user_access
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usuarios veem proprio acesso"
  ON public.user_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_access_updated_at
  BEFORE UPDATE ON public.user_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função RPC para admins listarem usuários com email da auth
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

-- Função RPC para estatísticas agregadas (admin)
CREATE OR REPLACE FUNCTION public.admin_user_stats()
RETURNS TABLE (
  total_users bigint,
  active_7d bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
    SELECT
      (SELECT COUNT(*) FROM auth.users)::bigint AS total_users,
      (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '7 days')::bigint AS active_7d;
END;
$$;