
-- Crews table
CREATE TABLE public.crews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  badge_emoji TEXT NOT NULL DEFAULT '⚾',
  badge_color TEXT NOT NULL DEFAULT 'primary',
  creator_id UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  is_public BOOLEAN NOT NULL DEFAULT true,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crew members
CREATE TABLE public.crew_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

-- Crew messages (group chat)
CREATE TABLE public.crew_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crew events (meetup planning with polls)
CREATE TABLE public.crew_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'voting',
  finalized_option_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crew event options (poll choices)
CREATE TABLE public.crew_event_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.crew_events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crew event votes
CREATE TABLE public.crew_event_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID NOT NULL REFERENCES public.crew_event_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(option_id, user_id)
);

-- Security definer function to check crew membership
CREATE OR REPLACE FUNCTION public.is_crew_member(_user_id UUID, _crew_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crew_members
    WHERE user_id = _user_id AND crew_id = _crew_id
  )
$$;

-- RLS: crews
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public crews" ON public.crews
  FOR SELECT TO authenticated USING (is_public = true OR public.is_crew_member(auth.uid(), id));

CREATE POLICY "Authenticated can create crews" ON public.crews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update crew" ON public.crews
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creator can delete crew" ON public.crews
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- RLS: crew_members
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view crew members" ON public.crew_members
  FOR SELECT TO authenticated USING (public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Users can join crews" ON public.crew_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave crews" ON public.crew_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: crew_messages
ALTER TABLE public.crew_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view crew messages" ON public.crew_messages
  FOR SELECT TO authenticated USING (public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Members can send crew messages" ON public.crew_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.is_crew_member(auth.uid(), crew_id));

-- RLS: crew_events
ALTER TABLE public.crew_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view crew events" ON public.crew_events
  FOR SELECT TO authenticated USING (public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Members can create crew events" ON public.crew_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id AND public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Creator can update crew events" ON public.crew_events
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- RLS: crew_event_options
ALTER TABLE public.crew_event_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view event options" ON public.crew_event_options
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.crew_events e WHERE e.id = event_id AND public.is_crew_member(auth.uid(), e.crew_id))
  );

CREATE POLICY "Event creator can add options" ON public.crew_event_options
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.crew_events e WHERE e.id = event_id AND e.creator_id = auth.uid())
  );

-- RLS: crew_event_votes
ALTER TABLE public.crew_event_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes" ON public.crew_event_votes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.crew_event_options o
      JOIN public.crew_events e ON e.id = o.event_id
      WHERE o.id = option_id AND public.is_crew_member(auth.uid(), e.crew_id)
    )
  );

CREATE POLICY "Members can vote" ON public.crew_event_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON public.crew_event_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for crew messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_messages;
