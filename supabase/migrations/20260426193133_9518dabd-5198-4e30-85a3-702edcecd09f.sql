create table public.user_credentials (
  id uuid references auth.users(id) on delete cascade primary key,
  casatrade_email text not null,
  casatrade_password text not null,
  created_at timestamp with time zone default now()
);

alter table public.user_credentials enable row level security;

create policy "Users can view own credentials"
  on public.user_credentials for select
  using (auth.uid() = id);

create policy "Users can insert own credentials"
  on public.user_credentials for insert
  with check (auth.uid() = id);