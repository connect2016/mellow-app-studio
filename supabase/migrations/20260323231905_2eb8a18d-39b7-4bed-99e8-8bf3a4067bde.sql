
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
