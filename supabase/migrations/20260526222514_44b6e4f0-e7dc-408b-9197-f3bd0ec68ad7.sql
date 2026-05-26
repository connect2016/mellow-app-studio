ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS game_day_intent text,
  ADD COLUMN IF NOT EXISTS intent_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS fan_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.lineup_meetups
  ADD COLUMN IF NOT EXISTS ground_control text;

ALTER TABLE public.flash_meetups
  ADD COLUMN IF NOT EXISTS ground_control text;

ALTER TABLE public.profiles
  ADD CONSTRAINT fan_tags_max_3 CHECK (array_length(fan_tags, 1) IS NULL OR array_length(fan_tags, 1) <= 3);

ALTER TABLE public.lineup_meetups
  ADD CONSTRAINT ground_control_max_120 CHECK (ground_control IS NULL OR char_length(ground_control) <= 120);

ALTER TABLE public.flash_meetups
  ADD CONSTRAINT flash_ground_control_max_120 CHECK (ground_control IS NULL OR char_length(ground_control) <= 120);