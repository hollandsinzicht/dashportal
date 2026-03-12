import { NextRequest, NextResponse } from "next/server";
import {
  getMicrosoftToken,
  getReportsInWorkspace,
  getWorkspaceById,
} from "@/lib/powerbi/token";
import { decrypt } from "@/lib/utils/encryption";
import { logActivity } from "@/lib/activity/log";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";

/**
 * POST /api/reports/sync
 *
 * Syncs reports from Power BI workspaces into the local database.
 * - Fetches all reports from the tenant's selected workspaces
 * - Upserts them into the `reports` table
 * - Grants the admin user access to all synced reports
 *
 * Body: { tenantId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth: sessie + admin check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const { currentUser, serviceClient: supabase } = ctx;

    // 1. Fetch tenant with Power BI config + workspace IDs
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select(
        "id, pbi_tenant_id, pbi_client_id, pbi_client_secret, pbi_workspace_ids"
      )
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant niet gevonden" },
        { status: 404 }
      );
    }

    if (!tenant.pbi_tenant_id || !tenant.pbi_client_id || !tenant.pbi_client_secret) {
      return NextResponse.json(
        { error: "Power BI is niet geconfigureerd voor deze tenant" },
        { status: 400 }
      );
    }

    const workspaceIds: string[] = tenant.pbi_workspace_ids || [];
    if (workspaceIds.length === 0) {
      return NextResponse.json(
        { error: "Geen workspaces geselecteerd" },
        { status: 400 }
      );
    }

    // 2. Get Power BI access token
    const accessToken = await getMicrosoftToken({
      tenantId: tenant.pbi_tenant_id,
      clientId: tenant.pbi_client_id,
      clientSecret: decrypt(tenant.pbi_client_secret),
    });

    // 3. Upsert workspaces (haal namen op uit Power BI)
    const workspacesToUpsert: {
      tenant_id: string;
      pbi_workspace_id: string;
      name: string;
    }[] = [];

    for (const wsId of workspaceIds) {
      try {
        const wsInfo = await getWorkspaceById(accessToken, wsId);
        workspacesToUpsert.push({
          tenant_id: tenantId,
          pbi_workspace_id: wsId,
          name: wsInfo.name,
        });
      } catch (err) {
        console.error(`Workspace ${wsId} ophalen mislukt:`, err);
        workspacesToUpsert.push({
          tenant_id: tenantId,
          pbi_workspace_id: wsId,
          name: `Workspace ${wsId.substring(0, 8)}`,
        });
      }
    }

    const { data: upsertedWorkspaces, error: wsUpsertError } = await supabase
      .from("workspaces")
      .upsert(workspacesToUpsert, {
        onConflict: "tenant_id,pbi_workspace_id",
        ignoreDuplicates: false,
      })
      .select("id, pbi_workspace_id");

    if (wsUpsertError) {
      console.error("Workspace upsert error:", wsUpsertError);
      // Continue — workspaces zijn niet kritiek voor reports sync
    }

    // Lookup map: pbi_workspace_id -> local UUID
    const wsMap = new Map(
      upsertedWorkspaces?.map((ws) => [ws.pbi_workspace_id, ws.id]) || []
    );

    // 4. Fetch reports from all selected workspaces
    const allReports: {
      pbi_workspace_id: string;
      pbi_report_id: string;
      pbi_dataset_id: string | null;
      title: string;
    }[] = [];

    for (const wsId of workspaceIds) {
      try {
        const reports = await getReportsInWorkspace(accessToken, wsId);
        for (const report of reports) {
          allReports.push({
            pbi_workspace_id: wsId,
            pbi_report_id: report.id,
            pbi_dataset_id: report.datasetId || null,
            title: report.name,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch reports for workspace ${wsId}:`, err);
      }
    }

    if (allReports.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "Geen rapporten gevonden in de geselecteerde workspaces",
      });
    }

    // 5. Upsert reports into database (nu met workspace_id FK)
    const reportsToUpsert = allReports.map((r, index) => ({
      tenant_id: tenantId,
      pbi_workspace_id: r.pbi_workspace_id,
      pbi_report_id: r.pbi_report_id,
      pbi_dataset_id: r.pbi_dataset_id,
      title: r.title,
      sort_order: index,
      is_published: true,
      workspace_id: wsMap.get(r.pbi_workspace_id) || null,
    }));

    const { data: upsertedReports, error: upsertError } = await supabase
      .from("reports")
      .upsert(reportsToUpsert, {
        onConflict: "tenant_id,pbi_report_id",
        ignoreDuplicates: false,
      })
      .select("id");

    if (upsertError) {
      console.error("Report upsert error:", upsertError);
      return NextResponse.json(
        { error: `Kon rapporten niet opslaan: ${upsertError.message}` },
        { status: 500 }
      );
    }

    // 5b. Repair: vul ontbrekende workspace_id in op bestaande reports
    if (upsertedWorkspaces && upsertedWorkspaces.length > 0) {
      for (const ws of upsertedWorkspaces) {
        const pbiWsId = workspacesToUpsert.find(
          (w) => wsMap.get(w.pbi_workspace_id) === ws.id
        )?.pbi_workspace_id;

        if (pbiWsId) {
          await supabase
            .from("reports")
            .update({ workspace_id: ws.id })
            .eq("tenant_id", tenantId)
            .eq("pbi_workspace_id", pbiWsId)
            .is("workspace_id", null);
        }
      }
    }

    // 6. Grant admin user(s) workspace_access (vervangt report_access)
    const { data: adminUsers } = await supabase
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("role", "admin")
      .eq("is_active", true);

    if (adminUsers && adminUsers.length > 0 && upsertedWorkspaces) {
      const accessRecords = [];
      for (const admin of adminUsers) {
        for (const ws of upsertedWorkspaces) {
          accessRecords.push({
            workspace_id: ws.id,
            user_id: admin.id,
            granted_by: admin.id,
          });
        }
      }

      if (accessRecords.length > 0) {
        const { error: accessError } = await supabase
          .from("workspace_access")
          .upsert(accessRecords, {
            onConflict: "workspace_id,user_id",
            ignoreDuplicates: true,
          });

        if (accessError) {
          console.error("Workspace access upsert error:", accessError);
        }
      }
    }

    // Activity logging
    try {
      await logActivity({
        serviceClient: supabase,
        tenantId,
        actorId: currentUser.id,
        action: "report.synced",
        targetType: "report",
        metadata: { count: String(upsertedReports?.length || 0) },
      });
    } catch {
      // Activity logging mag niet falen
    }

    return NextResponse.json({
      success: true,
      synced: upsertedReports?.length || 0,
      message: `${upsertedReports?.length || 0} rapport(en) gesynchroniseerd`,
    });
  } catch (error) {
    console.error("Report sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kon rapporten niet synchroniseren",
      },
      { status: 500 }
    );
  }
}
