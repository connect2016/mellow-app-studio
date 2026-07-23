-- Add human-readable referral code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

-- Referrals attribution table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  new_user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their referrals" ON public.referrals;
CREATE POLICY "Users see their referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = new_user_id);

-- Inserts only via SECURITY DEFINER RPC below (no insert policy on purpose).

-- RPC: get or create my referral code (DAVID1234 style)
CREATE OR REPLACE FUNCTION public.get_or_create_my_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
  v_name text;
  v_base text;
  v_attempt int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT referral_code, display_name INTO v_code, v_name
    FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  IF v_code IS NOT NULL AND length(v_code) > 0 THEN
    RETURN v_code;
  END IF;

  v_base := upper(regexp_replace(COALESCE(v_name, ''), '[^a-zA-Z]', '', 'g'));
  IF v_base IS NULL OR length(v_base) < 3 THEN v_base := 'FAN'; END IF;
  IF length(v_base) > 10 THEN v_base := substr(v_base, 1, 10); END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := v_base || lpad((floor(random() * 10000))::int::text, 4, '0');
    BEGIN
      UPDATE public.profiles SET referral_code = v_code WHERE user_id = v_user;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt > 25 THEN RAISE EXCEPTION 'Could not generate unique referral code'; END IF;
    END;
  END LOOP;

  RETURN v_code;
END;
$$;

-- RPC: claim a referral code after signup
CREATE OR REPLACE FUNCTION public.claim_referral_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_referrer uuid;
  v_norm text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_code IS NULL THEN RETURN false; END IF;
  v_norm := upper(regexp_replace(p_code, '[^a-zA-Z0-9]', '', 'g'));
  IF length(v_norm) < 5 OR length(v_norm) > 30 THEN RETURN false; END IF;

  -- Don't re-attribute if already claimed
  IF EXISTS (SELECT 1 FROM public.referrals WHERE new_user_id = v_user) THEN
    RETURN false;
  END IF;

  SELECT user_id INTO v_referrer FROM public.profiles WHERE referral_code = v_norm;
  IF v_referrer IS NULL OR v_referrer = v_user THEN RETURN false; END IF;

  INSERT INTO public.referrals (referrer_user_id, new_user_id, referral_code)
  VALUES (v_referrer, v_user, v_norm)
  ON CONFLICT (new_user_id) DO NOTHING;

  RETURN true;
END;
$$;

-- RPC: count my referrals (for "You've invited X friends")
CREATE OR REPLACE FUNCTION public.get_my_referral_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.referrals WHERE referrer_user_id = auth.uid();
$$;

-- ============================================================
-- NEW: claim a referral directly from an invite-link UUID.
--
-- Invite links carry ?ref=<inviter uuid> (not a DAVID1234 code),
-- so the code-based claim above never fires for them. This RPC
-- lets the post-signup invite flow record the referral using the
-- inviter's user id. Same guards as claim_referral_code:
-- authenticated only, no self-referral, one referral per new user,
-- inserts protected by ON CONFLICT.
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_referral_from_inviter(p_referrer uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_referrer IS NULL OR p_referrer = v_user THEN RETURN false; END IF;

  -- One referral per new user, ever.
  IF EXISTS (SELECT 1 FROM public.referrals WHERE new_user_id = v_user) THEN
    RETURN false;
  END IF;

  -- Referrer must be a real profile.
  SELECT referral_code INTO v_code FROM public.profiles WHERE user_id = p_referrer;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO public.referrals (referrer_user_id, new_user_id, referral_code)
  VALUES (p_referrer, v_user, COALESCE(v_code, 'INVITELINK'))
  ON CONFLICT (new_user_id) DO NOTHING;

  RETURN true;
END;
$$;
