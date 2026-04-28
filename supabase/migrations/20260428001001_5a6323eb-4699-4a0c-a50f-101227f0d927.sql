ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pregame_meal text,
  ADD COLUMN IF NOT EXISTS postgame_food text,
  ADD COLUMN IF NOT EXISTS carb_up_strategy text,
  ADD COLUMN IF NOT EXISTS favorite_bar_food text,
  ADD COLUMN IF NOT EXISTS post_win_meal text;