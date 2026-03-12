import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftToken, generateEmbedToken } from "@/lib/powerbi/token";
import { decrypt } from "@/lib/utils/encryption";
import { getUserContext, isAuthError } from "@/lib/auth/validate";

export async function POST(req: NextRequest) {
  try {
    const { reportId, tenantId } = await req.json();

    if (!reportId || !tenantId) {
      return NextResponse.json(
        { error: "reportId en tenantId zijn verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth: sessie + tenant membership ───
    const ctx = await getUserContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const { tenantUser, serviceClient: supabase } = ctx;
    const userId = tenantUser.id;

    // ─── 1. Tenant config ophalen ───
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("pbi_tenant_id, pbi_client_id, pbi_client_secret")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error("[embed-token] Tenant niet gevonden:", tenantError?.message);
      return NextResponse.json(
        { error: "Tenant niet gevonden" },
        { status: 404 }
      );
    }

    if (!tenant.pbi_tenant_id || !tenant.pbi_client_id || !tenant.pbi_client_secret) {
      console.error("[embed-token] Power BI niet geconfigureerd voor tenant:", tenantId);
      return NextResponse.json(
        {
          error: "Power BI is niet geconfigureerd. Controleer de Azure AD / app registratie instellingen.",
          detail: {
            hasTenantId: !!tenant.pbi_tenant_id,
            hasClientId: !!tenant.pbi_client_id,
            hasClientSecret: !!tenant.pbi_client_secret,
          },
        },
        { status: 400 }
      );
    }

    // ─── 2. Rapport ophalen ───
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id, pbi_report_id, pbi_workspace_id, pbi_dataset_id, rls_type, workspace_id")
      .eq("id", reportId)
      .eq("tenant_id", tenantId)
      .single();

    if (reportError || !report) {
      console.error("[embed-token] Rapport niet gevonden:", reportError?.message);
      return NextResponse.json(
        { error: "Rapport niet gevonden" },
        { status: 404 }
      );
    }

    // ─── 3. Toegangscheck ───
    // access_type kolom bestaat mogelijk nog niet — treat als "all_users"
    const accessType = (report as Record<string, unknown>).access_type as string | undefined || "all_users";

    // 3a. Admin-only: alleen admins mogen dit rapport zien
    if (accessType === "admin_only" && tenantUser.role !== "admin") {
      return NextResponse.json(
        { error: "Dit rapport is alleen beschikbaar voor admins" },
        { status: 403 }
      );
    }

    // 3b. Specific users: controleer report_access tabel (admins altijd toegang)
    if (accessType === "specific_users" && tenantUser.role !== "admin") {
      const { data: reportAccess } = await supabase
        .from("report_access")
        .select("id")
        .eq("report_id", reportId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!reportAccess) {
        return NextResponse.json(
          { error: "Geen toegang tot dit rapport" },
          { status: 403 }
        );
      }
    }

    // 3c. Workspace-level check (aanvullend op rapport-level)
    if (report.workspace_id) {
      const { data: access } = await supabase
        .from("workspace_access")
        .select("id")
        .eq("workspace_id", report.workspace_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!access) {
        return NextResponse.json(
          { error: "Geen toegang tot dit rapport" },
          { status: 403 }
        );
      }
    }

    // ─── 4. RLS config ───
    let rlsIdentity;
    if (report.rls_type === "row" && userId) {
      const { data: rlsRole } = await supabase
        .from("rls_roles")
        .select("role_name, role_value")
        .eq("user_id", userId)
        .eq("report_id", reportId)
        .maybeSingle();

      if (rlsRole && report.pbi_dataset_id) {
        rlsIdentity = {
          username: rlsRole.role_value,
          roles: [rlsRole.role_name],
          datasets: [{ id: report.pbi_dataset_id }],
        };
      }
    }

    // ─── 5. Microsoft access token ophalen ───
    let clientSecret: string;
    try {
      clientSecret = decrypt(tenant.pbi_client_secret);
    } catch (decryptError) {
      console.error("[embed-token] Client secret decryptie mislukt:", decryptError);
      return NextResponse.json(
        { error: "Client secret kon niet worden ontsleuteld. Configureer de Power BI koppeling opnieuw." },
        { status: 500 }
      );
    }

    if (!clientSecret) {
      console.error("[embed-token] Client secret is leeg na decryptie");
      return NextResponse.json(
        { error: "Client secret is leeg na ontsleuteling. Configureer de Power BI koppeling opnieuw." },
        { status: 500 }
      );
    }

    let accessToken: string;
    try {
      accessToken = await getMicrosoftToken({
        tenantId: tenant.pbi_tenant_id,
        clientId: tenant.pbi_client_id,
        clientSecret,
      });
    } catch (tokenError) {
      console.error("[embed-token] Microsoft token fout:", tokenError);
      return NextResponse.json(
        {
          error: `Microsoft authenticatie mislukt: ${tokenError instanceof Error ? tokenError.message : "Onbekende fout"}`,
        },
        { status: 502 }
      );
    }

    if (!accessToken) {
      console.error("[embed-token] Microsoft token is leeg");
      return NextResponse.json(
        { error: "Microsoft access token is leeg. Controleer de app registratie." },
        { status: 502 }
      );
    }

    // ─── 6. Power BI embed token genereren ───
    let embedResult: { token: string; expiration: string };
    try {
      embedResult = await generateEmbedToken({
        reportId: report.pbi_report_id,
        workspaceId: report.pbi_workspace_id,
        accessToken,
        datasetId: report.pbi_dataset_id,
        rlsIdentity,
      });
    } catch (embedError) {
      console.error("[embed-token] Embed token generatie mislukt:", embedError);
      return NextResponse.json(
        {
          error: `Embed token kon niet worden gegenereerd: ${embedError instanceof Error ? embedError.message : "Onbekende fout"}`,
        },
        { status: 502 }
      );
    }

    if (!embedResult?.token) {
      console.error("[embed-token] Embed token is leeg. Response:", JSON.stringify(embedResult));
      return NextResponse.json(
        { error: "Power BI gaf een lege embed token terug. Controleer of de service principal toegang heeft tot de workspace." },
        { status: 502 }
      );
    }

    console.log("[embed-token] Succes! Token gegenereerd voor rapport:", report.pbi_report_id);

    return NextResponse.json({
      token: embedResult.token,
      expiration: embedResult.expiration,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${report.pbi_report_id}&groupId=${report.pbi_workspace_id}`,
      pbiReportId: report.pbi_report_id,
    });
  } catch (error) {
    console.error("[embed-token] Onverwachte fout:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kon embed token niet genereren",
      },
      { status: 500 }
    );
  }
}
