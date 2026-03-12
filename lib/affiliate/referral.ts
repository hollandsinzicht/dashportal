import { createServiceClient } from "@/lib/supabase/server";

/**
 * Genereer een unieke referral code voor een affiliate.
 * Format: REF-XXXXXX (6 alfanumerieke tekens)
 */
export function generateReferralCode(prefix = "REF"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Geen verwarrende chars (0/O, 1/I/L)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Valideer een referral code en haal de affiliate op.
 * Returns affiliate data of null als de code ongeldig is.
 */
export async function validateReferralCode(code: string) {
  if (!code || code.length < 3) return null;

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("affiliates")
    .select("id, name, company_name, referral_code, status, commission_percent")
    .eq("referral_code", code.toUpperCase().trim())
    .eq("status", "active")
    .single();

  return data;
}

/**
 * Registreer een referral bij het aanmaken van een tenant.
 * Wordt aangeroepen vanuit de tenant POST API.
 */
export async function trackReferral(
  affiliateId: string,
  tenantId: string,
  email: string
) {
  const supabase = await createServiceClient();

  // Referral record aanmaken
  await supabase.from("affiliate_referrals").insert({
    affiliate_id: affiliateId,
    referred_tenant_id: tenantId,
    referred_email: email,
    status: "signed_up",
  });

  // Tenant koppelen aan affiliate
  await supabase
    .from("tenants")
    .update({ referred_by_affiliate_id: affiliateId })
    .eq("id", tenantId);

  // Tel referrals op
  await supabase.rpc("increment_affiliate_referrals", {
    aff_id: affiliateId,
  });
}

/**
 * Update referral status wanneer een tenant converteert (eerste betaling).
 * Wordt aangeroepen vanuit de Stripe webhook bij invoice.paid.
 */
export async function convertReferral(
  tenantId: string,
  subscriptionAmount: number
) {
  const supabase = await createServiceClient();

  // Haal referral op via tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("referred_by_affiliate_id")
    .eq("id", tenantId)
    .single();

  if (!tenant?.referred_by_affiliate_id) return;

  // Haal affiliate commissie percentage
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, commission_percent, commission_type")
    .eq("id", tenant.referred_by_affiliate_id)
    .single();

  if (!affiliate) return;

  const commission =
    (subscriptionAmount * Number(affiliate.commission_percent)) / 100;

  // Update referral record
  await supabase
    .from("affiliate_referrals")
    .update({
      status: "active",
      commission_amount: commission,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("referred_tenant_id", tenantId)
    .eq("affiliate_id", affiliate.id);

  // Increment total_earned (via direct update)
  const { data: currentAffiliate } = await supabase
    .from("affiliates")
    .select("total_earned")
    .eq("id", affiliate.id)
    .single();

  if (currentAffiliate) {
    await supabase
      .from("affiliates")
      .update({
        total_earned: Number(currentAffiliate.total_earned) + commission,
      })
      .eq("id", affiliate.id);
  }
}

/**
 * Haal affiliate dashboard data op.
 */
export async function getAffiliateDashboard(affiliateId: string) {
  const supabase = await createServiceClient();

  const [affiliateResult, referralsResult, payoutsResult] = await Promise.all([
    supabase
      .from("affiliates")
      .select("*")
      .eq("id", affiliateId)
      .single(),

    supabase
      .from("affiliate_referrals")
      .select(
        "id, referred_email, status, commission_amount, commission_paid, converted_at, created_at"
      )
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("affiliate_payouts")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    affiliate: affiliateResult.data,
    referrals: referralsResult.data || [],
    payouts: payoutsResult.data || [],
  };
}
