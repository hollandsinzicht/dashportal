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
    return { error: "Alleen admins kunnen rapporten beheren", status: 403 };
  }

  return { currentUser, serviceClient };
}

// Toegestane velden voor updates
const ALLOWED_FIELDS = [
  "rls_type",
  "rls_role_field",
  "access_type",
  "category",
  "is_published",
  "title",
  "description",
  "thumbnail_url",
];

// ─── PATCH: Rapport instellingen wijzigen ───
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
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

    // Controleer dat het rapport bij deze tenant hoort
    const { data: report } = await serviceClient
      .from("reports")
      .select("id, tenant_id, title")
      .eq("id", reportId)
      .eq("tenant_id", tenantId)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: "Rapport niet gevonden" },
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

    // Validatie: rls_type moet "none" of "row" zijn
    if (updates.rls_type !== undefined) {
      const validTypes = ["none", "row"];
      if (!validTypes.includes(updates.rls_type as string)) {
        return NextResponse.json(
          { error: "Ongeldig RLS type. Gebruik 'none' of 'row'." },
          { status: 400 }
        );
      }
    }

    // Validatie: access_type moet "all_users", "specific_users" of "admin_only" zijn
    if (updates.access_type !== undefined) {
      const validAccessTypes = ["all_users", "specific_users", "admin_only"];
      if (!validAccessTypes.includes(updates.access_type as string)) {
        return NextResponse.json(
          { error: "Ongeldig access type. Gebruik 'all_users', 'specific_users' of 'admin_only'." },
          { status: 400 }
        );
      }
    }

    // Update rapport
    const { error: updateError } = await serviceClient
      .from("reports")
      .update(updates)
      .eq("id", reportId);

    if (updateError) {
      console.error("[reports/patch] Update fout:", updateError);
      return NextResponse.json(
        { error: "Kon rapport niet bijwerken" },
        { status: 500 }
      );
    }

    // Activity logging
    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "report.updated",
      targetType: "report",
      targetId: reportId,
      metadata: { title: report.title, changes: Object.keys(updates) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reports/patch] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
