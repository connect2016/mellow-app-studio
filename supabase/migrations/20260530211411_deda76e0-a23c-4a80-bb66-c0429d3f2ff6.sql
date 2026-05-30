ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkin_bar text,
  ADD COLUMN IF NOT EXISTS checkin_section text,
  ADD COLUMN IF NOT EXISTS checkin_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_updated_at timestamptz;