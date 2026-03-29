
-- Live Moments table
CREATE TABLE public.live_moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  moment_type TEXT NOT NULL DEFAULT 'chant',
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📣',
  location_context TEXT NOT NULL DEFAULT 'stadium',
  duration_seconds INTEGER NOT NULL DEFAULT 30,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 minutes'),
  participant_count INTEGER NOT NULL DEFAULT 0,
  peak_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'live',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Participants table
CREATE TABLE public.live_moment_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id UUID NOT NULL REFERENCES public.live_moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(moment_id, user_id)
);

-- RLS
ALTER TABLE public.live_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_moment_participants ENABLE ROW LEVEL SECURITY;

-- live_moments policies
CREATE POLICY "Anyone can view live moments" ON public.live_moments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create moments" ON public.live_moments FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update moments" ON public.live_moments FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creator can delete moments" ON public.live_moments FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- live_moment_participants policies
CREATE POLICY "Anyone can view participants" ON public.live_moment_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join moments" ON public.live_moment_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave moments" ON public.live_moment_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_moments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_moment_participants;
