
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
