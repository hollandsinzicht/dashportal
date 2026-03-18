import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext, getAgencyMemberContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";
import { formatEuro } from "@/lib/agency/pricing";

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

/**
 * DELETE /api/agency/clients/[id]
 *
 * Verwijder een klant-tenant van de agency.
 * - Bewaart alle bestaande invoice lines (factuurgeschiedenis)
 * - Maakt een pro-rata factuurlijn aan voor de lopende maand
 * - Deactiveert de tenant en ontkoppelt van agency
 *
 * Body: { agencyId }
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { agencyId } = await req.json();

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
      .select("id, name, slug, created_at")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
    }

    // ─── Pro-rata factuurlijn aanmaken ───
    // Bereken hoeveel dagen de klant deze maand actief was
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();

    // Klant was actief vanaf het begin van de maand of de aanmaakdatum (wat later is)
    const clientStart = new Date(tenant.created_at);
    const periodStart = clientStart > monthStart ? clientStart : monthStart;
    const activeDays = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / 86400000));
    const proRataFactor = activeDays / daysInMonth;

    // Tel actieve gebruikers
    const { count: userCount } = await ctx.serviceClient
      .from("tenant_users")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", id)
      .eq("is_active", true);

    // Bereken tier prijs
    const { data: tiers } = await ctx.serviceClient
      .from("agency_pricing_tiers")
      .select("min_users, max_users, price_per_month, label")
      .eq("agency_id", agencyId)
      .order("sort_order", { ascending: true });

    let proRataAmount = 0;
    let tierLabel = "Verwijderd";

    if (tiers && tiers.length > 0) {
      const { calculateTierPrice } = await import("@/lib/agency/pricing");
      const tierResult = calculateTierPrice(userCount ?? 0, tiers);
      proRataAmount = Math.round(tierResult.price * proRataFactor * 100) / 100;
      tierLabel = `${tierResult.label || "Standaard"} (pro-rata ${activeDays}/${daysInMonth} dagen)`;
    }

    // Sla pro-rata factuurlijn op (bewaar voor facturatie)
    await ctx.serviceClient
      .from("agency_invoice_lines")
      .insert({
        agency_id: agencyId,
        tenant_id: id,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: now.toISOString().split("T")[0],
        user_count: userCount ?? 0,
        tier_label: tierLabel,
        amount: proRataAmount,
      });

    // ─── Deactiveer tenant ───
    // 1. Deactiveer alle tenant_users
    await ctx.serviceClient
      .from("tenant_users")
      .update({ is_active: false })
      .eq("tenant_id", id);

    // 2. Deactiveer de tenant en ontkoppel van agency
    await ctx.serviceClient
      .from("tenants")
      .update({
        is_active: false,
        agency_id: null,
        billing_owner: "self",
      })
      .eq("id", id);

    console.log(
      `[agency/clients/id] Klant verwijderd: ${tenant.slug} (${id}) van agency ${agencyId}. Pro-rata: ${formatEuro(proRataAmount)} (${activeDays}/${daysInMonth} dagen)`
    );

    return NextResponse.json({
      success: true,
      message: `${tenant.name} is verwijderd`,
      proRata: { amount: proRataAmount, days: activeDays, totalDays: daysInMonth },
    });
  } catch (error) {
    console.error("[agency/clients/id] DELETE fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
