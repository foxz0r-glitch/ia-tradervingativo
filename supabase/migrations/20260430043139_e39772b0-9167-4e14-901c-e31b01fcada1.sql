ALTER TABLE public.casatrade_data
  ADD COLUMN IF NOT EXISTS postback_evento text,
  ADD COLUMN IF NOT EXISTS postback_recebido_em timestamptz;