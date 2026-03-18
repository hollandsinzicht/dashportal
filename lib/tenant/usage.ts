import { type SupabaseClient } from "@supabase/supabase-js";
import { getPlanLimits, type PlanId } from "@/lib/stripe/config";

/**
 * Resultaat van getTenantUsage.
 */
export interface TenantUsage {
  currentUsers: number;
  maxUsers: number;         // -1 = unlimited
  remaining: number;        // -1 = unlimited
  percentageUsed: number;   // 0-100, 0 als unlimited
  isUnlimited: boolean;
}

/**
 * Haal het huidige gebruikersgebruik op voor een tenant.
 *
 * @param supabase - Supabase client (service role voor server, of authenticated client)
 * @param tenantId - Tenant UUID
 * @param plan     - Huidige plan (starter, business, scale, enterprise)
 */
export async function getTenantUsage(
  supabase: SupabaseClient,
  tenantId: string,
  plan: string
): Promise<TenantUsage> {
  // Haal actieve gebruikers count
  const { count } = await supabase
    .from("tenant_users")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const currentUsers = count ?? 0;

  // Check of tenant agency-managed is — dan geen harde limiet
  const { data: tenant } = await supabase
    .from("tenants")
    .select("agency_id")
    .eq("id", tenantId)
    .single();

  if (tenant?.agency_id) {
    // Agency-managed: onbeperkt users (agency betaalt per tier)
    return {
      currentUsers,
      maxUsers: -1,
      remaining: -1,
      percentageUsed: 0,
      isUnlimited: true,
    };
  }

  const limits = getPlanLimits(plan);
  const maxUsers = limits.users;
  const isUnlimited = maxUsers === -1;

  return {
    currentUsers,
    maxUsers,
    remaining: isUnlimited ? -1 : Math.max(0, maxUsers - currentUsers),
    percentageUsed: isUnlimited
      ? 0
      : maxUsers > 0
        ? Math.min(100, Math.round((currentUsers / maxUsers) * 100))
        : 0,
    isUnlimited,
  };
}

/**
 * Upgrade suggestie op basis van huidig plan.
 * Geeft het volgende plan terug met de gebruikerslimiet.
 */
export function getUpgradeSuggestion(
  plan: string
): { planName: string; planId: PlanId; userLimit: string } | null {
  switch (plan as PlanId) {
    case "starter":
      return { planName: "Business", planId: "business", userLimit: "50" };
    case "business":
      return { planName: "Scale", planId: "scale", userLimit: "200" };
    case "scale":
      return {
        planName: "Enterprise",
        planId: "enterprise",
        userLimit: "onbeperkt",
      };
    default:
      return null; // Enterprise heeft al unlimited
  }
}
