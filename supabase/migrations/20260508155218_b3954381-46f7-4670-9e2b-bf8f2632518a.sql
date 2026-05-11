create table if not exists public.user_operations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  created_at    timestamptz default now(),
  symbol        text,
  direction     text,
  result        text,
  pnl           numeric,
  invest        numeric,
  payout        numeric,
  open_ts       bigint,
  close_ts      bigint,
  expiracao_seg integer,
  ai_model      text,
  session_id    bigint
);

alter table public.user_operations enable row level security;

create policy "Usuário insere próprias operações"
  on public.user_operations for insert
  with check (auth.uid() = user_id);

create policy "Usuário lê próprias operações"
  on public.user_operations for select
  using (auth.uid() = user_id);

create policy "Admin lê todas as operações"
  on public.user_operations for select
  using (public.has_role(auth.uid(), 'admin'));