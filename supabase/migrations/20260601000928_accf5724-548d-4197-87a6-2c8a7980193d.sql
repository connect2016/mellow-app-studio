-- Add rooftop support fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS planned_location_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS planned_location_venue text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS checkin_rooftop text;

ALTER TABLE public.bar_partners_waitlist ADD COLUMN IF NOT EXISTS partner_type text NOT NULL DEFAULT 'bar';
ALTER TABLE public.bar_partners_waitlist ADD COLUMN IF NOT EXISTS capacity integer;