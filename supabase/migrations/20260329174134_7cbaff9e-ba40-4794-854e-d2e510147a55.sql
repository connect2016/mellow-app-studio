
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_lat double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS home_lng double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS work_lat double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS work_lng double precision DEFAULT NULL;
