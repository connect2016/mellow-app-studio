
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shots_taken_season integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appetizers_had_season integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_food_spot text;

CREATE OR REPLACE FUNCTION public.get_public_card_extras(p_user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  shots_taken_season integer,
  appetizers_had_season integer,
  favorite_food_spot text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.shots_taken_season, p.appetizers_had_season, p.favorite_food_spot
  FROM public.profiles p
  WHERE p.is_banned = false
    AND p.user_id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_card_extras(uuid[]) TO authenticated, anon;
