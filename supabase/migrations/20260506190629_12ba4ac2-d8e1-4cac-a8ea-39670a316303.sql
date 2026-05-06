-- merchants
CREATE TABLE public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  logo_url text,
  description text,
  merchant_secret text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active merchants are publicly viewable"
  ON public.merchants FOR SELECT USING (is_active = true);

-- merchant_promos
CREATE TABLE public.merchant_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_type text CHECK (discount_type IN ('percent','fixed','free_item')),
  discount_value integer,
  min_purchase_cents integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions integer,
  current_redemptions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.merchant_promos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active promos are publicly viewable"
  ON public.merchant_promos FOR SELECT USING (is_active = true);
CREATE INDEX idx_promos_merchant ON public.merchant_promos(merchant_id, is_active);

-- promo_redemptions
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  promo_id uuid NOT NULL REFERENCES public.merchant_promos(id) ON DELETE CASCADE,
  qr_code_token text NOT NULL UNIQUE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  UNIQUE (user_id, promo_id)
);
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own redemptions"
  ON public.promo_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_redemptions_user ON public.promo_redemptions(user_id, redeemed_at DESC);

-- updated_at triggers (reuse existing function)
CREATE TRIGGER trg_merchants_updated BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON public.merchant_promos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- claim_promo: fan claims; regenerates token on existing row if not yet confirmed
CREATE OR REPLACE FUNCTION public.claim_promo(p_promo_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_promo public.merchant_promos%ROWTYPE;
  v_existing public.promo_redemptions%ROWTYPE;
  v_token text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='28000'; END IF;

  SELECT * INTO v_promo FROM public.merchant_promos WHERE id = p_promo_id AND is_active = true;
  IF v_promo.id IS NULL THEN RAISE EXCEPTION 'Promo not available'; END IF;
  IF v_promo.valid_from IS NOT NULL AND now() < v_promo.valid_from THEN RAISE EXCEPTION 'Promo not yet active'; END IF;
  IF v_promo.valid_until IS NOT NULL AND now() > v_promo.valid_until THEN RAISE EXCEPTION 'Promo expired'; END IF;
  IF v_promo.max_redemptions IS NOT NULL AND v_promo.current_redemptions >= v_promo.max_redemptions THEN
    RAISE EXCEPTION 'Promo fully redeemed';
  END IF;

  SELECT * INTO v_existing FROM public.promo_redemptions
    WHERE user_id = v_user AND promo_id = p_promo_id;
  IF v_existing.id IS NOT NULL AND v_existing.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already redeemed';
  END IF;

  v_token := encode(gen_random_bytes(18), 'hex');

  IF v_existing.id IS NULL THEN
    INSERT INTO public.promo_redemptions (user_id, promo_id, qr_code_token)
    VALUES (v_user, p_promo_id, v_token);
  ELSE
    UPDATE public.promo_redemptions
       SET qr_code_token = v_token, redeemed_at = now()
     WHERE id = v_existing.id;
  END IF;

  RETURN v_token;
END;
$$;

-- preview_promo_redemption: bartender screen lookup
CREATE OR REPLACE FUNCTION public.preview_promo_redemption(p_token text, p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_red public.promo_redemptions%ROWTYPE;
  v_promo public.merchant_promos%ROWTYPE;
  v_merchant public.merchants%ROWTYPE;
  v_user_name text;
BEGIN
  SELECT * INTO v_red FROM public.promo_redemptions WHERE qr_code_token = p_token;
  IF v_red.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid token'); END IF;

  SELECT * INTO v_promo FROM public.merchant_promos WHERE id = v_red.promo_id;
  SELECT * INTO v_merchant FROM public.merchants WHERE id = v_promo.merchant_id;
  IF v_merchant.merchant_secret IS NULL OR v_merchant.merchant_secret <> p_secret THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid merchant secret');
  END IF;

  SELECT display_name INTO v_user_name FROM public.profiles WHERE user_id = v_red.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'already_confirmed', v_red.confirmed_at IS NOT NULL,
    'expired', now() > v_red.redeemed_at + interval '15 minutes',
    'user_name', COALESCE(v_user_name,'Fan'),
    'promo_title', v_promo.title,
    'promo_description', v_promo.description,
    'merchant_name', v_merchant.name
  );
END;
$$;

-- confirm_promo_redemption: bartender confirms
CREATE OR REPLACE FUNCTION public.confirm_promo_redemption(p_token text, p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_red public.promo_redemptions%ROWTYPE;
  v_promo public.merchant_promos%ROWTYPE;
  v_merchant public.merchants%ROWTYPE;
  v_user_name text;
BEGIN
  SELECT * INTO v_red FROM public.promo_redemptions WHERE qr_code_token = p_token;
  IF v_red.id IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF v_red.confirmed_at IS NOT NULL THEN RAISE EXCEPTION 'Already confirmed'; END IF;
  IF now() > v_red.redeemed_at + interval '15 minutes' THEN RAISE EXCEPTION 'Token expired'; END IF;

  SELECT * INTO v_promo FROM public.merchant_promos WHERE id = v_red.promo_id;
  SELECT * INTO v_merchant FROM public.merchants WHERE id = v_promo.merchant_id;

  IF v_merchant.merchant_secret IS NULL OR v_merchant.merchant_secret <> p_secret THEN
    RAISE EXCEPTION 'Invalid merchant secret';
  END IF;

  IF v_promo.max_redemptions IS NOT NULL AND v_promo.current_redemptions >= v_promo.max_redemptions THEN
    RAISE EXCEPTION 'Promo fully redeemed';
  END IF;

  UPDATE public.promo_redemptions SET confirmed_at = now() WHERE id = v_red.id;
  UPDATE public.merchant_promos SET current_redemptions = current_redemptions + 1 WHERE id = v_promo.id;

  SELECT display_name INTO v_user_name FROM public.profiles WHERE user_id = v_red.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'user_name', COALESCE(v_user_name,'Fan'),
    'promo_title', v_promo.title,
    'merchant_name', v_merchant.name
  );
END;
$$;