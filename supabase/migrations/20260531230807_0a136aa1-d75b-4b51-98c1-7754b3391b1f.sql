ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS attendance_frequency TEXT,
  ADD COLUMN IF NOT EXISTS primary_goal TEXT;