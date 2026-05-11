CREATE TABLE IF NOT EXISTS public.user_demo_state (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sessions_used int NOT NULL DEFAULT 0,
  scenario   text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_demo_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_select_own"
  ON public.user_demo_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "demo_upsert_own"
  ON public.user_demo_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "demo_update_own"
  ON public.user_demo_state FOR UPDATE
  USING (auth.uid() = user_id);