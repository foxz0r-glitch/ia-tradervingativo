CREATE TABLE IF NOT EXISTS public.marketplace_submissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id      UUID        NOT NULL REFERENCES public.user_strategies(id) ON DELETE CASCADE,
  nome             TEXT        NOT NULL,
  descricao        TEXT,
  preco_sugerido   NUMERIC(10,2),
  preview_winrate  NUMERIC(5,2),
  preview_trades   INTEGER,
  status           TEXT        NOT NULL DEFAULT 'pending',
  checkout_url     TEXT,
  comissao_pct     INTEGER     DEFAULT 30,
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketplace_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace: leitura"
  ON public.marketplace_submissions FOR SELECT
  USING (auth.uid() = user_id OR status = 'approved' OR auth.role() = 'authenticated');

CREATE POLICY "marketplace: insert"
  ON public.marketplace_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "marketplace: update admin"
  ON public.marketplace_submissions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "marketplace: delete admin"
  ON public.marketplace_submissions FOR DELETE
  USING (auth.role() = 'authenticated');