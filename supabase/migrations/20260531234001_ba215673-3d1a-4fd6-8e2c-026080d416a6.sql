
-- Leaderboard RPC functions (SECURITY DEFINER to aggregate across all users)

-- Top Fans: rank by total completed missions
CREATE OR REPLACE FUNCTION public.leaderboard_top_fans(_limit int DEFAULT 10)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  display_name text,
  profile_photo text,
  missions_completed bigint,
  points_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      mp.user_id,
      COUNT(*) FILTER (WHERE mp.completed) AS missions_completed,
      COALESCE(SUM(CASE WHEN mp.completed THEN m.points ELSE 0 END), 0) AS points_total
    FROM mission_progress mp
    JOIN missions m ON m.id = mp.mission_id
    GROUP BY mp.user_id
  )
  SELECT
    RANK() OVER (ORDER BY s.missions_completed DESC, s.points_total DESC) AS rank,
    s.user_id,
    COALESCE(p.display_name, 'Cubs Fan') AS display_name,
    p.profile_photo,
    s.missions_completed,
    s.points_total
  FROM stats s
  LEFT JOIN profiles p ON p.user_id = s.user_id
  WHERE s.missions_completed > 0
  ORDER BY rank
  LIMIT _limit;
$$;

-- Current user's fan rank (always returns 1 row if user has progress)
CREATE OR REPLACE FUNCTION public.leaderboard_my_fan_rank()
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  display_name text,
  profile_photo text,
  missions_completed bigint,
  points_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      mp.user_id,
      COUNT(*) FILTER (WHERE mp.completed) AS missions_completed,
      COALESCE(SUM(CASE WHEN mp.completed THEN m.points ELSE 0 END), 0) AS points_total
    FROM mission_progress mp
    JOIN missions m ON m.id = mp.mission_id
    GROUP BY mp.user_id
  ),
  ranked AS (
    SELECT
      RANK() OVER (ORDER BY s.missions_completed DESC, s.points_total DESC) AS rank,
      s.user_id,
      s.missions_completed,
      s.points_total
    FROM stats s
    WHERE s.missions_completed > 0
  )
  SELECT
    r.rank,
    r.user_id,
    COALESCE(p.display_name, 'You') AS display_name,
    p.profile_photo,
    r.missions_completed,
    r.points_total
  FROM ranked r
  LEFT JOIN profiles p ON p.user_id = r.user_id
  WHERE r.user_id = auth.uid();
$$;

-- Most Active Crews: rank by combined member bar_checkins this season (last 90d)
CREATE OR REPLACE FUNCTION public.leaderboard_top_crews(_limit int DEFAULT 10)
RETURNS TABLE(
  rank bigint,
  crew_id uuid,
  crew_name text,
  badge_emoji text,
  member_count bigint,
  checkin_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH crew_checkins AS (
    SELECT
      cm.crew_id,
      COUNT(DISTINCT cm.user_id) AS member_count,
      COUNT(bc.id) AS checkin_total
    FROM crew_members cm
    LEFT JOIN bar_checkins bc
      ON bc.user_id = cm.user_id
     AND bc.checked_in_at > now() - interval '90 days'
    GROUP BY cm.crew_id
  )
  SELECT
    RANK() OVER (ORDER BY cc.checkin_total DESC, cc.member_count DESC) AS rank,
    cc.crew_id,
    c.name AS crew_name,
    c.badge_emoji,
    cc.member_count,
    cc.checkin_total
  FROM crew_checkins cc
  JOIN crews c ON c.id = cc.crew_id
  ORDER BY rank
  LIMIT _limit;
$$;

-- Current user's crew rank (best crew if user belongs to multiple)
CREATE OR REPLACE FUNCTION public.leaderboard_my_crew_rank()
RETURNS TABLE(
  rank bigint,
  crew_id uuid,
  crew_name text,
  badge_emoji text,
  member_count bigint,
  checkin_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH crew_checkins AS (
    SELECT
      cm.crew_id,
      COUNT(DISTINCT cm.user_id) AS member_count,
      COUNT(bc.id) AS checkin_total
    FROM crew_members cm
    LEFT JOIN bar_checkins bc
      ON bc.user_id = cm.user_id
     AND bc.checked_in_at > now() - interval '90 days'
    GROUP BY cm.crew_id
  ),
  ranked AS (
    SELECT
      RANK() OVER (ORDER BY cc.checkin_total DESC, cc.member_count DESC) AS rank,
      cc.*
    FROM crew_checkins cc
  )
  SELECT
    r.rank,
    r.crew_id,
    c.name AS crew_name,
    c.badge_emoji,
    r.member_count,
    r.checkin_total
  FROM ranked r
  JOIN crews c ON c.id = r.crew_id
  WHERE r.crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  ORDER BY r.rank
  LIMIT 1;
$$;

-- Bar Champions: most checked-into bars this week
CREATE OR REPLACE FUNCTION public.leaderboard_top_bars(_limit int DEFAULT 10)
RETURNS TABLE(
  rank bigint,
  bar_name text,
  checkin_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    RANK() OVER (ORDER BY COUNT(*) DESC) AS rank,
    bc.bar_name,
    COUNT(*) AS checkin_count
  FROM bar_checkins bc
  WHERE bc.checked_in_at > now() - interval '7 days'
    AND bc.visibility = 'visible'
  GROUP BY bc.bar_name
  ORDER BY rank
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_top_fans(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_my_fan_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_top_crews(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_my_crew_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_top_bars(int) TO authenticated;
