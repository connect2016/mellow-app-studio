CREATE TABLE public.teammate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT teammate_requests_no_self CHECK (requester_id <> recipient_id),
  CONSTRAINT teammate_requests_status_chk CHECK (status IN ('pending','accepted','declined','cancelled'))
);

CREATE UNIQUE INDEX teammate_requests_pair_unique
  ON public.teammate_requests (
    LEAST(requester_id, recipient_id),
    GREATEST(requester_id, recipient_id)
  )
  WHERE status IN ('pending','accepted');

CREATE INDEX teammate_requests_recipient_idx ON public.teammate_requests (recipient_id, status);
CREATE INDEX teammate_requests_requester_idx ON public.teammate_requests (requester_id, status);

ALTER TABLE public.teammate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own teammate rows"
  ON public.teammate_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send teammate requests"
  ON public.teammate_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Recipient or requester can update"
  ON public.teammate_requests FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Either party can remove the bond"
  ON public.teammate_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE TRIGGER teammate_requests_updated_at
  BEFORE UPDATE ON public.teammate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_teammate_ids(_user_id uuid)
RETURNS TABLE(teammate_id uuid, since timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT
    CASE WHEN tr.requester_id = _user_id THEN tr.recipient_id ELSE tr.requester_id END AS teammate_id,
    COALESCE(tr.responded_at, tr.updated_at) AS since
  FROM public.teammate_requests tr
  WHERE tr.status = 'accepted'
    AND (tr.requester_id = _user_id OR tr.recipient_id = _user_id);
$func$;

CREATE OR REPLACE FUNCTION public.notify_teammate_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT display_name INTO requester_name FROM public.profiles WHERE user_id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.recipient_id,
      'teammate_request',
      'New Teammate Request',
      COALESCE(NULLIF(requester_name, ''), 'A fan') || ' wants to add you to their team.',
      '🧢',
      '/dugout',
      jsonb_build_object('request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER teammate_request_notify
  AFTER INSERT ON public.teammate_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_teammate_request();

CREATE OR REPLACE FUNCTION public.notify_teammate_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  recipient_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT display_name INTO recipient_name FROM public.profiles WHERE user_id = NEW.recipient_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.requester_id,
      'teammate_accepted',
      'New Teammate joined your roster!',
      COALESCE(NULLIF(recipient_name, ''), 'A fan') || ' is on your team.',
      '🤝',
      '/dugout',
      jsonb_build_object('request_id', NEW.id, 'teammate_id', NEW.recipient_id)
    );
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER teammate_request_accepted
  BEFORE UPDATE ON public.teammate_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_teammate_accepted();