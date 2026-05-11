CREATE TABLE IF NOT EXISTS public.activation_codes (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  code          text        UNIQUE NOT NULL,
  cakto_order_id text       NOT NULL,
  cakto_event   text        NOT NULL,
  ref_id        uuid        NOT NULL,
  tipo          text        NOT NULL CHECK (tipo IN ('plan', 'upsell')),
  customer_email text       NOT NULL,
  claimed_by    uuid        REFERENCES auth.users(id),
  claimed_at    timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access" ON public.activation_codes
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(p_email)) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_activation_code_by_order(p_order_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT code FROM public.activation_codes
  WHERE cakto_order_id = p_order_id
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_activation_code_by_order(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_activation_code(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code  public.activation_codes%ROWTYPE;
  v_plan  public.plans%ROWTYPE;
  v_now   timestamptz := now();
BEGIN
  SELECT * INTO v_code
  FROM public.activation_codes
  WHERE code = upper(trim(p_code))
    AND claimed_by IS NULL
    AND (expires_at IS NULL OR expires_at > v_now);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Código inválido ou já utilizado');
  END IF;

  UPDATE public.activation_codes
  SET claimed_by = p_user_id, claimed_at = v_now
  WHERE id = v_code.id;

  IF v_code.tipo = 'plan' THEN
    SELECT * INTO v_plan FROM public.plans WHERE id = v_code.ref_id;

    INSERT INTO public.user_subscriptions (
      user_id, plan_id, cakto_order_id, status,
      starts_at, expires_at, is_lifetime, created_at, updated_at
    ) VALUES (
      p_user_id, v_code.ref_id, v_code.cakto_order_id, 'active',
      v_now, v_code.expires_at, v_plan.is_vitalicio, v_now, v_now
    );

    INSERT INTO public.user_access (user_id, plan, access_expires_at, granted_by)
    VALUES (p_user_id, v_plan.slug, v_code.expires_at, 'activation_code')
    ON CONFLICT (user_id) DO UPDATE
      SET plan             = v_plan.slug,
          access_expires_at = v_code.expires_at,
          granted_by       = 'activation_code',
          updated_at       = v_now;

    RETURN jsonb_build_object('ok', true, 'tipo', 'plan', 'plan_slug', v_plan.slug);

  ELSIF v_code.tipo = 'upsell' THEN
    INSERT INTO public.user_upsells (user_id, upsell_id, cakto_order_id, status, created_at)
    VALUES (p_user_id, v_code.ref_id, v_code.cakto_order_id, 'active', v_now);

    RETURN jsonb_build_object('ok', true, 'tipo', 'upsell');
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'Tipo desconhecido');
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_activation_code(text, uuid) TO authenticated;