-- Security hardening: restrict overly permissive RLS policies
DROP POLICY IF EXISTS "service inserts trades" ON public.trade_events;
CREATE POLICY "service inserts trades" ON public.trade_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service upserts missions" ON public.user_missions;
CREATE POLICY "service upserts missions" ON public.user_missions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service manages rank history" ON public.rank_history;
CREATE POLICY "service manages rank history" ON public.rank_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service updates rank history" ON public.rank_history;
CREATE POLICY "service updates rank history" ON public.rank_history
  FOR UPDATE USING (auth.role() = 'service_role');