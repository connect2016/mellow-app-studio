-- Add favorite bars list and private mode toggle to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_bars text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS private_mode boolean DEFAULT false;