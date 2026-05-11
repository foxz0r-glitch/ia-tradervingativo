CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp text,
  genero text,
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios veem proprio perfil" ON public.profiles;
CREATE POLICY "usuarios veem proprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios editam proprio perfil" ON public.profiles;
CREATE POLICY "usuarios editam proprio perfil" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins veem tudo profiles" ON public.profiles;
CREATE POLICY "admins veem tudo profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.profiles (id, whatsapp)
SELECT id, raw_user_meta_data->>'whatsapp'
FROM auth.users
WHERE raw_user_meta_data->>'whatsapp' IS NOT NULL
ON CONFLICT (id) DO NOTHING;