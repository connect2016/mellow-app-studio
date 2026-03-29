
-- The Lineup: Public Meetup tables

CREATE TABLE public.lineup_meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  location_name text NOT NULL,
  meeting_time timestamptz NOT NULL,
  description text DEFAULT '',
  max_members integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 hours')
);

ALTER TABLE public.lineup_meetups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active meetups" ON public.lineup_meetups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create meetups" ON public.lineup_meetups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update meetup" ON public.lineup_meetups
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creator can delete meetup" ON public.lineup_meetups
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Lineup members
CREATE TABLE public.lineup_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES public.lineup_meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meetup_id, user_id)
);

ALTER TABLE public.lineup_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meetup members" ON public.lineup_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join meetups" ON public.lineup_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave meetups" ON public.lineup_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lineup messages (temporary group chat)
CREATE TABLE public.lineup_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES public.lineup_meetups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lineup_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meetup messages" ON public.lineup_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lineup_members
    WHERE meetup_id = lineup_messages.meetup_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.lineup_meetups
    WHERE id = lineup_messages.meetup_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Members can send meetup messages" ON public.lineup_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (
        SELECT 1 FROM public.lineup_members
        WHERE meetup_id = lineup_messages.meetup_id AND user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.lineup_meetups
        WHERE id = lineup_messages.meetup_id AND creator_id = auth.uid()
      )
    )
  );

-- Enable realtime for lineup messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.lineup_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lineup_members;
