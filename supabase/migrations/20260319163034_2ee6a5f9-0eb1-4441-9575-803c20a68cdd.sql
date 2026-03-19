
-- Scoring sessions
CREATE TABLE public.scoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'live',
  is_public boolean NOT NULL DEFAULT true,
  invite_code text DEFAULT encode(extensions.gen_random_bytes(4), 'hex'),
  home_team text NOT NULL DEFAULT 'Cubs',
  away_team text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public sessions" ON public.scoring_sessions
  FOR SELECT TO authenticated USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Authenticated can create sessions" ON public.scoring_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update sessions" ON public.scoring_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creator can delete sessions" ON public.scoring_sessions
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Session members
CREATE TABLE public.scoring_session_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  location_label text DEFAULT 'Unknown',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.scoring_session_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view session members" ON public.scoring_session_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join sessions" ON public.scoring_session_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions" ON public.scoring_session_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own membership" ON public.scoring_session_members
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Inning-by-inning score entries
CREATE TABLE public.scoring_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  inning integer NOT NULL,
  half text NOT NULL DEFAULT 'top',
  runs integer NOT NULL DEFAULT 0,
  hits integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  confirmed_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, inning, half)
);

ALTER TABLE public.scoring_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scoring entries" ON public.scoring_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can create entries" ON public.scoring_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update entries" ON public.scoring_entries
  FOR UPDATE TO authenticated USING (true);

-- Timeline events (key plays)
CREATE TABLE public.scoring_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  inning integer NOT NULL,
  half text NOT NULL DEFAULT 'top',
  play_type text NOT NULL,
  description text NOT NULL,
  confirmed_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timeline" ON public.scoring_timeline
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can add timeline events" ON public.scoring_timeline
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update timeline" ON public.scoring_timeline
  FOR UPDATE TO authenticated USING (true);

-- Chat/reactions in sessions
CREATE TABLE public.scoring_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'chat',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.scoring_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can post reactions" ON public.scoring_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.scoring_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_session_members;
