import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.email !== process.env.SUPER_ADMIN_EMAIL) return null;
  return user;
}

/**
 * PATCH /api/admin/tenants/[id]
 *
 * Wijzig tenant status (archiveren, activeren, opschorten).
 * Body: { action: "archive" | "activate" | "suspend" }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifySuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();
    const serviceClient = await createServiceClient();

    if (action === "archive") {
      // Deactiveer tenant + alle users
      await serviceClient
        .from("tenant_users")
        .update({ is_active: false })
        .eq("tenant_id", id);

      const { error } = await serviceClient
        .from("tenants")
        .update({ is_active: false, subscription_status: "canceled" })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Tenant gearchiveerd" });
    }

    if (action === "activate") {
      const { error } = await serviceClient
        .from("tenants")
        .update({ is_active: true, subscription_status: "active" })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Tenant geactiveerd" });
    }

    if (action === "suspend") {
      const { error } = await serviceClient
        .from("tenants")
        .update({ subscription_status: "suspended" })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Tenant opgeschort" });
    }

    return NextResponse.json({ error: "Ongeldige actie" }, { status: 400 });
  } catch (error) {
    console.error("[admin/tenants] PATCH fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
