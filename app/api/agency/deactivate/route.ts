import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext, } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/agency/deactivate
 *
 * Agency deactiveert zichzelf. Cascade naar alle klant-tenants:
 * - Alle klant-tenants worden gedeactiveerd
 * - Alle tenant_users worden gedeactiveerd
 * - Alle agency_users worden gedeactiveerd
 * - De agency zelf wordt gedeactiveerd
 *
 * Body: { agencyId }
 */
export async function POST(req: NextRequest) {
  try {
    const { agencyId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    // Alleen owners mogen de agency deactiveren
    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Controleer dat de ingelogde user een owner is (niet alleen admin)
    const { data: agencyUser } = await ctx.serviceClient
      .from("agency_users")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("email", ctx.user.email)
      .eq("is_active", true)
      .single();

    if (!agencyUser || agencyUser.role !== "owner") {
      return NextResponse.json(
        { error: "Alleen de eigenaar kan de agency deactiveren" },
        { status: 403 }
      );
    }

    const serviceClient = await createServiceClient();

    // Haal alle klant-tenants op
    const { data: tenants } = await serviceClient
      .from("tenants")
      .select("id")
      .eq("agency_id", agencyId);

    const tenantIds = (tenants || []).map((t) => t.id);

    // 1. Deactiveer alle tenant_users
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
      .eq("agency_id", agencyId);

    // 4. Deactiveer de agency
    await serviceClient
      .from("agencies")
      .update({ is_active: false })
      .eq("id", agencyId);

    console.log(`[agency/deactivate] Agency ${agencyId} gedeactiveerd met ${tenantIds.length} klant(en)`);

    return NextResponse.json({
      success: true,
      message: `Agency gedeactiveerd inclusief ${tenantIds.length} klant(en)`,
      tenantsAffected: tenantIds.length,
    });
  } catch (error) {
    console.error("[agency/deactivate] Fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
