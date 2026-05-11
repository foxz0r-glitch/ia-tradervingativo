CREATE POLICY "ranking publico leitura" ON public.user_xp
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users can select own xp" ON public.user_xp;