
-- 1. Fix ivy_leaves: replace permissive INSERT with validated server function
DROP POLICY "Users can earn ivy leaves" ON public.ivy_leaves;

CREATE OR REPLACE FUNCTION public.award_ivy_leaf(
  _source text,
  _source_id uuid DEFAULT NULL,
  _amount integer DEFAULT 1,
  _homestand_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _amount < 1 OR _amount > 10 THEN
    RAISE EXCEPTION 'Amount must be between 1 and 10';
  END IF;
  IF char_length(_source) > 100 THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;
  
  INSERT INTO public.ivy_leaves (user_id, source, source_id, amount, homestand_id)
  VALUES (auth.uid(), _source, _source_id, _amount, _homestand_id);
END;
$$;

-- 2. Fix user_points: replace permissive INSERT with validated server function
DROP POLICY "Users can insert own points" ON public.user_points;

CREATE OR REPLACE FUNCTION public.award_user_points(
  _source text,
  _source_id uuid DEFAULT NULL,
  _points integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _points < 1 OR _points > 100 THEN
    RAISE EXCEPTION 'Points must be between 1 and 100';
  END IF;
  IF char_length(_source) > 100 THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;
  
  INSERT INTO public.user_points (user_id, source, source_id, points)
  VALUES (auth.uid(), _source, _source_id, _points);
END;
$$;

-- 3. Fix user_locations: restrict SELECT to own location only
DROP POLICY "Authenticated can read locations" ON public.user_locations;

CREATE POLICY "Users can view own location"
ON public.user_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create server function for map data with fuzzied locations and home/work exclusion
CREATE OR REPLACE FUNCTION public.get_map_fans()
RETURNS TABLE(
  fan_user_id uuid,
  fan_display_name text,
  fan_profile_photo text,
  fan_game_status text,
  fan_wrigley_section text,
  fan_wrigleyville_bar text,
  fan_gameday_intents text[],
  fan_fan_style text[],
  fan_location_last_set_at timestamptz,
  fan_gameday_persona text,
  fan_intent text[],
  fan_latitude double precision,
  fan_longitude double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  six_hours_ago timestamptz := now() - interval '6 hours';
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.profile_photo,
    p.game_status,
    p.wrigley_section,
    p.wrigleyville_bar,
    p.gameday_intents,
    p.fan_style,
    p.location_last_set_at,
    p.gameday_persona,
    p.intent,
    CASE WHEN ul.latitude IS NOT NULL THEN ul.latitude + (random() - 0.5) * 0.003 ELSE NULL END,
    CASE WHEN ul.longitude IS NOT NULL THEN ul.longitude + (random() - 0.5) * 0.003 ELSE NULL END
  FROM public.profiles p
  LEFT JOIN public.user_locations ul ON ul.user_id = p.user_id
  WHERE p.is_banned = false
    AND p.onboarding_completed = true
    AND p.game_status IS DISTINCT FROM 'NotSet'
    AND p.location_last_set_at >= six_hours_ago
    AND p.user_id != auth.uid()
    AND NOT (
      p.home_lat IS NOT NULL AND p.home_lng IS NOT NULL
      AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL
      AND abs(ul.latitude - p.home_lat) < 0.0009
      AND abs(ul.longitude - p.home_lng) < 0.0009
    )
    AND NOT (
      p.work_lat IS NOT NULL AND p.work_lng IS NOT NULL
      AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL
      AND abs(ul.latitude - p.work_lat) < 0.0009
      AND abs(ul.longitude - p.work_lng) < 0.0009
    )
  LIMIT 200;
END;
$$;
