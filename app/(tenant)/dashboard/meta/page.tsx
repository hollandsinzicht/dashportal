import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MetaSyncButton } from "@/components/meta/MetaSyncButton";
import { MetaKPIBar } from "@/components/meta/MetaKPIBar";
import { MetaAlerts } from "@/components/meta/MetaAlerts";
import { MetaWorkspaceTable } from "@/components/meta/MetaWorkspaceTable";
import { MetaScheduleSelector } from "@/components/meta/MetaScheduleSelector";
import { getAllowedSyncSchedules } from "@/lib/features/gates";
import { Activity } from "lucide-react";
import { calculateHygieneScore } from "@/lib/powerbi/hygiene";
import { HygieneScoreWidget } from "@/components/meta/HygieneScoreWidget";

export default async function MetaDashboardPage() {
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

  // ─── Data ophalen uit cache ───
  const { data: workspaces } = await serviceClient
    .from("meta_workspaces")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  const { data: datasets } = await serviceClient
    .from("meta_datasets")
    .select(
      "pbi_dataset_id, pbi_workspace_id, name, configured_by, is_refreshable, last_refresh_status, last_refresh_at, last_refresh_error"
    )
    .eq("tenant_id", tenantId);

  const { data: lastSync } = await serviceClient
    .from("meta_sync_log")
    .select("completed_at")
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ─── Tenant sync schedule + plan ophalen ───
  const { data: tenantData } = await serviceClient
    .from("tenants")
    .select("meta_sync_schedule, subscription_plan")
    .eq("id", tenantId)
    .single();

  const syncSchedule = tenantData?.meta_sync_schedule || "manual";
  const tenantPlan = tenantData?.subscription_plan || "starter";
  const allowedSchedules = getAllowedSyncSchedules(tenantPlan);

  // ─── Aggregaties ───
  const lastSyncedAt = lastSync?.completed_at || null;
  const allWorkspaces = workspaces || [];
  const allDatasets = datasets || [];

  // Gezondheid per workspace berekenen
  const now = Date.now();
  const healthMap = new Map<
    string,
    {
      failedRefreshCount: number;
      staleDatasetCount: number;
      failedDatasetNames: string[];
      staleDatasetNames: string[];
    }
  >();

  for (const ds of allDatasets) {
    if (!healthMap.has(ds.pbi_workspace_id)) {
      healthMap.set(ds.pbi_workspace_id, {
        failedRefreshCount: 0,
        staleDatasetCount: 0,
        failedDatasetNames: [],
        staleDatasetNames: [],
      });
    }
    const h = healthMap.get(ds.pbi_workspace_id)!;

    // Gefaalde refresh
    if (ds.last_refresh_status === "Failed") {
      h.failedRefreshCount++;
      h.failedDatasetNames.push(ds.name);
    }

    // Verouderde dataset (> 72 uur niet ververst)
    if (ds.last_refresh_at) {
      const hoursSinceRefresh =
        (now - new Date(ds.last_refresh_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceRefresh > 72) {
        h.staleDatasetCount++;
        h.staleDatasetNames.push(ds.name);
      }
    }
  }

  const defaultHealth = {
    failedRefreshCount: 0,
    staleDatasetCount: 0,
    failedDatasetNames: [],
    staleDatasetNames: [],
  };

  // Verrijkte workspace data (met gezondheid)
  const enrichedWorkspaces = allWorkspaces.map((ws) => ({
    ...ws,
    health: healthMap.get(ws.pbi_workspace_id) || defaultHealth,
  }));

  const totalReports = allWorkspaces.reduce(
    (s, w) => s + (w.report_count || 0),
    0
  );
  const totalDatasets = allWorkspaces.reduce(
    (s, w) => s + (w.dataset_count || 0),
    0
  );
  const failedRefreshes = allDatasets.filter(
    (d) => d.last_refresh_status === "Failed"
  ).length;

  const isEmpty = allWorkspaces.length === 0;

  // ─── Hygiene Score berekenen ───
  const hygieneScore = calculateHygieneScore(allDatasets, allWorkspaces);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Meta Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Overzicht van je Power BI omgeving
          </p>
        </div>
        <MetaSyncButton tenantId={tenantId} lastSyncedAt={lastSyncedAt} />
      </div>

      {/* Schedule Selector */}
      <MetaScheduleSelector
        tenantId={tenantId}
        currentSchedule={syncSchedule}
        plan={tenantPlan}
        allowedSchedules={allowedSchedules}
      />

      {isEmpty ? (
        /* Empty state */
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <Activity className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
            Nog geen metadata
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Klik op &quot;Ververs metadata&quot; om de gegevens van je Power BI
            omgeving op te halen. Dit synchroniseert werkruimtes, rapporten,
            datasets en vernieuwingsgeschiedenis.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Bar */}
          <MetaKPIBar
            totalWorkspaces={allWorkspaces.length}
            totalReports={totalReports}
            totalDatasets={totalDatasets}
            failedRefreshes={failedRefreshes}
          />

          {/* Hygiene Score */}
          <HygieneScoreWidget score={hygieneScore} />

          {/* Alerts */}
          <MetaAlerts datasets={allDatasets} lastSyncedAt={lastSyncedAt} />

          {/* Workspace Table */}
          <div>
            <h2 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
              Werkruimtes
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Klik op een werkruimte voor gedetailleerde informatie over
              rapporten, datasets en vernieuwingsgeschiedenis.
            </p>
            <MetaWorkspaceTable workspaces={enrichedWorkspaces} />
          </div>
        </>
      )}
    </div>
  );
}
