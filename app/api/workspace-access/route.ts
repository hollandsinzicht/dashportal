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
    return { error: "Alleen admins kunnen toegang beheren", status: 403 };
  }

  return { currentUser, serviceClient };
}

/**
 * POST /api/workspace-access
 *
 * Grant of revoke workspace-niveau toegang.
 * Body: { workspaceId, userId, tenantId, action: "grant" | "revoke" }
 */
export async function POST(req: NextRequest) {
  try {
    const { workspaceId, userId, tenantId, action } = await req.json();

    if (!workspaceId || !userId || !tenantId || !action) {
      return NextResponse.json(
        { error: "workspaceId, userId, tenantId en action zijn verplicht" },
        { status: 400 }
      );
    }

    if (!["grant", "revoke"].includes(action)) {
      return NextResponse.json(
        { error: "Action moet 'grant' of 'revoke' zijn" },
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

    // Controleer dat workspace bij tenant hoort
    const { data: workspace } = await serviceClient
      .from("workspaces")
      .select("id, name")
      .eq("id", workspaceId)
      .eq("tenant_id", tenantId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace niet gevonden" },
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

    if (action === "grant") {
      const { error: upsertError } = await serviceClient
        .from("workspace_access")
        .upsert(
          {
            workspace_id: workspaceId,
            user_id: userId,
            granted_by: currentUser.id,
            granted_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,user_id" }
        );

      if (upsertError) {
        console.error("[workspace-access] Grant fout:", upsertError);
        return NextResponse.json(
          { error: "Kon toegang niet verlenen" },
          { status: 500 }
        );
      }

      await logActivity({
        serviceClient,
        tenantId,
        actorId: currentUser.id,
        action: "workspace_access.granted",
        targetType: "workspace",
        targetId: workspaceId,
        metadata: { userId, userEmail: targetUser.email, workspace: workspace.name },
      });
    } else {
      const { error: deleteError } = await serviceClient
        .from("workspace_access")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("[workspace-access] Revoke fout:", deleteError);
        return NextResponse.json(
          { error: "Kon toegang niet intrekken" },
          { status: 500 }
        );
      }

      await logActivity({
        serviceClient,
        tenantId,
        actorId: currentUser.id,
        action: "workspace_access.revoked",
        targetType: "workspace",
        targetId: workspaceId,
        metadata: { userId, userEmail: targetUser.email, workspace: workspace.name },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[workspace-access] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
