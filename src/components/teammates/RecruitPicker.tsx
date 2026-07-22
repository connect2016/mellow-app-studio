
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  profile_photo TEXT DEFAULT '',
  age INTEGER,
  pronouns TEXT,
  bio TEXT DEFAULT '',
  intent TEXT[] DEFAULT '{}',
  favorite_player TEXT DEFAULT '',
  favorite_moment TEXT DEFAULT '',
  favorite_moment_is_valid BOOLEAN DEFAULT true,
  game_status TEXT DEFAULT 'NotSet',
  wrigley_section TEXT,
  wrigley_row TEXT,
  wrigley_seat TEXT,
  wrigley_location_privacy TEXT DEFAULT 'MatchesOnly',
  wrigleyville_bar TEXT,
  bar_location_privacy TEXT DEFAULT 'MatchesOnly',
  distance_pref_miles INTEGER DEFAULT 25,
  age_min INTEGER DEFAULT 21,
  age_max INTEGER DEFAULT 50,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  hidden_from_discover BOOLEAN DEFAULT false,
  blocked_users UUID[] DEFAULT '{}',
  superstition TEXT,
  stretch_song TEXT,
  best_bar TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-banned profiles" ON public.profiles
  FOR SELECT USING (is_banned = false);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, profile_photo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_hi_five BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user, to_user, is_hi_five)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see likes they sent or received" ON public.likes
  FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = from_user);

-- Passes table
CREATE TABLE public.passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passed_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user, passed_user)
);

ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own passes" ON public.passes
  FOR SELECT USING (auth.uid() = from_user);

CREATE POLICY "Users can create passes" ON public.passes
  FOR INSERT WITH CHECK (auth.uid() = from_user);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'matched',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Authenticated users can create matches" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can update their own matches" ON public.matches
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_a, participant_b)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "Authenticated can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
    AND (participant_a = _user_id OR participant_b = _user_id)
  )
$$;

CREATE POLICY "Users can see messages in their conversations" ON public.messages
  FOR SELECT USING (public.is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender AND public.is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Users can update read status" ON public.messages
  FOR UPDATE USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Mutual match trigger
CREATE OR REPLACE FUNCTION public.check_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
  _match_id UUID;
  _user_a UUID;
  _user_b UUID;
BEGIN
  IF NEW.is_hi_five = true THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE from_user = NEW.to_user
    AND to_user = NEW.from_user
    AND is_hi_five = false
  ) THEN
    IF NEW.from_user < NEW.to_user THEN
      _user_a := NEW.from_user;
      _user_b := NEW.to_user;
    ELSE
      _user_a := NEW.to_user;
      _user_b := NEW.from_user;
    END IF;

    INSERT INTO public.matches (user_a, user_b, status)
    VALUES (_user_a, _user_b, 'matched')
    ON CONFLICT (user_a, user_b) DO NOTHING
    RETURNING id INTO _match_id;

    IF _match_id IS NOT NULL THEN
      INSERT INTO public.conversations (participant_a, participant_b)
      VALUES (_user_a, _user_b)
      ON CONFLICT (participant_a, participant_b) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_like_check_match
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.check_mutual_match();

-- Indexes
CREATE INDEX idx_profiles_game_status ON public.profiles(game_status);
CREATE INDEX idx_profiles_is_banned ON public.profiles(is_banned);
CREATE INDEX idx_profiles_hidden ON public.profiles(hidden_from_discover);
CREATE INDEX idx_likes_from_user ON public.likes(from_user);
CREATE INDEX idx_likes_to_user ON public.likes(to_user);
CREATE INDEX idx_passes_from_user ON public.passes(from_user);
CREATE INDEX idx_matches_user_a ON public.matches(user_a);
CREATE INDEX idx_matches_user_b ON public.matches(user_b);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);


ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_last_set_at timestamptz DEFAULT NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Vibe posts table
CREATE TABLE public.vibe_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  location_tag text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours')
);

ALTER TABLE public.vibe_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vibe posts"
  ON public.vibe_posts FOR SELECT TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users can create vibe posts"
  ON public.vibe_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vibe posts"
  ON public.vibe_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for vibe media
INSERT INTO storage.buckets (id, name, public)
VALUES ('vibe-media', 'vibe-media', true);

CREATE POLICY "Authenticated users can upload vibe media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view vibe media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vibe-media');

CREATE POLICY "Users can delete own vibe media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Games schedule table
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent text NOT NULL,
  game_start timestamptz NOT NULL,
  game_end timestamptz NOT NULL,
  venue text NOT NULL DEFAULT 'Wrigley Field',
  is_home boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view games
CREATE POLICY "Anyone can view games"
  ON public.games FOR SELECT TO authenticated
  USING (true);

-- Game-time matches table (30-min expiring matches)
CREATE TABLE public.game_time_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  meeting_spot text NOT NULL DEFAULT 'Captain Morgan Club',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  status text NOT NULL DEFAULT 'active',
  conversation_id uuid REFERENCES public.conversations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b, game_id)
);

ALTER TABLE public.game_time_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their game-time matches"
  ON public.game_time_matches FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "System can create game-time matches"
  ON public.game_time_matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can update their game-time matches"
  ON public.game_time_matches FOR UPDATE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- User geolocation table for proximity checks
CREATE TABLE public.user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upsert own location"
  ON public.user_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can read locations"
  ON public.user_locations FOR SELECT TO authenticated
  USING (true);

-- Seed some upcoming games
INSERT INTO public.games (opponent, game_start, game_end, venue, is_home) VALUES
  ('Cardinals', now() - interval '1 hour', now() + interval '2 hours', 'Wrigley Field', true),
  ('Brewers', now() + interval '1 day', now() + interval '1 day 3 hours', 'Wrigley Field', true),
  ('Reds', now() + interval '3 days', now() + interval '3 days 3 hours', 'Wrigley Field', true);
-- User pennant progress table
CREATE TABLE public.user_pennants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  target_count integer NOT NULL,
  unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_pennants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all pennants"
  ON public.user_pennants FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own pennants"
  ON public.user_pennants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pennants"
  ON public.user_pennants FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
-- No schema change needed, game_status is already a text field
-- Just updating the comment for documentation
COMMENT ON COLUMN public.profiles.game_status IS 'User current status: AtWrigley, AtBar, Tailgating, WatchingRemote, NotSet';

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


-- Missions definition table (admin-seeded)
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '⚾',
  category TEXT NOT NULL DEFAULT 'social',
  target_count INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 10,
  badge_key TEXT,
  perk_description TEXT,
  is_daily BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User mission progress
CREATE TABLE public.mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, reset_date)
);

-- User points ledger
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: missions (readable by all authenticated)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active missions" ON public.missions
  FOR SELECT TO authenticated USING (is_active = true);

-- RLS: mission_progress
ALTER TABLE public.mission_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.mission_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.mission_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.mission_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS: user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON public.user_points
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- Game memories table for photos from meetups
CREATE TABLE public.game_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  location_tag TEXT NOT NULL DEFAULT 'Wrigley Field',
  tagged_users UUID[] NOT NULL DEFAULT '{}',
  game_id UUID REFERENCES public.games(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_memories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view memories
CREATE POLICY "Anyone can view memories"
  ON public.game_memories FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own memories
CREATE POLICY "Users can create memories"
  ON public.game_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own memories
CREATE POLICY "Users can delete own memories"
  ON public.game_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for live story feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_memories;


-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔔',
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert notifications for any user (edge function uses service role)
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can mark their own as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for instant push
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Index for fast user queries
CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;


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


-- Fix scoring_entries update policy
DROP POLICY "Members can update entries" ON public.scoring_entries;
CREATE POLICY "Members can update entries" ON public.scoring_entries
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE session_id = scoring_entries.session_id AND user_id = auth.uid()
  ));

-- Fix scoring_timeline update policy
DROP POLICY "Members can update timeline" ON public.scoring_timeline;
CREATE POLICY "Members can update timeline" ON public.scoring_timeline
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE session_id = scoring_timeline.session_id AND user_id = auth.uid()
  ));


-- Predictions table
CREATE TABLE public.scoring_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.scoring_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  inning integer NOT NULL,
  half text NOT NULL DEFAULT 'top',
  predicted_play text NOT NULL,
  is_correct boolean DEFAULT NULL,
  resolved_at timestamptz DEFAULT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view predictions" ON public.scoring_predictions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create predictions" ON public.scoring_predictions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Session members can resolve predictions" ON public.scoring_predictions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE session_id = scoring_predictions.session_id AND user_id = auth.uid()
  ));

-- Scorer stats table (aggregated per user)
CREATE TABLE public.scorer_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  games_scored integer NOT NULL DEFAULT 0,
  total_predictions integer NOT NULL DEFAULT 0,
  correct_predictions integer NOT NULL DEFAULT 0,
  total_confirmations integer NOT NULL DEFAULT 0,
  prediction_points integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scorer_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scorer stats" ON public.scorer_stats
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own stats" ON public.scorer_stats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.scorer_stats
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for predictions
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoring_predictions;


-- Create profile-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Allow users to update/replace their own photos
CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


CREATE TABLE public.bar_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bar_name text NOT NULL,
  wait_time text NOT NULL DEFAULT 'no_line',
  vibe text NOT NULL DEFAULT 'chill',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bar_name)
);

ALTER TABLE public.bar_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bar votes" ON public.bar_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upsert own votes" ON public.bar_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON public.bar_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.bar_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_votes;


CREATE TABLE public.ballpark_buddy_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_date date NOT NULL,
  section text NOT NULL,
  intent text NOT NULL DEFAULT 'beer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_date)
);

ALTER TABLE public.ballpark_buddy_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view searches" ON public.ballpark_buddy_searches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upsert own searches" ON public.ballpark_buddy_searches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches" ON public.ballpark_buddy_searches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches" ON public.ballpark_buddy_searches
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


CREATE TABLE public.passport_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_key text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, location_key)
);

ALTER TABLE public.passport_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view passport checkins" ON public.passport_checkins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own checkins" ON public.passport_checkins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON public.passport_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.profiles ADD COLUMN gameday_intents text[] DEFAULT '{}'::text[];

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

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fan_style text[] DEFAULT '{}'::text[];

-- Section chat messages table
CREATE TABLE public.section_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  section text NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view section chat messages for sections they belong to
CREATE POLICY "Anyone can view section messages" ON public.section_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send section messages" ON public.section_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_chat_messages;

-- Hot dog icebreakers (reuse likes table with a new type indicator via message prefix)
-- No schema change needed - we'll use the existing likes table with message = '🌭 Hot Dog!'


ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_lat double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS home_lng double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS work_lat double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS work_lng double precision DEFAULT NULL;


CREATE TABLE public.safety_timers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meetup_id uuid REFERENCES public.lineup_meetups(id) ON DELETE CASCADE,
  emergency_contact_phone text NOT NULL,
  emergency_contact_name text NOT NULL DEFAULT '',
  location_description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own safety timers"
  ON public.safety_timers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own safety timers"
  ON public.safety_timers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own safety timers"
  ON public.safety_timers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own safety timers"
  ON public.safety_timers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- User reports table
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'non_fan_behavior',
  details text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(reporter_id, reported_user_id)
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.user_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view own reports
CREATE POLICY "Users can view own reports"
  ON public.user_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Auto shadow-ban trigger: when a user gets 3+ reports, set hidden_from_discover = true (shadow ban)
CREATE OR REPLACE FUNCTION public.auto_shadow_ban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_count integer;
BEGIN
  SELECT count(*) INTO report_count
  FROM public.user_reports
  WHERE reported_user_id = NEW.reported_user_id
    AND status = 'pending';

  IF report_count >= 3 THEN
    UPDATE public.profiles
    SET hidden_from_discover = true
    WHERE user_id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_shadow_ban
  AFTER INSERT ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_shadow_ban();


ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS vibe_state text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS vibe_emoji text DEFAULT '⚾',
ADD COLUMN IF NOT EXISTS vibe_state_updated_at timestamp with time zone DEFAULT now();


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


ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fan_tier text DEFAULT 'rookie',
ADD COLUMN IF NOT EXISTS fan_xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS fan_title text DEFAULT 'Rookie Fan',
ADD COLUMN IF NOT EXISTS fan_tier_emoji text DEFAULT '🌱',
ADD COLUMN IF NOT EXISTS fan_identity_updated_at timestamp with time zone DEFAULT now();


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


