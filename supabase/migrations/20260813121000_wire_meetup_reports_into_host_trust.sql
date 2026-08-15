-- get_host_trust previously only counted recent_reports from user_reports,
-- so meetup-level complaints (meetup_reports) against a host never affected
-- their trust badge. Fold pending meetup_reports on meetups the host created
-- into the same recent_reports count.

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
          AND r.status = 'pending') AS user_report_count,
      (SELECT COUNT(*)::INTEGER FROM public.meetup_reports mr
        JOIN public.lineup_meetups m ON m.id = mr.meetup_id
        WHERE m.creator_id = _host_id
          AND mr.created_at > now() - interval '90 days'
          AND mr.status = 'pending') AS meetup_report_count,
      (SELECT COALESCE(p.is_verified, false) FROM public.profiles p WHERE p.user_id = _host_id) AS is_verified
  )
  SELECT
    s.hosted_count,
    s.user_report_count + s.meetup_report_count AS recent_reports,
    s.is_verified,
    (s.is_verified AND s.hosted_count >= 3 AND (s.user_report_count + s.meetup_report_count) = 0) AS is_trusted,
    (s.hosted_count <= 1) AS is_first_time
  FROM stats s;
$$;
