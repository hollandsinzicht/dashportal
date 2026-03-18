import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Verifieer dat de huidige gebruiker de super admin is.
 */
async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.email !== process.env.SUPER_ADMIN_EMAIL) return null;
  return user;
}

/**
 * PATCH /api/admin/users/[id]
 *
 * Wijzig een tenant_user record (deactiveren, activeren, rol wijzigen).
 * Body: { action: "deactivate" | "activate" | "change_role", role?: string }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifySuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const { id } = await params;
    const { action, role } = await req.json();
    const serviceClient = await createServiceClient();

    if (action === "deactivate") {
      const { error } = await serviceClient
        .from("tenant_users")
        .update({ is_active: false })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Gebruiker gedeactiveerd" });
    }

    if (action === "activate") {
      const { error } = await serviceClient
        .from("tenant_users")
        .update({ is_active: true })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Gebruiker geactiveerd" });
    }

    if (action === "change_role" && role) {
      const validRoles = ["admin", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
      }

      const { error } = await serviceClient
        .from("tenant_users")
        .update({ role })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: `Rol gewijzigd naar ${role}` });
    }

    return NextResponse.json({ error: "Ongeldige actie" }, { status: 400 });
  } catch (error) {
    console.error("[admin/users] PATCH fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Verwijder een tenant_user record permanent.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifySuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const { id } = await params;
    const serviceClient = await createServiceClient();

    const { error } = await serviceClient
      .from("tenant_users")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Gebruiker verwijderd" });
  } catch (error) {
    console.error("[admin/users] DELETE fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
