/**
 * Trust & safety guards for monetary gifting (Buy a Beer).
 * Frontend-first: real payment processing is not yet wired, so:
 *  - Recipient eligibility is checked against Supabase signals (verification + recent activity).
 *  - Per-user daily/transaction caps live in localStorage as a stand-in ledger
 *    until a real payments backend exists.
 */

import { supabase } from '@/integrations/supabase/client';

/* ───── Caps & policy constants ───── */

export const GIFT_LIMITS = {
  /** Max single transaction (USD) before KYC escalation is required. */
  PER_TRANSACTION_USD: 100,
  /** Max cumulative gifting per rolling 24h (USD) for standard accounts. */
  DAILY_USD: 250,
  /** New-account window — accounts younger than this get tighter caps. */
  NEW_ACCOUNT_DAYS: 7,
  /** Per-transaction cap for new accounts (USD). */
  NEW_ACCOUNT_PER_TRANSACTION_USD: 25,
  /** Daily cap for new accounts (USD). */
  NEW_ACCOUNT_DAILY_USD: 50,
  /** Recipient must show activity within this window. */
  RECIPIENT_ACTIVITY_WINDOW_DAYS: 30,
  /** Refund/dispute window (hours). */
  REFUND_WINDOW_HOURS: 24,
} as const;

/* ───── Recipient eligibility ───── */

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: EligibilityReason; message: string };

export type EligibilityReason =
  | 'self'
  | 'not_verified_no_activity'
  | 'recipient_not_found'
  | 'recipient_banned'
  | 'unknown';

/**
 * A recipient is eligible if they are:
 *  - Verified, OR
 *  - Have accepted at least one Hi-Five in the last 30 days, OR
 *  - Have joined a meetup in the last 30 days.
 * Self-gifting is never allowed.
 */
export async function checkRecipientEligibility(
  recipientUserId: string,
  currentUserId: string | undefined,
): Promise<EligibilityResult> {
  if (!recipientUserId) {
    return { eligible: false, reason: 'recipient_not_found', message: 'Recipient not found.' };
  }
  if (currentUserId && recipientUserId === currentUserId) {
    return { eligible: false, reason: 'self', message: "You can't send a beer to yourself." };
  }

  const since = new Date(
    Date.now() - GIFT_LIMITS.RECIPIENT_ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Verification status
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('is_verified, is_banned')
    .eq('user_id', recipientUserId)
    .maybeSingle();

  if (pErr || !profile) {
    return { eligible: false, reason: 'recipient_not_found', message: 'Recipient profile unavailable.' };
  }
  if (profile.is_banned) {
    return { eligible: false, reason: 'recipient_banned', message: 'This account is unavailable for gifting.' };
  }
  if (profile.is_verified) {
    return { eligible: true };
  }

  // Recent Hi-Five received (any sender)
  const { count: hiFiveCount } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('to_user', recipientUserId)
    .eq('is_hi_five', true)
    .gte('created_at', since);

  if ((hiFiveCount ?? 0) > 0) return { eligible: true };

  // Recent meetup joins
  const { count: meetupCount } = await supabase
    .from('lineup_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', recipientUserId)
    .gte('joined_at', since);

  if ((meetupCount ?? 0) > 0) return { eligible: true };

  return {
    eligible: false,
    reason: 'not_verified_no_activity',
    message:
      'This fan needs to verify their account or be active in the last 30 days before they can receive gifts.',
  };
}

/* ───── Sender limits (localStorage stand-in ledger) ───── */

interface LedgerEntry {
  id: string;
  amount: number;
  recipientLabel: string;
  recipientUserId?: string;
  context: 'fan' | 'meetup' | 'bar' | 'general';
  createdAt: string; // ISO
  status: 'completed' | 'refunded' | 'disputed' | 'flagged_hold';
  isPublic: boolean;
  flagReason?: string;
}

const LEDGER_KEY = 'cb_gift_ledger_v1';

function readLedger(): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLedger(entries: LedgerEntry[]) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(entries.slice(-200)));
    window.dispatchEvent(new CustomEvent('cb:gift-ledger:changed'));
  } catch {
    // ignore quota errors
  }
}

