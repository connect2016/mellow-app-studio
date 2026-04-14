
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
