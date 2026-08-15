-- Client-side block filtering can be bypassed by a determined client, so
-- sending a direct message to (or from) a blocked counterpart must also be
-- rejected server-side. Looks up the other participant in the conversation
-- and checks them against the sender's mutual blocked-pair set.

CREATE OR REPLACE FUNCTION public.prevent_blocked_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_other uuid;
BEGIN
  SELECT CASE WHEN c.participant_a = NEW.sender THEN c.participant_b ELSE c.participant_a END
    INTO v_other
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_other IS NOT NULL AND v_other = ANY(public.get_blocked_pair_ids(NEW.sender)) THEN
    RAISE EXCEPTION 'Cannot message a blocked user' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_blocked_message ON public.messages;
CREATE TRIGGER trg_prevent_blocked_message
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_blocked_message();
