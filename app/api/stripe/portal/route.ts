import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { createPortalSession } from "@/lib/stripe/helpers";

/**
 * POST /api/stripe/portal
 *
 * Genereert een Stripe Customer Portal sessie URL.
 * De admin wordt hierheen geredirect om abonnement te beheren.
 *
 * Body: { tenantId }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // ─── Stripe Customer ID ophalen ───
    const { data: tenant } = await ctx.serviceClient
      .from("tenants")
      .select("stripe_customer_id")
      .eq("id", tenantId)
      .single();

    if (!tenant?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Geen Stripe koppeling gevonden. Neem contact op met support." },
        { status: 400 }
      );
    }

    // ─── Portal sessie aanmaken ───
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const returnUrl = `${origin}/dashboard/billing`;

    const portalUrl = await createPortalSession(
      tenant.stripe_customer_id,
      returnUrl
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("[stripe/portal] Fout:", error);
    return NextResponse.json(
      { error: "Kon facturatieportaal niet openen" },
      { status: 500 }
    );
  }
}
