CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT safety_reports_unique UNIQUE (reporter_id, reported_user_id, reason),
  CONSTRAINT safety_reports_no_self CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_safety_reports_reported ON public.safety_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter ON public.safety_reports(reporter_id);

GRANT SELECT, INSERT ON public.safety_reports TO authenticated;
GRANT ALL ON public.safety_reports TO service_role;

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can create their own reports"
  ON public.safety_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view their own reports"
  ON public.safety_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);