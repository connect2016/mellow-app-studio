
ALTER TABLE public.bar_checkins 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'checkin',
ADD COLUMN IF NOT EXISTS custom_message text;
