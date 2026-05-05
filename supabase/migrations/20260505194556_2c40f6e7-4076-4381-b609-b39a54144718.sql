-- 1. phone_verified on profiles (no enforcement yet)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

-- 2. beer_money_balances
CREATE TABLE IF NOT EXISTS public.beer_money_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.beer_money_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own balance"
  ON public.beer_money_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies → only SECURITY DEFINER RPCs can write.

-- 3. credit_purchases (Stripe top-ups)
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE,
  price_id text NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.credit_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON public.credit_purchases(user_id, created_at DESC);

-- 4. beer_tips (immutable)
CREATE TABLE IF NOT EXISTS public.beer_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL CHECK (credits BETWEEN 500 AND 2500),
  message text CHECK (message IS NULL OR char_length(message) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_tip CHECK (sender_id <> recipient_id)
);
ALTER TABLE public.beer_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender or recipient can view tip"
  ON public.beer_tips FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
-- No INSERT/UPDATE/DELETE → tips only created via RPC.

CREATE INDEX IF NOT EXISTS idx_beer_tips_sender ON public.beer_tips(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beer_tips_recipient ON public.beer_tips(recipient_id, created_at DESC);

-- 5. send_beer_tip RPC (atomic debit/credit/notify)
CREATE OR REPLACE FUNCTION public.send_beer_tip(
  p_recipient_id uuid,
  p_credits integer,
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_today_total integer;
  v_balance integer;
  v_sender_name text;
  v_tip_id uuid;
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

  -- Daily cap: 5000 credits sent in last 24h
  SELECT COALESCE(SUM(credits), 0) INTO v_today_total
    FROM public.beer_tips
   WHERE sender_id = v_sender AND created_at > now() - interval '24 hours';
  IF v_today_total + p_credits > 5000 THEN
    RAISE EXCEPTION 'Daily tip limit reached (5000 credits per 24h)' USING ERRCODE = '22023';
  END IF;

  -- Lock + check balance
  SELECT credits INTO v_balance FROM public.beer_money_balances WHERE user_id = v_sender FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient Beer Money' USING ERRCODE = '22023';
  END IF;
  IF v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient Beer Money' USING ERRCODE = '22023';
  END IF;

  -- Debit sender
  UPDATE public.beer_money_balances
     SET credits = credits - p_credits, updated_at = now()
   WHERE user_id = v_sender;

  -- Credit recipient (upsert)
  INSERT INTO public.beer_money_balances (user_id, credits)
  VALUES (p_recipient_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.beer_money_balances.credits + EXCLUDED.credits,
        updated_at = now();

  -- Record tip
  INSERT INTO public.beer_tips (sender_id, recipient_id, credits, message)
  VALUES (v_sender, p_recipient_id, p_credits, p_message)
  RETURNING id INTO v_tip_id;

  -- Notify
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = v_sender;
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_recipient_id,
    'beer_received',
    COALESCE(NULLIF(v_sender_name, ''), 'A fan') || ' bought you a beer!',
    'You got ' || p_credits || ' Beer Money' || COALESCE(' — "' || p_message || '"', ''),
    '🍺',
    '/profile',
    jsonb_build_object('tip_id', v_tip_id, 'sender_id', v_sender, 'credits', p_credits)
  );

  RETURN v_tip_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_beer_tip(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_beer_tip(uuid, integer, text) TO authenticated;

-- 6. add_beer_credits RPC (service role only — called by webhook)
CREATE OR REPLACE FUNCTION public.add_beer_credits(
  p_user_id uuid,
  p_credits integer,
  p_session_id text,
  p_price_id text,
  p_amount_cents integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Credits must be positive';
  END IF;

  -- Idempotency: if this session was already processed, do nothing
  IF EXISTS (SELECT 1 FROM public.credit_purchases WHERE stripe_session_id = p_session_id AND status = 'completed') THEN
    RETURN;
  END IF;

  INSERT INTO public.credit_purchases (user_id, stripe_session_id, price_id, credits, amount_cents, status, completed_at)
  VALUES (p_user_id, p_session_id, p_price_id, p_credits, p_amount_cents, 'completed', now())
  ON CONFLICT (stripe_session_id) DO UPDATE
    SET status = 'completed', completed_at = now();

  INSERT INTO public.beer_money_balances (user_id, credits)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.beer_money_balances.credits + EXCLUDED.credits,
        updated_at = now();

  -- Notify the buyer
  INSERT INTO public.notifications (user_id, type, title, body, emoji, action_url, metadata)
  VALUES (
    p_user_id,
    'credits_added',
    'Beer Money topped up!',
    p_credits || ' credits added to your wallet',
    '💰',
    '/profile',
    jsonb_build_object('credits', p_credits, 'amount_cents', p_amount_cents)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.add_beer_credits(uuid, integer, text, text, integer) FROM PUBLIC, anon, authenticated;
-- service_role keeps default access; webhook uses service role.