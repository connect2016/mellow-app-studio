
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beers_today_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beers_week_count  integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_league_leaders(
  p_category text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
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
  week_start timestamptz := date_trunc('week', now());
  day_start  timestamptz := date_trunc('day',  now());
BEGIN
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
            AND bc.checked_in_at >= week_start
        )
        WHEN 'meetupsFinished' THEN (
          SELECT COUNT(*)::int
          FROM public.lineup_members lm
          WHERE lm.user_id = p.user_id
        )
        WHEN 'fansConnected' THEN (
          SELECT COUNT(*)::int
          FROM public.matches m
          WHERE (m.user_a = p.user_id OR m.user_b = p.user_id)
            AND m.status = 'matched'
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

REVOKE EXECUTE ON FUNCTION public.get_league_leaders(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_league_leaders(text, integer) TO authenticated;
