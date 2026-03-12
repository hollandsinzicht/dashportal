import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getMicrosoftToken, getWorkspaces, getReportsInWorkspace } from "@/lib/powerbi/token";
import {
  getDatasets,
  getDatasetRefreshHistory,
  getDatasetDatasources,
} from "@/lib/powerbi/meta";
import { decrypt } from "@/lib/utils/encryption";

// ─── Schedule intervals in milliseconden ───
const SCHEDULE_INTERVALS: Record<string, number> = {
  hourly: 60 * 60 * 1000,           // 1 uur
  twice_daily: 12 * 60 * 60 * 1000, // 12 uur
  daily: 24 * 60 * 60 * 1000,       // 24 uur
  weekly: 7 * 24 * 60 * 60 * 1000,  // 7 dagen
};

/**
 * GET /api/cron/meta-sync
 *
 * Vercel Cron Job — wordt elke uur aangeroepen.
 * Zoekt tenants waarvan meta_next_sync_at in het verleden ligt
 * en voert voor elk een metadata sync uit.
 *
 * Beveiligd via CRON_SECRET header (Vercel stuurt dit automatisch).
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
  const now = new Date().toISOString();

  try {
    // ─── Vind tenants die een sync nodig hebben ───
    const { data: tenants, error: queryError } = await supabase
      .from("tenants")
      .select(
        "id, pbi_tenant_id, pbi_client_id, pbi_client_secret, pbi_workspace_ids, meta_sync_schedule"
      )
      .neq("meta_sync_schedule", "manual")
      .eq("is_active", true)
      .not("pbi_tenant_id", "is", null)
      .not("pbi_client_id", "is", null)
      .not("pbi_client_secret", "is", null)
      .lte("meta_next_sync_at", now);

    if (queryError) {
      console.error("[cron/meta-sync] Query error:", queryError);
      return NextResponse.json(
        { error: "Database query mislukt" },
        { status: 500 }
      );
    }

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Geen tenants om te synchroniseren",
        synced: 0,
      });
    }

    const results: Array<{ tenantId: string; success: boolean; error?: string }> = [];

    // ─── Per tenant sync uitvoeren ───
    for (const tenant of tenants) {
      try {
        await syncTenantMeta(supabase, tenant);

        // ─── Volgende sync berekenen ───
        const interval = SCHEDULE_INTERVALS[tenant.meta_sync_schedule] || SCHEDULE_INTERVALS.daily;
        const nextSync = new Date(Date.now() + interval).toISOString();

        await supabase
          .from("tenants")
          .update({ meta_next_sync_at: nextSync })
          .eq("id", tenant.id);

        results.push({ tenantId: tenant.id, success: true });
      } catch (err) {
        console.error(`[cron/meta-sync] Sync failed for tenant ${tenant.id}:`, err);
        results.push({
          tenantId: tenant.id,
          success: false,
          error: err instanceof Error ? err.message : "Onbekende fout",
        });

        // Plan retry over 1 uur (niet de volledige interval)
        const retryAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await supabase
          .from("tenants")
          .update({ meta_next_sync_at: retryAt })
          .eq("id", tenant.id);
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: tenants.length,
      results,
    });
  } catch (error) {
    console.error("[cron/meta-sync] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Cron job mislukt" },
      { status: 500 }
    );
  }
}

// ─── Sync helper voor één tenant ───
async function syncTenantMeta(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  tenant: {
    id: string;
    pbi_tenant_id: string;
    pbi_client_id: string;
    pbi_client_secret: string;
    pbi_workspace_ids: string[] | null;
  }
) {
  // Sync log aanmaken
  const { data: syncLog } = await supabase
    .from("meta_sync_log")
    .insert({ tenant_id: tenant.id, status: "running" })
    .select("id")
    .single();

  try {
    const accessToken = await getMicrosoftToken({
      tenantId: tenant.pbi_tenant_id,
      clientId: tenant.pbi_client_id,
      clientSecret: decrypt(tenant.pbi_client_secret),
    });

    const pbiWorkspaces = await getWorkspaces(accessToken);
    const selectedIds = new Set<string>(tenant.pbi_workspace_ids || []);
    const targetWorkspaces =
      selectedIds.size > 0
        ? pbiWorkspaces.filter((ws: { id: string }) => selectedIds.has(ws.id))
        : pbiWorkspaces;

    let totalReports = 0;
    let totalDatasets = 0;

    for (const ws of targetWorkspaces) {
      try {
        // Reports
        const reports = await getReportsInWorkspace(accessToken, ws.id);
        totalReports += reports.length;

        if (reports.length > 0) {
          const reportRows = reports.map(
            (r: { id: string; name: string; datasetId?: string; reportType?: string; webUrl?: string; modifiedDateTime?: string }) => ({
              tenant_id: tenant.id,
              pbi_workspace_id: ws.id,
              pbi_report_id: r.id,
              name: r.name,
              dataset_id: r.datasetId || null,
              report_type: r.reportType || null,
              web_url: r.webUrl || null,
              modified_at: r.modifiedDateTime || null,
              synced_at: new Date().toISOString(),
            })
          );

          await supabase
            .from("meta_reports")
            .upsert(reportRows, { onConflict: "tenant_id,pbi_report_id" });
        }

        // Datasets
        const datasets = await getDatasets(accessToken, ws.id);
        totalDatasets += datasets.length;

        for (const ds of datasets) {
          const datasources = await getDatasetDatasources(accessToken, ws.id, ds.id);
          const refreshHistory = await getDatasetRefreshHistory(accessToken, ws.id, ds.id, 5);
          const lastRefresh = refreshHistory.length > 0 ? refreshHistory[0] : null;

          await supabase.from("meta_datasets").upsert(
            {
              tenant_id: tenant.id,
              pbi_workspace_id: ws.id,
              pbi_dataset_id: ds.id,
              name: ds.name,
              configured_by: ds.configuredBy || null,
              is_refreshable: ds.isRefreshable,
              last_refresh_status: lastRefresh?.status || null,
              last_refresh_at: lastRefresh?.endTime || lastRefresh?.startTime || null,
              last_refresh_error: lastRefresh?.serviceExceptionJson || null,
              datasource_count: datasources.length,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,pbi_dataset_id" }
          );

          if (refreshHistory.length > 0) {
            const historyRows = refreshHistory.map((rh: { refreshType?: string; status?: string; startTime?: string; endTime?: string; serviceExceptionJson?: string }) => ({
              tenant_id: tenant.id,
              pbi_workspace_id: ws.id,
              pbi_dataset_id: ds.id,
              refresh_type: rh.refreshType || null,
              status: rh.status || null,
              start_time: rh.startTime || null,
              end_time: rh.endTime || null,
              error_message: rh.serviceExceptionJson || null,
              synced_at: new Date().toISOString(),
            }));

            await supabase
              .from("meta_refresh_history")
              .delete()
              .eq("tenant_id", tenant.id)
              .eq("pbi_dataset_id", ds.id);

            await supabase.from("meta_refresh_history").insert(historyRows);
          }
        }

        // Workspace meta
        await supabase.from("meta_workspaces").upsert(
          {
            tenant_id: tenant.id,
            pbi_workspace_id: ws.id,
            name: ws.name,
            state: ws.state || "Active",
            report_count: reports.length,
            dataset_count: datasets.length,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,pbi_workspace_id" }
        );
      } catch (err) {
        console.error(`[cron/meta-sync] Workspace ${ws.id} error:`, err);
      }
    }

    // Sync log updaten
    await supabase
      .from("meta_sync_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        workspace_count: targetWorkspaces.length,
        report_count: totalReports,
        dataset_count: totalDatasets,
      })
      .eq("id", syncLog?.id);
  } catch (err) {
    // Sync log falen
    await supabase
      .from("meta_sync_log")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : "Onbekende fout",
      })
      .eq("id", syncLog?.id);

    throw err;
  }
}
