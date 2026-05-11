alter table public.user_credentials 
add column if not exists casatrade_token text,
add column if not exists casatrade_user_id bigint;