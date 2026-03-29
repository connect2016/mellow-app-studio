
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS vibe_state text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS vibe_emoji text DEFAULT '⚾',
ADD COLUMN IF NOT EXISTS vibe_state_updated_at timestamp with time zone DEFAULT now();
