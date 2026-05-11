-- Tabela que persiste o estado das sessões demo por usuário.
-- Garante que as 3 sessões valem por conta, não por dispositivo/browser.

CREATE TABLE IF NOT EXISTS public.user_demo_state (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sessions_used int  NOT NULL DEFAULT 0,
  scenario   text,                    -- 'A' | 'B' | 'C'
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_demo_state ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler e atualizar apenas a própria linha
CREATE POLICY "demo_select_own"
  ON public.user_demo_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "demo_upsert_own"
  ON public.user_demo_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "demo_update_own"
  ON public.user_demo_state FOR UPDATE
  USING (auth.uid() = user_id);
