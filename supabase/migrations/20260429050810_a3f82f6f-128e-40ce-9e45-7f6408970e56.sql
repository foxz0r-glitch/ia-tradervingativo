
-- Trigger function para updated_at (caso ainda não exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- TABLE: user_xp
-- ============================================
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_rank TEXT NOT NULL DEFAULT 'Prata I',
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp"
  ON public.user_xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own xp"
  ON public.user_xp FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_xp_updated_at
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: xp_transactions
-- ============================================
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert xp transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_xp_transactions_user_id ON public.xp_transactions(user_id);

-- ============================================
-- TABLE: user_achievements
-- ============================================
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);

-- ============================================
-- FUNCTION: calculate_rank
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_rank(p_total_xp INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE
    WHEN p_total_xp >= 150000 THEN 'Global'
    WHEN p_total_xp >= 100000 THEN 'Supremo'
    WHEN p_total_xp >= 75000  THEN 'Águia II'
    WHEN p_total_xp >= 55000  THEN 'Águia I'
    WHEN p_total_xp >= 40000  THEN 'Xerife'
    WHEN p_total_xp >= 28000  THEN 'AK Cruzada'
    WHEN p_total_xp >= 19000  THEN 'AK II'
    WHEN p_total_xp >= 12000  THEN 'AK I'
    WHEN p_total_xp >= 7500   THEN 'Ouro III'
    WHEN p_total_xp >= 4500   THEN 'Ouro II'
    WHEN p_total_xp >= 2500   THEN 'Ouro I'
    WHEN p_total_xp >= 1200   THEN 'Prata III'
    WHEN p_total_xp >= 500    THEN 'Prata II'
    ELSE 'Prata I'
  END;
END;
$$;

-- ============================================
-- FUNCTION: award_xp
-- ============================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT
)
RETURNS TABLE(new_total_xp INTEGER, new_rank TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_rank TEXT;
BEGIN
  -- 1. Registra a transação
  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (p_user_id, p_amount, p_source, p_description);

  -- 2. Upsert em user_xp
  INSERT INTO public.user_xp (user_id, total_xp, current_rank)
  VALUES (p_user_id, GREATEST(0, p_amount), public.calculate_rank(GREATEST(0, p_amount)))
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp = GREATEST(0, public.user_xp.total_xp + p_amount),
        current_rank = public.calculate_rank(GREATEST(0, public.user_xp.total_xp + p_amount)),
        updated_at = now()
  RETURNING public.user_xp.total_xp, public.user_xp.current_rank
  INTO v_total, v_rank;

  RETURN QUERY SELECT v_total, v_rank;
END;
$$;