-- Homestands table: defines reset periods for the leaderboard
CREATE TABLE public.homestands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homestands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view homestands"
  ON public.homestands FOR SELECT
  TO authenticated
  USING (true);

-- Ivy Leaves table: tracks leaves earned per user per homestand
CREATE TABLE public.ivy_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  homestand_id UUID REFERENCES public.homestands(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ivy_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ivy leaves"
  ON public.ivy_leaves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can earn ivy leaves"
  ON public.ivy_leaves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for fast leaderboard queries
CREATE INDEX idx_ivy_leaves_homestand_user ON public.ivy_leaves (homestand_id, user_id);
CREATE INDEX idx_ivy_leaves_user ON public.ivy_leaves (user_id);

-- Seed a sample homestand so the system works immediately
INSERT INTO public.homestands (name, start_date, end_date)
VALUES ('Opening Homestand 2026', '2026-04-03', '2026-04-13');

ALTER TABLE public.profiles ADD COLUMN gameday_persona text DEFAULT NULL;

-- Add new columns to scoring_sessions
ALTER TABLE public.scoring_sessions
  ADD COLUMN IF NOT EXISTS active_scorer_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS active_batter integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS finalized_at timestamp with time zone DEFAULT NULL;

-- Add scored_by to scoring_entries
ALTER TABLE public.scoring_entries
  ADD COLUMN IF NOT EXISTS scored_by uuid DEFAULT NULL;

-- Allow session members to update scoring_sessions (for Pass the Pencil and finalize)
CREATE POLICY "Members can update session state"
ON public.scoring_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scoring_session_members
    WHERE scoring_session_members.session_id = scoring_sessions.id
    AND scoring_session_members.user_id = auth.uid()
  )
);

-- Add unique constraint on scoring_entries for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scoring_entries_session_inning_half_key'
  ) THEN
    ALTER TABLE public.scoring_entries
      ADD CONSTRAINT scoring_entries_session_inning_half_key UNIQUE (session_id, inning, half);
  END IF;
END $$;


-- 1. Fix ivy_leaves: replace permissive INSERT with validated server function
DROP POLICY "Users can earn ivy leaves" ON public.ivy_leaves;

CREATE OR REPLACE FUNCTION public.award_ivy_leaf(
  _source text,
  _source_id uuid DEFAULT NULL,
  _amount integer DEFAULT 1,
  _homestand_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _amount < 1 OR _amount > 10 THEN
    RAISE EXCEPTION 'Amount must be between 1 and 10';
  END IF;
  IF char_length(_source) > 100 THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;
  
  INSERT INTO public.ivy_leaves (user_id, source, source_id, amount, homestand_id)
  VALUES (auth.uid(), _source, _source_id, _amount, _homestand_id);
END;
$$;

-- 2. Fix user_points: replace permissive INSERT with validated server function
DROP POLICY "Users can insert own points" ON public.user_points;

CREATE OR REPLACE FUNCTION public.award_user_points(
  _source text,
  _source_id uuid DEFAULT NULL,
  _points integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _points < 1 OR _points > 100 THEN
    RAISE EXCEPTION 'Points must be between 1 and 100';
  END IF;
  IF char_length(_source) > 100 THEN
    RAISE EXCEPTION 'Invalid source';
  END IF;
  
  INSERT INTO public.user_points (user_id, source, source_id, points)
  VALUES (auth.uid(), _source, _source_id, _points);
END;
$$;

-- 3. Fix user_locations: restrict SELECT to own location only
DROP POLICY "Authenticated can read locations" ON public.user_locations;

CREATE POLICY "Users can view own location"
ON public.user_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create server function for map data with fuzzied locations and home/work exclusion
CREATE OR REPLACE FUNCTION public.get_map_fans()
RETURNS TABLE(
  fan_user_id uuid,
  fan_display_name text,
  fan_profile_photo text,
  fan_game_status text,
  fan_wrigley_section text,
  fan_wrigleyville_bar text,
  fan_gameday_intents text[],
  fan_fan_style text[],
  fan_location_last_set_at timestamptz,
  fan_gameday_persona text,
  fan_intent text[],
  fan_latitude double precision,
  fan_longitude double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  six_hours_ago timestamptz := now() - interval '6 hours';
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.profile_photo,
    p.game_status,
    p.wrigley_section,
    p.wrigleyville_bar,
    p.gameday_intents,
    p.fan_style,
    p.location_last_set_at,
    p.gameday_persona,
    p.intent,
    CASE WHEN ul.latitude IS NOT NULL THEN ul.latitude + (random() - 0.5) * 0.003 ELSE NULL END,
    CASE WHEN ul.longitude IS NOT NULL THEN ul.longitude + (random() - 0.5) * 0.003 ELSE NULL END
  FROM public.profiles p
  LEFT JOIN public.user_locations ul ON ul.user_id = p.user_id
  WHERE p.is_banned = false
    AND p.onboarding_completed = true
    AND p.game_status IS DISTINCT FROM 'NotSet'
    AND p.location_last_set_at >= six_hours_ago
    AND p.user_id != auth.uid()
    AND NOT (
      p.home_lat IS NOT NULL AND p.home_lng IS NOT NULL
      AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL
      AND abs(ul.latitude - p.home_lat) < 0.0009
      AND abs(ul.longitude - p.home_lng) < 0.0009
    )
    AND NOT (
      p.work_lat IS NOT NULL AND p.work_lng IS NOT NULL
      AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL
      AND abs(ul.latitude - p.work_lat) < 0.0009
      AND abs(ul.longitude - p.work_lng) < 0.0009
    )
  LIMIT 200;
END;
$$;


-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated can read locations" ON public.user_locations;
DROP POLICY IF EXISTS "Anyone can view locations" ON public.user_locations;

-- Allow users to read only their own location
CREATE POLICY "Users can read own location"
ON public.user_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view non-banned profiles" ON public.profiles;

-- 2. Owner can read their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. Secure function for public profile browsing (excludes sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_profiles(
  p_user_ids uuid[] DEFAULT NULL,
  p_exclude_ids uuid[] DEFAULT NULL,
  p_game_status text DEFAULT NULL,
  p_only_onboarded boolean DEFAULT false,
  p_limit integer DEFAULT 200
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  profile_photo text,
  age integer,
  pronouns text,
  bio text,
  intent text[],
  favorite_moment text,
  favorite_player text,
  game_status text,
  wrigley_section text,
  wrigley_row text,
  wrigley_seat text,
  wrigleyville_bar text,
  fan_style text[],
  gameday_intents text[],
  vibe_state text,
  vibe_emoji text,
  fan_tier text,
  fan_xp integer,
  fan_title text,
  fan_tier_emoji text,
  gameday_persona text,
  superstition text,
  stretch_song text,
  best_bar text,
  is_verified boolean,
  is_banned boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  location_last_set_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.profile_photo, p.age, p.pronouns,
    p.bio, p.intent, p.favorite_moment, p.favorite_player, p.game_status,
    p.wrigley_section, p.wrigley_row, p.wrigley_seat, p.wrigleyville_bar,
    p.fan_style, p.gameday_intents, p.vibe_state, p.vibe_emoji,
    p.fan_tier, p.fan_xp, p.fan_title, p.fan_tier_emoji, p.gameday_persona,
    p.superstition, p.stretch_song, p.best_bar,
    p.is_verified, p.is_banned, p.onboarding_completed,
    p.created_at, p.updated_at, p.location_last_set_at
  FROM public.profiles p
  WHERE p.is_banned = false
    AND (p_user_ids IS NULL OR p.user_id = ANY(p_user_ids))
    AND (p_exclude_ids IS NULL OR NOT (p.user_id = ANY(p_exclude_ids)))
    AND (p_game_status IS NULL OR p.game_status = p_game_status)
    AND (NOT p_only_onboarded OR p.onboarding_completed = true)
    AND (NOT p_only_onboarded OR p.hidden_from_discover = false)
  LIMIT p_limit;
$$;


CREATE OR REPLACE FUNCTION public.get_public_profiles(
  p_user_ids uuid[] DEFAULT NULL,
  p_exclude_ids uuid[] DEFAULT NULL,
  p_game_status text DEFAULT NULL,
  p_only_onboarded boolean DEFAULT false,
  p_limit integer DEFAULT 200,
  p_active_since timestamptz DEFAULT NULL,
  p_require_section boolean DEFAULT false,
  p_require_bar boolean DEFAULT false
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  profile_photo text,
  age integer,
  pronouns text,
  bio text,
  intent text[],
  favorite_moment text,
  favorite_player text,
  game_status text,
  wrigley_section text,
  wrigley_row text,
  wrigley_seat text,
  wrigleyville_bar text,
  fan_style text[],
  gameday_intents text[],
  vibe_state text,
  vibe_emoji text,
  fan_tier text,
  fan_xp integer,
  fan_title text,
  fan_tier_emoji text,
  gameday_persona text,
  superstition text,
  stretch_song text,
  best_bar text,
  is_verified boolean,
  is_banned boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  location_last_set_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.profile_photo, p.age, p.pronouns,
    p.bio, p.intent, p.favorite_moment, p.favorite_player, p.game_status,
    p.wrigley_section, p.wrigley_row, p.wrigley_seat, p.wrigleyville_bar,
    p.fan_style, p.gameday_intents, p.vibe_state, p.vibe_emoji,
    p.fan_tier, p.fan_xp, p.fan_title, p.fan_tier_emoji, p.gameday_persona,
    p.superstition, p.stretch_song, p.best_bar,
    p.is_verified, p.is_banned, p.onboarding_completed,
    p.created_at, p.updated_at, p.location_last_set_at
  FROM public.profiles p
  WHERE p.is_banned = false
    AND (p_user_ids IS NULL OR p.user_id = ANY(p_user_ids))
    AND (p_exclude_ids IS NULL OR NOT (p.user_id = ANY(p_exclude_ids)))
    AND (p_game_status IS NULL OR p.game_status = p_game_status)
    AND (NOT p_only_onboarded OR (p.onboarding_completed = true AND p.hidden_from_discover = false))
    AND (p_active_since IS NULL OR p.location_last_set_at >= p_active_since)
    AND (NOT p_require_section OR p.wrigley_section IS NOT NULL)
    AND (NOT p_require_bar OR p.wrigleyville_bar IS NOT NULL)
  LIMIT p_limit;
$$;


-- Bar Check-ins table
CREATE TABLE public.bar_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  bar_name text NOT NULL,
  visibility text NOT NULL DEFAULT 'visible',
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '4 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bar_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible checkins"
  ON public.bar_checkins FOR SELECT TO authenticated
  USING (visibility = 'visible' OR auth.uid() = user_id);

CREATE POLICY "Users can create own checkins"
  ON public.bar_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON public.bar_checkins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins"
  ON public.bar_checkins FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_bar_checkins_bar ON public.bar_checkins (bar_name);
CREATE INDEX idx_bar_checkins_expires ON public.bar_checkins (expires_at);

-- Pub Crawls table
CREATE TABLE public.pub_crawls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  start_bar text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  invite_code text DEFAULT encode(extensions.gen_random_bytes(4), 'hex'),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_crawls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public crawls"
  ON public.pub_crawls FOR SELECT TO authenticated
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create crawls"
  ON public.pub_crawls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update crawls"
  ON public.pub_crawls FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete crawls"
  ON public.pub_crawls FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

-- Pub Crawl Stops table
CREATE TABLE public.pub_crawl_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crawl_id uuid NOT NULL REFERENCES public.pub_crawls(id) ON DELETE CASCADE,
  bar_name text NOT NULL,
  stop_order integer NOT NULL DEFAULT 1,
  arrived_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_crawl_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crawl stops"
  ON public.pub_crawl_stops FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id
    AND (c.is_public = true OR c.creator_id = auth.uid())
  ));

CREATE POLICY "Creators can add stops"
  ON public.pub_crawl_stops FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id AND c.creator_id = auth.uid()
  ));

CREATE POLICY "Creators can update stops"
  ON public.pub_crawl_stops FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id AND c.creator_id = auth.uid()
  ));

