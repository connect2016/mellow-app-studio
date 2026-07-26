-- Data-hygiene bug: some buddy_requests rows land in status='accepted' (or
-- 'declined') with responded_at still NULL. say_hi_to_buddy()'s auto-accept
-- branch always sets responded_at explicitly, but useRespondToRequest()
-- (Dugout's Accept/Decline buttons, RecruitButton's "Accept Recruit") does a
-- bare client-side `.update({ status })` with no responded_at.
--
-- teammate_requests used to have a BEFORE UPDATE trigger
-- (notify_teammate_accepted / teammate_request_accepted) that stamped
-- responded_at on every pending->accepted transition, which covered this for
-- free. When the app repointed onto buddy_requests, that trigger was never
-- recreated on the new table — only the notification insert survived, via
-- notify_buddy_accepted (AFTER UPDATE, no responded_at side effect). So
-- buddy_requests has had no table-level backstop since.
--
-- Fix at the lowest common layer instead of patching call sites: a BEFORE
-- UPDATE trigger that stamps responded_at on any pending->accepted or
-- pending->declined transition, if it isn't already set. This is a no-op for
-- say_hi_to_buddy (which already sets responded_at in the same UPDATE, so the
-- IS NULL guard skips it) and closes the gap for the client-side path and any
-- future direct-update caller.
CREATE OR REPLACE FUNCTION public.stamp_buddy_request_responded_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $func$
BEGIN
  IF NEW.status IN ('accepted', 'declined') AND OLD.status = 'pending' AND NEW.responded_at IS NULL THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_buddy_requests_stamp_responded_at ON public.buddy_requests;
CREATE TRIGGER trg_buddy_requests_stamp_responded_at
  BEFORE UPDATE ON public.buddy_requests
  FOR EACH ROW EXECUTE FUNCTION public.stamp_buddy_request_responded_at();

-- One-time backfill for existing accepted/declined rows with a NULL
-- responded_at. updated_at is the best available proxy: trg_buddy_requests_
-- updated_at stamps it on every UPDATE regardless of which columns changed,
-- so for a row that transitioned via the buggy path, updated_at holds the
-- timestamp of that status change. created_at would be wrong — that's the
-- original request-sent time, not the accept/decline time.
UPDATE public.buddy_requests
   SET responded_at = updated_at
 WHERE status IN ('accepted', 'declined')
   AND responded_at IS NULL;
