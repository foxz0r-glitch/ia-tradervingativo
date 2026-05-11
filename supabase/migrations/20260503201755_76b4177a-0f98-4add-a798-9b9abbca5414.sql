-- Strategies table
CREATE TABLE IF NOT EXISTS public.user_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

ALTER TABLE public.user_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own strategies"
  ON public.user_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "anyone can view non-deleted strategies"
  ON public.user_strategies FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "users insert own strategies"
  ON public.user_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own strategies"
  ON public.user_strategies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own strategies"
  ON public.user_strategies FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_strategies_user ON public.user_strategies(user_id) WHERE deleted_at IS NULL;

-- Add strategy_id to trade_events
ALTER TABLE public.trade_events
  ADD COLUMN IF NOT EXISTS strategy_id uuid REFERENCES public.user_strategies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trade_events_strategy ON public.trade_events(strategy_id) WHERE strategy_id IS NOT NULL;
