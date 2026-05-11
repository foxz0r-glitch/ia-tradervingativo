DELETE FROM public.user_credentials a
USING public.user_credentials b
WHERE a.ctid < b.ctid
  AND a.id = b.id;