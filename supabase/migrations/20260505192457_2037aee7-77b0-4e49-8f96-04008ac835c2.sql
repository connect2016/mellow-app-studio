CREATE OR REPLACE FUNCTION public.set_profile_location(
  p_lat double precision,
  p_lng double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_lat IS NULL OR p_lng IS NULL THEN
    RAISE EXCEPTION 'Coordinates required';
  END IF;
  IF p_lat < -90 OR p_lat > 90 OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Coordinates out of range';
  END IF;

  UPDATE public.profiles
     SET location = extensions.ST_MakePoint(p_lng, p_lat)::extensions.geography
   WHERE user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_profile_location(double precision, double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_profile_location(double precision, double precision) TO authenticated;