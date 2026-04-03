
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
