-- Consolidate get_public_profiles into a single function signature.
--
-- Two overloads have been live since 2026-04-10:
--   (uuid[], uuid[], text, boolean, integer)                                -- "narrow" version
--   (uuid[], uuid[], text, boolean, integer, timestamptz, boolean, boolean) -- "activity" version
-- Later migrations (20260531234719, 20260623120000) only replaced the narrow
-- overload, leaving the activity one live, never REVOKEd from anon/public,
-- and ambiguous whenever a caller supplies just the shared base params
-- (PostgREST error PGRST203). This also reinstates the hidden_from_discover
-- shadow-ban filter, which was silently dropped when the narrow overload was
-- last replaced.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram text;

DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[], uuid[], text, boolean, integer);
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[], uuid[], text, boolean, integer, timestamptz, boolean, boolean);

CREATE FUNCTION public.get_public_profiles(
  p_user_ids uuid[] DEFAULT NULL::uuid[],
  p_exclude_ids uuid[] DEFAULT NULL::uuid[],
  p_game_status text DEFAULT NULL::text,
  p_only_onboarded boolean DEFAULT false,
  p_limit integer DEFAULT 200,
  p_active_since timestamptz DEFAULT NULL::timestamptz,
  p_require_section boolean DEFAULT false,
  p_require_bar boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, user_id uuid, display_name text, profile_photo text, age integer, pronouns text,
  bio text, intent text[], favorite_moment text, favorite_player text, game_status text,
  wrigley_section text, wrigley_row text, wrigley_seat text, wrigleyville_bar text,
  fan_style text[], gameday_intents text[], vibe_state text, vibe_emoji text,
  fan_tier text, fan_xp integer, fan_title text, fan_tier_emoji text, gameday_persona text,
  superstition text, stretch_song text, best_bar text,
  is_verified boolean, is_season_ticket_holder boolean, is_banned boolean,
  onboarding_completed boolean,
  created_at timestamptz, updated_at timestamptz, location_last_set_at timestamptz,
  instagram text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.profile_photo, p.age, p.pronouns,
    p.bio, p.intent, p.favorite_moment, p.favorite_player, p.game_status,
    p.wrigley_section, p.wrigley_row, p.wrigley_seat, p.wrigleyville_bar,
    p.fan_style, p.gameday_intents, p.vibe_state, p.vibe_emoji,
    p.fan_tier, p.fan_xp, p.fan_title, p.fan_tier_emoji, p.gameday_persona,
    p.superstition, p.stretch_song, p.best_bar,
    p.is_verified, p.is_season_ticket_holder, p.is_banned,
    p.onboarding_completed, p.created_at, p.updated_at, p.location_last_set_at,
    p.instagram
  FROM public.profiles p
  WHERE COALESCE(p.is_banned, false) = false
    AND p.hidden_from_discover = false
    AND (p_user_ids IS NULL OR p.user_id = ANY(p_user_ids))
    AND (p_exclude_ids IS NULL OR NOT (p.user_id = ANY(p_exclude_ids)))
    AND (p_game_status IS NULL OR p.game_status = p_game_status)
    AND (NOT p_only_onboarded OR p.onboarding_completed = true)
    AND (p_active_since IS NULL OR p.location_last_set_at >= p_active_since)
    AND (NOT p_require_section OR p.wrigley_section IS NOT NULL)
    AND (NOT p_require_bar OR p.wrigleyville_bar IS NOT NULL)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[], uuid[], text, boolean, integer, timestamptz, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[], uuid[], text, boolean, integer, timestamptz, boolean, boolean) TO authenticated;