CREATE POLICY "Creators can delete stops"
  ON public.pub_crawl_stops FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pub_crawls c
    WHERE c.id = pub_crawl_stops.crawl_id AND c.creator_id = auth.uid()
  ));

-- Pub Crawl Members table
CREATE TABLE public.pub_crawl_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crawl_id uuid NOT NULL REFERENCES public.pub_crawls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(crawl_id, user_id)
);

ALTER TABLE public.pub_crawl_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crawl members"
  ON public.pub_crawl_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join crawls"
  ON public.pub_crawl_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave crawls"
  ON public.pub_crawl_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for check-ins and crawl members
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pub_crawl_members;

-- Updated_at trigger for pub_crawls
CREATE TRIGGER update_pub_crawls_updated_at
  BEFORE UPDATE ON public.pub_crawls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create bucket list progress table
CREATE TABLE public.bucket_list_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_key)
);

ALTER TABLE public.bucket_list_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.bucket_list_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.bucket_list_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.bucket_list_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add gameday legend badge expiry to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gameday_legend_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE TABLE public.stat_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stat_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  time_range text NOT NULL DEFAULT 'today',
  visibility text NOT NULL DEFAULT 'everyone',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stat_key)
);

ALTER TABLE public.stat_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stat preferences"
  ON public.stat_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stat preferences"
  ON public.stat_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stat preferences"
  ON public.stat_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stat preferences"
  ON public.stat_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can view others stat prefs for card display"
  ON public.stat_preferences FOR SELECT TO authenticated
  USING (true);

-- Add favorite bars list and private mode toggle to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_bars text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS private_mode boolean DEFAULT false;
-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Per-category frequency: 'instant' | 'hourly' | 'daily' | 'off'
  meetup_freq text NOT NULL DEFAULT 'instant',
  bar_freq text NOT NULL DEFAULT 'instant',
  friend_freq text NOT NULL DEFAULT 'instant',
  gameday_freq text NOT NULL DEFAULT 'instant',
  -- Quiet hours (local time, HH:MM 24h). NULL means disabled.
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_start time DEFAULT '22:00',
  quiet_end time DEFAULT '08:00',
  timezone text NOT NULL DEFAULT 'America/Chicago',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: classify a notification.type into a preference category
CREATE OR REPLACE FUNCTION public.notification_category(_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _type IN ('meetup_new', 'meetup_invite', 'meetup_join', 'meetup_reminder') THEN 'meetup'
    WHEN _type IN ('bar_busy', 'bar_quiet', 'bar_vote', 'bar_checkin') THEN 'bar'
    WHEN _type IN ('match', 'hi_five', 'message', 'friend_checkin', 'friend_meetup') THEN 'friend'
    WHEN _type IN ('game_start', 'game_score', 'game_weather', 'game_reminder') THEN 'gameday'
    ELSE 'other'
  END;
$$;

-- Filter trigger: respects user prefs (frequency=off + quiet hours)
CREATE OR REPLACE FUNCTION public.respect_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefs record;
  category text;
  freq text;
  local_now time;
  in_quiet boolean;
BEGIN
  category := public.notification_category(NEW.type);

  -- 'other' category bypasses prefs (system notifs always go through)
  IF category = 'other' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO prefs FROM public.notification_preferences WHERE user_id = NEW.user_id;

  -- No prefs row => defaults (instant for everything, no quiet hours) => allow
  IF prefs IS NULL THEN
    RETURN NEW;
  END IF;

  freq := CASE category
    WHEN 'meetup' THEN prefs.meetup_freq
    WHEN 'bar' THEN prefs.bar_freq
    WHEN 'friend' THEN prefs.friend_freq
    WHEN 'gameday' THEN prefs.gameday_freq
  END;

  -- Off => drop silently
  IF freq = 'off' THEN
    RETURN NULL;
  END IF;

  -- Quiet hours check (handles overnight windows like 22:00 -> 08:00)
  IF prefs.quiet_hours_enabled AND prefs.quiet_start IS NOT NULL AND prefs.quiet_end IS NOT NULL THEN
    local_now := (now() AT TIME ZONE COALESCE(prefs.timezone, 'America/Chicago'))::time;
    IF prefs.quiet_start <= prefs.quiet_end THEN
      in_quiet := local_now >= prefs.quiet_start AND local_now < prefs.quiet_end;
    ELSE
      in_quiet := local_now >= prefs.quiet_start OR local_now < prefs.quiet_end;
    END IF;

    IF in_quiet THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Digests (hourly/daily) are accepted now — a future cron job can batch them.
  -- For instant we just allow.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_respect_preferences ON public.notifications;
CREATE TRIGGER notifications_respect_preferences
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.respect_notification_preferences();

-- ============ TABLES ============

CREATE TABLE public.bar_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'finalized'
  finalized_option_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bar_plan_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bar_plans(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  bar_name TEXT NOT NULL,
  bar_slug TEXT, -- nullable: only set when picked from curated guide
  address TEXT,
  emoji TEXT DEFAULT '🍻',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bar_plan_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID NOT NULL REFERENCES public.bar_plan_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (option_id, user_id)
);

CREATE TABLE public.bar_plan_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bar_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bar_plans_crew ON public.bar_plans(crew_id, created_at DESC);
CREATE INDEX idx_bar_plan_options_plan ON public.bar_plan_options(plan_id);
CREATE INDEX idx_bar_plan_votes_option ON public.bar_plan_votes(option_id);
CREATE INDEX idx_bar_plan_comments_plan ON public.bar_plan_comments(plan_id, created_at);

-- ============ updated_at trigger ============

CREATE TRIGGER trg_bar_plans_updated_at
BEFORE UPDATE ON public.bar_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS ============

ALTER TABLE public.bar_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_plan_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_plan_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_plan_comments ENABLE ROW LEVEL SECURITY;

-- bar_plans: crew members only
CREATE POLICY "Crew members can view plans"
ON public.bar_plans FOR SELECT TO authenticated
USING (public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Crew members can create plans"
ON public.bar_plans FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id AND public.is_crew_member(auth.uid(), crew_id));

CREATE POLICY "Plan creator can update plan"
ON public.bar_plans FOR UPDATE TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Plan creator can delete plan"
ON public.bar_plans FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

-- bar_plan_options: crew members only (via plan->crew)
CREATE POLICY "Crew members can view options"
ON public.bar_plan_options FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bar_plans p
  WHERE p.id = bar_plan_options.plan_id
    AND public.is_crew_member(auth.uid(), p.crew_id)
));

CREATE POLICY "Crew members can add options"
ON public.bar_plan_options FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = added_by
  AND EXISTS (
    SELECT 1 FROM public.bar_plans p
    WHERE p.id = bar_plan_options.plan_id
      AND public.is_crew_member(auth.uid(), p.crew_id)
  )
);

CREATE POLICY "Adder can remove their option"
ON public.bar_plan_options FOR DELETE TO authenticated
USING (auth.uid() = added_by);

-- bar_plan_votes
CREATE POLICY "Crew members can view votes"
ON public.bar_plan_votes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bar_plan_options o
  JOIN public.bar_plans p ON p.id = o.plan_id
  WHERE o.id = bar_plan_votes.option_id
    AND public.is_crew_member(auth.uid(), p.crew_id)
));

CREATE POLICY "Crew members can vote"
ON public.bar_plan_votes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.bar_plan_options o
    JOIN public.bar_plans p ON p.id = o.plan_id
    WHERE o.id = bar_plan_votes.option_id
      AND public.is_crew_member(auth.uid(), p.crew_id)
  )
);

CREATE POLICY "Users can remove own votes"
ON public.bar_plan_votes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- bar_plan_comments
CREATE POLICY "Crew members can view comments"
ON public.bar_plan_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bar_plans p
  WHERE p.id = bar_plan_comments.plan_id
    AND public.is_crew_member(auth.uid(), p.crew_id)
));

CREATE POLICY "Crew members can comment"
ON public.bar_plan_comments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.bar_plans p
    WHERE p.id = bar_plan_comments.plan_id
      AND public.is_crew_member(auth.uid(), p.crew_id)
  )
);

CREATE POLICY "Users can delete own comments"
ON public.bar_plan_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plan_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plan_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bar_plan_comments;

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
-- Per-meetup attendance visibility
ALTER TABLE public.lineup_members
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Allow members to flip their own visibility
DROP POLICY IF EXISTS "Users can update own membership" ON public.lineup_members;
CREATE POLICY "Users can update own membership"
ON public.lineup_members FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Meetup-level reports (separate from per-user user_reports)
CREATE TABLE IF NOT EXISTS public.meetup_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meetup_id UUID NOT NULL REFERENCES public.lineup_meetups(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meetup_id, reporter_id)
);

ALTER TABLE public.meetup_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file meetup reports"
ON public.meetup_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view own reports"
ON public.meetup_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

-- Host trust signal (counts hosted meetups, recent reports against host)
CREATE OR REPLACE FUNCTION public.get_host_trust(_host_id UUID)
RETURNS TABLE (
  hosted_count INTEGER,
  recent_reports INTEGER,
  is_verified BOOLEAN,
  is_trusted BOOLEAN,
  is_first_time BOOLEAN
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      (SELECT COUNT(*)::INTEGER FROM public.lineup_meetups m WHERE m.creator_id = _host_id) AS hosted_count,
      (SELECT COUNT(*)::INTEGER FROM public.user_reports r
        WHERE r.reported_user_id = _host_id
          AND r.created_at > now() - interval '90 days'
          AND r.status = 'pending') AS recent_reports,
      (SELECT COALESCE(p.is_verified, false) FROM public.profiles p WHERE p.user_id = _host_id) AS is_verified
  )
  SELECT
    s.hosted_count,
    s.recent_reports,
    s.is_verified,
    (s.is_verified AND s.hosted_count >= 3 AND s.recent_reports = 0) AS is_trusted,
    (s.hosted_count <= 1) AS is_first_time
  FROM stats s;
$$;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS quick_start jsonb;

COMMENT ON COLUMN public.profiles.quick_start IS 'Quick onboarding answers: { primary_intent, gameday_behavior, hangout_zone, group_size, completed_at }';

ALTER TABLE public.bar_checkins 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'checkin',
ADD COLUMN IF NOT EXISTS custom_message text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pregame_meal text,
  ADD COLUMN IF NOT EXISTS postgame_food text,
  ADD COLUMN IF NOT EXISTS carb_up_strategy text,
  ADD COLUMN IF NOT EXISTS favorite_bar_food text,
  ADD COLUMN IF NOT EXISTS post_win_meal text;
CREATE TABLE public.teammate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT teammate_requests_no_self CHECK (requester_id <> recipient_id),
  CONSTRAINT teammate_requests_status_chk CHECK (status IN ('pending','accepted','declined','cancelled'))
);

CREATE UNIQUE INDEX teammate_requests_pair_unique
  ON public.teammate_requests (
    LEAST(requester_id, recipient_id),
    GREATEST(requester_id, recipient_id)
  )
  WHERE status IN ('pending','accepted');

CREATE INDEX teammate_requests_recipient_idx ON public.teammate_requests (recipient_id, status);
CREATE INDEX teammate_requests_requester_idx ON public.teammate_requests (requester_id, status);

ALTER TABLE public.teammate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own teammate rows"
  ON public.teammate_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send teammate requests"
  ON public.teammate_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Recipient or requester can update"
  ON public.teammate_requests FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Either party can remove the bond"
  ON public.teammate_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE TRIGGER teammate_requests_updated_at
  BEFORE UPDATE ON public.teammate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_teammate_ids(_user_id uuid)
