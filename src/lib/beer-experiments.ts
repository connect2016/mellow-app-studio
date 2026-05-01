/**
 * Buy a Beer — A/B experiments + canonical analytics layer.
 *
 * Implements the event spec the product team requested:
 *   buy_beer_cta_viewed, buy_beer_cta_clicked, buy_beer_modal_opened,
 *   buy_beer_payment_attempt, buy_beer_success, buy_beer_refund_requested,
 *   buy_beer_share_clicked
 *
 * Plus three running experiments:
 *   - cta_placement: profile_card | fab | both
 *   - public_default: on | off
 *   - quick_amounts: on | off
 *
 * Assignment is deterministic per-device (sticky) so KPIs (conversion,
 * AOV, repeat purchase, viral lift, refund rate) can be sliced per arm.
 */

import { trackBeerEvent } from './gift-social';

const ASSIGNMENT_KEY = 'cb.beer.experiments.v1';
const DEVICE_KEY = 'cb.beer.deviceId.v1';

/* ───── Experiment registry ───── */

export type ExperimentId = 'cta_placement' | 'public_default' | 'quick_amounts';

interface ExperimentDef<V extends string = string> {
  id: ExperimentId;
  variants: V[];
  /** Equal weights; can be tuned later. */
  weights?: number[];
  /** Minimum exposures per arm before reading results. */
  minSamplePerArm: number;
}

const EXPERIMENTS: Record<ExperimentId, ExperimentDef> = {
  cta_placement: {
    id: 'cta_placement',
    variants: ['profile_card', 'fab', 'both'],
    minSamplePerArm: 200,
  },
  public_default: {
    id: 'public_default',
    variants: ['on', 'off'],
    minSamplePerArm: 200,
  },
  quick_amounts: {
    id: 'quick_amounts',
    variants: ['on', 'off'],
    minSamplePerArm: 200,
  },
};

/* ───── Storage helpers ───── */

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/* ───── Device id (anonymous) ───── */

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      (window.crypto && 'randomUUID' in window.crypto)
        ? window.crypto.randomUUID()
        : `d_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/* ───── Deterministic hash for sticky assignment ───── */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ───── Assignment ───── */

type AssignmentMap = Partial<Record<ExperimentId, string>>;

function loadAssignments(): AssignmentMap {
  return readJson<AssignmentMap>(ASSIGNMENT_KEY, {});
}

function saveAssignments(map: AssignmentMap) {
  writeJson(ASSIGNMENT_KEY, map);
}

export function getVariant<V extends string = string>(id: ExperimentId): V {
  const def = EXPERIMENTS[id];
  const map = loadAssignments();
  if (map[id] && def.variants.includes(map[id]!)) return map[id] as V;

  const bucket = hashStr(`${getDeviceId()}::${id}`) % def.variants.length;
  const variant = def.variants[bucket];
  map[id] = variant;
  saveAssignments(map);

  // Log exposure once per assignment.
  trackBeerEvent('beer_button_viewed', {
    _exposure: true,
    experiment: id,
    variant,
  });

  return variant as V;
}

export function getAllAssignments(): AssignmentMap {
  // Force-resolve all known experiments so dashboards can read them.
  const out: AssignmentMap = {};
  (Object.keys(EXPERIMENTS) as ExperimentId[]).forEach((id) => {
    out[id] = getVariant(id);
  });
  return out;
}

/* ───── Convenience: feature flags derived from assignments ───── */

export const beerExperiments = {
  /** Where to render the CTA. */
  ctaPlacement(): 'profile_card' | 'fab' | 'both' {
    return getVariant<'profile_card' | 'fab' | 'both'>('cta_placement');
  },
  /** Whether the public-shoutout toggle defaults on. */
  defaultPublic(): boolean {
    return getVariant<'on' | 'off'>('public_default') === 'on';
  },
  /** Whether to render the $5/$10/$20 quick chips. */
  showQuickAmounts(): boolean {
    return getVariant<'on' | 'off'>('quick_amounts') === 'on';
  },
  /** Should this surface render the CTA at all, given the placement test? */
  shouldShowAt(surface: 'profile_card' | 'fab'): boolean {
    const v = beerExperiments.ctaPlacement();
    return v === 'both' || v === surface;
  },
};

/* ───── Canonical product event names (spec) ───── */

export type BuyBeerEvent =
  | 'buy_beer_cta_viewed'
  | 'buy_beer_cta_clicked'
  | 'buy_beer_modal_opened'
  | 'buy_beer_payment_attempt'
  | 'buy_beer_success'
  | 'buy_beer_refund_requested'
  | 'buy_beer_share_clicked';

/**
 * Emit a canonical Buy a Beer event with experiment assignments attached
 * so every event is sliceable by arm in the analytics dashboard.
 */
export function trackBuyBeer(
  event: BuyBeerEvent,
  props: Record<string, unknown> = {},
) {
  const enriched = {
    ...props,
    deviceId: getDeviceId(),
    experiments: getAllAssignments(),
    ts: Date.now(),
  };
  // Re-use the existing logger sink for unified storage/inspection.
  // Cast: the underlying logger accepts arbitrary event names in practice.
  trackBeerEvent(event as unknown as Parameters<typeof trackBeerEvent>[0], enriched);
}

/* ───── KPI dashboard helpers (read local analytics buffer) ───── */

interface LoggedEvent {
  event: string;
  props: Record<string, unknown>;
  ts: number;
}

function readLog(): LoggedEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('cb.beer.analytics.v1');
    return raw ? (JSON.parse(raw) as LoggedEvent[]) : [];
  } catch {
    return [];
  }
}

export interface ExperimentKpiRow {
  variant: string;
  exposures: number;
  ctaClicks: number;
  successes: number;
  refunds: number;
  shares: number;
  conversionRate: number; // success / cta_click
  aov: number; // avg order value
  refundRate: number; // refund / success
  viralLift: number; // share / success
  ready: boolean; // hit minSamplePerArm
}

export function readExperimentKpis(id: ExperimentId): ExperimentKpiRow[] {
  const def = EXPERIMENTS[id];
  const log = readLog();
  const get = (e: LoggedEvent) =>
    (e.props?.experiments as AssignmentMap | undefined)?.[id];

  return def.variants.map((variant) => {
    const arm = log.filter((e) => get(e) === variant);
    const exposures = arm.filter((e) => e.event === 'buy_beer_cta_viewed').length;
    const ctaClicks = arm.filter((e) => e.event === 'buy_beer_cta_clicked').length;
    const successes = arm.filter((e) => e.event === 'buy_beer_success');
    const refunds = arm.filter((e) => e.event === 'buy_beer_refund_requested').length;
    const shares = arm.filter((e) => e.event === 'buy_beer_share_clicked').length;
    const totalRevenue = successes.reduce(
      (acc, e) => acc + (typeof e.props?.amount === 'number' ? (e.props.amount as number) : 0),
      0,
    );
    return {
      variant,
      exposures,
      ctaClicks,
      successes: successes.length,
      refunds,
      shares,
      conversionRate: ctaClicks > 0 ? successes.length / ctaClicks : 0,
      aov: successes.length > 0 ? totalRevenue / successes.length : 0,
      refundRate: successes.length > 0 ? refunds / successes.length : 0,
      viralLift: successes.length > 0 ? shares / successes.length : 0,
      ready: exposures >= def.minSamplePerArm,
    };
  });
}

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__beerExperiments = {
    getAllAssignments,
    readExperimentKpis,
    flags: beerExperiments,
  };
}
