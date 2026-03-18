import Stripe from "stripe";

// ─── Stripe server instance (lazy geinitialiseerd) ───
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is niet geconfigureerd. Stel deze in als environment variable."
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * @deprecated Gebruik `getStripe()` voor lazy initialization.
 * Dit wordt behouden voor backwards compatibility met bestaande imports.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});

// ─── Plan definities ───
export type PlanId = "starter" | "business" | "scale" | "enterprise";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // EUR per maand, 0 = op maat
  stripePriceId: string | null; // null voor enterprise (custom)
  limits: {
    workspaces: number; // -1 = unlimited
    users: number;
    reports: number;
  };
  features: string[];
  highlighted?: boolean;
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 99,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || null,
    limits: { workspaces: -1, users: 10, reports: -1 },
    features: [
      "Onbeperkt werkruimtes",
      "Tot 10 gebruikers",
      "Onbeperkt rapporten",
      "Eigen branding",
      "E-mail authenticatie",
      "E-mail support",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 249,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || null,
    limits: { workspaces: -1, users: 30, reports: -1 },
    features: [
      "Onbeperkt werkruimtes",
      "Tot 30 gebruikers",
      "Onbeperkt rapporten",
      "Eigen domein",
      "Microsoft SSO",
      "Row-level security",
      "Crisp chat support",
      "API toegang",
    ],
    highlighted: true,
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 499,
    stripePriceId: process.env.STRIPE_PRICE_SCALE || null,
    limits: { workspaces: -1, users: 150, reports: -1 },
    features: [
      "Onbeperkt werkruimtes",
      "Tot 150 gebruikers",
      "Onbeperkt rapporten",
      "Alles van Business",
      "Geavanceerde analytics",
      "Priority support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // Op maat
    stripePriceId: null,
    limits: { workspaces: -1, users: -1, reports: -1 },
    features: [
      "151+ gebruikers",
      "Alles van Scale",
      "SLA garantie",
      "Dedicated support",
      "Custom integraties",
      "Meerdere omgevingen",
    ],
  },
};

/**
 * Haal de configuratie op voor een plan.
 */
export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIG[plan as PlanId] || PLAN_CONFIG.starter;
}

/**
 * Haal de limieten op voor een plan.
 */
export function getPlanLimits(plan: string) {
  return getPlanConfig(plan).limits;
}

/**
 * Haal de Stripe Price ID op voor een plan.
 * Geeft null terug voor enterprise (custom pricing).
 */
export function getStripePriceId(plan: string): string | null {
  return getPlanConfig(plan).stripePriceId;
}

/**
 * Alle plan IDs in volgorde.
 */
export const PLAN_ORDER: PlanId[] = ["starter", "business", "scale", "enterprise"];

/**
 * Check of plan A hoger is dan plan B.
 */
export function isPlanHigherThan(planA: string, planB: string): boolean {
  const indexA = PLAN_ORDER.indexOf(planA as PlanId);
  const indexB = PLAN_ORDER.indexOf(planB as PlanId);
  return indexA > indexB;
}
