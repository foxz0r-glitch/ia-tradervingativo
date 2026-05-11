-- ============================================================
-- Gamification v2
-- • score (patente) separado de total_xp (nível/XP acumulado)
-- • season_xp: XP da temporada atual (mensal)
-- • level: calculado via total_xp
-- • achievements_catalog: catálogo com raridade
-- • seasons: tabela de temporadas + MVP + Hall da Fama
-- • trade_events: histórico de operações (para win-rate real)
-- • award_score(): nova função para resultados de trading
-- ============================================================

-- 1. Novas colunas em user_xp
ALTER TABLE public.user_xp
  ADD COLUMN IF NOT EXISTS score      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season_xp  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season_id  text    NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  ADD COLUMN IF NOT EXISTS level      integer NOT NULL DEFAULT 1;

-- Back-fill: score = total_xp para manter as patentes atuais
UPDATE public.user_xp
  SET
    score = total_xp,
    level = GREATEST(1, floor(sqrt(GREATEST(0, total_xp)::numeric / 50))::integer + 1)
  WHERE score = 0;

-- 2. calculate_rank() agora recebe score (mesma lógica, parâmetro renomeado)
CREATE OR REPLACE FUNCTION public.calculate_rank(p_score integer)
RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  RETURN CASE
    WHEN p_score >= 150000 THEN 'Global'
    WHEN p_score >= 100000 THEN 'Supremo'
    WHEN p_score >= 75000  THEN 'Águia II'
    WHEN p_score >= 55000  THEN 'Águia I'
    WHEN p_score >= 40000  THEN 'Xerife'
    WHEN p_score >= 28000  THEN 'AK Cruzada'
    WHEN p_score >= 19000  THEN 'AK II'
    WHEN p_score >= 12000  THEN 'AK I'
    WHEN p_score >= 7500   THEN 'Ouro III'
    WHEN p_score >= 4500   THEN 'Ouro II'
    WHEN p_score >= 2500   THEN 'Ouro I'
    WHEN p_score >= 1200   THEN 'Prata III'
    WHEN p_score >= 500    THEN 'Prata II'
    ELSE 'Prata I'
  END;
END;
$$;

-- 3. calculate_level() baseado em total_xp
-- Fórmula: floor(sqrt(xp/50)) + 1
--   Nível 1 = 0 XP | Nível 5 = 1000 XP | Nível 10 = 4500 XP | Nível 20 = 19k XP
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp integer)
RETURNS integer
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  RETURN GREATEST(1, floor(sqrt(GREATEST(0, p_xp)::numeric / 50))::integer + 1);
END;
$$;

