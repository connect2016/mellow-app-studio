-- Consolidate user_reports / safety_reports into a single canonical table.
--
-- user_reports already drives the auto_shadow_ban trigger (real consequence);
-- safety_reports has no downstream effect at all and is redundant. Adopt
-- safety_reports' better unique-constraint shape (allows re-reporting the same
-- person for a different reason) onto user_reports, migrate any existing
-- safety_reports rows over, then drop safety_reports.

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_reporter_id_reported_user_id_key;

ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_unique UNIQUE (reporter_id, reported_user_id, reason);

ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_no_self CHECK (reporter_id <> reported_user_id);

INSERT INTO public.user_reports (reporter_id, reported_user_id, reason, details, status, created_at)
SELECT reporter_id, reported_user_id, reason, details, status, created_at
FROM public.safety_reports
ON CONFLICT (reporter_id, reported_user_id, reason) DO NOTHING;

DROP TABLE public.safety_reports;
