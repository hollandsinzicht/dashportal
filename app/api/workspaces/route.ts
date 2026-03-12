import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftToken, getWorkspaces, getReportsInWorkspace } from "@/lib/powerbi/token";
import { decrypt } from "@/lib/utils/encryption";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { isValidUUID } from "@/lib/utils/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, test, pbiTenantId, pbiClientId, pbiClientSecret } = body;

    let config: { tenantId: string; clientId: string; clientSecret: string };

    if (test && pbiTenantId && pbiClientId && pbiClientSecret) {
      // Testing met opgegeven credentials (onboarding stap 2)
      // Vereist wél een ingelogde gebruiker — maar nog geen tenant in DB
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
      }

      // UUID validatie vóór Microsoft token aanroep
      if (!isValidUUID(pbiTenantId)) {
        return NextResponse.json(
          { error: "Azure Tenant ID heeft geen geldig UUID formaat (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)" },
          { status: 400 }
        );
      }
      if (!isValidUUID(pbiClientId)) {
        return NextResponse.json(
          { error: "Application (Client) ID heeft geen geldig UUID formaat (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)" },
          { status: 400 }
        );
      }

      config = {
        tenantId: pbiTenantId,
        clientId: pbiClientId,
        clientSecret: pbiClientSecret,
      };
    } else if (tenantId) {
      // Opgeslagen credentials — admin check vereist
      const ctx = await getAdminContext(tenantId);
      if (isAuthError(ctx)) {
        return NextResponse.json({ error: ctx.error }, { status: ctx.status });
      }
      const { serviceClient } = ctx;

      const { data: tenant } = await serviceClient
        .from("tenants")
        .select("pbi_tenant_id, pbi_client_id, pbi_client_secret")
        .eq("id", tenantId)
        .single();

      if (!tenant?.pbi_tenant_id) {
        return NextResponse.json(
          { error: "Power BI niet geconfigureerd" },
          { status: 400 }
        );
      }

      config = {
        tenantId: tenant.pbi_tenant_id,
        clientId: tenant.pbi_client_id,
        clientSecret: decrypt(tenant.pbi_client_secret),
      };
    } else {
      return NextResponse.json(
        { error: "Ontbrekende gegevens" },
        { status: 400 }
      );
    }

    const accessToken = await getMicrosoftToken(config);
    const workspaces = await getWorkspaces(accessToken);

    // Optionally get report counts per workspace
    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (ws: { id: string; name: string }) => {
        try {
          const reports = await getReportsInWorkspace(accessToken, ws.id);
          return { ...ws, reportCount: reports.length };
        } catch {
          return { ...ws, reportCount: 0 };
        }
      })
    );

    return NextResponse.json({
      success: true,
      workspaces: workspacesWithCounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verbinding mislukt",
      },
      { status: 500 }
    );
  }
}
