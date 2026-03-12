import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createStripeCustomer, createSubscription } from "@/lib/stripe/helpers";
import { getPlanConfig, type PlanId, PLAN_ORDER } from "@/lib/stripe/config";

/**
 * POST /api/stripe/checkout
 *
 * Start een Stripe subscription met 14 dagen trial (geen creditcard nodig).
 * Wordt aangeroepen na tenant aanmaak in de onboarding flow.
 *
 * Body: { tenantId, plan, email, companyName }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, plan, email, companyName } = await req.json();

    if (!tenantId || !plan || !email) {
      return NextResponse.json(
        { error: "tenantId, plan en email zijn verplicht" },
        { status: 400 }
      );
    }

    // Valideer plan
    if (!PLAN_ORDER.includes(plan as PlanId)) {
      return NextResponse.json(
        { error: "Ongeldig plan" },
        { status: 400 }
      );
    }

    // Enterprise wordt apart afgehandeld (custom deal)
    if (plan === "enterprise") {
      return NextResponse.json(
        { error: "Enterprise plan vereist een gepersonaliseerde offerte" },
        { status: 400 }
      );
    }

    const planConfig = getPlanConfig(plan);
    if (!planConfig.stripePriceId) {
      // Als er geen Stripe Price ID is geconfigureerd, sla Stripe over
      // maar update wel het plan in de database (voor development)
      const supabase = await createServiceClient();
      const trialEndsAt = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString();

      await supabase
        .from("tenants")
        .update({
          subscription_plan: plan,
          subscription_status: "trialing",
          trial_ends_at: trialEndsAt,
        })
        .eq("id", tenantId);

      return NextResponse.json({
        success: true,
        subscriptionId: null,
        trialEndsAt,
        message: "Trial gestart (Stripe Price ID niet geconfigureerd)",
      });
    }

    // ─── Stripe Customer aanmaken of ophalen ───
    const stripeCustomerId = await createStripeCustomer(
      tenantId,
      email,
      companyName || "Onbekend bedrijf"
    );

    // ─── Subscription aanmaken met 14 dagen trial ───
    const { subscriptionId, trialEnd, status } = await createSubscription(
      stripeCustomerId,
      plan,
      14
    );

    // ─── Tenant updaten met subscription data ───
    const supabase = await createServiceClient();
    await supabase
      .from("tenants")
      .update({
        stripe_subscription_id: subscriptionId,
        subscription_plan: plan,
        subscription_status: status,
        trial_ends_at: trialEnd?.toISOString() || null,
      })
      .eq("id", tenantId);

    return NextResponse.json({
      success: true,
      subscriptionId,
      trialEndsAt: trialEnd?.toISOString() || null,
      status,
    });
  } catch (error) {
    console.error("[stripe/checkout] Fout:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kon subscription niet aanmaken" },
      { status: 500 }
    );
  }
}
