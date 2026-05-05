-- 1) Add new profile fields used by Discover Fans filters
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_gate text,
  ADD COLUMN IF NOT EXISTS vibe_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS watch_locations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS zip_code text;

CREATE INDEX IF NOT EXISTS idx_profiles_vibe_tags ON public.profiles USING GIN (vibe_tags);
CREATE INDEX IF NOT EXISTS idx_profiles_watch_locations ON public.profiles USING GIN (watch_locations);
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_gate ON public.profiles (favorite_gate);

-- 2) Buddy requests table (separate from teammate_requests, per spec)
CREATE TABLE IF NOT EXISTS public.buddy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT buddy_requests_no_self CHECK (requester_id <> recipient_id),
  CONSTRAINT buddy_requests_status_chk CHECK (status IN ('pending','accepted','declined')),
  CONSTRAINT buddy_requests_unique_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_buddy_requests_recipient ON public.buddy_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_requester ON public.buddy_requests(requester_id, status);

ALTER TABLE public.buddy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their buddy requests"
  ON public.buddy_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users create buddy requests they send"
  ON public.buddy_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipient or requester can update"
  ON public.buddy_requests FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

CREATE POLICY "Requester can cancel"
  ON public.buddy_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id);

CREATE TRIGGER trg_buddy_requests_updated_at
  BEFORE UPDATE ON public.buddy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Atomic "Say Hi" RPC: handles new request, auto-accept on mutual, and idempotent re-send
CREATE OR REPLACE FUNCTION public.say_hi_to_buddy(p_recipient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing record;
  v_reverse record;
  v_conv_id uuid;
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_user THEN
    RAISE EXCEPTION 'Invalid recipient' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_recipient_id AND is_banned = false) THEN
    RAISE EXCEPTION 'Recipient not available' USING ERRCODE = '22023';
  END IF;

  -- Reverse pending request? auto-accept and open chat
  SELECT * INTO v_reverse FROM public.buddy_requests
   WHERE requester_id = p_recipient_id AND recipient_id = v_user AND status = 'pending'
   LIMIT 1;

  IF v_reverse.id IS NOT NULL THEN
    UPDATE public.buddy_requests
       SET status = 'accepted', responded_at = now(), updated_at = now()
     WHERE id = v_reverse.id;

    IF v_user < p_recipient_id THEN v_user_a := v_user; v_user_b := p_recipient_id;
    ELSE v_user_a := p_recipient_id; v_user_b := v_user; END IF;

    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (v_user_a, v_user_b)
    ON CONFLICT (participant_a, participant_b) DO UPDATE SET last_message_at = now()
    RETURNING id INTO v_conv_id;

    IF v_conv_id IS NULL THEN
      SELECT id INTO v_conv_id FROM public.conversations
       WHERE participant_a = v_user_a AND participant_b = v_user_b LIMIT 1;
    END IF;

    RETURN jsonb_build_object('result', 'accepted', 'conversation_id', v_conv_id);
  END IF;

  -- Existing connection? open chat
  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE ((requester_id = v_user AND recipient_id = p_recipient_id)
       OR (requester_id = p_recipient_id AND recipient_id = v_user))
     AND status = 'accepted'
   LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    IF v_user < p_recipient_id THEN v_user_a := v_user; v_user_b := p_recipient_id;
    ELSE v_user_a := p_recipient_id; v_user_b := v_user; END IF;

    INSERT INTO public.conversations (participant_a, participant_b)
    VALUES (v_user_a, v_user_b)
    ON CONFLICT (participant_a, participant_b) DO NOTHING;

    SELECT id INTO v_conv_id FROM public.conversations
     WHERE participant_a = v_user_a AND participant_b = v_user_b LIMIT 1;

    RETURN jsonb_build_object('result', 'already_connected', 'conversation_id', v_conv_id);
  END IF;

  -- Outgoing pending? noop
  SELECT * INTO v_existing FROM public.buddy_requests
   WHERE requester_id = v_user AND recipient_id = p_recipient_id AND status = 'pending'
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('result', 'already_sent', 'request_id', v_existing.id);
  END IF;

  -- Otherwise, create new pending request (handle prior declined row)
  INSERT INTO public.buddy_requests (requester_id, recipient_id, status)
  VALUES (v_user, p_recipient_id, 'pending')
  ON CONFLICT (requester_id, recipient_id) DO UPDATE
    SET status = 'pending', updated_at = now(), responded_at = NULL
  RETURNING id INTO v_existing.id;

  -- Notify recipient
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

  RETURN jsonb_build_object('result', 'sent', 'request_id', v_existing.id);
END;
$$;