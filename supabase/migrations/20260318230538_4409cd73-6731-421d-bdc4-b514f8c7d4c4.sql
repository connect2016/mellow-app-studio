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