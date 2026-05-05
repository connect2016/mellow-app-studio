import posthog from 'posthog-js';

// PostHog public project key — safe to hardcode (write-only client key).
// Override available via VITE_POSTHOG_KEY at build time if ever needed.
const POSTHOG_KEY =
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ||
  'phc_BDaQWgZtyxXyXsXzb7MwNvNhrpfMwN5kVXPMHjefaDAA';
const POSTHOG_HOST = 'https://app.posthog.com';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      persistence: 'localStorage',
      autocapture: false,
    });
    initialized = true;
  } catch {
    // swallow — analytics must never break the app
  }
}

/** Fire-and-forget event tracking. Never throws. */
export function track(event: string, properties?: Record<string, unknown>) {
  try {
    if (!initialized) return;
    posthog.capture(event, properties);
  } catch {
    /* no-op */
  }
}

/** Identify the current user. Safe to call multiple times — guard at call site. */
export function identify(userId: string, properties?: Record<string, unknown>) {
  try {
    if (!initialized) return;
    posthog.identify(userId, properties);
  } catch {
    /* no-op */
  }
}

/** Reset on logout. */
export function resetAnalytics() {
  try {
    if (!initialized) return;
    posthog.reset();
  } catch {
    /* no-op */
  }
}