export function getTransactions(): LedgerEntry[] {
  return readLedger().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordTransaction(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'status'> & {
  status?: LedgerEntry['status'];
  flagReason?: string;
}): LedgerEntry {
  const item: LedgerEntry = {
    id: `BB-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: entry.status ?? 'completed',
    ...entry,
  };
  writeLedger([...readLedger(), item]);
  return item;
}

export function updateTransactionStatus(id: string, status: LedgerEntry['status']) {
  const entries = readLedger().map((e) => (e.id === id ? { ...e, status } : e));
  writeLedger(entries);
}

export type { LedgerEntry };

/* ───── Sender caps & fraud heuristics ───── */

export interface SenderCapsContext {
  /** Account creation date (from auth.user.created_at). */
  accountCreatedAt?: string;
}

export interface CapsCheck {
  allowed: boolean;
  reason?:
    | 'over_per_transaction'
    | 'over_daily'
    | 'kyc_required'
    | 'new_account_throttle'
    | 'flagged_pattern';
  message?: string;
  perTransactionCap: number;
  dailyCap: number;
  spentToday: number;
  remainingToday: number;
  isNewAccount: boolean;
}

export function checkSenderCaps(amountUsd: number, ctx: SenderCapsContext): CapsCheck {
  const isNewAccount = ctx.accountCreatedAt
    ? Date.now() - new Date(ctx.accountCreatedAt).getTime() <
      GIFT_LIMITS.NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000
    : false;

  const perTransactionCap = isNewAccount
    ? GIFT_LIMITS.NEW_ACCOUNT_PER_TRANSACTION_USD
    : GIFT_LIMITS.PER_TRANSACTION_USD;
  const dailyCap = isNewAccount ? GIFT_LIMITS.NEW_ACCOUNT_DAILY_USD : GIFT_LIMITS.DAILY_USD;

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const spentToday = readLedger()
    .filter((e) => e.status !== 'refunded' && new Date(e.createdAt).getTime() >= dayAgo)
    .reduce((sum, e) => sum + e.amount, 0);
  const remainingToday = Math.max(0, dailyCap - spentToday);

  const base = { perTransactionCap, dailyCap, spentToday, remainingToday, isNewAccount };

  if (amountUsd > GIFT_LIMITS.PER_TRANSACTION_USD) {
    return {
      ...base,
      allowed: false,
      reason: 'kyc_required',
      message: `Amounts over $${GIFT_LIMITS.PER_TRANSACTION_USD} require ID verification (KYC). Verify your account in Settings to lift this cap.`,
    };
  }
  if (amountUsd > perTransactionCap) {
    return {
      ...base,
      allowed: false,
      reason: isNewAccount ? 'new_account_throttle' : 'over_per_transaction',
      message: isNewAccount
        ? `New accounts are capped at $${perTransactionCap} per gift for the first ${GIFT_LIMITS.NEW_ACCOUNT_DAYS} days.`
        : `Per-gift cap is $${perTransactionCap}.`,
    };
  }
  if (spentToday + amountUsd > dailyCap) {
    return {
      ...base,
      allowed: false,
      reason: 'over_daily',
      message: `You've reached your daily gifting limit ($${dailyCap}). Resets in 24h.`,
    };
  }
  return { ...base, allowed: true };
}

/**
 * Simple fraud heuristic — flags suspicious patterns for manual review and
 * places a temporary hold on the transaction (status: 'flagged_hold').
 * Triggers:
 *   - 4+ gifts in the last 60 minutes
 *   - 3+ different recipients in the last 10 minutes
 */
export function detectFraudPattern(nextRecipientId?: string): {
  flagged: boolean;
  reason?: string;
} {
  const now = Date.now();
  const recent = readLedger().filter(
    (e) => now - new Date(e.createdAt).getTime() < 60 * 60 * 1000,
  );
  if (recent.length >= 4) {
    return { flagged: true, reason: 'High gifting frequency in the last hour.' };
  }
  const last10m = recent.filter((e) => now - new Date(e.createdAt).getTime() < 10 * 60 * 1000);
  const distinctRecipients = new Set(
    [...last10m.map((e) => e.recipientUserId ?? e.recipientLabel), nextRecipientId].filter(Boolean),
  );
  if (distinctRecipients.size >= 3 && last10m.length >= 2) {
    return { flagged: true, reason: 'Multiple new recipients in a short window.' };
  }
  return { flagged: false };
}
