import { createServiceClient } from "@/lib/supabase/server";
import { calculateTierPrice } from "./pricing";
import type { AgencyPricingTier } from "./types";

export interface AgencyBillingClient {
  tenantId: string;
  tenantName: string;
  userCount: number;
  price: number;
  tierLabel: string | null;
  isCustom: boolean;
}

export interface AgencyBillingResult {
  agencyId: string;
  agencyName: string;
  stripeCustomerId: string | null;
  clients: AgencyBillingClient[];
  total: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Bereken de maandelijkse facturatiegegevens voor alle actieve agencies.
 * Wordt gebruikt door de cron job om Stripe invoice items aan te maken.
 */
export async function calculateAllAgencyBilling(): Promise<AgencyBillingResult[]> {
  const supabase = await createServiceClient();

  // Alle actieve agencies ophalen
  const { data: agencies, error } = await supabase
    .from("agencies")
    .select("id, name, stripe_customer_id")
    .eq("is_active", true);

  if (error || !agencies) return [];

  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate()
  ).toISOString();

  const results: AgencyBillingResult[] = [];

  for (const agency of agencies) {
    const result = await calculateAgencyBilling(
      agency.id,
      agency.name,
      agency.stripe_customer_id,
      periodStart,
      periodEnd
    );
    if (result) results.push(result);
  }

  return results;
}

/**
 * Bereken de facturatie voor één agency.
 */
export async function calculateAgencyBilling(
  agencyId: string,
  agencyName: string,
  stripeCustomerId: string | null,
  periodStart: string,
  periodEnd: string
): Promise<AgencyBillingResult | null> {
  const supabase = await createServiceClient();

  // Pricing tiers ophalen
  const { data: tiers } = await supabase
    .from("agency_pricing_tiers")
    .select("*")
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true });

  if (!tiers || tiers.length === 0) return null;

  // Klant-tenants ophalen
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("agency_id", agencyId)
    .eq("billing_owner", "agency");

  if (!tenants || tenants.length === 0) return null;

  const clients: AgencyBillingClient[] = [];

  for (const tenant of tenants) {
    // Tel actieve gebruikers per tenant
    const { count } = await supabase
      .from("tenant_users")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    const userCount = count ?? 0;
    const tierResult = calculateTierPrice(
      userCount,
      tiers as AgencyPricingTier[]
    );

    clients.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      userCount,
      price: tierResult.price,
      tierLabel: tierResult.label,
      isCustom: tierResult.isCustom,
    });
  }

  const total = clients.reduce((sum, c) => sum + c.price, 0);

  return {
    agencyId,
    agencyName,
    stripeCustomerId,
    clients,
    total,
    periodStart,
    periodEnd,
  };
}

/**
 * Sla factuurregels op in de database.
 */
export async function saveInvoiceLines(
  agencyId: string,
  clients: AgencyBillingClient[],
  periodStart: string,
  periodEnd: string,
  stripeInvoiceItemIds: Record<string, string> = {}
): Promise<void> {
  const supabase = await createServiceClient();

  const rows = clients.map((client) => ({
    agency_id: agencyId,
    tenant_id: client.tenantId,
    period_start: periodStart,
    period_end: periodEnd,
    user_count: client.userCount,
    tier_label: client.tierLabel,
    amount: client.price,
    stripe_invoice_item_id: stripeInvoiceItemIds[client.tenantId] || null,
  }));

  await supabase.from("agency_invoice_lines").insert(rows);
}
