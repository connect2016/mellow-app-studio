-- Coordination table: one row per (meetup, user) tracking ETA + arrival
CREATE TABLE public.meetup_coordination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meetup_id UUID NOT NULL REFERENCES public.lineup_meetups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  arrival_status TEXT NOT NULL DEFAULT 'on_my_way'
    CHECK (arrival_status IN ('on_my_way','almost_there','arrived','running_late')),
  eta_minutes INTEGER CHECK (eta_minutes IS NULL OR (eta_minutes >= 0 AND eta_minutes <= 240)),
  shared_lat DOUBLE PRECISION,
  shared_lng DOUBLE PRECISION,
  shared_label TEXT,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meetup_id, user_id)
);

CREATE INDEX idx_meetup_coordination_meetup ON public.meetup_coordination(meetup_id);

ALTER TABLE public.meetup_coordination ENABLE ROW LEVEL SECURITY;

-- Helper: is this user part of the meetup (member OR host)?
CREATE OR REPLACE FUNCTION public.is_meetup_participant(_user_id UUID, _meetup_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lineup_members
    WHERE meetup_id = _meetup_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.lineup_meetups
    WHERE id = _meetup_id AND creator_id = _user_id
  );
$$;

CREATE POLICY "Participants can view coordination"
ON public.meetup_coordination FOR SELECT TO authenticated
USING (public.is_meetup_participant(auth.uid(), meetup_id));

CREATE POLICY "Participants can create own coordination"
ON public.meetup_coordination FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_meetup_participant(auth.uid(), meetup_id));

CREATE POLICY "Users can update own coordination"
ON public.meetup_coordination FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can clear own coordination"
ON public.meetup_coordination FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_meetup_coordination_updated_at
BEFORE UPDATE ON public.meetup_coordination
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.meetup_coordination;
ALTER TABLE public.meetup_coordination REPLICA IDENTITY FULL;