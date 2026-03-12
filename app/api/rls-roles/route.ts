import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";

// ─── Admin auth helper ───
async function getAdminContext(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();
  const { data: currentUser } = await serviceClient
    .from("tenant_users")
    .select("id, role, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Alleen admins kunnen RLS beheren", status: 403 };
  }

  return { currentUser, serviceClient };
}

/**
 * POST /api/rls-roles
 *
 * Upsert een RLS-rol mapping voor een gebruiker op een rapport.
 * Body: { reportId, userId, tenantId, roleName, roleValue }
 */
export async function POST(req: NextRequest) {
  try {
    const { reportId, userId, tenantId, roleName, roleValue } =
      await req.json();

    if (!reportId || !userId || !tenantId || !roleName) {
      return NextResponse.json(
        { error: "reportId, userId, tenantId en roleName zijn verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if ("error" in ctx) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      );
    }
    const { currentUser, serviceClient } = ctx;

    // Controleer dat rapport bij tenant hoort
    const { data: report } = await serviceClient
      .from("reports")
      .select("id, title")
      .eq("id", reportId)
      .eq("tenant_id", tenantId)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: "Rapport niet gevonden" },
        { status: 404 }
      );
    }

    // Controleer dat gebruiker bij tenant hoort
    const { data: targetUser } = await serviceClient
      .from("tenant_users")
      .select("id, email")
      .eq("id", userId)
      .eq("tenant_id", tenantId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Upsert RLS-rol (UNIQUE constraint op user_id + report_id)
    const { error: upsertError } = await serviceClient
      .from("rls_roles")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          report_id: reportId,
          role_name: roleName,
          role_value: roleValue || "",
        },
        {
          onConflict: "user_id,report_id",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error("[rls-roles] Upsert fout:", upsertError);
      return NextResponse.json(
        { error: "Kon RLS-rol niet opslaan" },
        { status: 500 }
      );
    }

    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "rls.configured",
      targetType: "report",
      targetId: reportId,
      metadata: {
        userId,
        userEmail: targetUser.email,
        roleName,
        roleValue: roleValue || "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[rls-roles] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rls-roles
 *
 * Verwijder een RLS-rol mapping.
 * Body: { reportId, userId, tenantId }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { reportId, userId, tenantId } = await req.json();

    if (!reportId || !userId || !tenantId) {
      return NextResponse.json(
        { error: "reportId, userId en tenantId zijn verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if ("error" in ctx) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      );
    }
    const { currentUser, serviceClient } = ctx;

    // Controleer dat rapport bij tenant hoort
    const { data: report } = await serviceClient
      .from("reports")
      .select("id, title")
      .eq("id", reportId)
      .eq("tenant_id", tenantId)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: "Rapport niet gevonden" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await serviceClient
      .from("rls_roles")
      .delete()
      .eq("user_id", userId)
      .eq("report_id", reportId);

    if (deleteError) {
      console.error("[rls-roles] Delete fout:", deleteError);
      return NextResponse.json(
        { error: "Kon RLS-rol niet verwijderen" },
        { status: 500 }
      );
    }

    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "rls.removed",
      targetType: "report",
      targetId: reportId,
      metadata: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[rls-roles/delete] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
