
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
