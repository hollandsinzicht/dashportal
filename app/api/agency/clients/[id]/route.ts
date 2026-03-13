import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext, getAgencyMemberContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/agency/clients/[id]?agencyId=xxx
 *
 * Haal detail van een klant-tenant op.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const agencyId = req.nextUrl.searchParams.get("agencyId");
    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    const ctx = await getAgencyMemberContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Haal tenant op — verifieer dat het bij deze agency hoort
    const { data: tenant, error } = await ctx.serviceClient
      .from("tenants")
      .select("*")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
    }

    // Haal users + reports count op
    const [usersResult, reportsResult] = await Promise.all([
      ctx.serviceClient
        .from("tenant_users")
        .select("id, email, name, role, is_active, created_at")
        .eq("tenant_id", id)
        .order("created_at", { ascending: true }),
      ctx.serviceClient
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", id)
        .eq("is_published", true),
    ]);

    return NextResponse.json({
      tenant,
      users: usersResult.data || [],
      reportCount: reportsResult.count || 0,
    });
  } catch (error) {
    console.error("[agency/clients/id] GET fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * PATCH /api/agency/clients/[id]
 *
 * Klant-tenant settings aanpassen (restricties, branding, etc.).
 * Body: { agencyId, client_can_invite_users?, client_can_edit_branding?, name?, ... }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { agencyId, ...rawUpdates } = body;

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Verifieer dat tenant bij deze agency hoort
    const { data: tenant } = await ctx.serviceClient
      .from("tenants")
      .select("id")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
    }

    const ALLOWED_FIELDS = [
      "name",
      "client_can_invite_users",
      "client_can_edit_branding",
      "primary_color",
      "accent_color",
      "logo_url",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_FIELDS.includes(key)) {
        updates[key] = rawUpdates[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Geen geldige velden opgegeven" }, { status: 400 });
    }

    const { error } = await ctx.serviceClient
      .from("tenants")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[agency/clients/id] PATCH fout:", error);
      return NextResponse.json({ error: "Kon instellingen niet opslaan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agency/clients/id] PATCH fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
