CREATE OR REPLACE FUNCTION public.claim_activation_code(p_code text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code  public.activation_codes%ROWTYPE;
  v_plan  public.plans%ROWTYPE;
  v_now   timestamptz := now();
BEGIN
  -- Autorizacao: usuario autenticado so opera na propria conta (fecha IDOR); service_role (backend) permitido
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Operação não autorizada');
  END IF;

  -- ===== BRANCH MESTRE "1337" (cosmético · permanente · reutilizável por todos) =====
  IF upper(trim(p_code)) = '1337' THEN
    SELECT * INTO v_plan FROM public.plans WHERE slug = 'pro' LIMIT 1;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Plano pro nao cadastrado');
    END IF;

    INSERT INTO public.user_subscriptions
      (user_id, plan_id, status, starts_at, expires_at, is_lifetime, created_at, updated_at)
    VALUES
      (p_user_id, v_plan.id, 'active', v_now, NULL, true, v_now, v_now)
    ON CONFLICT (user_id) DO UPDATE
      SET plan_id     = EXCLUDED.plan_id,
          status      = 'active',
          expires_at  = NULL,
          is_lifetime = true,
          updated_at  = v_now;

    INSERT INTO public.user_access
      (user_id, plan, access_expires_at, granted_by)
    VALUES
      (p_user_id, v_plan.slug, NULL, NULL)
    ON CONFLICT (user_id) DO UPDATE
      SET plan              = EXCLUDED.plan,
          access_expires_at = NULL,
          granted_by        = NULL,
          updated_at        = v_now;

    RETURN jsonb_build_object('ok', true, 'tipo', 'plan', 'plan_slug', v_plan.slug);
  END IF;
  -- ===== FIM BRANCH "1337" =====

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
    VALUES (p_user_id, v_plan.slug, v_code.expires_at, NULL)   -- FIX: era 'activation_code' (string num campo uuid → erro de cast)
    ON CONFLICT (user_id) DO UPDATE
      SET plan              = v_plan.slug,
          access_expires_at = v_code.expires_at,
          granted_by        = NULL,                            -- FIX (mesmo motivo)
          updated_at        = v_now;

    RETURN jsonb_build_object('ok', true, 'tipo', 'plan', 'plan_slug', v_plan.slug);

  ELSIF v_code.tipo = 'upsell' THEN
    INSERT INTO public.user_upsells (user_id, upsell_id, cakto_order_id, status, created_at)
    VALUES (p_user_id, v_code.ref_id, v_code.cakto_order_id, 'active', v_now);

    RETURN jsonb_build_object('ok', true, 'tipo', 'upsell');
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'Tipo desconhecido');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_activation_code(text, uuid) TO authenticated;
