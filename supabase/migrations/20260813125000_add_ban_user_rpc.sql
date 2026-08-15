-- is_banned is read in a dozen places across the app but nothing has ever
-- set it to true — banning is non-functional end-to-end today. A plain
-- client UPDATE can't set it on someone else's row under current profiles
-- RLS (USING (auth.uid() = user_id)), so this needs an admin-gated
-- SECURITY DEFINER RPC, following the same shape as say_hi_to_buddy /
-- send_beer_tip elsewhere in this codebase. unban_user is included
-- alongside it since a ban action with no way to reverse a mistake is an
-- operational trap.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE OR REPLACE FUNCTION public.ban_user(p_target_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_target_id IS NULL OR p_target_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid target' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET is_banned = true, ban_reason = p_reason
  WHERE user_id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found' USING ERRCODE = '22023';
  END IF;

  UPDATE public.user_reports
  SET status = 'actioned'
  WHERE reported_user_id = p_target_id AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.unban_user(p_target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_target_id IS NULL THEN
    RAISE EXCEPTION 'Invalid target' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET is_banned = false, ban_reason = NULL
  WHERE user_id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found' USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ban_user(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ban_user(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unban_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unban_user(uuid) TO authenticated;
