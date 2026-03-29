
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fan_tier text DEFAULT 'rookie',
ADD COLUMN IF NOT EXISTS fan_xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS fan_title text DEFAULT 'Rookie Fan',
ADD COLUMN IF NOT EXISTS fan_tier_emoji text DEFAULT '🌱',
ADD COLUMN IF NOT EXISTS fan_identity_updated_at timestamp with time zone DEFAULT now();
