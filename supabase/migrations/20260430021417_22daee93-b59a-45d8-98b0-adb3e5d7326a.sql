ALTER TABLE public.casatrade_balance_history
ADD COLUMN IF NOT EXISTS tipo_variacao text DEFAULT 'inicial',
ADD COLUMN IF NOT EXISTS saque_detectado boolean DEFAULT false;