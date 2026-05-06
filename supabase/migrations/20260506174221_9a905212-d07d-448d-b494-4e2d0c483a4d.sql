DROP FUNCTION IF EXISTS public.notification_category(text);
DROP FUNCTION IF EXISTS public.notification_allowed(uuid, text);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb
    NOT NULL
    DEFAULT '{"buddies": true, "beers": true, "meetups": true, "vibes": true, "gameday": true}'::jsonb;

CREATE OR REPLACE FUNCTION public.notification_category(p_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_type IN ('buddy_request','buddy_accepted','teammate_request','teammate_accepted','match') THEN 'buddies'
    WHEN p_type IN ('beer_received') THEN 'beers'
    WHEN p_type IN ('meetup','meetup_created','meetup_joined','meetup_nearby') THEN 'meetups'
    WHEN p_type IN ('vibe_mention','vibe_reaction') THEN 'vibes'
    WHEN p_type IN (
      'game_reminder','crew_active','fans_active','section_active','post_game',
      'fellow_bar_gather','section_buddies','new_fan_nearby','wrigleyville_buzz',
      'almost_first_pitch','food_pregame','food_postgame','weather'
    ) THEN 'gameday'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.notification_allowed(p_user_id uuid, p_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs jsonb;
  v_cat text;
BEGIN
  v_cat := public.notification_category(p_type);
  IF v_cat IS NULL THEN
    RETURN true;
  END IF;
  SELECT notification_preferences INTO v_prefs FROM public.profiles WHERE user_id = p_user_id;
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;
  RETURN COALESCE((v_prefs ->> v_cat)::boolean, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_teammate_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' AND public.notification_allowed(NEW.recipient_id, 'teammate_request') THEN
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

CREATE OR REPLACE FUNCTION public.notify_teammate_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  recipient_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    IF public.notification_allowed(NEW.requester_id, 'teammate_accepted') THEN
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
    END IF;
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION public.notify_buddy_accepted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  recipient_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending'
     AND public.notification_allowed(NEW.requester_id, 'buddy_accepted') THEN
    SELECT display_name INTO recipient_name FROM public.profiles WHERE user_id = NEW.recipient_id;
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      NEW.requester_id,
      'buddy_accepted',
      'You got a new buddy!',
      COALESCE(NULLIF(recipient_name, ''), 'A fan') || ' said hi back. Tap to start chatting.',
      '🤝',
      '/messages',
      jsonb_build_object('buddy_id', NEW.recipient_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS buddy_request_accepted ON public.buddy_requests;
CREATE TRIGGER buddy_request_accepted
  AFTER UPDATE ON public.buddy_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_buddy_accepted();

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

  IF public.notification_allowed(p_recipient_id, 'buddy_request') THEN
    INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
    VALUES (
      p_recipient_id,
      'buddy_request',
      'A fan said hi!',
      'Tap to view their card and say hi back.',
      '👋',
      '/discover-fans',
      jsonb_build_object('request_id', v_existing.id, 'requester_id', v_user)
    );
  END IF;

  RETURN jsonb_build_object('result', 'sent', 'request_id', v_existing.id);
END;
$$;