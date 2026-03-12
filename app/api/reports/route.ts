import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftToken, getReportsInWorkspace } from "@/lib/powerbi/token";
import { decrypt } from "@/lib/utils/encryption";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, workspaceId } = await req.json();

    if (!tenantId || !workspaceId) {
      return NextResponse.json(
        { error: "tenantId en workspaceId zijn verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth: sessie + admin check ───
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

    const accessToken = await getMicrosoftToken({
      tenantId: tenant.pbi_tenant_id,
      clientId: tenant.pbi_client_id,
      clientSecret: decrypt(tenant.pbi_client_secret),
    });

    const reports = await getReportsInWorkspace(accessToken, workspaceId);

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Kon rapporten niet ophalen",
      },
      { status: 500 }
    );
  }
}
