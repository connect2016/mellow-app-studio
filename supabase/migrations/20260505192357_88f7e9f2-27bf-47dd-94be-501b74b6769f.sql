-- 1. Enable PostGIS in the dedicated extensions schema (Supabase best practice)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add geography column + spatial index on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location extensions.geography(POINT, 4326);

CREATE INDEX IF NOT EXISTS profiles_location_idx
  ON public.profiles USING GIST(location);

-- 3. Proximity RPC. Returns nearest fans within radius_miles of the given point.
--    SECURITY DEFINER + explicit auth.uid() guard so unauthenticated calls return 0 rows.
CREATE OR REPLACE FUNCTION public.nearby_fans(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision DEFAULT 2
)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  zip_code text,
  vibe_tags text[],
  watch_locations text[],
  distance_meters double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    p.user_id           AS id,
    p.display_name,
    p.profile_photo     AS avatar_url,
    p.zip_code,
    p.vibe_tags,
    p.watch_locations,
    extensions.ST_Distance(
      p.location,
      extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography
    ) AS distance_meters
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND p.location IS NOT NULL
    AND p.is_banned = false
    AND p.onboarding_completed = true
    AND p.hidden_from_discover = false
    AND extensions.ST_DWithin(
      p.location,
      extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography,
      radius_miles * 1609.34
    )
  ORDER BY distance_meters ASC
  LIMIT 50;
$$;

-- Lock down execution: only signed-in users
REVOKE EXECUTE ON FUNCTION public.nearby_fans(double precision, double precision, double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.nearby_fans(double precision, double precision, double precision) TO authenticated;