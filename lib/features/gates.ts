import { type PlanId, PLAN_ORDER } from "@/lib/stripe/config";

// ─── Feature definities per tier ───
// Elke tier erft automatisch de features van lagere tiers.

type Feature =
  | "basic_reports"
  | "email_auth"
  | "branding"
  | "custom_domain"
  | "microsoft_sso"
  | "rls"
  | "crisp_chat"
  | "api_access"
  | "multi_workspace"
  | "advanced_analytics"
  | "meta_dashboard"
  | "priority_support"
  | "sla"
  | "dedicated_support"
  | "custom_integrations";

const TIER_FEATURES: Record<PlanId, Feature[]> = {
  starter: ["basic_reports", "email_auth", "branding", "multi_workspace"],
  business: [
    "basic_reports",
    "email_auth",
    "branding",
    "multi_workspace",
    "custom_domain",
    "microsoft_sso",
    "rls",
    "crisp_chat",
    "api_access",
    "meta_dashboard",
  ],
  scale: [
    "basic_reports",
    "email_auth",
    "branding",
    "multi_workspace",
    "custom_domain",
    "microsoft_sso",
    "rls",
    "crisp_chat",
    "api_access",
    "meta_dashboard",
    "advanced_analytics",
    "priority_support",
  ],
  enterprise: [
    "basic_reports",
    "email_auth",
    "branding",
    "multi_workspace",
    "custom_domain",
    "microsoft_sso",
    "rls",
    "crisp_chat",
    "api_access",
    "meta_dashboard",
    "advanced_analytics",
    "priority_support",
    "sla",
    "dedicated_support",
    "custom_integrations",
  ],
};

// ─── Minimum plan per feature (voor upgrade CTA) ───
const MINIMUM_PLAN_FOR_FEATURE: Partial<Record<Feature, PlanId>> = {
  custom_domain: "business",
  microsoft_sso: "business",
  rls: "business",
  crisp_chat: "business",
  api_access: "business",
  meta_dashboard: "business",
  multi_workspace: "starter", // Werkruimtes zijn onbeperkt voor alle tiers
  advanced_analytics: "scale",
  priority_support: "scale",
  sla: "enterprise",
  dedicated_support: "enterprise",
  custom_integrations: "enterprise",
};

/**
 * Tenant type voor feature gating.
 * Minimale subset van tenant data die nodig is.
 */
interface TenantForGating {
  subscription_plan: string;
  subscription_status?: string;
  trial_ends_at?: string | null;
}

/**
 * Check of een trial actief is.
 */
export function isTrialActive(tenant: TenantForGating): boolean {
  if (tenant.subscription_status !== "trialing") return false;
  if (!tenant.trial_ends_at) return false;
  return new Date(tenant.trial_ends_at) > new Date();
}

/**
 * Bereken het aantal resterende trial dagen.
 */
export function getTrialDaysRemaining(tenant: TenantForGating): number {
  if (!tenant.trial_ends_at) return 0;
  const diff = new Date(tenant.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check of een tenant een specifieke feature mag gebruiken.
 * Tijdens een actieve trial zijn ALLE features beschikbaar.
 */
export function canUseFeature(
  tenant: TenantForGating,
  feature: string
): boolean {
  // Tijdens trial: alle features beschikbaar
  if (isTrialActive(tenant)) return true;

  // Check of subscription actief is
  if (
    tenant.subscription_status &&
    !["active", "trialing"].includes(tenant.subscription_status)
  ) {
    return false;
  }

  const plan = tenant.subscription_plan as PlanId;
  const features = TIER_FEATURES[plan] || TIER_FEATURES.starter;
  return features.includes(feature as Feature);
}

/**
 * Haal alle features op voor een plan.
 */
export function getPlanFeatures(plan: string): string[] {
  return TIER_FEATURES[plan as PlanId] || TIER_FEATURES.starter;
}

/**
 * Haal het minimum plan op dat nodig is voor een feature.
 * Gebruikt voor upgrade CTAs.
 */
export function getMinimumPlanForFeature(feature: string): PlanId | null {
  return MINIMUM_PLAN_FOR_FEATURE[feature as Feature] || null;
}

/**
 * Haal de naam op van het minimum plan voor een feature.
 */
export function getUpgradePlanName(feature: string): string {
  const plan = getMinimumPlanForFeature(feature);
  if (!plan) return "Business";

  const names: Record<PlanId, string> = {
    starter: "Starter",
    business: "Business",
    scale: "Scale",
    enterprise: "Enterprise",
  };
  return names[plan];
}

/**
 * Check of een plan limiet bereikt is.
 * Geeft true als de limiet bereikt of overschreden is.
 */
export function isLimitReached(
  currentCount: number,
  limit: number
): boolean {
  if (limit === -1) return false; // Unlimited
  return currentCount >= limit;
}

/**
 * Check of een plan hoger of gelijk is aan een ander plan.
 */
export function isPlanAtLeast(currentPlan: string, requiredPlan: string): boolean {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan as PlanId);
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan as PlanId);
  if (currentIndex === -1 || requiredIndex === -1) return false;
  return currentIndex >= requiredIndex;
}

// ─── Meta sync frequentie per tier ───

type SyncSchedule = "manual" | "hourly" | "twice_daily" | "daily" | "weekly";

const SYNC_SCHEDULES_BY_PLAN: Record<PlanId, SyncSchedule[]> = {
  starter: ["manual"], // Geen meta dashboard, maar veilige fallback
  business: ["manual", "daily", "weekly"],
  scale: ["manual", "hourly", "twice_daily", "daily", "weekly"],
  enterprise: ["manual", "hourly", "twice_daily", "daily", "weekly"],
};

/**
 * Haal de toegestane sync-frequenties op voor een plan.
 */
export function getAllowedSyncSchedules(plan: string): SyncSchedule[] {
  return SYNC_SCHEDULES_BY_PLAN[plan as PlanId] || SYNC_SCHEDULES_BY_PLAN.starter;
}

/**
 * Check of een sync-frequentie is toegestaan voor een plan.
 */
export function isSyncScheduleAllowed(plan: string, schedule: string): boolean {
  const allowed = getAllowedSyncSchedules(plan);
  return allowed.includes(schedule as SyncSchedule);
}

/**
 * Haal het minimum plan op dat nodig is voor een sync-frequentie.
 */
export function getMinPlanForSchedule(schedule: string): PlanId {
  if (schedule === "hourly" || schedule === "twice_daily") return "scale";
  if (schedule === "daily" || schedule === "weekly") return "business";
  return "starter";
}
