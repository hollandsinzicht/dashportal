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
    return { error: "Alleen admins kunnen workspaces beheren", status: 403 };
  }

  return { currentUser, serviceClient };
}

const ALLOWED_FIELDS = [
  "thumbnail_url",
  "name",
  "description",
  "sort_order",
];

/**
 * PATCH /api/workspaces/[id]
 *
 * Update workspace instellingen (thumbnail, naam, beschrijving, volgorde).
 * Body: { tenantId, thumbnail_url?, name?, description?, sort_order? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const body = await req.json();
    const { tenantId, ...fields } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
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
      .select("id, tenant_id, name")
      .eq("id", workspaceId)
      .eq("tenant_id", tenantId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace niet gevonden" },
        { status: 404 }
      );
    }

    // Filter alleen toegestane velden
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) {
        updates[key] = fields[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Geen wijzigingen opgegeven" },
        { status: 400 }
      );
    }

    const { error: updateError } = await serviceClient
      .from("workspaces")
      .update(updates)
      .eq("id", workspaceId);

    if (updateError) {
      console.error("[workspaces/patch] Update fout:", updateError);
      return NextResponse.json(
        { error: "Kon workspace niet bijwerken" },
        { status: 500 }
      );
    }

    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "workspace.updated",
      targetType: "workspace",
      targetId: workspaceId,
      metadata: { name: workspace.name, changes: Object.keys(updates) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[workspaces/patch] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
