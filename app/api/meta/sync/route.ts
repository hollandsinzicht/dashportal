import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getMicrosoftToken, getWorkspaces, getReportsInWorkspace } from "@/lib/powerbi/token";
import {
  getDatasets,
  getDatasetRefreshHistory,
  getDatasetDatasources,
} from "@/lib/powerbi/meta";
import { decrypt } from "@/lib/utils/encryption";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";

const SYNC_TTL_HOURS = 6;

/**
 * POST /api/meta/sync
 *
 * Synchroniseert Power BI metadata (workspaces, reports, datasets, refresh history)
 * naar lokale cache tabellen.
 *
 * Body: { tenantId: string, force?: boolean }
 */
export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const { tenantId, force = false } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      );
    }
    const { serviceClient } = ctx;

    // ─── TTL check ───
    if (!force) {
      const { data: lastSync } = await serviceClient
        .from("meta_sync_log")
        .select("completed_at")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSync?.completed_at) {
        const elapsed =
          Date.now() - new Date(lastSync.completed_at).getTime();
        const ttlMs = SYNC_TTL_HOURS * 60 * 60 * 1000;
        if (elapsed < ttlMs) {
          return NextResponse.json({
            success: true,
            skipped: true,
            message: `Laatste sync was ${Math.round(elapsed / 60000)} minuten geleden. Gebruik force=true om opnieuw te synchroniseren.`,
            lastSyncedAt: lastSync.completed_at,
          });
        }
      }
    }

    // ─── Create sync log entry ───
    const { data: syncLog } = await serviceClient
      .from("meta_sync_log")
      .insert({ tenant_id: tenantId, status: "running" })
      .select("id")
      .single();

    // ─── Tenant + PBI credentials ───
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select(
        "id, pbi_tenant_id, pbi_client_id, pbi_client_secret, pbi_workspace_ids"
      )
      .eq("id", tenantId)
      .single();

    if (!tenant?.pbi_tenant_id || !tenant?.pbi_client_id || !tenant?.pbi_client_secret) {
      await updateSyncLog(serviceClient, syncLog?.id, "failed", "Power BI niet geconfigureerd");
      return NextResponse.json(
        { error: "Power BI is niet geconfigureerd voor deze tenant" },
        { status: 400 }
      );
    }

    const accessToken = await getMicrosoftToken({
      tenantId: tenant.pbi_tenant_id,
      clientId: tenant.pbi_client_id,
      clientSecret: decrypt(tenant.pbi_client_secret),
    });

    // ─── Fetch workspaces ───
    const pbiWorkspaces = await getWorkspaces(accessToken);
    const selectedIds = new Set<string>(tenant.pbi_workspace_ids || []);

    // Filter alleen geselecteerde workspaces (of neem alle als geen filter)
    const targetWorkspaces =
      selectedIds.size > 0
        ? pbiWorkspaces.filter((ws: { id: string }) => selectedIds.has(ws.id))
        : pbiWorkspaces;

    let totalReports = 0;
    let totalDatasets = 0;

    // ─── Per workspace: sync reports, datasets, refresh history ───
    for (const ws of targetWorkspaces) {
      try {
        // Reports
        const reports = await getReportsInWorkspace(accessToken, ws.id);
        totalReports += reports.length;

        if (reports.length > 0) {
          const reportRows = reports.map(
            (r: { id: string; name: string; datasetId?: string; reportType?: string; webUrl?: string; modifiedDateTime?: string }) => ({
              tenant_id: tenantId,
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

          await serviceClient
            .from("meta_reports")
            .upsert(reportRows, { onConflict: "tenant_id,pbi_report_id" });
        }

        // Datasets
        const datasets = await getDatasets(accessToken, ws.id);
        totalDatasets += datasets.length;

        for (const ds of datasets) {
          // Datasources count
          const datasources = await getDatasetDatasources(
            accessToken,
            ws.id,
            ds.id
          );

          // Refresh history (top 5)
          const refreshHistory = await getDatasetRefreshHistory(
            accessToken,
            ws.id,
            ds.id,
            5
          );

          const lastRefresh = refreshHistory.length > 0 ? refreshHistory[0] : null;

          // Upsert dataset
          await serviceClient.from("meta_datasets").upsert(
            {
              tenant_id: tenantId,
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

          // Upsert refresh history
          if (refreshHistory.length > 0) {
            const historyRows = refreshHistory.map((rh) => ({
              tenant_id: tenantId,
              pbi_workspace_id: ws.id,
              pbi_dataset_id: ds.id,
              refresh_type: rh.refreshType || null,
              status: rh.status || null,
              start_time: rh.startTime || null,
              end_time: rh.endTime || null,
              error_message: rh.serviceExceptionJson || null,
              synced_at: new Date().toISOString(),
            }));

            // Verwijder oude history voor deze dataset en insert nieuwe
            await serviceClient
              .from("meta_refresh_history")
              .delete()
              .eq("tenant_id", tenantId)
              .eq("pbi_dataset_id", ds.id);

            await serviceClient
              .from("meta_refresh_history")
              .insert(historyRows);
          }
        }

        // Upsert workspace meta
        await serviceClient.from("meta_workspaces").upsert(
          {
            tenant_id: tenantId,
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
        console.error(`Meta sync error for workspace ${ws.id}:`, err);
        // Continue met volgende workspace
      }
    }

    // ─── Update sync log ───
    const duration = Date.now() - start;
    await serviceClient
      .from("meta_sync_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        workspace_count: targetWorkspaces.length,
        report_count: totalReports,
        dataset_count: totalDatasets,
      })
      .eq("id", syncLog?.id);

    return NextResponse.json({
      success: true,
      synced: {
        workspaces: targetWorkspaces.length,
        reports: totalReports,
        datasets: totalDatasets,
      },
      duration: `${(duration / 1000).toFixed(1)}s`,
    });
  } catch (error) {
    console.error("Meta sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Metadata synchronisatie mislukt",
      },
      { status: 500 }
    );
  }
}

// Helper om sync log te updaten bij fouten
async function updateSyncLog(
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
  syncLogId: string | undefined,
  status: string,
  errorMessage: string
) {
  if (!syncLogId) return;
  await serviceClient
    .from("meta_sync_log")
    .update({ status, error_message: errorMessage, completed_at: new Date().toISOString() })
    .eq("id", syncLogId);
}
