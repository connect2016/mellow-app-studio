-- get_public_profiles deliberately filters out is_banned/hidden_from_discover
-- rows (it's the Discover-feed primitive) -- which makes it unusable for the
-- admin dashboard, since the exact users most likely to be in the reports
-- queue are already banned or shadow-banned. These two admin-gated
-- SECURITY DEFINER lookups give Admin.tsx what it actually needs: profile
-- summaries for arbitrary (possibly banned) user ids, and sitewide user/ban
-- counts, without opening a blanket "admins can read all profiles" RLS hole.

CREATE OR REPLACE FUNCTION public.get_admin_profile_summaries(_user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  display_name text,
  profile_photo text,
  is_banned boolean,
  hidden_from_discover boolean,
  ban_reason text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.profile_photo, p.is_banned, p.hidden_from_discover, p.ban_reason
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin') AND p.user_id = ANY(_user_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_profile_summaries(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_profile_summaries(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(total_users integer, banned_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT COUNT(*)::integer, COUNT(*) FILTER (WHERE is_banned)::integer
  FROM public.profiles;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_stats() TO authenticated;
