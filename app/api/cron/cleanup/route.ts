import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/cleanup
 *
 * Vercel Cron Job — wordt dagelijks aangeroepen.
 * Verwijdert tenant data van accounts die > 30 dagen geleden geannuleerd zijn.
 *
 * Proces:
 * 1. Vind tenants met status "canceled" en canceled_at > 30 dagen geleden
 * 2. Verwijder alle gerelateerde data (cascade via FK)
 * 3. Markeer tenant als is_active = false (soft delete)
 * 4. Optioneel: verwijder tenant record volledig
 *
 * Beveiligd via CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  // ─── Cron authenticatie ───
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Niet geautoriseerd" },
      { status: 401 }
    );
  }

  const supabase = await createServiceClient();

  try {
    // 30 dagen geleden
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // ─── Vind tenants die opgeruimd moeten worden ───
    const { data: tenants, error: queryError } = await supabase
      .from("tenants")
      .select("id, name, slug, canceled_at")
      .eq("subscription_status", "canceled")
      .eq("is_active", true)
      .lte("canceled_at", thirtyDaysAgo);

    if (queryError) {
      console.error("[cron/cleanup] Query error:", queryError);
      return NextResponse.json(
        { error: "Database query mislukt" },
        { status: 500 }
      );
    }

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Geen tenants om op te ruimen",
        cleaned: 0,
      });
    }

    const results: Array<{
      tenantId: string;
      slug: string;
      success: boolean;
      error?: string;
    }> = [];

    // ─── Per tenant data opruimen ───
    for (const tenant of tenants) {
      try {
        await cleanupTenantData(supabase, tenant.id);

        results.push({
          tenantId: tenant.id,
          slug: tenant.slug,
          success: true,
        });

        console.log(
          `[cron/cleanup] Tenant ${tenant.slug} (${tenant.id}) succesvol opgeruimd`
        );
      } catch (err) {
        console.error(
          `[cron/cleanup] Cleanup failed voor ${tenant.slug}:`,
          err
        );
        results.push({
          tenantId: tenant.id,
          slug: tenant.slug,
          success: false,
          error: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    }

    return NextResponse.json({
      success: true,
      cleaned: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: tenants.length,
      results,
    });
  } catch (error) {
    console.error("[cron/cleanup] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Cleanup cron mislukt" },
      { status: 500 }
    );
  }
}

/**
 * Verwijder alle data van een tenant.
 *
 * Volgorde is belangrijk vanwege foreign key constraints.
 * Veel tabellen hebben ON DELETE CASCADE, maar we doen het
 * expliciet voor logging en controle.
 */
async function cleanupTenantData(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  tenantId: string
) {
  // 1. Activity log (geen FK cascade nodig)
  await supabase
    .from("activity_log")
    .delete()
    .eq("tenant_id", tenantId);

  // 2. Report views
  await supabase
    .from("report_views")
    .delete()
    .eq("tenant_id", tenantId);

  // 3. RLS roles
  await supabase
    .from("rls_roles")
    .delete()
    .eq("tenant_id", tenantId);

  // 4. Report access (via report_id FK cascade, maar expliciet)
  const { data: reports } = await supabase
    .from("reports")
    .select("id")
    .eq("tenant_id", tenantId);

  if (reports && reports.length > 0) {
    const reportIds = reports.map((r) => r.id);
    await supabase
      .from("report_access")
      .delete()
      .in("report_id", reportIds);
  }

  // 5. Reports
  await supabase
    .from("reports")
    .delete()
    .eq("tenant_id", tenantId);

  // 6. Workspace access
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .eq("tenant_id", tenantId);

  if (workspaces && workspaces.length > 0) {
    const wsIds = workspaces.map((w) => w.id);
    await supabase
      .from("workspace_access")
      .delete()
      .in("workspace_id", wsIds);
  }

  // 7. Workspaces
  await supabase
    .from("workspaces")
    .delete()
    .eq("tenant_id", tenantId);

  // 8. Meta tables (als ze bestaan)
  for (const table of [
    "meta_refresh_history",
    "meta_datasets",
    "meta_reports",
    "meta_workspaces",
    "meta_sync_log",
  ]) {
    try {
      await supabase.from(table).delete().eq("tenant_id", tenantId);
    } catch {
      // Tabel bestaat mogelijk niet — negeren
    }
  }

  // 9. Tenant users (deactiveer Supabase auth accounts niet — die kunnen bij andere tenants horen)
  await supabase
    .from("tenant_users")
    .delete()
    .eq("tenant_id", tenantId);

  // 10. Markeer tenant als inactief + wis gevoelige data
  await supabase
    .from("tenants")
    .update({
      is_active: false,
      pbi_client_secret: null,
      pbi_tenant_id: null,
      pbi_client_id: null,
      pbi_workspace_ids: null,
      logo_url: null,
      custom_domain: null,
    })
    .eq("id", tenantId);
}
