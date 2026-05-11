
-- 1. PLANS
CREATE TABLE IF NOT EXISTS public.plans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT        UNIQUE NOT NULL,
  nome              TEXT        NOT NULL,
  max_estrategias   INTEGER     NOT NULL DEFAULT 3,
  is_recorrente     BOOLEAN     NOT NULL DEFAULT false,
  is_vitalicio      BOOLEAN     NOT NULL DEFAULT false,
  ativo             BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans: leitura pública"  ON public.plans FOR SELECT USING (true);
CREATE POLICY "plans: escrita service"  ON public.plans FOR ALL    USING (auth.role() = 'service_role');

INSERT INTO public.plans (slug, nome, max_estrategias, is_recorrente, is_vitalicio) VALUES
  ('free',      'Free',      3,  false, false),
  ('pro',       'Pro',       10, true,  false),
  ('elite',     'Elite',     20, true,  false),
  ('vitalicio', 'Vitalício', 20, false, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. COURSES já existe — mantida intacta. Nenhuma alteração.

-- 3. COURSE_PLAN_ACCESS
CREATE TABLE IF NOT EXISTS public.course_plan_access (
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  plan_id   UUID REFERENCES public.plans(id)   ON DELETE CASCADE,
  PRIMARY KEY (course_id, plan_id)
);

ALTER TABLE public.course_plan_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_plan_access: leitura pública"  ON public.course_plan_access FOR SELECT USING (true);
CREATE POLICY "course_plan_access: escrita service"  ON public.course_plan_access FOR ALL    USING (auth.role() = 'service_role');

-- 4. USER_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                  UUID        NOT NULL REFERENCES public.plans(id),
  kirvano_order_id         TEXT,
  kirvano_subscription_id  TEXT,
  status                   TEXT        NOT NULL DEFAULT 'active',
  starts_at                TIMESTAMPTZ DEFAULT NOW(),
  expires_at               TIMESTAMPTZ,
  is_lifetime              BOOLEAN     DEFAULT false,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions (user_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions: lê próprio"      ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_subscriptions: escrita service" ON public.user_subscriptions FOR ALL    USING (auth.role() = 'service_role');

-- 5. UPSELLS
CREATE TABLE IF NOT EXISTS public.upsells (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  tipo          TEXT        NOT NULL,
  valor         NUMERIC(10,2),
  is_recorrente BOOLEAN     DEFAULT false,
  ativo         BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upsells: leitura pública"  ON public.upsells FOR SELECT USING (true);
CREATE POLICY "upsells: escrita service"  ON public.upsells FOR ALL    USING (auth.role() = 'service_role');

-- 6. USER_UPSELLS
CREATE TABLE IF NOT EXISTS public.user_upsells (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upsell_id        UUID        NOT NULL REFERENCES public.upsells(id),
  kirvano_order_id TEXT,
  status           TEXT        NOT NULL DEFAULT 'active',
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_upsells: lê próprio"      ON public.user_upsells FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_upsells: escrita service" ON public.user_upsells FOR ALL    USING (auth.role() = 'service_role');

-- 7. KIRVANO_PRODUCT_MAP
CREATE TABLE IF NOT EXISTS public.kirvano_product_map (
  id                   UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  kirvano_product_id   TEXT  UNIQUE NOT NULL,
  kirvano_product_nome TEXT,
  tipo                 TEXT  NOT NULL,
  ref_id               UUID  NOT NULL,
  ativo                BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kirvano_product_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kirvano_product_map: leitura autenticado" ON public.kirvano_product_map FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "kirvano_product_map: escrita service"     ON public.kirvano_product_map FOR ALL    USING (auth.role() = 'service_role');

-- 8. KIRVANO_EVENTS
CREATE TABLE IF NOT EXISTS public.kirvano_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento           TEXT        NOT NULL,
  kirvano_order_id TEXT,
  kirvano_email    TEXT,
  payload          JSONB,
  status           TEXT        DEFAULT 'processed',
  erro             TEXT,
  processado_em    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kirvano_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kirvano_events: escrita service" ON public.kirvano_events FOR ALL USING (auth.role() = 'service_role');

-- RPC: retorna plano ativo do usuário
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TABLE (
  plan_slug        TEXT,
  plan_nome        TEXT,
  max_estrategias  INTEGER,
  is_vitalicio     BOOLEAN,
  is_recorrente    BOOLEAN,
  status           TEXT,
  expires_at       TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pl.slug,
    pl.nome,
    pl.max_estrategias,
    pl.is_vitalicio,
    pl.is_recorrente,
    us.status,
    us.expires_at
  FROM public.user_subscriptions us
  JOIN public.plans pl ON pl.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  LIMIT 1;
$$;

-- RPC: retorna cursos acessíveis ao usuário
-- Adaptada ao schema atual da tabela `courses`:
--   title, description, thumbnail_url, panda_video_id, ordem, published
CREATE OR REPLACE FUNCTION public.get_user_courses(p_user_id UUID)
RETURNS TABLE (
  id              UUID,
  title           TEXT,
  description     TEXT,
  thumbnail_url   TEXT,
  panda_video_id  TEXT,
  ordem           INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    c.id, c.title, c.description, c.thumbnail_url, c.panda_video_id, c.ordem
  FROM public.courses c
  JOIN public.course_plan_access cpa ON cpa.course_id = c.id
  JOIN public.user_subscriptions us  ON us.plan_id = cpa.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
    AND c.published = true
  ORDER BY c.ordem;
$$;
