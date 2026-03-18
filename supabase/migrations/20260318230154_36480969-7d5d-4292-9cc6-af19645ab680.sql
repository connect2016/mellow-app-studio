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