/**
 * Invite ref persistence + post-signup attribution.
 *
 * When a logged-out user lands on /join?ref=<inviterId>, we stash the ref so
 * we can convert it into a buddy_request after they finish signup + onboarding.
 */
import { supabase } from '@/integrations/supabase/client';

const KEY = 'wrigleyville_invite_ref';
const LEGACY_KEY = 'cubbies_invite_ref'; // pre-rename key — fall back for in-flight invites
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type Stored = { ref: string; ts: number };

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function storeInviteRef(ref: string | null | undefined) {
  if (!ref || !isUuid(ref)) return;
  try {
    const payload: Stored = { ref, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* no-op */
  }
}

export function getInviteRef(): string | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.ref || !isUuid(parsed.ref)) return null;
    if (Date.now() - (parsed.ts ?? 0) > MAX_AGE_MS) {
      clearInviteRef();
      return null;
    }
    return parsed.ref;
  } catch {
    return null;
  }
}

export function clearInviteRef() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* no-op */
  }
}

/**
 * Send a buddy request to the stored inviter (if any) and clear the ref.
 * Safe to call repeatedly — uses say_hi_to_buddy which is idempotent.
 */
export async function consumeInviteRefIfPresent(currentUserId: string | null | undefined) {
  if (!currentUserId) return { consumed: false, ref: null as string | null };
  const ref = getInviteRef();
  if (!ref || ref === currentUserId) {
    if (ref === currentUserId) clearInviteRef();
    return { consumed: false, ref };
  }
  try {
    await supabase.rpc('say_hi_to_buddy', { p_recipient_id: ref });
    void supabase.rpc('claim_referral_from_inviter' as any, { p_referrer: ref }).then(
      ({ error }: { error: unknown }) => {
        if (error) console.error('claim_referral_from_inviter failed', error);
      },
      (error) => console.error('claim_referral_from_inviter failed', error),
    );
    clearInviteRef();
    return { consumed: true, ref };
  } catch {
    // Don't clear on transient failure — let it retry on next mount.
    return { consumed: false, ref };
  }
}
