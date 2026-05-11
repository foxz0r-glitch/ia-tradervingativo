ALTER TABLE public.casatrade_data
  ADD CONSTRAINT casatrade_data_casatrade_user_id_key
  UNIQUE (casatrade_user_id);