import { createServiceClient } from "@/lib/supabase/server";
import { calculateTierPrice } from "./pricing";
import type {
  Agency,
  AgencyUser,
  AgencyClient,
  AgencyDashboardStats,
  AgencyPricingTier,
  AgencyInvoiceLine,
  AgencyWithCounts,
} from "./types";

// ─── Agency ophalen ────────────────────────────────────────

export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Agency;
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Agency;
}

// ─── Agency Users ──────────────────────────────────────────

export async function getAgencyUsers(agencyId: string): Promise<AgencyUser[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("agency_users")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data as AgencyUser[];
}

export async function getAgencyUserByEmail(
  agencyId: string,
  email: string
): Promise<AgencyUser | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("agency_users")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as AgencyUser;
}

// ─── Clients (Tenants van een agency) ──────────────────────

export async function getAgencyClients(
  agencyId: string
): Promise<AgencyClient[]> {
  const supabase = await createServiceClient();

  // Haal tenants op die bij deze agency horen
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url, subscription_status, subscription_plan, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error || !tenants) return [];

  // Haal pricing tiers op voor real-time berekening
  const { data: tiers } = await supabase
    .from("agency_pricing_tiers")
    .select("min_users, max_users, price_per_month, label")
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true });

  // Tel users en reports per tenant
  const clients: AgencyClient[] = await Promise.all(
    tenants.map(async (tenant) => {
      const [userCount, reportCount] = await Promise.all([
        supabase
          .from("tenant_users")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .then(({ count }) => count ?? 0),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("is_published", true)
          .then(({ count }) => count ?? 0),
      ]);

      // Real-time tier berekening op basis van actieve users
      let monthlyCost = 0;
      let tierLabel: string | null = null;

      if (tiers && tiers.length > 0) {
        const tierResult = calculateTierPrice(userCount, tiers);
        monthlyCost = tierResult.price;
        tierLabel = tierResult.label;
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        subscription_status: tenant.subscription_status,
        subscription_plan: tenant.subscription_plan,
        user_count: userCount,
        report_count: reportCount,
        monthly_cost: monthlyCost,
        tier_label: tierLabel,
        created_at: tenant.created_at,
      } satisfies AgencyClient;
    })
  );

  return clients;
}

// ─── Dashboard Stats ───────────────────────────────────────

export async function getAgencyDashboardStats(
  agencyId: string
): Promise<AgencyDashboardStats> {
  const supabase = await createServiceClient();

  // Alle klant-tenants van deze agency
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, subscription_status")
    .eq("agency_id", agencyId);

  const allTenants = tenants || [];
  const tenantIds = allTenants.map((t) => t.id);

  // Actieve en trial klanten
  const activeClients = allTenants.filter(
    (t) => t.subscription_status === "active"
  ).length;
  const trialClients = allTenants.filter(
    (t) => t.subscription_status === "trialing"
  ).length;

  // Totaal users over alle klant-tenants
  let totalUsers = 0;
  if (tenantIds.length > 0) {
    const { count } = await supabase
      .from("tenant_users")
      .select("id", { count: "exact", head: true })
      .in("tenant_id", tenantIds)
      .eq("is_active", true);
    totalUsers = count ?? 0;
  }

  // Maandelijks omzet: real-time berekend op basis van users + tiers
  let monthlyRevenue = 0;
  if (tenantIds.length > 0) {
    const { data: tiers } = await supabase
      .from("agency_pricing_tiers")
      .select("min_users, max_users, price_per_month, label")
      .eq("agency_id", agencyId)
      .order("sort_order", { ascending: true });

    if (tiers && tiers.length > 0) {
      // Tel users per tenant en bereken tier
      for (const tenantId of tenantIds) {
        const { count } = await supabase
          .from("tenant_users")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("is_active", true);
        const tierResult = calculateTierPrice(count ?? 0, tiers);
        monthlyRevenue += tierResult.price;
      }
    }
  }

  return {
    total_clients: allTenants.length,
    active_clients: activeClients,
    total_users: totalUsers,
    monthly_revenue: monthlyRevenue,
    trial_clients: trialClients,
  };
}

// ─── Pricing Tiers ─────────────────────────────────────────

export async function getAgencyPricingTiers(
  agencyId: string
): Promise<AgencyPricingTier[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("agency_pricing_tiers")
    .select("*")
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data as AgencyPricingTier[];
}

// ─── Invoice Lines ─────────────────────────────────────────

export async function getAgencyInvoiceLines(
  agencyId: string,
  limit = 50
): Promise<AgencyInvoiceLine[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("agency_invoice_lines")
    .select("*")
    .eq("agency_id", agencyId)
    .order("period_end", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as AgencyInvoiceLine[];
}

// ─── Super Admin queries ──────────────────────────────────

export async function getAllAgenciesWithCounts(): Promise<AgencyWithCounts[]> {
  const supabase = await createServiceClient();

  const { data: agencies, error } = await supabase
    .from("agencies")
    .select("id, slug, name, owner_email, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error || !agencies) return [];

  const result: AgencyWithCounts[] = await Promise.all(
    agencies.map(async (agency) => {
      // Haal tenants + tiers op
      const [tenantsRes, tiersRes] = await Promise.all([
        supabase.from("tenants").select("id").eq("agency_id", agency.id),
        supabase.from("agency_pricing_tiers").select("min_users, max_users, price_per_month, label").eq("agency_id", agency.id).order("sort_order", { ascending: true }),
      ]);

      const tenantIds = (tenantsRes.data || []).map((t) => t.id);
      const tiers = tiersRes.data || [];
      const clientCount = tenantIds.length;

      // Tel users
      let totalUsers = 0;
      if (tenantIds.length > 0) {
        const { count } = await supabase
          .from("tenant_users")
          .select("id", { count: "exact", head: true })
          .in("tenant_id", tenantIds)
          .eq("is_active", true);
        totalUsers = count ?? 0;
      }

      // Real-time MRR berekening
      let monthlyRevenue = 0;
      if (tiers.length > 0 && tenantIds.length > 0) {
        for (const tid of tenantIds) {
          const { count } = await supabase
            .from("tenant_users")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid)
            .eq("is_active", true);
          const tierResult = calculateTierPrice(count ?? 0, tiers);
          monthlyRevenue += tierResult.price;
        }
      }

      return {
        id: agency.id,
        slug: agency.slug,
        name: agency.name,
        owner_email: agency.owner_email,
        is_active: agency.is_active,
        client_count: clientCount,
        total_users: totalUsers,
        monthly_revenue: monthlyRevenue,
        created_at: agency.created_at,
      } satisfies AgencyWithCounts;
    })
  );

  return result;
}

/**
 * Check of een agency slug al bestaat.
 */
export async function isAgencySlugTaken(slug: string): Promise<boolean> {
  const supabase = await createServiceClient();
  const { count } = await supabase
    .from("agencies")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);

  return (count ?? 0) > 0;
}
