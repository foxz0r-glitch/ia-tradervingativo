ALTER TABLE public.upsells
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS preco_label TEXT;

CREATE POLICY "upsells: escrita autenticado"
  ON public.upsells FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "user_upsells: leitura admin"
  ON public.user_upsells FOR SELECT
  USING (auth.role() = 'authenticated');