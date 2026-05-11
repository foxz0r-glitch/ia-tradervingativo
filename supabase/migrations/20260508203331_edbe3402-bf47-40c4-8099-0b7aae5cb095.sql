ALTER TABLE public.kirvano_events RENAME TO cakto_events;
ALTER TABLE public.cakto_events RENAME COLUMN kirvano_email TO cakto_email;
ALTER TABLE public.cakto_events RENAME COLUMN kirvano_order_id TO cakto_order_id;
ALTER TABLE public.kirvano_product_map RENAME TO cakto_product_map;
ALTER TABLE public.cakto_product_map RENAME COLUMN kirvano_product_id TO cakto_product_id;
ALTER TABLE public.cakto_product_map RENAME COLUMN kirvano_product_nome TO cakto_product_nome;
ALTER TABLE public.user_subscriptions RENAME COLUMN kirvano_order_id TO cakto_order_id;
ALTER TABLE public.user_subscriptions RENAME COLUMN kirvano_subscription_id TO cakto_subscription_id;
ALTER TABLE public.user_upsells RENAME COLUMN kirvano_order_id TO cakto_order_id;