-- Security sweep (task 9), continued: audited every SECURITY DEFINER
-- function actually called from client code (supabase.rpc(...) call sites
-- in src/) against two things — an internal auth.uid() guard, and an
-- explicit REVOKE of the default PUBLIC/anon execute grant PostgREST
-- otherwise leaves in place.
--
-- Two real findings:
--
-- 1) get_teammate_ids(_user_id uuid) had NO auth check at all and no
--    revoke — it's SQL, not plpgsql, so there was nothing stopping any
--    caller (including anon over PostgREST) from passing an arbitrary
--    _user_id and reading that person's full teammate/friend list with
--    timestamps. src/hooks/useTeammates.ts only ever calls it with the
--    caller's own id, so there's no product reason to allow otherwise.
--    Adding an ownership check closes this IDOR.
--
-- 2) get_map_fans() had no explicit auth check; it happened to return zero
--    rows for anon today only because its `p.user_id != auth.uid()` filter
--    evaluates to NULL (never TRUE) when auth.uid() is NULL, which is an
--    accident of three-valued SQL logic rather than an intentional guard.
--    A future edit to that filter could silently reopen live fan GPS
--    coordinates to anon. Making the guard explicit.
--
-- The rest of the audited functions (add_to_personal_crew, claim_referral_code,
-- get_beer_buyer_count, get_host_trust, get_leaderboard_extras,
-- get_my_referral_count, get_or_create_my_referral_code, react_w_flag,
-- record_fan_streak_open, say_hi_to_buddy, toggle_watch_party_rsvp) already
-- correctly raise on a null auth.uid() internally, but never had the anon
-- grant revoked — closing that gap for defense in depth, matching the
-- pattern already applied to has_role/award_user_points/get_payment_handles.
--
-- get_public_profiles and get_public_card_extras are intentionally anon-
-- readable (logged-out fan cards) and are left untouched.

-- 1) get_teammate_ids: enforce callers can only ever read their own list.
CREATE OR REPLACE FUNCTION public.get_teammate_ids(_user_id uuid)
RETURNS TABLE(teammate_id uuid, since timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT
    CASE WHEN tr.requester_id = _user_id THEN tr.recipient_id ELSE tr.requester_id END AS teammate_id,
    COALESCE(tr.responded_at, tr.updated_at) AS since
  FROM public.teammate_requests tr
  WHERE tr.status = 'accepted'
    AND (tr.requester_id = _user_id OR tr.recipient_id = _user_id)
    AND auth.uid() = _user_id;
$func$;

-- 2) get_map_fans: make the authenticated-only requirement explicit instead
-- of relying on NULL-propagation through `p.user_id != auth.uid()`.
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

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

-- 3) Revoke the default PUBLIC/anon execute grant on every remaining
-- client-called SECURITY DEFINER function that lacked it.
REVOKE EXECUTE ON FUNCTION public.get_teammate_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_teammate_ids(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_map_fans() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_map_fans() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.add_to_personal_crew(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_to_personal_crew(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_referral_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral_code(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_beer_buyer_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_beer_buyer_count(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_host_trust(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_host_trust(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard_extras(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_extras(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_referral_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_referral_count() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_or_create_my_referral_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_my_referral_code() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.react_w_flag(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.react_w_flag(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_fan_streak_open(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_fan_streak_open(date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.say_hi_to_buddy(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.say_hi_to_buddy(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.toggle_watch_party_rsvp(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_watch_party_rsvp(uuid) TO authenticated;
