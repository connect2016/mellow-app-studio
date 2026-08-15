-- profiles UPDATE previously had no WITH CHECK, so a user's own client-side
-- UPDATE could set any column on their own row -- including is_banned and
-- hidden_from_discover, letting a banned/shadow-banned user just flip
-- themselves back. Lock those two columns to their existing stored value on
-- any UPDATE that goes through normal RLS; writes from SECURITY DEFINER
-- functions (ban_user/unban_user/auto_shadow_ban) bypass RLS entirely and are
-- unaffected. Also fixes the SELECT policy so a banned user can still see
-- their own row (needed to render a "you've been banned" state) instead of
-- their profile fetch silently returning nothing.
--
-- Pre-flight verified: no useUpdateProfile.mutate(...) call site anywhere in
-- src/ ever sets is_banned or hidden_from_discover -- the only hits for those
-- keys outside generated types are static mock fixtures in
-- src/types/index.ts, not a live mutation path.

CREATE OR REPLACE FUNCTION public.get_moderation_flags(_user_id uuid)
RETURNS TABLE(is_banned boolean, hidden_from_discover boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.is_banned, p.hidden_from_discover FROM public.profiles p WHERE p.user_id = _user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_moderation_flags(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_moderation_flags(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_banned IS NOT DISTINCT FROM (SELECT f.is_banned FROM public.get_moderation_flags(auth.uid()) f)
    AND hidden_from_discover IS NOT DISTINCT FROM (SELECT f.hidden_from_discover FROM public.get_moderation_flags(auth.uid()) f)
  );

DROP POLICY IF EXISTS "Anyone can view non-banned profiles" ON public.profiles;
CREATE POLICY "Anyone can view non-banned profiles" ON public.profiles
  FOR SELECT
  USING (is_banned = false OR auth.uid() = user_id);
