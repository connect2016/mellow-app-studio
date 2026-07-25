// Stripe-based Buy a Beer checkout requires a live Stripe key to process real
// transactions; none is configured in production yet. Flip to true once
// payments go live.
export const STRIPE_CHECKOUT_ENABLED = false;

// Peer-to-peer beer gifting via a fan's own Venmo/Cash App/PayPal handle.
// Runs independently of Stripe — no payment processor needed, so it can stay
// on even while STRIPE_CHECKOUT_ENABLED is off.
export const P2P_HANDLES_ENABLED = true;
