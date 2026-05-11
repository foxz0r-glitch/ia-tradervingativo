DROP POLICY IF EXISTS "users can view own xp" ON public.user_xp;
DROP POLICY IF EXISTS "users can update own xp" ON public.user_xp;
DROP POLICY IF EXISTS "users can insert own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can view own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can update own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can insert own xp" ON public.user_xp;

CREATE POLICY "users can select own xp" ON public.user_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert own xp" ON public.user_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own xp" ON public.user_xp
  FOR UPDATE USING (auth.uid() = user_id);