DELETE FROM public.user_credentials
WHERE ctid IN (
  SELECT ctid FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC NULLS LAST) AS rn
    FROM public.user_credentials
  ) ranked
  WHERE rn > 1
);