-- Live probe confirms public.claim_referral_from_inviter does not exist in
-- production (PGRST202 "no matches found in the schema cache"), even though
-- it's already defined in 20260722210000_referrals_system_and_link_claim.sql
-- and already called client-side from src/lib/invite-ref.ts. That call is
-- wrapped in a swallowed promise rejection, so the 404 has been silently
-- failing invite-link referral attribution ever since. Re-applying
-- idempotently so it can be safely re-pushed regardless of prior partial
-- application of that migration.

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

REVOKE EXECUTE ON FUNCTION public.claim_referral_from_inviter(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral_from_inviter(uuid) TO authenticated;
