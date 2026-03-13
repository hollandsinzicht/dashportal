import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getMicrosoftToken, getDatasetRoles } from "@/lib/powerbi/token";
import { decrypt } from "@/lib/utils/encryption";

/**
 * GET /api/reports/[id]/rls-detect
 *
 * Detecteert of het Power BI dataset van dit rapport RLS-rollen heeft.
 * Alleen voor admins — geen tenantId nodig in de request, wordt afgeleid uit het rapport.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;

    // ─── Auth: gebruiker moet ingelogd zijn ───
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { hasRoles: null, roles: [], error: "not_authenticated" },
        { status: 401 }
      );
    }

    const serviceClient = await createServiceClient();

    // ─── Rapport ophalen ───
    const { data: report, error: reportError } = await serviceClient
      .from("reports")
      .select("id, tenant_id, pbi_workspace_id, pbi_dataset_id")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { hasRoles: null, roles: [], error: "report_not_found" },
        { status: 404 }
      );
    }

    // ─── Admin check ───
    const { data: tenantUser } = await serviceClient
      .from("tenant_users")
      .select("id, role")
      .eq("tenant_id", report.tenant_id)
      .eq("email", user.email!)
      .eq("is_active", true)
      .single();

    if (!tenantUser || tenantUser.role !== "admin") {
      return NextResponse.json(
        { hasRoles: null, roles: [], error: "not_admin" },
        { status: 403 }
      );
    }

    // ─── Dataset ID check ───
    if (!report.pbi_dataset_id) {
      return NextResponse.json({
        hasRoles: null,
        roles: [],
        error: "no_dataset_id",
      });
    }

    // ─── Tenant Power BI config ophalen ───
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select("pbi_tenant_id, pbi_client_id, pbi_client_secret")
      .eq("id", report.tenant_id)
      .single();

    if (
      !tenant?.pbi_tenant_id ||
      !tenant?.pbi_client_id ||
      !tenant?.pbi_client_secret
    ) {
      return NextResponse.json({
        hasRoles: null,
        roles: [],
        error: "no_pbi_config",
      });
    }

    // ─── Microsoft token + RLS rollen ophalen ───
    let clientSecret: string;
    try {
      clientSecret = decrypt(tenant.pbi_client_secret);
    } catch {
      return NextResponse.json({
        hasRoles: null,
        roles: [],
        error: "decrypt_error",
      });
    }

    const accessToken = await getMicrosoftToken({
      tenantId: tenant.pbi_tenant_id,
      clientId: tenant.pbi_client_id,
      clientSecret,
    });

    const datasetRoles = await getDatasetRoles(
      accessToken,
      report.pbi_workspace_id,
      report.pbi_dataset_id
    );

    const roleNames = datasetRoles.map((r) => r.name);

    return NextResponse.json({
      hasRoles: roleNames.length > 0,
      roles: roleNames,
      datasetId: report.pbi_dataset_id,
    });
  } catch (error) {
    console.error("[rls-detect] Fout:", error);
    return NextResponse.json({
      hasRoles: null,
      roles: [],
      error: "api_error",
    });
  }
}
