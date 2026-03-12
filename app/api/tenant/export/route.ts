import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { logActivity } from "@/lib/activity/log";

/**
 * GET /api/tenant/export?tenantId=xxx
 *
 * GDPR data export — download alle tenant data als JSON.
 * Bevat: tenant info, gebruikers, rapporten, werkruimtes,
 * rapport-toegang, RLS rollen, rapport views, activiteitslog.
 *
 * Gevoelige velden (pbi_client_secret) worden NIET meegegeven.
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

    // ─── Auth check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const { currentUser, serviceClient } = ctx;

    // ─── Alle data parallel ophalen ───
    const [
      tenantResult,
      usersResult,
      reportsResult,
      workspacesResult,
      reportAccessResult,
      rlsRolesResult,
      reportViewsResult,
      activityResult,
    ] = await Promise.all([
      // Tenant (zonder gevoelige velden)
      serviceClient
        .from("tenants")
        .select(
          "id, slug, name, logo_url, primary_color, accent_color, custom_domain, subscription_plan, subscription_status, dpa_accepted_at, dpa_accepted_by, is_active, created_at, updated_at"
        )
        .eq("id", tenantId)
        .single(),

      // Gebruikers
      serviceClient
        .from("tenant_users")
        .select(
          "id, email, name, role, auth_provider, is_active, invited_at, last_login, created_at"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),

      // Rapporten
      serviceClient
        .from("reports")
        .select(
          "id, pbi_workspace_id, pbi_report_id, pbi_dataset_id, title, description, category, sort_order, access_type, rls_type, rls_role_field, is_published, created_at"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),

      // Werkruimtes
      serviceClient
        .from("workspaces")
        .select(
          "id, name, description, pbi_workspace_id, thumbnail_url, sort_order, is_active, created_at"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),

      // Rapport toegang
      serviceClient
        .from("report_access")
        .select("id, report_id, user_id, granted_at")
        .in(
          "report_id",
          (
            await serviceClient
              .from("reports")
              .select("id")
              .eq("tenant_id", tenantId)
          ).data?.map((r) => r.id) || []
        ),

      // RLS rollen
      serviceClient
        .from("rls_roles")
        .select("id, user_id, report_id, role_name, role_value, created_at")
        .eq("tenant_id", tenantId),

      // Rapport views (laatste 1000)
      serviceClient
        .from("report_views")
        .select("id, report_id, user_id, viewed_at")
        .eq("tenant_id", tenantId)
        .order("viewed_at", { ascending: false })
        .limit(1000),

      // Activiteitslog (laatste 1000)
      serviceClient
        .from("activity_log")
        .select("id, actor_id, action, target_type, target_id, metadata, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    // ─── Export samenstellen ───
    const exportData = {
      _meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.id,
        format: "DashPortal GDPR Data Export",
        version: "1.0",
      },
      tenant: tenantResult.data || null,
      users: usersResult.data || [],
      reports: reportsResult.data || [],
      workspaces: workspacesResult.data || [],
      reportAccess: reportAccessResult.data || [],
      rlsRoles: rlsRolesResult.data || [],
      reportViews: reportViewsResult.data || [],
      activityLog: activityResult.data || [],
    };

    // ─── Activity log ───
    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "tenant.exported",
      targetType: "tenant",
      targetId: tenantId,
      metadata: {
        userCount: (usersResult.data || []).length,
        reportCount: (reportsResult.data || []).length,
      },
    });

    // ─── JSON response als downloadbaar bestand ───
    const json = JSON.stringify(exportData, null, 2);
    const slug = tenantResult.data?.slug || "export";
    const date = new Date().toISOString().split("T")[0];
    const filename = `dashportal-export-${slug}-${date}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[tenant/export] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Kon data niet exporteren" },
      { status: 500 }
    );
  }
}
