
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_last_set_at timestamptz DEFAULT NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
