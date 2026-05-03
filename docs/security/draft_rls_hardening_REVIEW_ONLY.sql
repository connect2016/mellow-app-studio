-- =====================================================================
-- DRAFT — DO NOT APPLY WITHOUT REVIEW
-- This file lives outside supabase/migrations/ on purpose so it is
-- NEVER auto-applied. Copy into the migration tool when ready.
-- =====================================================================
-- Audit summary (run 2026-05-03):
--   • 59 public tables, ALL have RLS enabled.
--   • profiles has NO email/phone column (PII stays in auth.users) ✓
--   • No `buddy_connections` table — closest analogs already participant-scoped:
--       - matches            (user_a, user_b)            — participants only ✓
--       - teammate_requests  (requester_id, recipient_id)— scoped ✓
--   • profiles SELECT policy already restricts to authenticated.
--
-- The spec's two patterns are therefore either already satisfied or N/A.
-- Statements below are the spec's literal patterns adapted to this
-- schema, wrapped in IF NOT EXISTS guards so re-runs are safe and
-- nothing existing is dropped (per constraint).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles: authenticated read of public fields  (additive, idempotent)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='public_profiles_read'
  ) THEN
    CREATE POLICY "public_profiles_read" ON public.profiles
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2) Buddy-connection analog → matches (participant-only SELECT)
--    matches has no `initiated_by`; the existing INSERT policy is
--    already stricter than an `initiated_by` check would be, so we do
--    NOT add a new INSERT policy (would loosen, not tighten, access).
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='matches'
      AND policyname='connection_participants'
  ) THEN
    CREATE POLICY "connection_participants" ON public.matches
      FOR SELECT TO authenticated
      USING (auth.uid() = user_a OR auth.uid() = user_b);
  END IF;
END $$;

-- =====================================================================
-- Manual review checklist before applying:
--   [ ] Confirm `public_profiles_read` does not duplicate an existing
--       profiles SELECT policy (would be redundant, not unsafe).
--   [ ] Confirm `connection_participants` matches your intended
--       definition of a "buddy connection" (this app uses matches +
--       teammate_requests rather than a buddy_connections table).
--   [ ] Test in the Supabase dashboard RLS tester with two user IDs
--       before promoting to production.
-- =====================================================================
