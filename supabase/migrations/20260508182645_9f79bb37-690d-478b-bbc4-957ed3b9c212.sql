UPDATE public.user_xp x
SET display_name = TRIM(
  COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
  COALESCE(u.raw_user_meta_data->>'last_name', '')
)
FROM auth.users u
WHERE x.user_id = u.id
  AND (x.display_name IS NULL OR x.display_name = '')
  AND TRIM(
    COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' ||
    COALESCE(u.raw_user_meta_data->>'last_name', '')
  ) <> '';

CREATE OR REPLACE FUNCTION public._sync_display_name_on_xp_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    SELECT TRIM(
      COALESCE(raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(raw_user_meta_data->>'last_name', '')
    )
    INTO v_name
    FROM auth.users
    WHERE id = NEW.user_id;
    IF v_name IS NOT NULL AND v_name <> '' AND v_name <> ' ' THEN
      NEW.display_name := v_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_display_name_on_xp_insert ON public.user_xp;
CREATE TRIGGER trg_sync_display_name_on_xp_insert
  BEFORE INSERT ON public.user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public._sync_display_name_on_xp_insert();