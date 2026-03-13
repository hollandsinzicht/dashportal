import { createServiceClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/tenant/queries";
import { getTenantUsage, type TenantUsage } from "@/lib/tenant/usage";
import { PLAN_CONFIG, type PlanId } from "@/lib/stripe/config";

// ─── Types ───

export interface TenantWithCounts {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  custom_domain: string | null;
  pbi_tenant_id: string | null;
  pbi_client_id: string | null;
  subscription_plan: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  cancel_reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Agency
  agency_id: string | null;
  // Aggregated
  user_count: number;
  report_count: number;
  workspace_count: number;
  admin_email: string | null;
  admin_name: string | null;
  agency_name: string | null;
  agency_slug: string | null;
}

export interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  mrr: number;
  trialsExpiringSoon: number;
}

export interface TenantDetail {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantById>>>;
  users: TenantUser[];
  reportCount: number;
  workspaceCount: number;
  activity: ActivityLogEntry[];
  usage: TenantUsage;
}

export interface TenantUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  auth_provider: string | null;
  azure_oid: string | null;
  azure_department: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  details: Record<string, string> | null;
  created_at: string;
}

// ─── Queries ───

/**
 * Haal alle tenants op met aggregated counts.
 * Gebruikt 5 parallelle queries (efficiënt, geen N+1).
 */
export async function getTenantsWithCounts(): Promise<TenantWithCounts[]> {
  const supabase = await createServiceClient();

  const [tenantsRes, usersRes, reportsRes, workspacesRes, adminsRes, agenciesRes] =
    await Promise.all([
      supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("is_active", true),
      supabase.from("reports").select("tenant_id"),
      supabase
        .from("workspaces")
        .select("tenant_id")
        .eq("is_active", true),
      supabase
        .from("tenant_users")
        .select("tenant_id, email, name")
        .eq("role", "admin")
        .eq("is_active", true),
      supabase
        .from("agencies")
        .select("id, name, slug"),
    ]);

  const tenants = tenantsRes.data || [];
  const allUsers = usersRes.data || [];
  const allReports = reportsRes.data || [];
  const allWorkspaces = workspacesRes.data || [];
  const allAdmins = adminsRes.data || [];
  const allAgencies = agenciesRes.data || [];

  // Agency lookup map
  const agencyMap = new Map<string, { name: string; slug: string }>();
  for (const agency of allAgencies) {
    agencyMap.set(agency.id, { name: agency.name, slug: agency.slug });
  }

  // Group counts by tenant_id
  const userCounts = groupCount(allUsers, "tenant_id");
  const reportCounts = groupCount(allReports, "tenant_id");
  const workspaceCounts = groupCount(allWorkspaces, "tenant_id");

  // Get first admin per tenant
  const adminMap = new Map<string, { email: string; name: string | null }>();
  for (const admin of allAdmins) {
    if (!adminMap.has(admin.tenant_id)) {
      adminMap.set(admin.tenant_id, {
        email: admin.email,
        name: admin.name,
      });
    }
  }

  return tenants.map((t) => {
    const admin = adminMap.get(t.id);
    const agency = t.agency_id ? agencyMap.get(t.agency_id) : null;
    return {
      ...t,
      subscription_plan: t.subscription_plan || "starter",
      subscription_status: t.subscription_status || "trialing",
      cancel_at_period_end: t.cancel_at_period_end || false,
      user_count: userCounts.get(t.id) || 0,
      report_count: reportCounts.get(t.id) || 0,
      workspace_count: workspaceCounts.get(t.id) || 0,
      admin_email: admin?.email || null,
      admin_name: admin?.name || null,
      agency_name: agency?.name || null,
      agency_slug: agency?.slug || null,
    };
  });
}

/**
 * Bereken platform-brede statistieken.
 * Pure functie — geen DB call.
 */
export function getPlatformStats(tenants: TenantWithCounts[]): PlatformStats {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let totalUsers = 0;
  let mrr = 0;
  let trialsExpiringSoon = 0;

  for (const t of tenants) {
    totalUsers += t.user_count;

    // MRR: actieve + trialing tenants
    if (t.subscription_status === "active" || t.subscription_status === "trialing") {
      const plan = PLAN_CONFIG[t.subscription_plan as PlanId];
      if (plan) {
        mrr += plan.price;
      }
    }

    // Trials die binnen 7 dagen aflopen
    if (t.subscription_status === "trialing" && t.trial_ends_at) {
      const trialEnd = new Date(t.trial_ends_at);
      if (trialEnd <= sevenDaysFromNow && trialEnd >= now) {
        trialsExpiringSoon++;
      }
    }
  }

  return {
    totalTenants: tenants.length,
    totalUsers,
    mrr,
    trialsExpiringSoon,
  };
}

/**
 * Haal gedetailleerde tenant informatie op voor de detail pagina.
 */
export async function getTenantDetail(
  id: string
): Promise<TenantDetail | null> {
  const tenant = await getTenantById(id);
  if (!tenant) return null;

  const supabase = await createServiceClient();

  const [usersRes, reportsRes, workspacesRes, activityRes, usage] =
    await Promise.all([
      supabase
        .from("tenant_users")
        .select(
          "id, name, email, role, auth_provider, azure_oid, azure_department, is_active, created_at"
        )
        .eq("tenant_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", id),
      supabase
        .from("workspaces")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", id)
        .eq("is_active", true),
      supabase
        .from("activity_log")
        .select("id, action, details, created_at")
        .eq("tenant_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      getTenantUsage(supabase, id, tenant.subscription_plan || "starter"),
    ]);

  return {
    tenant,
    users: (usersRes.data || []) as TenantUser[],
    reportCount: reportsRes.count || 0,
    workspaceCount: workspacesRes.count || 0,
    activity: (activityRes.data || []) as ActivityLogEntry[],
    usage,
  };
}

// ─── Helpers ───

function groupCount(
  rows: { tenant_id: string }[],
  key: "tenant_id"
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row[key], (map.get(row[key]) || 0) + 1);
  }
  return map;
}
