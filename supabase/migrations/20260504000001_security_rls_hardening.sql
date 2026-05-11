-- Security hardening: restrict overly permissive RLS policies
-- All legitimate writes to these tables come from service_role (bypasses RLS)
-- or SECURITY DEFINER functions (run as postgres, bypasses RLS).
-- These policies only affect direct anon/authenticated client calls.

-- 1. trade_events INSERT: was WITH CHECK (true) — any authenticated user could
--    insert trades with any user_id. Restrict: service_role bypasses RLS anyway,
--    so this effectively blocks all direct client inserts.
DROP POLICY IF EXISTS "service inserts trades" ON public.trade_events;
CREATE POLICY "service inserts trades" ON public.trade_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 2. user_missions INSERT: was WITH CHECK (true) — any authenticated user could
--    insert missions for any user_id. The "users manage own missions" FOR ALL
--    policy already covers users inserting their own missions correctly.
DROP POLICY IF EXISTS "service upserts missions" ON public.user_missions;
CREATE POLICY "service upserts missions" ON public.user_missions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 3. rank_history INSERT: same issue — open to any authenticated user.
DROP POLICY IF EXISTS "service manages rank history" ON public.rank_history;
CREATE POLICY "service manages rank history" ON public.rank_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 4. rank_history UPDATE: was USING (true) — any authenticated user could update
--    any rank record. Restrict to service_role.
DROP POLICY IF EXISTS "service updates rank history" ON public.rank_history;
CREATE POLICY "service updates rank history" ON public.rank_history
  FOR UPDATE USING (auth.role() = 'service_role');
