
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