-- 4. award_xp() atualizado: incrementa XP + season_xp + level, NÃO altera score/patente
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, text, text);

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id     uuid,
  p_amount      integer,
  p_source      text,
  p_description text
)
RETURNS TABLE(new_total_xp integer, new_rank text, new_level integer, new_season_xp integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total   integer;
  v_rank    text;
  v_level   integer;
  v_season  integer;
  v_sid     text := to_char(now(), 'YYYY-MM');
BEGIN
  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (p_user_id, p_amount, p_source, p_description);

  INSERT INTO public.user_xp (user_id, total_xp, score, season_xp, season_id, current_rank, level)
  VALUES (
    p_user_id,
    GREATEST(0, p_amount),
    GREATEST(0, p_amount),
    GREATEST(0, p_amount),
    v_sid,
    public.calculate_rank(GREATEST(0, p_amount)),
    public.calculate_level(GREATEST(0, p_amount))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp   = GREATEST(0, public.user_xp.total_xp + p_amount),
    season_xp  = CASE
                   WHEN public.user_xp.season_id = v_sid
                     THEN GREATEST(0, public.user_xp.season_xp + p_amount)
                   ELSE GREATEST(0, p_amount)
                 END,
    season_id  = v_sid,
    level      = public.calculate_level(GREATEST(0, public.user_xp.total_xp + p_amount)),
    updated_at = now()
  RETURNING
    public.user_xp.total_xp,
    public.user_xp.current_rank,
    public.user_xp.level,
    public.user_xp.season_xp
  INTO v_total, v_rank, v_level, v_season;

  RETURN QUERY SELECT v_total, v_rank, v_level, v_season;
END;
$$;

-- 5. Nova função: award_score() para resultados de trading
CREATE OR REPLACE FUNCTION public.award_score(
  p_user_id uuid,
  p_delta   integer,
  p_source  text
)
RETURNS TABLE(new_score integer, new_rank text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_score integer;
  v_rank  text;
BEGIN
  INSERT INTO public.user_xp (user_id, score, current_rank)
  VALUES (
    p_user_id,
    GREATEST(0, p_delta),
    public.calculate_rank(GREATEST(0, p_delta))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score        = GREATEST(0, public.user_xp.score + p_delta),
    current_rank = public.calculate_rank(GREATEST(0, public.user_xp.score + p_delta)),
    updated_at   = now()
  RETURNING public.user_xp.score, public.user_xp.current_rank
  INTO v_score, v_rank;

  RETURN QUERY SELECT v_score, v_rank;
END;
$$;

-- 6. Catálogo de conquistas com raridade
CREATE TABLE IF NOT EXISTS public.achievements_catalog (
  key         text        PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  rarity      text        NOT NULL DEFAULT 'comum'
                          CHECK (rarity IN ('comum','rara','epica','lendaria')),
  xp_reward   integer     NOT NULL DEFAULT 0,
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog leitura publica"
  ON public.achievements_catalog FOR SELECT USING (true);

CREATE POLICY "admins gerenciam catalog"
  ON public.achievements_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.achievements_catalog (key, title, description, rarity, xp_reward) VALUES
  ('daily_login',   'Primeiro Login',        'Fez login pela primeira vez',               'comum',      10),
  ('streak_7',      'Semana Perfeita',        'Login 7 dias seguidos',                    'rara',      100),
  ('streak_30',     'Mês Imparável',          'Login 30 dias seguidos',                   'epica',     500),
  ('streak_100',    'Centenário',             'Login 100 dias seguidos',                  'lendaria', 2000),
  ('first_trade',   'Primeira Operação',      'Realizou a primeira operação',             'comum',      50),
  ('win_10',        '10 Vitórias',            'Acumulou 10 operações vencedoras',         'rara',      200),
  ('win_50',        '50 Vitórias',            'Acumulou 50 operações vencedoras',         'epica',     500),
  ('win_100',       '100 Vitórias',           'Acumulou 100 operações vencedoras',        'lendaria', 1000),
  ('deposit_first', 'Primeiro Depósito',      'Realizou o primeiro depósito',             'rara',      100),
  ('rank_ouro',     'Chegou ao Ouro',         'Alcançou a patente Ouro I',                'rara',      150),
  ('rank_ak',       'AK na Mesa',             'Alcançou a patente AK I',                  'epica',     300),
  ('rank_aguia',    'Voo da Águia',           'Alcançou a patente Águia I',               'epica',     500),
  ('rank_supremo',  'Supremo',                'Alcançou a patente Supremo',               'lendaria', 1000),
  ('rank_global',   'Global Elite',           'Alcançou a patente Global',                'lendaria', 2000)
ON CONFLICT (key) DO NOTHING;

-- 7. Tabela de temporadas (MVP + Hall da Fama)
CREATE TABLE IF NOT EXISTS public.seasons (
  id                   text        PRIMARY KEY,         -- 'YYYY-MM'
  started_at           timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  ended_at             timestamptz,
  mvp1_user_id         uuid,
  mvp2_user_id         uuid,
  mvp3_user_id         uuid,
  hall_of_fame_user_id uuid,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seasons leitura publica"
  ON public.seasons FOR SELECT USING (true);

CREATE POLICY "admins gerenciam seasons"
  ON public.seasons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.seasons (id, started_at)
VALUES (to_char(now(), 'YYYY-MM'), date_trunc('month', now()))
ON CONFLICT (id) DO NOTHING;

-- 8. Histórico de operações (para win-rate, ativo preferido, etc.)
CREATE TABLE IF NOT EXISTS public.trade_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL,
  casatrade_user_id text,
  asset             text,
  direction         text,
  result            text        CHECK (result IN ('win','loss','draw')),
  pnl               numeric,
  happened_at       timestamptz NOT NULL DEFAULT now(),
  raw_payload       jsonb
);

ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own trades"
  ON public.trade_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service inserts trades"
  ON public.trade_events FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_trade_events_user_id     ON public.trade_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_happened_at ON public.trade_events(happened_at DESC);

-- 9. Índices de performance para ranking por score e season_xp
CREATE INDEX IF NOT EXISTS idx_user_xp_score      ON public.user_xp(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_xp_season_xp  ON public.user_xp(season_xp DESC);
