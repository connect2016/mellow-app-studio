CREATE TABLE public.beer_shoutouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id uuid NOT NULL UNIQUE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  credits integer NOT NULL,
  message text,
  is_auto_generated boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_beer_shoutouts_created ON public.beer_shoutouts (created_at DESC);
CREATE INDEX idx_beer_shoutouts_expires ON public.beer_shoutouts (expires_at);
CREATE INDEX idx_beer_shoutouts_sender ON public.beer_shoutouts (sender_id);
CREATE INDEX idx_beer_shoutouts_recipient ON public.beer_shoutouts (recipient_id);

ALTER TABLE public.beer_shoutouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view shoutouts"
  ON public.beer_shoutouts FOR SELECT
  TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.beer_shoutouts;

CREATE OR REPLACE FUNCTION public.get_beer_buyer_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.beer_tips WHERE sender_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.send_beer_tip(p_recipient_id uuid, p_credits integer, p_message text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender uuid := auth.uid();
  v_today_total integer;
  v_balance integer;
  v_sender_name text;
  v_tip_id uuid;
  v_shoutout_id uuid;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender THEN
    RAISE EXCEPTION 'Cannot tip yourself' USING ERRCODE = '22023';
  END IF;
  IF p_credits IS NULL OR p_credits < 500 OR p_credits > 2500 THEN
    RAISE EXCEPTION 'Tip must be between 500 and 2500 credits' USING ERRCODE = '22023';
  END IF;
  IF p_message IS NOT NULL AND char_length(p_message) > 100 THEN
    RAISE EXCEPTION 'Message too long' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_recipient_id AND is_banned = false) THEN
    RAISE EXCEPTION 'Recipient not found' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(SUM(credits), 0) INTO v_today_total
    FROM public.beer_tips
   WHERE sender_id = v_sender AND created_at > now() - interval '24 hours';
  IF v_today_total + p_credits > 5000 THEN
    RAISE EXCEPTION 'Daily tip limit reached (5000 credits per 24h)' USING ERRCODE = '22023';
  END IF;

  SELECT credits INTO v_balance FROM public.beer_money_balances WHERE user_id = v_sender FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient Beer Money' USING ERRCODE = '22023';
  END IF;

  UPDATE public.beer_money_balances
     SET credits = credits - p_credits, updated_at = now()
   WHERE user_id = v_sender;

  INSERT INTO public.beer_money_balances (user_id, credits)
  VALUES (p_recipient_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.beer_money_balances.credits + EXCLUDED.credits,
        updated_at = now();

  INSERT INTO public.beer_tips (sender_id, recipient_id, credits, message)
  VALUES (v_sender, p_recipient_id, p_credits, p_message)
  RETURNING id INTO v_tip_id;

  INSERT INTO public.beer_shoutouts (tip_id, sender_id, recipient_id, credits, message, is_auto_generated)
  VALUES (v_tip_id, v_sender, p_recipient_id, p_credits, p_message, true)
  RETURNING id INTO v_shoutout_id;

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = v_sender;
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_recipient_id,
    'beer_received',
    COALESCE(NULLIF(v_sender_name, ''), 'A fan') || ' bought you a beer!',
    COALESCE(NULLIF(p_message, ''), 'Enjoy the game!'),
    '🍺',
    '/vibe?shoutout=' || v_shoutout_id::text,
    jsonb_build_object(
      'tip_id', v_tip_id,
      'shoutout_id', v_shoutout_id,
      'sender_id', v_sender,
      'credits', p_credits,
      'message', p_message
    )
  );

  RETURN v_tip_id;
END;
$function$;