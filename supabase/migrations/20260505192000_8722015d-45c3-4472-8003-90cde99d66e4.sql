ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS watch_locations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS arrival_time text,
  ADD COLUMN IF NOT EXISTS vibe_tags text[] NOT NULL DEFAULT '{}';