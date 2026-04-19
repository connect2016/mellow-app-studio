ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS quick_start jsonb;

COMMENT ON COLUMN public.profiles.quick_start IS 'Quick onboarding answers: { primary_intent, gameday_behavior, hangout_zone, group_size, completed_at }';