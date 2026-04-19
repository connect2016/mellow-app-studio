-- Per-meetup attendance visibility
ALTER TABLE public.lineup_members
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Allow members to flip their own visibility
DROP POLICY IF EXISTS "Users can update own membership" ON public.lineup_members;
CREATE POLICY "Users can update own membership"
ON public.lineup_members FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Meetup-level reports (separate from per-user user_reports)
CREATE TABLE IF NOT EXISTS public.meetup_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meetup_id UUID NOT NULL REFERENCES public.lineup_meetups(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meetup_id, reporter_id)
);

ALTER TABLE public.meetup_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file meetup reports"
ON public.meetup_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view own reports"
ON public.meetup_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

-- Host trust signal (counts hosted meetups, recent reports against host)
CREATE OR REPLACE FUNCTION public.get_host_trust(_host_id UUID)
RETURNS TABLE (
  hosted_count INTEGER,
  recent_reports INTEGER,
  is_verified BOOLEAN,
  is_trusted BOOLEAN,
  is_first_time BOOLEAN
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      (SELECT COUNT(*)::INTEGER FROM public.lineup_meetups m WHERE m.creator_id = _host_id) AS hosted_count,
      (SELECT COUNT(*)::INTEGER FROM public.user_reports r
        WHERE r.reported_user_id = _host_id
          AND r.created_at > now() - interval '90 days'
          AND r.status = 'pending') AS recent_reports,
      (SELECT COALESCE(p.is_verified, false) FROM public.profiles p WHERE p.user_id = _host_id) AS is_verified
  )
  SELECT
    s.hosted_count,
    s.recent_reports,
    s.is_verified,
    (s.is_verified AND s.hosted_count >= 3 AND s.recent_reports = 0) AS is_trusted,
    (s.hosted_count <= 1) AS is_first_time
  FROM stats s;
$$;