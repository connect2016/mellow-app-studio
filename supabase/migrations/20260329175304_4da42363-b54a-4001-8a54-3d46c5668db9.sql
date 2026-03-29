
-- User reports table
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'non_fan_behavior',
  details text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(reporter_id, reported_user_id)
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.user_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view own reports
CREATE POLICY "Users can view own reports"
  ON public.user_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Auto shadow-ban trigger: when a user gets 3+ reports, set hidden_from_discover = true (shadow ban)
CREATE OR REPLACE FUNCTION public.auto_shadow_ban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_count integer;
BEGIN
  SELECT count(*) INTO report_count
  FROM public.user_reports
  WHERE reported_user_id = NEW.reported_user_id
    AND status = 'pending';

  IF report_count >= 3 THEN
    UPDATE public.profiles
    SET hidden_from_discover = true
    WHERE user_id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_shadow_ban
  AFTER INSERT ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_shadow_ban();
