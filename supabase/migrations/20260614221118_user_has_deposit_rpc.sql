CREATE OR REPLACE FUNCTION public.user_has_deposit()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.casatrade_data cd
      JOIN auth.users u ON lower(u.email) = lower(cd.email)
      WHERE u.id = auth.uid()
        AND (COALESCE(cd.total_deposited, 0) > 0 OR cd.ftd_date IS NOT NULL)
    )
    OR EXISTS (
      SELECT 1
      FROM public.casatrade_balance_history bh
      WHERE bh.user_id = auth.uid()
        AND bh.deposito_detectado = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_deposit() TO authenticated;
