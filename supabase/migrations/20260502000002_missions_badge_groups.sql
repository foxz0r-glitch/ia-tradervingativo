-- ============================================================
-- Gamification v2 — parte 2
-- • badge_group em achievements_catalog
-- • equipped em user_achievements
-- • missions_catalog + user_missions
-- • rank_history (snapshot diário para rank_change)
-- ============================================================

-- 1. badge_group no catálogo de conquistas
ALTER TABLE public.achievements_catalog
  ADD COLUMN IF NOT EXISTS badge_group text NOT NULL DEFAULT 'outros';

UPDATE public.achievements_catalog SET badge_group = CASE
  WHEN key IN ('daily_login','streak_7','streak_30','streak_100') THEN 'streak'
  WHEN key IN ('first_trade','win_10','win_50','win_100')          THEN 'trading'
  WHEN key IN ('rank_ouro','rank_ak','rank_aguia','rank_supremo','rank_global') THEN 'patente'
  WHEN key IN ('deposit_first')                                    THEN 'financeiro'
  ELSE 'outros'
END;

-- 2. Equipar badge (destaque)
ALTER TABLE public.user_achievements
  ADD COLUMN IF NOT EXISTS equipped boolean NOT NULL DEFAULT false;

-- 3. Catálogo de missões
CREATE TABLE IF NOT EXISTS public.missions_catalog (
  id                text    PRIMARY KEY,
  title             text    NOT NULL,
  description       text,
  type              text    NOT NULL DEFAULT 'daily'
                            CHECK (type IN ('daily','weekly','permanent')),
  requirement_type  text    NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  xp_reward         integer NOT NULL DEFAULT 0,
  icon              text,
  sort_order        integer NOT NULL DEFAULT 0
);

ALTER TABLE public.missions_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions catalog public read" ON public.missions_catalog FOR SELECT USING (true);

INSERT INTO public.missions_catalog
  (id, title, description, type, requirement_type, requirement_value, xp_reward, sort_order)
VALUES
  ('daily_login',      'Login Diário',       'Faça login hoje',                           'daily',     'login',         1,  10, 1),
  ('daily_3_trades',   'Operador Ativo',     'Realize 3 operações hoje',                  'daily',     'trades_today',  3,  30, 2),
  ('daily_2_wins',     'Sniper do Dia',      'Vença 2 operações hoje',                    'daily',     'wins_today',    2,  25, 3),
  ('weekly_10_trades', 'Trader da Semana',   'Realize 10 operações nesta semana',         'weekly',    'trades_week',  10, 100, 4),
  ('weekly_5_wins',    'Série Vencedora',    'Vença 5 operações nesta semana',            'weekly',    'wins_week',     5,  75, 5),
  ('perm_first_trade', 'Primeira Operação',  'Realize sua primeira operação no total',    'permanent', 'total_trades',  1,  50, 6),
  ('perm_10_wins',     '10 Vitórias',        'Vença 10 operações no total',               'permanent', 'total_wins',   10, 200, 7),
  ('perm_streak_7',    'Semana Perfeita',    'Login 7 dias seguidos',                     'permanent', 'streak',        7, 100, 8),
  ('perm_streak_30',   'Mês Imparável',      'Login 30 dias seguidos',                    'permanent', 'streak',       30, 500, 9)
ON CONFLICT (id) DO NOTHING;

-- 4. Progresso do usuário nas missões
CREATE TABLE IF NOT EXISTS public.user_missions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  mission_id   text        NOT NULL,
  progress     integer     NOT NULL DEFAULT 0,
  completed_at timestamptz,
  reset_at     date,
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
-- Usuário só vê as próprias missões
CREATE POLICY "users view own missions"    ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users manage own missions"  ON public.user_missions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service upserts missions"   ON public.user_missions FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON public.user_missions(user_id);

-- 5. Histórico de rank diário (para calcular variação de posição)
CREATE TABLE IF NOT EXISTS public.rank_history (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL,
  rank_position integer NOT NULL,
  score         integer NOT NULL DEFAULT 0,
  recorded_date date    NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, recorded_date)
);

ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank history public read"    ON public.rank_history FOR SELECT  USING (true);
CREATE POLICY "service manages rank history" ON public.rank_history FOR INSERT WITH CHECK (true);
CREATE POLICY "service updates rank history" ON public.rank_history FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_rank_history_user_date ON public.rank_history(user_id, recorded_date DESC);
