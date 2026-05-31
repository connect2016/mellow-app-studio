
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_season_ticket_holder boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_sth ON public.profiles(is_season_ticket_holder) WHERE is_season_ticket_holder = true;
