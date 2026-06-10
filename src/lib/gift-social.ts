/**
 * Social + rewards layer for Buy a Beer.
 * Frontend-first: shoutout feed, badges, leaderboard points, reciprocity nudges,
 * partner promo codes, share helpers, analytics, and a "new user tooltip seen" flag.
 *
 * Persists to localStorage as a stand-in until a real backend is wired.
 */

import { getTransactions, type LedgerEntry } from './gift-trust-safety';

/* ───── Quick amount presets ───── */

export const QUICK_AMOUNTS = [5, 10, 20] as const;

/* ───── Public shoutout feed ───── */

export interface BeerShoutout {
  id: string;
  txId: string;
  senderId?: string;
  senderName: string;
  senderAvatar?: string;
  recipientId?: string;
  recipientLabel: string;
  context: 'fan' | 'meetup' | 'bar' | 'general';
  amount: number;
  message?: string;
  promoCode?: string;
  createdAt: string; // ISO
  reactions: { likes: number; cheers: number };
  reciprocated?: boolean;
}

const SHOUTOUT_KEY = 'cb_beer_shoutouts_v1';
const RECIPROCITY_KEY = 'cb_beer_reciprocity_v1';
const BADGES_KEY = 'cb_beer_badges_v1';
const POINTS_KEY = 'cb_beer_points_v1';
const TOOLTIP_KEY = 'cb_beer_tooltip_seen_v1';
const ANALYTICS_KEY = 'cb_beer_analytics_v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson<T>(key: string, value: T, eventName?: string) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (eventName) window.dispatchEvent(new CustomEvent(eventName));
  } catch {
    // ignore
  }
}

export function getShoutouts(limit = 25): BeerShoutout[] {
  return readJson<BeerShoutout[]>(SHOUTOUT_KEY, [])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function postShoutout(input: Omit<BeerShoutout, 'id' | 'createdAt' | 'reactions'>): BeerShoutout {
  const item: BeerShoutout = {
    ...input,
    id: `SO-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    reactions: { likes: 0, cheers: 0 },
  };
  const next = [...readJson<BeerShoutout[]>(SHOUTOUT_KEY, []), item].slice(-100);
  writeJson(SHOUTOUT_KEY, next, 'cb:beer-shoutouts:changed');
  return item;
}

export function reactToShoutout(id: string, kind: 'likes' | 'cheers') {
  const next = readJson<BeerShoutout[]>(SHOUTOUT_KEY, []).map((s) =>
    s.id === id ? { ...s, reactions: { ...s.reactions, [kind]: s.reactions[kind] + 1 } } : s,
  );
  writeJson(SHOUTOUT_KEY, next, 'cb:beer-shoutouts:changed');
}

/* ───── Reciprocity nudges (48h window) ───── */

const RECIPROCITY_WINDOW_HOURS = 48;

export interface ReciprocityNudge {
  id: string;
  fromUserId?: string;
  fromName: string;
  fromAvatar?: string;
  amount: number;
  shoutoutId: string;
  createdAt: string;
  expiresAt: string;
  dismissed?: boolean;
  acted?: boolean;
}

export function getActiveReciprocityNudges(): ReciprocityNudge[] {
  const now = Date.now();
  return readJson<ReciprocityNudge[]>(RECIPROCITY_KEY, [])
    .filter((n) => !n.dismissed && !n.acted && new Date(n.expiresAt).getTime() > now)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addReciprocityNudge(input: Omit<ReciprocityNudge, 'id' | 'createdAt' | 'expiresAt'>): ReciprocityNudge {
  const now = new Date();
  const item: ReciprocityNudge = {
    ...input,
    id: `RN-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RECIPROCITY_WINDOW_HOURS * 60 * 60 * 1000).toISOString(),
  };
  const next = [...readJson<ReciprocityNudge[]>(RECIPROCITY_KEY, []), item].slice(-50);
  writeJson(RECIPROCITY_KEY, next, 'cb:beer-reciprocity:changed');
  return item;
}

export function dismissReciprocityNudge(id: string) {
  const next = readJson<ReciprocityNudge[]>(RECIPROCITY_KEY, []).map((n) =>
    n.id === id ? { ...n, dismissed: true } : n,
  );
  writeJson(RECIPROCITY_KEY, next, 'cb:beer-reciprocity:changed');
}

export function markReciprocityActed(id: string) {
  const next = readJson<ReciprocityNudge[]>(RECIPROCITY_KEY, []).map((n) =>
    n.id === id ? { ...n, acted: true } : n,
  );
  writeJson(RECIPROCITY_KEY, next, 'cb:beer-reciprocity:changed');
}

/* ───── Round Giver badges & leaderboard points ───── */

