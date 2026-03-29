
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
