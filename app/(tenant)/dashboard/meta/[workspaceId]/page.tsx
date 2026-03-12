import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MetaDetailTabs } from "@/components/meta/MetaDetailTabs";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default async function MetaWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: pbiWorkspaceId } = await params;

  // ─── Auth + tenant context ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role")
    .eq("email", user.email!)
    .limit(1)
    .maybeSingle();

  if (!tenantUser || tenantUser.role !== "admin") redirect("/");

  const tenantId = tenantUser.tenant_id;
  const serviceClient = await createServiceClient();

  // ─── Workspace info ───
  const { data: workspace } = await serviceClient
    .from("meta_workspaces")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("pbi_workspace_id", pbiWorkspaceId)
    .single();

  if (!workspace) notFound();

  // ─── Reports ───
  const { data: reports } = await serviceClient
    .from("meta_reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("pbi_workspace_id", pbiWorkspaceId)
    .order("name", { ascending: true });

  // ─── Datasets ───
  const { data: datasets } = await serviceClient
    .from("meta_datasets")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("pbi_workspace_id", pbiWorkspaceId)
    .order("name", { ascending: true });

  // ─── Refresh history ───
  const { data: refreshHistory } = await serviceClient
    .from("meta_refresh_history")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("pbi_workspace_id", pbiWorkspaceId)
    .order("start_time", { ascending: false });

  // ─── Recent activity (report_views) ───
  const sixtyDaysAgo = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000
  ).toISOString();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Haal reports uit de reports tabel die bij deze workspace horen
  const { data: portalReports } = await serviceClient
    .from("reports")
    .select("id, pbi_report_id")
    .eq("tenant_id", tenantId)
    .eq("pbi_workspace_id", pbiWorkspaceId);

  const portalReportIds = (portalReports || []).map((r) => r.id);

  // Haal report views op voor de rapporten in deze workspace
  let recentViews: { user_id: string; report_id: string; viewed_at: string }[] = [];
  if (portalReportIds.length > 0) {
    const { data: views } = await serviceClient
      .from("report_views")
      .select("user_id, report_id, viewed_at")
      .eq("tenant_id", tenantId)
      .in("report_id", portalReportIds)
      .gte("viewed_at", sixtyDaysAgo);
    recentViews = views || [];
  }

  // Map portal report_id → pbi_report_id
  const portalToPbi = new Map(
    (portalReports || []).map((r) => [r.id, r.pbi_report_id])
  );

  // Bereken gebruikers per PBI report (30d en 60d)
  const reportUsers30 = new Map<string, Set<string>>();
  const reportUsers60 = new Map<string, Set<string>>();

  for (const view of recentViews) {
    const pbiReportId = portalToPbi.get(view.report_id);
    if (!pbiReportId || !view.user_id) continue;

    if (!reportUsers60.has(pbiReportId)) reportUsers60.set(pbiReportId, new Set());
    reportUsers60.get(pbiReportId)!.add(view.user_id);

    if (view.viewed_at >= thirtyDaysAgo) {
      if (!reportUsers30.has(pbiReportId)) reportUsers30.set(pbiReportId, new Set());
      reportUsers30.get(pbiReportId)!.add(view.user_id);
    }
  }

  // Eigenaar per rapport (via dataset configured_by)
  const datasetOwner = new Map(
    (datasets || [])
      .filter((d) => d.configured_by)
      .map((d) => [d.pbi_dataset_id, d.configured_by as string])
  );

  // Laatste refresh per rapport (via dataset)
  const datasetRefresh = new Map(
    (datasets || [])
      .filter((d) => d.last_refresh_at)
      .map((d) => [d.pbi_dataset_id, { status: d.last_refresh_status, at: d.last_refresh_at }])
  );

  // Verrijk rapporten met extra info
  const enrichedReports = (reports || []).map((r) => ({
    ...r,
    owner: r.dataset_id ? datasetOwner.get(r.dataset_id) || null : null,
    users30d: reportUsers30.get(r.pbi_report_id)?.size || 0,
    users60d: reportUsers60.get(r.pbi_report_id)?.size || 0,
    lastRefreshStatus: r.dataset_id
      ? datasetRefresh.get(r.dataset_id)?.status || null
      : null,
    lastRefreshAt: r.dataset_id
      ? datasetRefresh.get(r.dataset_id)?.at || null
      : null,
  }));

  // Activity log
  const { data: activityLog } = await serviceClient
    .from("activity_log")
    .select("action, target_id, metadata, created_at")
    .eq("tenant_id", tenantId)
    .eq("action", "report.viewed")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/meta"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar overzicht
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
              {workspace.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge
                variant={workspace.state === "Active" ? "success" : "warning"}
              >
                {workspace.state || "Onbekend"}
              </Badge>
              <span className="text-sm text-text-secondary">
                {workspace.report_count} rapporten · {workspace.dataset_count}{" "}
                datasets
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <MetaDetailTabs
        reports={enrichedReports}
        datasets={datasets || []}
        refreshHistory={refreshHistory || []}
        recentViews={activityLog || []}
      />
    </div>
  );
}
