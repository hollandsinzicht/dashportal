import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { createServiceClient } from "@/lib/supabase/server";
import { generateReferralCode, getAffiliateDashboard } from "@/lib/affiliate/referral";

/**
 * GET /api/affiliate?tenantId=xxx
 *
 * Haal affiliate dashboard data op voor de ingelogde admin.
 * Returnt affiliate profiel, referrals en payouts.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Zoek affiliate gekoppeld aan deze tenant
    const { data: affiliate } = await ctx.serviceClient
      .from("affiliates")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    if (!affiliate) {
      return NextResponse.json({
        affiliate: null,
        referrals: [],
        payouts: [],
        isAffiliate: false,
      });
    }

    const dashboard = await getAffiliateDashboard(affiliate.id);
    return NextResponse.json({ ...dashboard, isAffiliate: true });
  } catch (error) {
    console.error("[affiliate/get] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Kon affiliate data niet ophalen" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliate
 *
 * Registreer als affiliate partner.
 * Maakt een affiliate record aan gekoppeld aan de tenant.
 *
 * Body: { tenantId, name, companyName, email }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, name, companyName, email } = await req.json();

    if (!tenantId || !name || !email) {
      return NextResponse.json(
        { error: "tenantId, name en email zijn verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Check of er al een affiliate bestaat voor deze tenant
    const { data: existing } = await ctx.serviceClient
      .from("affiliates")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Er is al een affiliate account voor deze tenant" },
        { status: 400 }
      );
    }

    // Check of email al in gebruik is
    const { data: existingEmail } = await ctx.serviceClient
      .from("affiliates")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al gekoppeld aan een affiliate account" },
        { status: 400 }
      );
    }

    // Genereer unieke referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;

    // Prefix op basis van bedrijfsnaam (eerste 3 letters)
    const prefix = companyName
      ? companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "")
      : "REF";

    do {
      referralCode = generateReferralCode(prefix || "REF");
      const { data: codeCheck } = await ctx.serviceClient
        .from("affiliates")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      isUnique = !codeCheck;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      return NextResponse.json(
        { error: "Kon geen unieke referral code genereren" },
        { status: 500 }
      );
    }

    // Affiliate aanmaken
    const { data: affiliate, error: insertError } = await ctx.serviceClient
      .from("affiliates")
      .insert({
        tenant_id: tenantId,
        email: email.toLowerCase().trim(),
        name,
        company_name: companyName || null,
        referral_code: referralCode!,
        commission_percent: 15,
        commission_type: "recurring",
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[affiliate/post] Insert error:", insertError);
      return NextResponse.json(
        { error: "Kon affiliate account niet aanmaken" },
        { status: 500 }
      );
    }

    return NextResponse.json({ affiliate });
  } catch (error) {
    console.error("[affiliate/post] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Interne fout" },
      { status: 500 }
    );
  }
}
