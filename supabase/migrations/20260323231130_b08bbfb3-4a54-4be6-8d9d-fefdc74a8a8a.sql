
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
