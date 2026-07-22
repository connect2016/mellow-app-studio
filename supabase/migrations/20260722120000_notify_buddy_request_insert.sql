-- Notify recipients of new buddy/recruit requests regardless of entry point.
--
-- Until now only say_hi_to_buddy manually inserted a notification; direct
-- inserts into buddy_requests (RecruitButton, RecruitPicker) produced none,
-- so recipients never learned about recruit requests unless they visited
-- their Dugout. Move the notification into an AFTER INSERT trigger so every
-- new pending request notifies, and strip the manual insert from
-- say_hi_to_buddy so the Say Hi path doesn't double-fire.

CREATE OR REPLACE FUNCTION public.notify_buddy_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' AND public.notification_allowed(NEW.recipient_id, 'buddy_request') THEN
    SELECT display_name INTO requester_name FROM public.profiles WHERE user_id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.recipient_id,
      'buddy_request',
      'New recruit request!',
      COALESCE(NULLIF(requester_name, ''), 'A fan') || ' wants to join your team. Tap to visit your Dugout.',
      '⚾',
      '/dugout',
      jsonb_build_object('request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS buddy_request_created ON public.buddy_requests;
CREATE TRIGGER buddy_request_created
  AFTER INSERT ON public.buddy_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_buddy_request();

-- Recreate say_hi_to_buddy WITHOUT its manual notification insert
-- (the trigger above now covers it).
CREATE OR REPLACE FUNCTION public.say_hi_to_buddy(p_recipient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing public.buddy_requests%ROWTYPE;
  v_incoming public.buddy_requests%ROWTYPE;
  v_conv_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_user = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot send a buddy request to yourself';
  END IF;

  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE ((requester_id = v_user AND recipient_id = p_recipient_id)
       OR (requester_id = p_recipient_id AND recipient_id = v_user))
     AND status = 'accepted'
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    SELECT id INTO v_conv_id FROM public.conversations
     WHERE (participant_a = v_user AND participant_b = p_recipient_id)
        OR (participant_a = p_recipient_id AND participant_b = v_user)
     LIMIT 1;
    IF v_conv_id IS NULL THEN
      INSERT INTO public.conversations (participant_a, participant_b)
      VALUES (LEAST(v_user, p_recipient_id), GREATEST(v_user, p_recipient_id))
      RETURNING id INTO v_conv_id;
    END IF;
    RETURN jsonb_build_object('result', 'already_connected', 'conversation_id', v_conv_id);
  END IF;

  SELECT * INTO v_incoming FROM public.buddy_requests
   WHERE requester_id = p_recipient_id AND recipient_id = v_user AND status = 'pending'
   LIMIT 1;
  IF v_incoming.id IS NOT NULL THEN
    UPDATE public.buddy_requests
       SET status = 'accepted', responded_at = now(), updated_at = now()
     WHERE id = v_incoming.id;
    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (LEAST(v_user, p_recipient_id), GREATEST(v_user, p_recipient_id))
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_conv_id FROM public.conversations
     WHERE (participant_a = LEAST(v_user, p_recipient_id) AND participant_b = GREATEST(v_user, p_recipient_id))
     LIMIT 1;
    RETURN jsonb_build_object('result', 'auto_accepted', 'conversation_id', v_conv_id);
  END IF;

  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE requester_id = v_user AND recipient_id = p_recipient_id AND status = 'pending'
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('result', 'already_sent', 'request_id', v_existing.id);
  END IF;

  INSERT INTO public.buddy_requests (requester_id, recipient_id, status)
  VALUES (v_user, p_recipient_id, 'pending')
  ON CONFLICT (requester_id, recipient_id) DO UPDATE
    SET status = 'pending', updated_at = now(), responded_at = NULL
  RETURNING id INTO v_existing.id;

  RETURN jsonb_build_object('result', 'sent', 'request_id', v_existing.id);
END;
$$;
