CREATE OR REPLACE FUNCTION public.get_active_fan_count_7d()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.profiles
  WHERE is_banned = false
    AND onboarding_completed = true
    AND location_last_set_at >= now() - interval '7 days';
$$;

REVOKE ALL ON FUNCTION public.get_active_fan_count_7d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_fan_count_7d() TO anon, authenticated, service_role;