export interface RoundGiverBadge {
  id: 'first_round' | 'round_giver' | 'big_spender' | 'bartender_friend' | 'generosity_legend';
  label: string;
  emoji: string;
  description: string;
  earnedAt: string;
}

const BADGE_DEFS: Omit<RoundGiverBadge, 'earnedAt'>[] = [
  { id: 'first_round',        label: 'First Round',        emoji: '🍺', description: 'Bought your first beer.' },
  { id: 'round_giver',        label: 'Round Giver',        emoji: '🍻', description: 'Bought 5 rounds for fans.' },
  { id: 'big_spender',        label: 'Big Spender',        emoji: '💸', description: 'Gifted $100+ in total.' },
  { id: 'bartender_friend',   label: "Bartender's Friend", emoji: '🤝', description: 'Tipped on 3+ rounds.' },
  { id: 'generosity_legend',  label: 'Generosity Legend',  emoji: '🏆', description: 'Bought 25 rounds — Hall of Fame.' },
];

export function getBadges(): RoundGiverBadge[] {
  return readJson<RoundGiverBadge[]>(BADGES_KEY, []);
}

function awardBadge(id: RoundGiverBadge['id']): RoundGiverBadge | null {
  const existing = getBadges();
  if (existing.some((b) => b.id === id)) return null;
  const def = BADGE_DEFS.find((b) => b.id === id);
  if (!def) return null;
  const earned: RoundGiverBadge = { ...def, earnedAt: new Date().toISOString() };
  writeJson(BADGES_KEY, [...existing, earned], 'cb:beer-badges:changed');
  return earned;
}

/** Points contribute to the league leaderboard (gifting category). */
export function getGiftingPoints(): number {
  return readJson<number>(POINTS_KEY, 0);
}
function addGiftingPoints(n: number) {
  writeJson(POINTS_KEY, getGiftingPoints() + n, 'cb:beer-points:changed');
}

/**
 * Recalculates badges + points after a successful gift. Returns any newly awarded badges.
 * Points formula: 10 base + 1 per $5 gifted + 5 if tipped + 5 if public.
 */
export function processGiftReward(opts: {
  amount: number;
  tipped: boolean;
  isPublic: boolean;
}): RoundGiverBadge[] {
  const completed = getTransactions().filter(
    (t: LedgerEntry) => t.status === 'completed' || t.status === 'flagged_hold',
  );
  const newlyAwarded: RoundGiverBadge[] = [];

  // Points
  const pts = 10 + Math.floor(opts.amount / 5) + (opts.tipped ? 5 : 0) + (opts.isPublic ? 5 : 0);
  addGiftingPoints(pts);

  // Badges
  if (completed.length >= 1) {
    const b = awardBadge('first_round'); if (b) newlyAwarded.push(b);
  }
  if (completed.length >= 5) {
    const b = awardBadge('round_giver'); if (b) newlyAwarded.push(b);
  }
  if (completed.length >= 25) {
    const b = awardBadge('generosity_legend'); if (b) newlyAwarded.push(b);
  }
  const total = completed.reduce((s, t) => s + t.amount, 0);
  if (total >= 100) {
    const b = awardBadge('big_spender'); if (b) newlyAwarded.push(b);
  }
  // Bartender's Friend tracked via separate "tip count" derived from transactions metadata
  const tipCount = readJson<number>('cb_beer_tip_count_v1', 0) + (opts.tipped ? 1 : 0);
  writeJson('cb_beer_tip_count_v1', tipCount);
  if (tipCount >= 3) {
    const b = awardBadge('bartender_friend'); if (b) newlyAwarded.push(b);
  }

  return newlyAwarded;
}

/* ───── Social proof aggregates ───── */

export function getSocialProof(): {
  roundsThisWeek: number;
  fansThisWeek: number;
  totalGiftedThisWeek: number;
} {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const completed = getTransactions().filter(
    (t) => (t.status === 'completed' || t.status === 'flagged_hold') && new Date(t.createdAt).getTime() >= weekAgo,
  );
  const fans = new Set(completed.map((t) => t.recipientUserId ?? t.recipientLabel));
  return {
    roundsThisWeek: Math.max(12, completed.length), // floor for social proof feel
    fansThisWeek: Math.max(8, fans.size),
    totalGiftedThisWeek: completed.reduce((s, t) => s + t.amount, 0),
  };
}

/* ───── Partner bar promotions ───── */

export interface PartnerPromo {
  barName: string;
  code: string;
  perk: string;
  minRoundUsd: number;
}

