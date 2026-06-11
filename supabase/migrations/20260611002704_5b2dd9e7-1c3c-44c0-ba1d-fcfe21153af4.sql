
-- 1. activity_feed: tighten SELECT, add SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Activity feed readable by authenticated" ON public.activity_feed;
CREATE POLICY "Users view own activity rows"
  ON public.activity_feed FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_activity_feed(p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  activity_type text,
  context_text text,
  location_zone text,
  w_flag_count int,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, activity_type, context_text, location_zone, w_flag_count, created_at
  FROM public.activity_feed
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(p_limit, 20), 100));
$$;
REVOKE ALL ON FUNCTION public.get_activity_feed(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_activity_feed(int) TO authenticated;

-- 2. bar_partners_waitlist: admin-only SELECT
DROP POLICY IF EXISTS "Users can view own submissions" ON public.bar_partners_waitlist;
CREATE POLICY "Admins can view waitlist submissions"
  ON public.bar_partners_waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. scoring_entries: require session membership on INSERT
DROP POLICY IF EXISTS "Members can create entries" ON public.scoring_entries;
CREATE POLICY "Members can create entries"
  ON public.scoring_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.scoring_session_members
      WHERE session_id = scoring_entries.session_id
        AND user_id = auth.uid()
    )
  );
