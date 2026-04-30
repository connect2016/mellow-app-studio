
-- =========================================================
-- Time-windowed League Leaders + Rank Snapshots
-- =========================================================

-- 1. Track weekly snapshots so we can compute "Rising Star" (most rank gain) and "Iron Fan" (consistent participation).
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  period text NOT NULL,                -- 'week' | 'month' | 'season'
  period_start date NOT NULL,
  rank integer NOT NULL,
  stat_value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, period, period_start)
);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "Anyone can view snapshots"
  ON public.leaderboard_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- 2. Replace get_league_leaders with a version that supports time periods.
DROP FUNCTION IF EXISTS public.get_league_leaders(text, integer);
DROP FUNCTION IF EXISTS public.get_league_leaders(text, integer, text);

CREATE OR REPLACE FUNCTION public.get_league_leaders(
  p_category text,
  p_limit integer DEFAULT 100,
  p_period text DEFAULT 'season'
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  profile_photo text,
  favorite_food_spot text,
  stat_value integer,
  rank integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start  timestamptz := date_trunc('week',  now());
  month_start timestamptz := date_trunc('month', now());
  day_start   timestamptz := date_trunc('day',   now());
  win_start   timestamptz;
BEGIN
  win_start := CASE p_period
    WHEN 'week'   THEN week_start
    WHEN 'month'  THEN month_start
    ELSE 'epoch'::timestamptz   -- season / cumulative
  END;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.user_id,
      p.display_name,
      p.profile_photo,
      p.favorite_food_spot,
      CASE p_category
        WHEN 'beersToday'         THEN p.beers_today_count
        WHEN 'beersThisWeek'      THEN p.beers_week_count
        WHEN 'shotsTakenSeason'   THEN p.shots_taken_season
        WHEN 'appetizersHadSeason'THEN p.appetizers_had_season

        WHEN 'barsVisitedToday' THEN (
          SELECT COUNT(DISTINCT bc.bar_name)::int
          FROM public.bar_checkins bc
          WHERE bc.user_id = p.user_id
            AND bc.checked_in_at >= day_start
        )
        WHEN 'barsVisitedThisWeek' THEN (
          SELECT COUNT(DISTINCT bc.bar_name)::int
          FROM public.bar_checkins bc
          WHERE bc.user_id = p.user_id
            AND bc.checked_in_at >= GREATEST(week_start, win_start)
        )
        WHEN 'meetupsFinished' THEN (
          SELECT COUNT(*)::int
          FROM public.lineup_members lm
          WHERE lm.user_id = p.user_id
            AND lm.joined_at >= win_start
        )
        WHEN 'fansConnected' THEN (
          SELECT COUNT(*)::int
          FROM public.matches m
          WHERE (m.user_a = p.user_id OR m.user_b = p.user_id)
            AND m.status = 'matched'
            AND m.created_at >= win_start
        )
        ELSE 0
      END AS stat_value
    FROM public.profiles p
    WHERE p.is_banned = false
      AND p.onboarding_completed = true
      AND p.hidden_from_discover = false
  )
  SELECT
    b.user_id,
    b.display_name,
    b.profile_photo,
    b.favorite_food_spot,
    b.stat_value,
    (RANK() OVER (ORDER BY b.stat_value DESC, b.display_name ASC))::int AS rank
  FROM base b
  ORDER BY stat_value DESC, b.display_name ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- 3. Helper RPC: rank delta vs last week (for Rising Star badge) and weekly participation streak (Iron Fan).
CREATE OR REPLACE FUNCTION public.get_leaderboard_extras(p_category text, p_period text DEFAULT 'season')
RETURNS TABLE (
  user_id uuid,
  rank_delta integer,           -- positive = climbed
  weeks_active_recent integer   -- weeks of activity in last 6 weeks
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH last_week AS (
    SELECT s.user_id, s.rank
    FROM public.leaderboard_snapshots s
    WHERE s.category = p_category
      AND s.period = p_period
      AND s.period_start = (date_trunc('week', now()) - interval '7 days')::date
  ),
  current_week AS (
    SELECT s.user_id, s.rank
    FROM public.leaderboard_snapshots s
    WHERE s.category = p_category
      AND s.period = p_period
      AND s.period_start = date_trunc('week', now())::date
  ),
  participation AS (
    SELECT s.user_id, COUNT(DISTINCT s.period_start)::int AS weeks_active
    FROM public.leaderboard_snapshots s
    WHERE s.category = p_category
      AND s.period = 'week'
      AND s.period_start >= (date_trunc('week', now()) - interval '6 weeks')::date
    GROUP BY s.user_id
  )
  SELECT
    COALESCE(c.user_id, l.user_id, pa.user_id) AS user_id,
    COALESCE(l.rank - c.rank, 0) AS rank_delta,
    COALESCE(pa.weeks_active, 0) AS weeks_active_recent
  FROM current_week c
  FULL OUTER JOIN last_week l ON l.user_id = c.user_id
  FULL OUTER JOIN participation pa ON pa.user_id = COALESCE(c.user_id, l.user_id);
$$;
