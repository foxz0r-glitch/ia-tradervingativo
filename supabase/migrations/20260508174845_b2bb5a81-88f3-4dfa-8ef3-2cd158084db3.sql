DELETE FROM public.casatrade_data
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY casatrade_user_id
        ORDER BY updated_at DESC NULLS LAST, imported_at DESC
      ) AS rn
    FROM public.casatrade_data
    WHERE casatrade_user_id IS NOT NULL
  ) sub WHERE rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'casatrade_data_casatrade_user_id_unique'
  ) THEN
    ALTER TABLE public.casatrade_data
      ADD CONSTRAINT casatrade_data_casatrade_user_id_unique UNIQUE (casatrade_user_id);
  END IF;
END $$;