RETURNS TABLE(teammate_id uuid, since timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT
    CASE WHEN tr.requester_id = _user_id THEN tr.recipient_id ELSE tr.requester_id END AS teammate_id,
    COALESCE(tr.responded_at, tr.updated_at) AS since
  FROM public.teammate_requests tr
  WHERE tr.status = 'accepted'
    AND (tr.requester_id = _user_id OR tr.recipient_id = _user_id);
$func$;

CREATE OR REPLACE FUNCTION public.notify_teammate_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT display_name INTO requester_name FROM public.profiles WHERE user_id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.recipient_id,
      'teammate_request',
      'New Teammate Request',
      COALESCE(NULLIF(requester_name, ''), 'A fan') || ' wants to add you to their team.',
      '🧢',
      '/dugout',
      jsonb_build_object('request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER teammate_request_notify
  AFTER INSERT ON public.teammate_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_teammate_request();

CREATE OR REPLACE FUNCTION public.notify_teammate_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  recipient_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT display_name INTO recipient_name FROM public.profiles WHERE user_id = NEW.recipient_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.requester_id,
      'teammate_accepted',
      'New Teammate joined your roster!',
      COALESCE(NULLIF(recipient_name, ''), 'A fan') || ' is on your team.',
      '🤝',
      '/dugout',
      jsonb_build_object('request_id', NEW.id, 'teammate_id', NEW.recipient_id)
    );
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER teammate_request_accepted
  BEFORE UPDATE ON public.teammate_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_teammate_accepted();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shots_taken_season integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appetizers_had_season integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_food_spot text;

CREATE OR REPLACE FUNCTION public.get_public_card_extras(p_user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  shots_taken_season integer,
  appetizers_had_season integer,
  favorite_food_spot text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.shots_taken_season, p.appetizers_had_season, p.favorite_food_spot
  FROM public.profiles p
  WHERE p.is_banned = false
    AND p.user_id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_card_extras(uuid[]) TO authenticated, anon;


ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beers_today_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beers_week_count  integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_league_leaders(
  p_category text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  profile_photo text,
  favorite_food_spot text,
  stat_value integer,
  rank integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start timestamptz := date_trunc('week', now());
  day_start  timestamptz := date_trunc('day',  now());
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      p.user_id,
      p.display_name,
      p.profile_photo,
      p.favorite_food_spot,
      CASE p_category
        WHEN 'beersToday'         THEN p.beers_today_count
        WHEN 'beersThisWeek'      THEN p.beers_week_count
        WHEN 'shotsTakenSeason'   THEN p.shots_taken_season
        WHEN 'appetizersHadSeason'THEN p.appetizers_had_season
        WHEN 'barsVisitedToday' THEN (
          SELECT COUNT(DISTINCT bc.bar_name)::int
          FROM public.bar_checkins bc
          WHERE bc.user_id = p.user_id
            AND bc.checked_in_at >= day_start
        )
        WHEN 'barsVisitedThisWeek' THEN (
          SELECT COUNT(DISTINCT bc.bar_name)::int
          FROM public.bar_checkins bc
          WHERE bc.user_id = p.user_id
            AND bc.checked_in_at >= week_start
        )
        WHEN 'meetupsFinished' THEN (
          SELECT COUNT(*)::int
          FROM public.lineup_members lm
          WHERE lm.user_id = p.user_id
        )
        WHEN 'fansConnected' THEN (
          SELECT COUNT(*)::int
          FROM public.matches m
          WHERE (m.user_a = p.user_id OR m.user_b = p.user_id)
            AND m.status = 'matched'
        )
        ELSE 0
      END AS stat_value
    FROM public.profiles p
    WHERE p.is_banned = false
      AND p.onboarding_completed = true
      AND p.hidden_from_discover = false
  )
  SELECT
    b.user_id,
    b.display_name,
    b.profile_photo,
    b.favorite_food_spot,
    b.stat_value,
    (RANK() OVER (ORDER BY b.stat_value DESC, b.display_name ASC))::int AS rank
  FROM base b
  ORDER BY stat_value DESC, b.display_name ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_league_leaders(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_league_leaders(text, integer) TO authenticated;


-- =========================================================
-- Time-windowed League Leaders + Rank Snapshots
-- =========================================================

-- 1. Track weekly snapshots so we can compute "Rising Star" (most rank gain) and "Iron Fan" (consistent participation).
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  period text NOT NULL,                -- 'week' | 'month' | 'season'
  period_start date NOT NULL,
  rank integer NOT NULL,
  stat_value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, period, period_start)
);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "Anyone can view snapshots"
  ON public.leaderboard_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- 2. Replace get_league_leaders with a version that supports time periods.
DROP FUNCTION IF EXISTS public.get_league_leaders(text, integer);
DROP FUNCTION IF EXISTS public.get_league_leaders(text, integer, text);

CREATE OR REPLACE FUNCTION public.get_league_leaders(
  p_category text,
  p_limit integer DEFAULT 100,
  p_period text DEFAULT 'season'
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  profile_photo text,
  favorite_food_spot text,
  stat_value integer,
  rank integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start  timestamptz := date_trunc('week',  now());
  month_start timestamptz := date_trunc('month', now());
  day_start   timestamptz := date_trunc('day',   now());
  win_start   timestamptz;
BEGIN
  win_start := CASE p_period
    WHEN 'week'   THEN week_start
    WHEN 'month'  THEN month_start
    ELSE 'epoch'::timestamptz   -- season / cumulative
  END;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.user_id,
      p.display_name,
      p.profile_photo,
      p.favorite_food_spot,
      CASE p_category
        WHEN 'beersToday'         THEN p.beers_today_count
        WHEN 'beersThisWeek'      THEN p.beers_week_count
        WHEN 'shotsTakenSeason'   THEN p.shots_taken_season
        WHEN 'appetizersHadSeason'THEN p.appetizers_had_season

        WHEN 'barsVisitedToday' THEN (
          SELECT COUNT(DISTINCT bc.bar_name)::int
          FROM public.bar_checkins bc
          WHERE bc.user_id = p.user_id
            AND bc.checked_in_at >= day_start
        )
        WHEN 'barsVisitedThisWeek' THEN (
          SELECT COUNT(DISTINCT bc.bar_name)::int
          FROM public.bar_checkins bc
          WHERE bc.user_id = p.user_id
            AND bc.checked_in_at >= GREATEST(week_start, win_start)
        )
        WHEN 'meetupsFinished' THEN (
          SELECT COUNT(*)::int
          FROM public.lineup_members lm
          WHERE lm.user_id = p.user_id
            AND lm.joined_at >= win_start
        )
        WHEN 'fansConnected' THEN (
          SELECT COUNT(*)::int
          FROM public.matches m
          WHERE (m.user_a = p.user_id OR m.user_b = p.user_id)
            AND m.status = 'matched'
            AND m.created_at >= win_start
        )
        ELSE 0
      END AS stat_value
    FROM public.profiles p
    WHERE p.is_banned = false
      AND p.onboarding_completed = true
      AND p.hidden_from_discover = false
  )
  SELECT
    b.user_id,
    b.display_name,
    b.profile_photo,
    b.favorite_food_spot,
    b.stat_value,
    (RANK() OVER (ORDER BY b.stat_value DESC, b.display_name ASC))::int AS rank
  FROM base b
  ORDER BY stat_value DESC, b.display_name ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- 3. Helper RPC: rank delta vs last week (for Rising Star badge) and weekly participation streak (Iron Fan).
CREATE OR REPLACE FUNCTION public.get_leaderboard_extras(p_category text, p_period text DEFAULT 'season')
RETURNS TABLE (
  user_id uuid,
  rank_delta integer,           -- positive = climbed
  weeks_active_recent integer   -- weeks of activity in last 6 weeks
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH last_week AS (
    SELECT s.user_id, s.rank
    FROM public.leaderboard_snapshots s
    WHERE s.category = p_category
      AND s.period = p_period
      AND s.period_start = (date_trunc('week', now()) - interval '7 days')::date
  ),
  current_week AS (
    SELECT s.user_id, s.rank
    FROM public.leaderboard_snapshots s
    WHERE s.category = p_category
      AND s.period = p_period
      AND s.period_start = date_trunc('week', now())::date
  ),
  participation AS (
    SELECT s.user_id, COUNT(DISTINCT s.period_start)::int AS weeks_active
    FROM public.leaderboard_snapshots s
    WHERE s.category = p_category
      AND s.period = 'week'
      AND s.period_start >= (date_trunc('week', now()) - interval '6 weeks')::date
    GROUP BY s.user_id
  )
  SELECT
    COALESCE(c.user_id, l.user_id, pa.user_id) AS user_id,
    COALESCE(l.rank - c.rank, 0) AS rank_delta,
    COALESCE(pa.weeks_active, 0) AS weeks_active_recent
  FROM current_week c
  FULL OUTER JOIN last_week l ON l.user_id = c.user_id
  FULL OUTER JOIN participation pa ON pa.user_id = COALESCE(c.user_id, l.user_id);
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS favorite_gate text;
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
-- 1. push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. Trigger: when a notification is inserted, call the send-push edge function via pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_send_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text := 'https://saqtmgjbuwimvxtrauvb.supabase.co/functions/v1/send-push';
BEGIN
  PERFORM extensions.http_post(
    url     := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.body,
      'action_url', NEW.action_url,
      'emoji', NEW.emoji,
      'type', NEW.type
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a notification insert because of push delivery failure
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_send_push ON public.notifications;
CREATE TRIGGER notifications_send_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_send_push();
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS watch_locations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS arrival_time text,
  ADD COLUMN IF NOT EXISTS vibe_tags text[] NOT NULL DEFAULT '{}';
-- 1. Enable PostGIS in the dedicated extensions schema (Supabase best practice)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add geography column + spatial index on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location extensions.geography(POINT, 4326);

CREATE INDEX IF NOT EXISTS profiles_location_idx
  ON public.profiles USING GIST(location);

-- 3. Proximity RPC. Returns nearest fans within radius_miles of the given point.
--    SECURITY DEFINER + explicit auth.uid() guard so unauthenticated calls return 0 rows.
CREATE OR REPLACE FUNCTION public.nearby_fans(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision DEFAULT 2
)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  zip_code text,
  vibe_tags text[],
  watch_locations text[],
  distance_meters double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    p.user_id           AS id,
    p.display_name,
    p.profile_photo     AS avatar_url,
    p.zip_code,
    p.vibe_tags,
    p.watch_locations,
    extensions.ST_Distance(
      p.location,
      extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography
    ) AS distance_meters
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND p.location IS NOT NULL
    AND p.is_banned = false
    AND p.onboarding_completed = true
    AND p.hidden_from_discover = false
    AND extensions.ST_DWithin(
      p.location,
      extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography,
      radius_miles * 1609.34
    )
  ORDER BY distance_meters ASC
  LIMIT 50;
$$;

-- Lock down execution: only signed-in users
REVOKE EXECUTE ON FUNCTION public.nearby_fans(double precision, double precision, double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.nearby_fans(double precision, double precision, double precision) TO authenticated;
CREATE OR REPLACE FUNCTION public.set_profile_location(
  p_lat double precision,
  p_lng double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_lat IS NULL OR p_lng IS NULL THEN
    RAISE EXCEPTION 'Coordinates required';
  END IF;
  IF p_lat < -90 OR p_lat > 90 OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Coordinates out of range';
  END IF;

  UPDATE public.profiles
     SET location = extensions.ST_MakePoint(p_lng, p_lat)::extensions.geography
   WHERE user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_profile_location(double precision, double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_profile_location(double precision, double precision) TO authenticated;
-- 1. phone_verified on profiles (no enforcement yet)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

-- 2. beer_money_balances
CREATE TABLE IF NOT EXISTS public.beer_money_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.beer_money_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance"
  ON public.beer_money_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies → only SECURITY DEFINER RPCs can write.

-- 3. credit_purchases (Stripe top-ups)
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE,
  price_id text NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.credit_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON public.credit_purchases(user_id, created_at DESC);

-- 4. beer_tips (immutable)
CREATE TABLE IF NOT EXISTS public.beer_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL CHECK (credits BETWEEN 500 AND 2500),
  message text CHECK (message IS NULL OR char_length(message) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_tip CHECK (sender_id <> recipient_id)
);
ALTER TABLE public.beer_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender or recipient can view tip"
  ON public.beer_tips FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
-- No INSERT/UPDATE/DELETE → tips only created via RPC.

CREATE INDEX IF NOT EXISTS idx_beer_tips_sender ON public.beer_tips(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beer_tips_recipient ON public.beer_tips(recipient_id, created_at DESC);

-- 5. send_beer_tip RPC (atomic debit/credit/notify)
CREATE OR REPLACE FUNCTION public.send_beer_tip(
  p_recipient_id uuid,
  p_credits integer,
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_today_total integer;
  v_balance integer;
  v_sender_name text;
  v_tip_id uuid;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender THEN
    RAISE EXCEPTION 'Cannot tip yourself' USING ERRCODE = '22023';
  END IF;
  IF p_credits IS NULL OR p_credits < 500 OR p_credits > 2500 THEN
    RAISE EXCEPTION 'Tip must be between 500 and 2500 credits' USING ERRCODE = '22023';
  END IF;
  IF p_message IS NOT NULL AND char_length(p_message) > 100 THEN
    RAISE EXCEPTION 'Message too long' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_recipient_id AND is_banned = false) THEN
    RAISE EXCEPTION 'Recipient not found' USING ERRCODE = '22023';
  END IF;

  -- Daily cap: 5000 credits sent in last 24h
  SELECT COALESCE(SUM(credits), 0) INTO v_today_total
    FROM public.beer_tips
   WHERE sender_id = v_sender AND created_at > now() - interval '24 hours';
  IF v_today_total + p_credits > 5000 THEN
    RAISE EXCEPTION 'Daily tip limit reached (5000 credits per 24h)' USING ERRCODE = '22023';
  END IF;

  -- Lock + check balance
  SELECT credits INTO v_balance FROM public.beer_money_balances WHERE user_id = v_sender FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient Beer Money' USING ERRCODE = '22023';
  END IF;
  IF v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient Beer Money' USING ERRCODE = '22023';
  END IF;

  -- Debit sender
  UPDATE public.beer_money_balances
     SET credits = credits - p_credits, updated_at = now()
   WHERE user_id = v_sender;

  -- Credit recipient (upsert)
  INSERT INTO public.beer_money_balances (user_id, credits)
  VALUES (p_recipient_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.beer_money_balances.credits + EXCLUDED.credits,
        updated_at = now();

  -- Record tip
  INSERT INTO public.beer_tips (sender_id, recipient_id, credits, message)
  VALUES (v_sender, p_recipient_id, p_credits, p_message)
  RETURNING id INTO v_tip_id;

  -- Notify
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = v_sender;
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_recipient_id,
    'beer_received',
    COALESCE(NULLIF(v_sender_name, ''), 'A fan') || ' bought you a beer!',
    'You got ' || p_credits || ' Beer Money' || COALESCE(' — "' || p_message || '"', ''),
    '🍺',
    '/profile',
    jsonb_build_object('tip_id', v_tip_id, 'sender_id', v_sender, 'credits', p_credits)
  );

  RETURN v_tip_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_beer_tip(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_beer_tip(uuid, integer, text) TO authenticated;

-- 6. add_beer_credits RPC (service role only — called by webhook)
CREATE OR REPLACE FUNCTION public.add_beer_credits(
  p_user_id uuid,
  p_credits integer,
  p_session_id text,
  p_price_id text,
  p_amount_cents integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Credits must be positive';
  END IF;

  -- Idempotency: if this session was already processed, do nothing
  IF EXISTS (SELECT 1 FROM public.credit_purchases WHERE stripe_session_id = p_session_id AND status = 'completed') THEN
    RETURN;
  END IF;

  INSERT INTO public.credit_purchases (user_id, stripe_session_id, price_id, credits, amount_cents, status, completed_at)
  VALUES (p_user_id, p_session_id, p_price_id, p_credits, p_amount_cents, 'completed', now())
  ON CONFLICT (stripe_session_id) DO UPDATE
    SET status = 'completed', completed_at = now();

  INSERT INTO public.beer_money_balances (user_id, credits)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.beer_money_balances.credits + EXCLUDED.credits,
        updated_at = now();

  -- Notify the buyer
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_user_id,
    'credits_added',
    'Beer Money topped up!',
    p_credits || ' credits added to your wallet',
    '💰',
    '/profile',
    jsonb_build_object('credits', p_credits, 'amount_cents', p_amount_cents)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.add_beer_credits(uuid, integer, text, text, integer) FROM PUBLIC, anon, authenticated;
-- service_role keeps default access; webhook uses service role.
CREATE TABLE public.beer_shoutouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id uuid NOT NULL UNIQUE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  credits integer NOT NULL,
  message text,
  is_auto_generated boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_beer_shoutouts_created ON public.beer_shoutouts (created_at DESC);
CREATE INDEX idx_beer_shoutouts_expires ON public.beer_shoutouts (expires_at);
CREATE INDEX idx_beer_shoutouts_sender ON public.beer_shoutouts (sender_id);
CREATE INDEX idx_beer_shoutouts_recipient ON public.beer_shoutouts (recipient_id);

ALTER TABLE public.beer_shoutouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view shoutouts"
  ON public.beer_shoutouts FOR SELECT
  TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.beer_shoutouts;

CREATE OR REPLACE FUNCTION public.get_beer_buyer_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.beer_tips WHERE sender_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.send_beer_tip(p_recipient_id uuid, p_credits integer, p_message text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender uuid := auth.uid();
  v_today_total integer;
  v_balance integer;
  v_sender_name text;
  v_tip_id uuid;
  v_shoutout_id uuid;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender THEN
    RAISE EXCEPTION 'Cannot tip yourself' USING ERRCODE = '22023';
  END IF;
  IF p_credits IS NULL OR p_credits < 500 OR p_credits > 2500 THEN
    RAISE EXCEPTION 'Tip must be between 500 and 2500 credits' USING ERRCODE = '22023';
  END IF;
  IF p_message IS NOT NULL AND char_length(p_message) > 100 THEN
    RAISE EXCEPTION 'Message too long' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_recipient_id AND is_banned = false) THEN
    RAISE EXCEPTION 'Recipient not found' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(SUM(credits), 0) INTO v_today_total
    FROM public.beer_tips
   WHERE sender_id = v_sender AND created_at > now() - interval '24 hours';
  IF v_today_total + p_credits > 5000 THEN
    RAISE EXCEPTION 'Daily tip limit reached (5000 credits per 24h)' USING ERRCODE = '22023';
  END IF;

  SELECT credits INTO v_balance FROM public.beer_money_balances WHERE user_id = v_sender FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient Beer Money' USING ERRCODE = '22023';
  END IF;

  UPDATE public.beer_money_balances
     SET credits = credits - p_credits, updated_at = now()
   WHERE user_id = v_sender;

  INSERT INTO public.beer_money_balances (user_id, credits)
  VALUES (p_recipient_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.beer_money_balances.credits + EXCLUDED.credits,
        updated_at = now();

  INSERT INTO public.beer_tips (sender_id, recipient_id, credits, message)
  VALUES (v_sender, p_recipient_id, p_credits, p_message)
  RETURNING id INTO v_tip_id;

  INSERT INTO public.beer_shoutouts (tip_id, sender_id, recipient_id, credits, message, is_auto_generated)
  VALUES (v_tip_id, v_sender, p_recipient_id, p_credits, p_message, true)
  RETURNING id INTO v_shoutout_id;

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = v_sender;
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_recipient_id,
    'beer_received',
    COALESCE(NULLIF(v_sender_name, ''), 'A fan') || ' bought you a beer!',
    COALESCE(NULLIF(p_message, ''), 'Enjoy the game!'),
    '🍺',
    '/vibe?shoutout=' || v_shoutout_id::text,
    jsonb_build_object(
      'tip_id', v_tip_id,
      'shoutout_id', v_shoutout_id,
      'sender_id', v_sender,
      'credits', p_credits,
      'message', p_message
    )
  );

  RETURN v_tip_id;
END;
$function$;
-- 1) Add new profile fields used by Discover Fans filters
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_gate text,
  ADD COLUMN IF NOT EXISTS vibe_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS watch_locations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS zip_code text;

CREATE INDEX IF NOT EXISTS idx_profiles_vibe_tags ON public.profiles USING GIN (vibe_tags);
CREATE INDEX IF NOT EXISTS idx_profiles_watch_locations ON public.profiles USING GIN (watch_locations);
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_gate ON public.profiles (favorite_gate);

-- 2) Buddy requests table (separate from teammate_requests, per spec)
CREATE TABLE IF NOT EXISTS public.buddy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT buddy_requests_no_self CHECK (requester_id <> recipient_id),
  CONSTRAINT buddy_requests_status_chk CHECK (status IN ('pending','accepted','declined')),
  CONSTRAINT buddy_requests_unique_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_buddy_requests_recipient ON public.buddy_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_requester ON public.buddy_requests(requester_id, status);

ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their buddy requests"
  ON public.buddy_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users create buddy requests they send"
  ON public.buddy_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipient or requester can update"
  ON public.buddy_requests FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Requester can cancel"
  ON public.buddy_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id);

CREATE TRIGGER trg_buddy_requests_updated_at
  BEFORE UPDATE ON public.buddy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Atomic "Say Hi" RPC: handles new request, auto-accept on mutual, and idempotent re-send
CREATE OR REPLACE FUNCTION public.say_hi_to_buddy(p_recipient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing record;
  v_reverse record;
  v_conv_id uuid;
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_user THEN
    RAISE EXCEPTION 'Invalid recipient' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_recipient_id AND is_banned = false) THEN
    RAISE EXCEPTION 'Recipient not available' USING ERRCODE = '22023';
  END IF;

  -- Reverse pending request? auto-accept and open chat
  SELECT * INTO v_reverse FROM public.buddy_requests
   WHERE requester_id = p_recipient_id AND recipient_id = v_user AND status = 'pending'
   LIMIT 1;

  IF v_reverse.id IS NOT NULL THEN
    UPDATE public.buddy_requests
       SET status = 'accepted', responded_at = now(), updated_at = now()
     WHERE id = v_reverse.id;

    IF v_user < p_recipient_id THEN v_user_a := v_user; v_user_b := p_recipient_id;
    ELSE v_user_a := p_recipient_id; v_user_b := v_user; END IF;

    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (v_user_a, v_user_b)
    ON CONFLICT (participant_a, participant_b) DO UPDATE SET last_message_at = now()
    RETURNING id INTO v_conv_id;

    IF v_conv_id IS NULL THEN
      SELECT id INTO v_conv_id FROM public.conversations
       WHERE participant_a = v_user_a AND participant_b = v_user_b LIMIT 1;
    END IF;

    RETURN jsonb_build_object('result', 'accepted', 'conversation_id', v_conv_id);
  END IF;

  -- Existing connection? open chat
  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE ((requester_id = v_user AND recipient_id = p_recipient_id)
       OR (requester_id = p_recipient_id AND recipient_id = v_user))
     AND status = 'accepted'
   LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    IF v_user < p_recipient_id THEN v_user_a := v_user; v_user_b := p_recipient_id;
    ELSE v_user_a := p_recipient_id; v_user_b := v_user; END IF;

    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (v_user_a, v_user_b)
    ON CONFLICT (participant_a, participant_b) DO NOTHING;

    SELECT id INTO v_conv_id FROM public.conversations
     WHERE participant_a = v_user_a AND participant_b = v_user_b LIMIT 1;

    RETURN jsonb_build_object('result', 'already_connected', 'conversation_id', v_conv_id);
  END IF;

  -- Outgoing pending? noop
  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE requester_id = v_user AND recipient_id = p_recipient_id AND status = 'pending'
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('result', 'already_sent', 'request_id', v_existing.id);
  END IF;

  -- Otherwise, create new pending request (handle prior declined row)
  INSERT INTO public.buddy_requests (requester_id, recipient_id, status)
  VALUES (v_user, p_recipient_id, 'pending')
  ON CONFLICT (requester_id, recipient_id) DO UPDATE
    SET status = 'pending', updated_at = now(), responded_at = NULL
  RETURNING id INTO v_existing.id;

  -- Notify recipient
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_recipient_id,
    'buddy_request',
    'A fan said hi!',
    'Tap to view their card and say hi back.',
    '👋',
    '/discover-fans',
    jsonb_build_object('request_id', v_existing.id, 'requester_id', v_user)
  );

  RETURN jsonb_build_object('result', 'sent', 'request_id', v_existing.id);
END;
$$;
DROP FUNCTION IF EXISTS public.notification_category(text);
DROP FUNCTION IF EXISTS public.notification_allowed(uuid, text);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb
    NOT NULL
    DEFAULT '{"buddies": true, "beers": true, "meetups": true, "vibes": true, "gameday": true}'::jsonb;

CREATE OR REPLACE FUNCTION public.notification_category(p_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_type IN ('buddy_request','buddy_accepted','teammate_request','teammate_accepted','match') THEN 'buddies'
    WHEN p_type IN ('beer_received') THEN 'beers'
    WHEN p_type IN ('meetup','meetup_created','meetup_joined','meetup_nearby') THEN 'meetups'
    WHEN p_type IN ('vibe_mention','vibe_reaction') THEN 'vibes'
    WHEN p_type IN (
      'game_reminder','crew_active','fans_active','section_active','post_game',
      'fellow_bar_gather','section_buddies','new_fan_nearby','wrigleyville_buzz',
      'almost_first_pitch','food_pregame','food_postgame','weather'
    ) THEN 'gameday'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.notification_allowed(p_user_id uuid, p_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs jsonb;
  v_cat text;
BEGIN
  v_cat := public.notification_category(p_type);
  IF v_cat IS NULL THEN
    RETURN true;
  END IF;
  SELECT notification_preferences INTO v_prefs FROM public.profiles WHERE user_id = p_user_id;
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;
  RETURN COALESCE((v_prefs ->> v_cat)::boolean, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_teammate_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' AND public.notification_allowed(NEW.recipient_id, 'teammate_request') THEN
    SELECT display_name INTO requester_name FROM public.profiles WHERE user_id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.recipient_id,
      'teammate_request',
      'New Teammate Request',
      COALESCE(NULLIF(requester_name, ''), 'A fan') || ' wants to add you to their team.',
      '🧢',
      '/dugout',
      jsonb_build_object('request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_teammate_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  recipient_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    IF public.notification_allowed(NEW.requester_id, 'teammate_accepted') THEN
      SELECT display_name INTO recipient_name FROM public.profiles WHERE user_id = NEW.recipient_id;
      INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
      VALUES (
        NEW.requester_id,
        'teammate_accepted',
        'New Teammate joined your roster!',
        COALESCE(NULLIF(recipient_name, ''), 'A fan') || ' is on your team.',
        '🤝',
        '/dugout',
        jsonb_build_object('request_id', NEW.id, 'teammate_id', NEW.recipient_id)
      );
    END IF;
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_buddy_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  recipient_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending'
     AND public.notification_allowed(NEW.requester_id, 'buddy_accepted') THEN
    SELECT display_name INTO recipient_name FROM public.profiles WHERE user_id = NEW.recipient_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.requester_id,
      'buddy_accepted',
      'You got a new buddy!',
      COALESCE(NULLIF(recipient_name, ''), 'A fan') || ' said hi back. Tap to start chatting.',
      '🤝',
      '/messages',
      jsonb_build_object('buddy_id', NEW.recipient_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS buddy_request_accepted ON public.buddy_requests;
CREATE TRIGGER buddy_request_accepted
  AFTER UPDATE ON public.buddy_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_buddy_accepted();

CREATE OR REPLACE FUNCTION public.say_hi_to_buddy(p_recipient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing public.buddy_requests%ROWTYPE;
  v_incoming public.buddy_requests%ROWTYPE;
  v_conv_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_user = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot send a buddy request to yourself';
  END IF;

  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE ((requester_id = v_user AND recipient_id = p_recipient_id)
       OR (requester_id = p_recipient_id AND recipient_id = v_user))
     AND status = 'accepted'
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    SELECT id INTO v_conv_id FROM public.conversations
     WHERE (participant_a = v_user AND participant_b = p_recipient_id)
        OR (participant_a = p_recipient_id AND participant_b = v_user)
     LIMIT 1;
    IF v_conv_id IS NULL THEN
      INSERT INTO public.conversations (participant_a, participant_b)
      VALUES (LEAST(v_user, p_recipient_id), GREATEST(v_user, p_recipient_id))
      RETURNING id INTO v_conv_id;
    END IF;
    RETURN jsonb_build_object('result', 'already_connected', 'conversation_id', v_conv_id);
  END IF;

  SELECT * INTO v_incoming FROM public.buddy_requests
   WHERE requester_id = p_recipient_id AND recipient_id = v_user AND status = 'pending'
   LIMIT 1;
  IF v_incoming.id IS NOT NULL THEN
    UPDATE public.buddy_requests
       SET status = 'accepted', responded_at = now(), updated_at = now()
     WHERE id = v_incoming.id;
    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (LEAST(v_user, p_recipient_id), GREATEST(v_user, p_recipient_id))
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_conv_id FROM public.conversations
     WHERE (participant_a = LEAST(v_user, p_recipient_id) AND participant_b = GREATEST(v_user, p_recipient_id))
     LIMIT 1;
    RETURN jsonb_build_object('result', 'auto_accepted', 'conversation_id', v_conv_id);
  END IF;

  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE requester_id = v_user AND recipient_id = p_recipient_id AND status = 'pending'
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('result', 'already_sent', 'request_id', v_existing.id);
  END IF;

  INSERT INTO public.buddy_requests (requester_id, recipient_id, status)
  VALUES (v_user, p_recipient_id, 'pending')
  ON CONFLICT (requester_id, recipient_id) DO UPDATE
    SET status = 'pending', updated_at = now(), responded_at = NULL
  RETURNING id INTO v_existing.id;

  IF public.notification_allowed(p_recipient_id, 'buddy_request') THEN
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      p_recipient_id,
      'buddy_request',
      'A fan said hi!',
      'Tap to view their card and say hi back.',
      '👋',
      '/discover-fans',
      jsonb_build_object('request_id', v_existing.id, 'requester_id', v_user)
    );
  END IF;

  RETURN jsonb_build_object('result', 'sent', 'request_id', v_existing.id);
END;
$$;
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read public-assets') THEN
    CREATE POLICY "Public read public-assets" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
  END IF;
END $$;
-- merchants
CREATE TABLE public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  logo_url text,
  description text,
  merchant_secret text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active merchants are publicly viewable"
  ON public.merchants FOR SELECT USING (is_active = true);

-- merchant_promos
CREATE TABLE public.merchant_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_type text CHECK (discount_type IN ('percent','fixed','free_item')),
  discount_value integer,
  min_purchase_cents integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions integer,
  current_redemptions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merchant_promos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active promos are publicly viewable"
  ON public.merchant_promos FOR SELECT USING (is_active = true);
CREATE INDEX idx_promos_merchant ON public.merchant_promos(merchant_id, is_active);

-- promo_redemptions
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  promo_id uuid NOT NULL REFERENCES public.merchant_promos(id) ON DELETE CASCADE,
  qr_code_token text NOT NULL UNIQUE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  UNIQUE (user_id, promo_id)
);
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own redemptions"
  ON public.promo_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_redemptions_user ON public.promo_redemptions(user_id, redeemed_at DESC);

-- updated_at triggers (reuse existing function)
CREATE TRIGGER trg_merchants_updated BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON public.merchant_promos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- claim_promo: fan claims; regenerates token on existing row if not yet confirmed
CREATE OR REPLACE FUNCTION public.claim_promo(p_promo_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_promo public.merchant_promos%ROWTYPE;
  v_existing public.promo_redemptions%ROWTYPE;
  v_token text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='28000'; END IF;

  SELECT * INTO v_promo FROM public.merchant_promos WHERE id = p_promo_id AND is_active = true;
  IF v_promo.id IS NULL THEN RAISE EXCEPTION 'Promo not available'; END IF;
  IF v_promo.valid_from IS NOT NULL AND now() < v_promo.valid_from THEN RAISE EXCEPTION 'Promo not yet active'; END IF;
  IF v_promo.valid_until IS NOT NULL AND now() > v_promo.valid_until THEN RAISE EXCEPTION 'Promo expired'; END IF;
  IF v_promo.max_redemptions IS NOT NULL AND v_promo.current_redemptions >= v_promo.max_redemptions THEN
    RAISE EXCEPTION 'Promo fully redeemed';
  END IF;

  SELECT * INTO v_existing FROM public.promo_redemptions
    WHERE user_id = v_user AND promo_id = p_promo_id;
  IF v_existing.id IS NOT NULL AND v_existing.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already redeemed';
  END IF;

  v_token := encode(gen_random_bytes(18), 'hex');

  IF v_existing.id IS NULL THEN
    INSERT INTO public.promo_redemptions (user_id, promo_id, qr_code_token)
    VALUES (v_user, p_promo_id, v_token);
  ELSE
    UPDATE public.promo_redemptions
       SET qr_code_token = v_token, redeemed_at = now()
     WHERE id = v_existing.id;
  END IF;

  RETURN v_token;
END;
$$;

-- preview_promo_redemption: bartender screen lookup
CREATE OR REPLACE FUNCTION public.preview_promo_redemption(p_token text, p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_red public.promo_redemptions%ROWTYPE;
  v_promo public.merchant_promos%ROWTYPE;
  v_merchant public.merchants%ROWTYPE;
  v_user_name text;
BEGIN
  SELECT * INTO v_red FROM public.promo_redemptions WHERE qr_code_token = p_token;
  IF v_red.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid token'); END IF;

  SELECT * INTO v_promo FROM public.merchant_promos WHERE id = v_red.promo_id;
  SELECT * INTO v_merchant FROM public.merchants WHERE id = v_promo.merchant_id;
  IF v_merchant.merchant_secret IS NULL OR v_merchant.merchant_secret <> p_secret THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid merchant secret');
  END IF;

  SELECT display_name INTO v_user_name FROM public.profiles WHERE user_id = v_red.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'already_confirmed', v_red.confirmed_at IS NOT NULL,
    'expired', now() > v_red.redeemed_at + interval '15 minutes',
    'user_name', COALESCE(v_user_name,'Fan'),
    'promo_title', v_promo.title,
    'promo_description', v_promo.description,
    'merchant_name', v_merchant.name
  );
END;
$$;

-- confirm_promo_redemption: bartender confirms
CREATE OR REPLACE FUNCTION public.confirm_promo_redemption(p_token text, p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_red public.promo_redemptions%ROWTYPE;
  v_promo public.merchant_promos%ROWTYPE;
  v_merchant public.merchants%ROWTYPE;
  v_user_name text;
BEGIN
  SELECT * INTO v_red FROM public.promo_redemptions WHERE qr_code_token = p_token;
  IF v_red.id IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF v_red.confirmed_at IS NOT NULL THEN RAISE EXCEPTION 'Already confirmed'; END IF;
  IF now() > v_red.redeemed_at + interval '15 minutes' THEN RAISE EXCEPTION 'Token expired'; END IF;

  SELECT * INTO v_promo FROM public.merchant_promos WHERE id = v_red.promo_id;
  SELECT * INTO v_merchant FROM public.merchants WHERE id = v_promo.merchant_id;

  IF v_merchant.merchant_secret IS NULL OR v_merchant.merchant_secret <> p_secret THEN
    RAISE EXCEPTION 'Invalid merchant secret';
  END IF;

  IF v_promo.max_redemptions IS NOT NULL AND v_promo.current_redemptions >= v_promo.max_redemptions THEN
    RAISE EXCEPTION 'Promo fully redeemed';
  END IF;

  UPDATE public.promo_redemptions SET confirmed_at = now() WHERE id = v_red.id;
  UPDATE public.merchant_promos SET current_redemptions = current_redemptions + 1 WHERE id = v_promo.id;

  SELECT display_name INTO v_user_name FROM public.profiles WHERE user_id = v_red.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'user_name', COALESCE(v_user_name,'Fan'),
    'promo_title', v_promo.title,
    'merchant_name', v_merchant.name
  );
END;
$$;
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_source ON public.waitlist(source);
CREATE INDEX idx_waitlist_email ON public.waitlist(email);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(source) BETWEEN 1 AND 64
  );
ALTER TABLE public.bar_checkins
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;
-- Priority 1: Fan Streak + Game Day Notifications schema
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fan_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date date,
  ADD COLUMN IF NOT EXISTS streak_freezes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_total_game_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS game_day_notifications boolean NOT NULL DEFAULT true;

-- Atomic streak update — returns the new state plus whether a reset happened.
CREATE OR REPLACE FUNCTION public.record_fan_streak_open(p_game_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_prev_date date;
  v_streak integer;
  v_freezes integer;
  v_total integer;
  v_reset boolean := false;
  v_used_freeze boolean := false;
  v_earned_freeze boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_game_date IS NULL THEN
    RAISE EXCEPTION 'game_date required';
  END IF;

  SELECT last_streak_date, fan_streak, streak_freezes, streak_total_game_days
    INTO v_prev_date, v_streak, v_freezes, v_total
    FROM public.profiles WHERE user_id = v_user FOR UPDATE;

  -- Already counted today
  IF v_prev_date = p_game_date THEN
    RETURN jsonb_build_object(
      'fan_streak', v_streak,
      'streak_freezes', v_freezes,
      'reset', false,
      'used_freeze', false,
      'earned_freeze', false,
      'already_counted', true
    );
  END IF;

  IF v_prev_date IS NULL THEN
    v_streak := 1;
  ELSIF v_prev_date = p_game_date - 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_prev_date = p_game_date - 2 AND v_freezes > 0 THEN
    v_streak := v_streak + 1;
    v_freezes := v_freezes - 1;
    v_used_freeze := true;
  ELSE
    v_streak := 1;
    v_reset := true;
  END IF;

  v_total := v_total + 1;

  -- Earn a freeze every 10 game-day opens (cap 3 banked)
  IF v_total > 0 AND v_total % 10 = 0 AND v_freezes < 3 THEN
    v_freezes := v_freezes + 1;
    v_earned_freeze := true;
  END IF;

  UPDATE public.profiles
     SET fan_streak = v_streak,
         streak_freezes = v_freezes,
         streak_total_game_days = v_total,
         last_streak_date = p_game_date
   WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'fan_streak', v_streak,
    'streak_freezes', v_freezes,
    'reset', v_reset,
    'used_freeze', v_used_freeze,
    'earned_freeze', v_earned_freeze,
    'already_counted', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_fan_streak_open(date) TO authenticated;

-- ============ FEATURE 5: activity_feed ============
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('checked_in','hosted_meetup','joined_meetup','attended_game')),
  location_zone text,
  context_text text,
  w_flag_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_feed_created_at_idx ON public.activity_feed (created_at DESC);
CREATE INDEX activity_feed_user_id_idx ON public.activity_feed (user_id);
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity feed readable by authenticated"
  ON public.activity_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own activity"
  ON public.activity_feed FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.react_w_flag(p_activity_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.activity_feed
     SET w_flag_count = w_flag_count + 1
   WHERE id = p_activity_id
  RETURNING w_flag_count INTO v_count;
  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_activity_meetup_hosted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, location_zone, context_text)
  VALUES (NEW.creator_id, 'hosted_meetup', NEW.location_name, NEW.location_name);
  RETURN NEW;
END; $$;
CREATE TRIGGER activity_meetup_hosted
AFTER INSERT ON public.lineup_meetups
FOR EACH ROW EXECUTE FUNCTION public.trg_activity_meetup_hosted();

CREATE OR REPLACE FUNCTION public.trg_activity_meetup_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_venue text;
BEGIN
  SELECT location_name INTO v_venue FROM public.lineup_meetups WHERE id = NEW.meetup_id;
  INSERT INTO public.activity_feed (user_id, activity_type, location_zone, context_text)
  VALUES (NEW.user_id, 'joined_meetup', v_venue, v_venue);
  RETURN NEW;
END; $$;
CREATE TRIGGER activity_meetup_joined
AFTER INSERT ON public.lineup_members
FOR EACH ROW EXECUTE FUNCTION public.trg_activity_meetup_joined();

CREATE OR REPLACE FUNCTION public.trg_activity_bar_checkin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, activity_type, location_zone, context_text)
  VALUES (NEW.user_id, 'checked_in', NEW.bar_name, NEW.bar_name);
  RETURN NEW;
END; $$;
CREATE TRIGGER activity_bar_checkin
AFTER INSERT ON public.bar_checkins
FOR EACH ROW EXECUTE FUNCTION public.trg_activity_bar_checkin();

-- ============ FEATURE 6: personal_crew (Close Friends) ============
CREATE TABLE public.personal_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  crew_member_user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, crew_member_user_id),
  CHECK (owner_user_id <> crew_member_user_id)
);
CREATE INDEX personal_crew_owner_idx ON public.personal_crew (owner_user_id);
ALTER TABLE public.personal_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own crew"
  ON public.personal_crew FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "Owner adds to own crew"
  ON public.personal_crew FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner removes from own crew"
  ON public.personal_crew FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE OR REPLACE FUNCTION public.add_to_personal_crew(p_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_count integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_user = p_member_id THEN RAISE EXCEPTION 'Cannot add yourself'; END IF;
  SELECT COUNT(*) INTO v_count FROM public.personal_crew WHERE owner_user_id = v_user;
  IF v_count >= 8 THEN RAISE EXCEPTION 'Crew is full (max 8)'; END IF;
  INSERT INTO public.personal_crew (owner_user_id, crew_member_user_id)
  VALUES (v_user, p_member_id)
  ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;

ALTER TABLE public.lineup_meetups ADD COLUMN IF NOT EXISTS crew_first boolean NOT NULL DEFAULT false;


-- 1. Hide merchant_secret column from anon & authenticated roles
REVOKE SELECT (merchant_secret) ON public.merchants FROM anon, authenticated, PUBLIC;

-- 2. crew_event_votes INSERT: require crew membership
DROP POLICY IF EXISTS "Members can vote" ON public.crew_event_votes;
CREATE POLICY "Members can vote"
ON public.crew_event_votes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.crew_event_options o
    JOIN public.crew_events e ON e.id = o.event_id
    WHERE o.id = crew_event_votes.option_id
      AND public.is_crew_member(auth.uid(), e.crew_id)
  )
);

-- 3. scoring_predictions INSERT: require session membership
DROP POLICY IF EXISTS "Users can create predictions" ON public.scoring_predictions;
CREATE POLICY "Users can create predictions"
ON public.scoring_predictions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.scoring_session_members m
    WHERE m.session_id = scoring_predictions.session_id
      AND m.user_id = auth.uid()
  )
);

-- 4. scoring_timeline INSERT: require session membership
DROP POLICY IF EXISTS "Members can add timeline events" ON public.scoring_timeline;
CREATE POLICY "Members can add timeline events"
ON public.scoring_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.scoring_session_members m
    WHERE m.session_id = scoring_timeline.session_id
      AND m.user_id = auth.uid()
  )
);

-- 5. scoring_reactions INSERT: require session membership
DROP POLICY IF EXISTS "Members can post reactions" ON public.scoring_reactions;
CREATE POLICY "Members can post reactions"
ON public.scoring_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.scoring_session_members m
    WHERE m.session_id = scoring_reactions.session_id
      AND m.user_id = auth.uid()
  )
);