const PARTNER_PROMOS: PartnerPromo[] = [
  { barName: 'Murphy\'s Bleachers',  code: 'CUBSAPP10',  perk: 'Free order of nachos',           minRoundUsd: 20 },
  { barName: 'The Cubby Bear',       code: 'CUBBY5',     perk: '10% off your tab',               minRoundUsd: 15 },
  { barName: 'Sluggers',             code: 'SLUG7',      perk: 'Free pretzel bites',             minRoundUsd: 15 },
  { barName: 'Casey Moran\'s',       code: 'MORAN20',    perk: '$5 appetizer',                   minRoundUsd: 20 },
  { barName: 'Bernie\'s',            code: 'BERN10',     perk: 'Free shot with next round',      minRoundUsd: 25 },
];

export function getPartnerPromo(barName?: string, amountUsd = 0): PartnerPromo | null {
  if (!barName) return null;
  const promo = PARTNER_PROMOS.find((p) => p.barName.toLowerCase() === barName.toLowerCase());
  if (!promo) return null;
  if (amountUsd < promo.minRoundUsd) return null;
  return promo;
}

/* ───── Share helpers ───── */

export async function shareShoutout(payload: {
  senderName: string;
  recipientLabel: string;
  amount: number;
  message?: string;
  url?: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  const text = `${payload.senderName} bought ${payload.recipientLabel} a round 🍻${payload.message ? ` "${payload.message}"` : ''} — Wrigleyville Buddies`;
  const url = payload.url ?? (typeof window !== 'undefined' ? window.location.origin : 'https://wrigleyvillebuddies.com');
  try {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : null;
    if (nav && typeof nav.share === 'function') {
      await nav.share({ title: 'Round on the house 🍻', text, url });
      trackBeerEvent('beer_shoutout_shared', { method: 'native' });
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      trackBeerEvent('beer_shoutout_shared', { method: 'clipboard' });
      return 'copied';
    }
  } catch {
    return 'failed';
  }
  return 'failed';
}

/* ───── New user tooltip ───── */

export function hasSeenBeerTooltip(): boolean {
  return readJson<boolean>(TOOLTIP_KEY, false);
}
export function markBeerTooltipSeen() {
  writeJson(TOOLTIP_KEY, true);
}

/* ───── Analytics (dev/QA logger; replaces with real provider later) ───── */

export type BeerAnalyticsEvent =
  | 'beer_button_viewed'
  | 'beer_modal_opened'
  | 'beer_quick_amount_selected'
  | 'beer_amount_custom_entered'
  | 'beer_public_toggled'
  | 'beer_message_added'
  | 'beer_promo_applied'
  | 'beer_purchase_attempted'
  | 'beer_purchase_completed'
  | 'beer_purchase_undone'
  | 'beer_shoutout_posted'
  | 'beer_shoutout_shared'
  | 'beer_shoutout_reacted'
  | 'beer_reciprocity_shown'
  | 'beer_reciprocity_clicked'
  | 'beer_reciprocity_dismissed'
  | 'beer_badge_awarded'
  | 'beer_tooltip_shown'
  | 'beer_tooltip_dismissed'
  | 'beer_tooltip_cta_clicked'
  // Canonical product spec events (mirrored via beer-experiments.trackBuyBeer)
  | 'buy_beer_cta_viewed'
  | 'buy_beer_cta_clicked'
  | 'buy_beer_modal_opened'
  | 'buy_beer_payment_attempt'
  | 'buy_beer_success'
  | 'buy_beer_refund_requested'
  | 'buy_beer_share_clicked';

export function trackBeerEvent(event: BeerAnalyticsEvent, props: Record<string, unknown> = {}) {
  const entry = { event, props, ts: Date.now() };
  try {
    const log = readJson<typeof entry[]>(ANALYTICS_KEY, []);
    log.push(entry);
    writeJson(ANALYTICS_KEY, log.slice(-200));
  } catch {
    // ignore
  }
  // Bridge select beer events into PostHog (fire-and-forget).
  try {
    if (event === 'beer_purchase_completed' || event === 'buy_beer_success') {
      // Lazy import to avoid circular dep risk
      import('@/lib/analytics').then(({ track }) => {
        track('beer_purchase_completed', {
          amount: typeof props.amount === 'number' ? props.amount : undefined,
          method: (props as any).method ?? 'unknown',
        });
      }).catch(() => {});
    }
  } catch {
    // ignore
  }
  // Surface in console for QA visibility.
  // eslint-disable-next-line no-console
  if (typeof console !== 'undefined') console.debug('[beer-analytics]', event, props);
}

/* ───── Default suggested public messages ───── */

export const SUGGESTED_MESSAGES = [
  'Cheers from the bleachers 🍻',
  'Go Cubs Go!',
  "You're a legend 💙",
  'Next round\'s on you 😉',
  'Welcome to Wrigleyville',
];
