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
 * PATCH /api/admin/agencies/[id]
 *
 * Wijzig agency status — cascade naar alle klant-tenants.
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

    // Haal alle klant-tenants van deze agency op
    const { data: tenants } = await serviceClient
      .from("tenants")
      .select("id")
      .eq("agency_id", id);

    const tenantIds = (tenants || []).map((t) => t.id);

    if (action === "archive") {
      // 1. Deactiveer alle tenant_users van alle klant-tenants
      if (tenantIds.length > 0) {
        await serviceClient
          .from("tenant_users")
          .update({ is_active: false })
          .in("tenant_id", tenantIds);

        // 2. Deactiveer alle klant-tenants
        await serviceClient
          .from("tenants")
          .update({ is_active: false, subscription_status: "canceled" })
          .in("id", tenantIds);
      }

      // 3. Deactiveer alle agency_users
      await serviceClient
        .from("agency_users")
        .update({ is_active: false })
        .eq("agency_id", id);

      // 4. Deactiveer de agency zelf
      const { error } = await serviceClient
        .from("agencies")
        .update({ is_active: false })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      console.log(`[admin/agencies] Agency ${id} gearchiveerd met ${tenantIds.length} klant(en)`);
      return NextResponse.json({
        success: true,
        message: `Agency gearchiveerd inclusief ${tenantIds.length} klant(en)`,
        tenantsAffected: tenantIds.length,
      });
    }

    if (action === "suspend") {
      // Schort alle klant-tenants op
      if (tenantIds.length > 0) {
        await serviceClient
          .from("tenants")
          .update({ subscription_status: "suspended" })
          .in("id", tenantIds);
      }

      // Deactiveer de agency
      const { error } = await serviceClient
        .from("agencies")
        .update({ is_active: false })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      console.log(`[admin/agencies] Agency ${id} opgeschort met ${tenantIds.length} klant(en)`);
      return NextResponse.json({
        success: true,
        message: `Agency opgeschort inclusief ${tenantIds.length} klant(en)`,
        tenantsAffected: tenantIds.length,
      });
    }

    if (action === "activate") {
      // Heractiveer de agency
      const { error } = await serviceClient
        .from("agencies")
        .update({ is_active: true })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Heractiveer agency_users
      await serviceClient
        .from("agency_users")
        .update({ is_active: true })
        .eq("agency_id", id);

      // Heractiveer klant-tenants
      if (tenantIds.length > 0) {
        await serviceClient
          .from("tenants")
          .update({ is_active: true, subscription_status: "active" })
          .in("id", tenantIds);
      }

      console.log(`[admin/agencies] Agency ${id} heractiveerd met ${tenantIds.length} klant(en)`);
      return NextResponse.json({
        success: true,
        message: `Agency heractiveerd inclusief ${tenantIds.length} klant(en)`,
        tenantsAffected: tenantIds.length,
      });
    }

    return NextResponse.json({ error: "Ongeldige actie" }, { status: 400 });
  } catch (error) {
    console.error("[admin/agencies] PATCH fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