-- 1. Private app_config schema for internal-only shared secrets
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.app_config FROM PUBLIC, anon, authenticated;

INSERT INTO private.app_config (key, value)
VALUES ('internal_webhook_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 2. SECURITY DEFINER helper so service-role edge functions can verify the secret
CREATE OR REPLACE FUNCTION public.verify_internal_secret(_secret text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE v_stored text;
BEGIN
  SELECT value INTO v_stored FROM private.app_config WHERE key = 'internal_webhook_secret';
  RETURN v_stored IS NOT NULL AND v_stored = _secret;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_internal_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_internal_secret(text) TO service_role;

-- 3. Update push trigger to send the internal secret header
CREATE OR REPLACE FUNCTION public.trigger_send_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  fn_url text := 'https://saqtmgjbuwimvxtrauvb.supabase.co/functions/v1/send-push';
  v_secret text;
BEGIN
  SELECT value INTO v_secret FROM private.app_config WHERE key = 'internal_webhook_secret';
  PERFORM extensions.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', COALESCE(v_secret, '')
    ),
    body    := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.body,
      'action_url', NEW.action_url,
      'emoji', NEW.emoji,
      'type', NEW.type
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- 4. User roles (separate table — never on profiles)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS game_day_intent text,
  ADD COLUMN IF NOT EXISTS intent_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS fan_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.lineup_meetups
  ADD COLUMN IF NOT EXISTS ground_control text;

ALTER TABLE public.flash_meetups
  ADD COLUMN IF NOT EXISTS ground_control text;

ALTER TABLE public.profiles
  ADD CONSTRAINT fan_tags_max_3 CHECK (array_length(fan_tags, 1) IS NULL OR array_length(fan_tags, 1) <= 3);

ALTER TABLE public.lineup_meetups
  ADD CONSTRAINT ground_control_max_120 CHECK (ground_control IS NULL OR char_length(ground_control) <= 120);

ALTER TABLE public.flash_meetups
  ADD CONSTRAINT flash_ground_control_max_120 CHECK (ground_control IS NULL OR char_length(ground_control) <= 120);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkin_bar text,
  ADD COLUMN IF NOT EXISTS checkin_section text,
  ADD COLUMN IF NOT EXISTS checkin_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_updated_at timestamptz;
CREATE OR REPLACE FUNCTION public.get_visible_checkins(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, checkin_bar text, checkin_section text, checkin_expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.checkin_bar,
    CASE
      WHEN p.checkin_expires_at IS NULL OR p.checkin_expires_at < now() THEN NULL
      ELSE p.checkin_section
    END AS checkin_section,
    CASE
      WHEN p.checkin_expires_at IS NULL OR p.checkin_expires_at < now() THEN NULL
      ELSE p.checkin_expires_at
    END AS checkin_expires_at
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id = ANY(p_user_ids)
    AND p.is_banned = false
    AND (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.status = 'matched'
          AND (
            (m.user_a = auth.uid() AND m.user_b = p.user_id) OR
            (m.user_b = auth.uid() AND m.user_a = p.user_id)
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.likes l
        WHERE l.from_user = auth.uid()
          AND l.to_user = p.user_id
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_visible_checkins(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_visible_checkins(uuid[]) TO authenticated;
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS attendance_frequency TEXT,
  ADD COLUMN IF NOT EXISTS primary_goal TEXT;
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT safety_reports_unique UNIQUE (reporter_id, reported_user_id, reason),
  CONSTRAINT safety_reports_no_self CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_safety_reports_reported ON public.safety_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter ON public.safety_reports(reporter_id);

GRANT SELECT, INSERT ON public.safety_reports TO authenticated;
GRANT ALL ON public.safety_reports TO service_role;

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can create their own reports"
  ON public.safety_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view their own reports"
  ON public.safety_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);
-- Add human-readable referral code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

-- Referrals attribution table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  new_user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their referrals" ON public.referrals;
CREATE POLICY "Users see their referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = new_user_id);

-- Inserts only via SECURITY DEFINER RPC below (no insert policy on purpose).

-- RPC: get or create my referral code (DAVID1234 style)
CREATE OR REPLACE FUNCTION public.get_or_create_my_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
  v_name text;
  v_base text;
  v_attempt int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT referral_code, display_name INTO v_code, v_name
    FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  IF v_code IS NOT NULL AND length(v_code) > 0 THEN
    RETURN v_code;
  END IF;

  v_base := upper(regexp_replace(COALESCE(v_name, ''), '[^a-zA-Z]', '', 'g'));
  IF v_base IS NULL OR length(v_base) < 3 THEN v_base := 'FAN'; END IF;
  IF length(v_base) > 10 THEN v_base := substr(v_base, 1, 10); END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := v_base || lpad((floor(random() * 10000))::int::text, 4, '0');
    BEGIN
      UPDATE public.profiles SET referral_code = v_code WHERE user_id = v_user;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt > 25 THEN RAISE EXCEPTION 'Could not generate unique referral code'; END IF;
    END;
  END LOOP;

  RETURN v_code;
END;
$$;

-- RPC: claim a referral code after signup
CREATE OR REPLACE FUNCTION public.claim_referral_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_referrer uuid;
  v_norm text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_code IS NULL THEN RETURN false; END IF;
  v_norm := upper(regexp_replace(p_code, '[^a-zA-Z0-9]', '', 'g'));
  IF length(v_norm) < 5 OR length(v_norm) > 30 THEN RETURN false; END IF;

  -- Don't re-attribute if already claimed
  IF EXISTS (SELECT 1 FROM public.referrals WHERE new_user_id = v_user) THEN
    RETURN false;
  END IF;

  SELECT user_id INTO v_referrer FROM public.profiles WHERE referral_code = v_norm;
  IF v_referrer IS NULL OR v_referrer = v_user THEN RETURN false; END IF;

  INSERT INTO public.referrals (referrer_user_id, new_user_id, referral_code)
  VALUES (v_referrer, v_user, v_norm)
  ON CONFLICT (new_user_id) DO NOTHING;

  RETURN true;
END;
$$;

-- RPC: count my referrals (for "You've invited X friends")
CREATE OR REPLACE FUNCTION public.get_my_referral_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.referrals WHERE referrer_user_id = auth.uid();
$$;

-- Leaderboard RPC functions (SECURITY DEFINER to aggregate across all users)

-- Top Fans: rank by total completed missions
CREATE OR REPLACE FUNCTION public.leaderboard_top_fans(_limit int DEFAULT 10)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  display_name text,
  profile_photo text,
  missions_completed bigint,
  points_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      mp.user_id,
      COUNT(*) FILTER (WHERE mp.completed) AS missions_completed,
      COALESCE(SUM(CASE WHEN mp.completed THEN m.points ELSE 0 END), 0) AS points_total
    FROM mission_progress mp
    JOIN missions m ON m.id = mp.mission_id
    GROUP BY mp.user_id
  )
  SELECT
    RANK() OVER (ORDER BY s.missions_completed DESC, s.points_total DESC) AS rank,
    s.user_id,
    COALESCE(p.display_name, 'Cubs Fan') AS display_name,
    p.profile_photo,
    s.missions_completed,
    s.points_total
  FROM stats s
  LEFT JOIN profiles p ON p.user_id = s.user_id
  WHERE s.missions_completed > 0
  ORDER BY rank
  LIMIT _limit;
$$;

-- Current user's fan rank (always returns 1 row if user has progress)
CREATE OR REPLACE FUNCTION public.leaderboard_my_fan_rank()
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  display_name text,
  profile_photo text,
  missions_completed bigint,
  points_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      mp.user_id,
      COUNT(*) FILTER (WHERE mp.completed) AS missions_completed,
      COALESCE(SUM(CASE WHEN mp.completed THEN m.points ELSE 0 END), 0) AS points_total
    FROM mission_progress mp
    JOIN missions m ON m.id = mp.mission_id
    GROUP BY mp.user_id
  ),
  ranked AS (
    SELECT
      RANK() OVER (ORDER BY s.missions_completed DESC, s.points_total DESC) AS rank,
      s.user_id,
      s.missions_completed,
      s.points_total
    FROM stats s
    WHERE s.missions_completed > 0
  )
  SELECT
    r.rank,
    r.user_id,
    COALESCE(p.display_name, 'You') AS display_name,
    p.profile_photo,
    r.missions_completed,
    r.points_total
  FROM ranked r
  LEFT JOIN profiles p ON p.user_id = r.user_id
  WHERE r.user_id = auth.uid();
$$;

-- Most Active Crews: rank by combined member bar_checkins this season (last 90d)
CREATE OR REPLACE FUNCTION public.leaderboard_top_crews(_limit int DEFAULT 10)
RETURNS TABLE(
  rank bigint,
  crew_id uuid,
  crew_name text,
  badge_emoji text,
  member_count bigint,
  checkin_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH crew_checkins AS (
    SELECT
      cm.crew_id,
      COUNT(DISTINCT cm.user_id) AS member_count,
      COUNT(bc.id) AS checkin_total
    FROM crew_members cm
    LEFT JOIN bar_checkins bc
      ON bc.user_id = cm.user_id
     AND bc.checked_in_at > now() - interval '90 days'
    GROUP BY cm.crew_id
  )
  SELECT
    RANK() OVER (ORDER BY cc.checkin_total DESC, cc.member_count DESC) AS rank,
    cc.crew_id,
    c.name AS crew_name,
    c.badge_emoji,
    cc.member_count,
    cc.checkin_total
  FROM crew_checkins cc
  JOIN crews c ON c.id = cc.crew_id
  ORDER BY rank
  LIMIT _limit;
$$;

-- Current user's crew rank (best crew if user belongs to multiple)
CREATE OR REPLACE FUNCTION public.leaderboard_my_crew_rank()
RETURNS TABLE(
  rank bigint,
  crew_id uuid,
  crew_name text,
  badge_emoji text,
  member_count bigint,
  checkin_total bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH crew_checkins AS (
    SELECT
      cm.crew_id,
      COUNT(DISTINCT cm.user_id) AS member_count,
      COUNT(bc.id) AS checkin_total
    FROM crew_members cm
    LEFT JOIN bar_checkins bc
      ON bc.user_id = cm.user_id
     AND bc.checked_in_at > now() - interval '90 days'
    GROUP BY cm.crew_id
  ),
  ranked AS (
    SELECT
      RANK() OVER (ORDER BY cc.checkin_total DESC, cc.member_count DESC) AS rank,
      cc.*
    FROM crew_checkins cc
  )
  SELECT
    r.rank,
    r.crew_id,
    c.name AS crew_name,
    c.badge_emoji,
    r.member_count,
    r.checkin_total
  FROM ranked r
  JOIN crews c ON c.id = r.crew_id
  WHERE r.crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  ORDER BY r.rank
  LIMIT 1;
$$;

-- Bar Champions: most checked-into bars this week
CREATE OR REPLACE FUNCTION public.leaderboard_top_bars(_limit int DEFAULT 10)
RETURNS TABLE(
  rank bigint,
  bar_name text,
  checkin_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    RANK() OVER (ORDER BY COUNT(*) DESC) AS rank,
    bc.bar_name,
    COUNT(*) AS checkin_count
  FROM bar_checkins bc
  WHERE bc.checked_in_at > now() - interval '7 days'
    AND bc.visibility = 'visible'
  GROUP BY bc.bar_name
  ORDER BY rank
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_top_fans(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_my_fan_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_top_crews(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_my_crew_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_top_bars(int) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.leaderboard_top_fans(int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leaderboard_my_fan_rank() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leaderboard_top_crews(int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leaderboard_my_crew_rank() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leaderboard_top_bars(int) FROM PUBLIC, anon;


ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_season_ticket_holder boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_sth ON public.profiles(is_season_ticket_holder) WHERE is_season_ticket_holder = true;


DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[], uuid[], text, boolean, integer);

CREATE OR REPLACE FUNCTION public.get_public_profiles(
  p_user_ids uuid[] DEFAULT NULL::uuid[],
  p_exclude_ids uuid[] DEFAULT NULL::uuid[],
  p_game_status text DEFAULT NULL::text,
  p_only_onboarded boolean DEFAULT false,
  p_limit integer DEFAULT 200
)
RETURNS TABLE(
  id uuid, user_id uuid, display_name text, profile_photo text, age integer, pronouns text,
  bio text, intent text[], favorite_moment text, favorite_player text, game_status text,
  wrigley_section text, wrigley_row text, wrigley_seat text, wrigleyville_bar text,
  fan_style text[], gameday_intents text[], vibe_state text, vibe_emoji text,
  fan_tier text, fan_xp integer, fan_title text, fan_tier_emoji text, gameday_persona text,
  superstition text, stretch_song text, best_bar text,
  is_verified boolean, is_season_ticket_holder boolean, is_banned boolean,
  onboarding_completed boolean,
  created_at timestamp with time zone, updated_at timestamp with time zone,
  location_last_set_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.profile_photo, p.age, p.pronouns,
    p.bio, p.intent, p.favorite_moment, p.favorite_player, p.game_status,
    p.wrigley_section, p.wrigley_row, p.wrigley_seat, p.wrigleyville_bar,
    p.fan_style, p.gameday_intents, p.vibe_state, p.vibe_emoji,
    p.fan_tier, p.fan_xp, p.fan_title, p.fan_tier_emoji, p.gameday_persona,
    p.superstition, p.stretch_song, p.best_bar,
    p.is_verified, p.is_season_ticket_holder, p.is_banned,
    p.onboarding_completed, p.created_at, p.updated_at, p.location_last_set_at
  FROM public.profiles p
  WHERE (p_user_ids IS NULL OR p.user_id = ANY(p_user_ids))
    AND (p_exclude_ids IS NULL OR NOT (p.user_id = ANY(p_exclude_ids)))
    AND (p_game_status IS NULL OR p.game_status = p_game_status)
    AND (NOT p_only_onboarded OR p.onboarding_completed = true)
    AND COALESCE(p.is_banned, false) = false
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[], uuid[], text, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[], uuid[], text, boolean, integer) TO authenticated;

CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  game_label TEXT NOT NULL,
  game_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_attendees INTEGER NOT NULL DEFAULT 20,
  rsvps UUID[] NOT NULL DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_parties TO authenticated;
GRANT ALL ON public.watch_parties TO service_role;

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view watch parties"
ON public.watch_parties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can host watch parties"
ON public.watch_parties FOR INSERT TO authenticated
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update own watch party"
ON public.watch_parties FOR UPDATE TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Attendees can RSVP toggle"
ON public.watch_parties FOR UPDATE TO authenticated
USING (auth.uid() = ANY(rsvps) OR true)
WITH CHECK (true);

CREATE POLICY "Host can delete own watch party"
ON public.watch_parties FOR DELETE TO authenticated
USING (auth.uid() = host_id);

CREATE INDEX idx_watch_parties_start_time ON public.watch_parties(start_time);

CREATE OR REPLACE FUNCTION public.toggle_watch_party_rsvp(_party_id UUID)
RETURNS public.watch_parties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _row public.watch_parties;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _row FROM public.watch_parties WHERE id = _party_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Watch party not found';
  END IF;

  IF _uid = ANY(_row.rsvps) THEN
    UPDATE public.watch_parties
      SET rsvps = array_remove(rsvps, _uid), updated_at = now()
      WHERE id = _party_id
      RETURNING * INTO _row;
  ELSE
    IF array_length(_row.rsvps, 1) IS NOT NULL AND array_length(_row.rsvps, 1) >= _row.max_attendees THEN
      RAISE EXCEPTION 'Watch party is full';
    END IF;
    UPDATE public.watch_parties
      SET rsvps = array_append(rsvps, _uid), updated_at = now()
      WHERE id = _party_id
      RETURNING * INTO _row;
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_watch_party_rsvp(UUID) TO authenticated;

CREATE TRIGGER update_watch_parties_updated_at
BEFORE UPDATE ON public.watch_parties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.bar_partners_waitlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    offer_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bar_partners_waitlist TO anon;
GRANT SELECT, INSERT ON public.bar_partners_waitlist TO authenticated;
GRANT ALL ON public.bar_partners_waitlist TO service_role;

ALTER TABLE public.bar_partners_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner interest"
ON public.bar_partners_waitlist
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view own submissions"
ON public.bar_partners_waitlist
FOR SELECT
TO public
USING (true);
-- Add rooftop support fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS planned_location_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS planned_location_venue text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS checkin_rooftop text;

ALTER TABLE public.bar_partners_waitlist ADD COLUMN IF NOT EXISTS partner_type text NOT NULL DEFAULT 'bar';
ALTER TABLE public.bar_partners_waitlist ADD COLUMN IF NOT EXISTS capacity integer;
DROP POLICY IF EXISTS "Attendees can RSVP toggle" ON public.watch_parties;

-- 1. activity_feed: tighten SELECT, add SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Activity feed readable by authenticated" ON public.activity_feed;
CREATE POLICY "Users view own activity rows"
  ON public.activity_feed FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_activity_feed(p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  activity_type text,
  context_text text,
  location_zone text,
  w_flag_count int,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, activity_type, context_text, location_zone, w_flag_count, created_at
  FROM public.activity_feed
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(p_limit, 20), 100));
$$;
REVOKE ALL ON FUNCTION public.get_activity_feed(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_activity_feed(int) TO authenticated;

-- 2. bar_partners_waitlist: admin-only SELECT
DROP POLICY IF EXISTS "Users can view own submissions" ON public.bar_partners_waitlist;
CREATE POLICY "Admins can view waitlist submissions"
  ON public.bar_partners_waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. scoring_entries: require session membership on INSERT
DROP POLICY IF EXISTS "Members can create entries" ON public.scoring_entries;
CREATE POLICY "Members can create entries"
  ON public.scoring_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.scoring_session_members
      WHERE session_id = scoring_entries.session_id
        AND user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.get_active_fan_count_7d()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.profiles
  WHERE is_banned = false
    AND onboarding_completed = true
    AND location_last_set_at >= now() - interval '7 days';
$$;

REVOKE ALL ON FUNCTION public.get_active_fan_count_7d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_fan_count_7d() TO anon, authenticated, service_role;
