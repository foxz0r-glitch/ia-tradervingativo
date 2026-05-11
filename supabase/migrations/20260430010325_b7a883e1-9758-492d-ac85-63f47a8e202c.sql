CREATE TABLE IF NOT EXISTS public.casatrade_balance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  casatrade_user_id text,
  saldo_real numeric DEFAULT 0,
  deposito_detectado boolean DEFAULT false,
  valor_variacao numeric DEFAULT 0,
  registrado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.casatrade_balance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins veem tudo balance_history"
  ON public.casatrade_balance_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins gerenciam balance_history"
  ON public.casatrade_balance_history
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_balance_history_user ON public.casatrade_balance_history(user_id, registrado_em DESC);