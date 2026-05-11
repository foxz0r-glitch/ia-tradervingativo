create policy "Users can update own credentials"
  on public.user_credentials for update
  using (auth.uid() = id)
  with check (auth.uid() = id);