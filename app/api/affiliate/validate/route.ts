import { NextRequest, NextResponse } from "next/server";
import { validateReferralCode } from "@/lib/affiliate/referral";

/**
 * GET /api/affiliate/validate?code=REF-XXXXXX
 *
 * Publieke route — valideert een referral code tijdens onboarding.
 * Geeft affiliate naam + bedrijf terug als de code geldig is.
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Code is verplicht" },
        { status: 400 }
      );
    }

    const affiliate = await validateReferralCode(code);

    if (!affiliate) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      affiliateId: affiliate.id,
      affiliateName: affiliate.company_name || affiliate.name,
    });
  } catch (error) {
    console.error("[affiliate/validate] Fout:", error);
    return NextResponse.json(
      { valid: false, error: "Validatie mislukt" },
      { status: 500 }
    );
  }
}
