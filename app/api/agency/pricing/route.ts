import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext, getAgencyMemberContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";
import { getAgencyPricingTiers } from "@/lib/agency/queries";

/**
 * GET /api/agency/pricing?agencyId=xxx
 *
 * Haal de prijsschijven van een agency op.
 */
export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get("agencyId");
    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    const ctx = await getAgencyMemberContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const tiers = await getAgencyPricingTiers(agencyId);
    return NextResponse.json({ tiers });
  } catch (error) {
    console.error("[agency/pricing] GET fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * PUT /api/agency/pricing
 *
 * Overschrijf alle prijsschijven van een agency.
 * Body: { agencyId, tiers: Array<{ min_users, max_users, price_per_month, label, sort_order }> }
 */
export async function PUT(req: NextRequest) {
  try {
    const { agencyId, tiers } = await req.json();

    if (!agencyId || !Array.isArray(tiers)) {
      return NextResponse.json(
        { error: "agencyId en tiers array zijn verplicht" },
        { status: 400 }
      );
    }

    // Minimaal 1 schijf
    if (tiers.length === 0) {
      return NextResponse.json(
        { error: "Er moet minimaal één prijsschijf zijn" },
        { status: 400 }
      );
    }

    // Validatie per tier
    for (const tier of tiers) {
      if (typeof tier.min_users !== "number" || tier.min_users < 0) {
        return NextResponse.json(
          { error: "min_users moet een positief getal zijn" },
          { status: 400 }
        );
      }
      if (tier.max_users !== null && (typeof tier.max_users !== "number" || tier.max_users < tier.min_users)) {
        return NextResponse.json(
          { error: "max_users moet groter of gelijk aan min_users zijn" },
          { status: 400 }
        );
      }
      if (typeof tier.price_per_month !== "number" || tier.price_per_month < 0) {
        return NextResponse.json(
          { error: "price_per_month moet een positief getal zijn" },
          { status: 400 }
        );
      }
    }

    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Verwijder bestaande tiers en voeg nieuwe toe (atomaire swap)
    const { error: deleteError } = await ctx.serviceClient
      .from("agency_pricing_tiers")
      .delete()
      .eq("agency_id", agencyId);

    if (deleteError) {
      console.error("[agency/pricing] Delete error:", deleteError);
      return NextResponse.json(
        { error: "Kon prijsschijven niet bijwerken" },
        { status: 500 }
      );
    }

    const inserts = tiers.map((tier: Record<string, unknown>, index: number) => ({
      agency_id: agencyId,
      min_users: tier.min_users,
      max_users: tier.max_users,
      price_per_month: tier.price_per_month,
      label: tier.label || null,
      sort_order: tier.sort_order ?? index,
    }));

    const { error: insertError } = await ctx.serviceClient
      .from("agency_pricing_tiers")
      .insert(inserts);

    if (insertError) {
      console.error("[agency/pricing] Insert error:", insertError);
      return NextResponse.json(
        { error: "Kon prijsschijven niet opslaan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agency/pricing] PUT fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
