
-- Flash meetups: time-limited events that expire in 30-60 minutes
CREATE TABLE public.flash_meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  emoji text NOT NULL DEFAULT '⚡',
  location_name text NOT NULL,
  description text DEFAULT '',
  max_members integer NOT NULL DEFAULT 6,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '45 minutes'),
  status text NOT NULL DEFAULT 'live',
  vibe text NOT NULL DEFAULT 'hype',
  is_system_generated boolean NOT NULL DEFAULT false
);

ALTER TABLE public.flash_meetups ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see live flash meetups
CREATE POLICY "Anyone can view live flash meetups" ON public.flash_meetups
  FOR SELECT TO authenticated USING (true);

-- Users can create flash meetups
CREATE POLICY "Users can create flash meetups" ON public.flash_meetups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

-- Creators can update their flash meetups
CREATE POLICY "Creators can update flash meetups" ON public.flash_meetups
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- Creators can delete their flash meetups
CREATE POLICY "Creators can delete flash meetups" ON public.flash_meetups
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Flash meetup members
CREATE TABLE public.flash_meetup_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES public.flash_meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(meetup_id, user_id)
);

ALTER TABLE public.flash_meetup_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flash meetup members" ON public.flash_meetup_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join flash meetups" ON public.flash_meetup_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave flash meetups" ON public.flash_meetup_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for flash meetups
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_meetups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_meetup_members;
