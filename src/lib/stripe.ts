import Stripe from "stripe";

/**
 * Stripe client — lazy initialized, no-ops if STRIPE_SECRET_KEY is not set.
 * This prevents the entire API from crashing when Stripe isn't configured.
 */

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set — billing features disabled");
    return null;
  }

  _stripe = new Stripe(key, {
    apiVersion: "2025-03-31.basil" as any,
    typescript: true,
  });

  return _stripe;
}

/** @deprecated Use getStripe() instead — this will throw if key is missing */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const instance = getStripe();
    if (!instance) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local");
    }
    return (instance as any)[prop];
  },
});
