import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";

/**
 * GET /api/meta/workspace/[id]?tenantId=xxx
 *
 * Geeft gecachte reports, datasets en refresh history voor een workspace.
 * [id] = pbi_workspace_id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pbiWorkspaceId } = await params;
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

    // Workspace info
    const { data: workspace } = await serviceClient
      .from("meta_workspaces")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("pbi_workspace_id", pbiWorkspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace niet gevonden" },
        { status: 404 }
      );
    }

    // Reports
    const { data: reports } = await serviceClient
      .from("meta_reports")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("pbi_workspace_id", pbiWorkspaceId)
      .order("name", { ascending: true });

    // Datasets
    const { data: datasets } = await serviceClient
      .from("meta_datasets")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("pbi_workspace_id", pbiWorkspaceId)
      .order("name", { ascending: true });

    // Refresh history voor alle datasets in deze workspace
    const { data: refreshHistory } = await serviceClient
      .from("meta_refresh_history")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("pbi_workspace_id", pbiWorkspaceId)
      .order("start_time", { ascending: false });

    // Recente report views (activiteitsdata)
    const { data: recentViews } = await serviceClient
      .from("activity_log")
      .select("action, target_id, metadata, created_at")
      .eq("tenant_id", tenantId)
      .eq("action", "report.viewed")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      workspace,
      reports: reports || [],
      datasets: datasets || [],
      refreshHistory: refreshHistory || [],
      recentViews: recentViews || [],
    });
  } catch (error) {
    console.error("Meta workspace detail error:", error);
    return NextResponse.json(
      { error: "Kon workspace details niet ophalen" },
      { status: 500 }
    );
  }
}
