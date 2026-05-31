/**
 * Human-readable referral code handling (e.g. DAVID1234).
 *
 * Captured from the landing URL `?ref=CODE`, persisted in localStorage,
 * and converted into a `public.referrals` row after signup via the
 * `claim_referral_code` RPC.
 */
import { supabase } from '@/integrations/supabase/client';

const KEY = 'cubbies_referral_code';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type Stored = { code: string; ts: number };

const isCode = (s: string) => /^[A-Z0-9]{5,30}$/.test(s);

function normalize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return isCode(cleaned) ? cleaned : null;
}

export function captureReferralCodeFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = normalize(params.get('ref'));
    if (!ref) return;
    const payload: Stored = { code: ref, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* no-op */
  }
}

export function getStoredReferralCode(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    const code = normalize(parsed?.code);
    if (!code) return null;
    if (Date.now() - (parsed.ts ?? 0) > MAX_AGE_MS) {
      clearStoredReferralCode();
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}

/** Idempotent. Safe to call multiple times. */
export async function claimStoredReferralCodeIfPresent(currentUserId: string | null | undefined) {
  if (!currentUserId) return { claimed: false, code: null as string | null };
  const code = getStoredReferralCode();
  if (!code) return { claimed: false, code: null };
  try {
    const { data, error } = await supabase.rpc('claim_referral_code', { p_code: code });
    if (error) return { claimed: false, code };
    clearStoredReferralCode();
    return { claimed: !!data, code };
  } catch {
    return { claimed: false, code };
  }
}
