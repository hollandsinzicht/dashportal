import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";

/**
 * GET /api/meta/workspaces?tenantId=xxx
 *
 * Geeft gecachte meta_workspaces + samenvattende stats + lastSyncedAt.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      );
    }
    const { serviceClient } = ctx;

    // Workspaces ophalen
    const { data: workspaces } = await serviceClient
      .from("meta_workspaces")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });

    // Summary stats
    const { data: datasets } = await serviceClient
      .from("meta_datasets")
      .select("last_refresh_status")
      .eq("tenant_id", tenantId);

    const totalReports =
      (workspaces || []).reduce((s, w) => s + (w.report_count || 0), 0);
    const totalDatasets =
      (workspaces || []).reduce((s, w) => s + (w.dataset_count || 0), 0);
    const failedRefreshes =
      (datasets || []).filter((d) => d.last_refresh_status === "Failed").length;

    // Laatste sync
    const { data: lastSync } = await serviceClient
      .from("meta_sync_log")
      .select("completed_at")
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      workspaces: workspaces || [],
      summary: {
        totalWorkspaces: (workspaces || []).length,
        totalReports,
        totalDatasets,
        failedRefreshes,
      },
      lastSyncedAt: lastSync?.completed_at || null,
    });
  } catch (error) {
    console.error("Meta workspaces fetch error:", error);
    return NextResponse.json(
      { error: "Kon metadata niet ophalen" },
      { status: 500 }
    );
  }
}
