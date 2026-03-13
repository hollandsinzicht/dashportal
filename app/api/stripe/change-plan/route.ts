import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { changeSubscriptionPlan } from "@/lib/stripe/helpers";
import { PLAN_ORDER, type PlanId } from "@/lib/stripe/config";

const VALID_PLANS: PlanId[] = ["starter", "business", "scale"];

/**
 * POST /api/stripe/change-plan
 *
 * Wijzigt het abonnementsplan van een tenant.
 * De wijziging gaat in bij de volgende factuur (geen prorating).
 *
 * Body: { tenantId: string, newPlan: "starter" | "business" | "scale" }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, newPlan } = await req.json();

    // ─── Input validatie ───
    if (!tenantId || !newPlan) {
      return NextResponse.json(
        { error: "tenantId en newPlan zijn verplicht" },
        { status: 400 }
      );
    }

    if (!VALID_PLANS.includes(newPlan as PlanId)) {
      return NextResponse.json(
        { error: `Ongeldig plan: ${newPlan}. Kies uit: ${VALID_PLANS.join(", ")}` },
        { status: 400 }
      );
    }

    // ─── Auth check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // ─── Tenant ophalen ───
    const { data: tenant } = await ctx.serviceClient
      .from("tenants")
      .select("stripe_subscription_id, subscription_plan, subscription_status")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant niet gevonden" },
        { status: 404 }
      );
    }

    // ─── Validaties ───
    if (!tenant.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Geen actief Stripe abonnement gevonden. Activeer eerst je abonnement." },
        { status: 400 }
      );
    }

    const status = tenant.subscription_status;
    if (status !== "active" && status !== "trialing") {
      return NextResponse.json(
        { error: "Je abonnement moet actief zijn om van plan te wisselen." },
        { status: 400 }
      );
    }

    if (tenant.subscription_plan === newPlan) {
      return NextResponse.json(
        { error: "Je zit al op dit plan." },
        { status: 400 }
      );
    }

    // ─── Plan wijzigen via Stripe ───
    const { effectiveDate } = await changeSubscriptionPlan(
      tenant.stripe_subscription_id,
      newPlan
    );

    // ─── Activity log (best-effort) ───
    const currentIndex = PLAN_ORDER.indexOf(tenant.subscription_plan as PlanId);
    const newIndex = PLAN_ORDER.indexOf(newPlan as PlanId);
    const direction = newIndex > currentIndex ? "upgrade" : "downgrade";

    try {
      await ctx.serviceClient.from("activity_log").insert({
        tenant_id: tenantId,
        action: `plan_${direction}`,
        details: `Plan gewijzigd van ${tenant.subscription_plan} naar ${newPlan}`,
        performed_by: ctx.user.email || "admin",
      });
    } catch {
      // Activity log is optioneel — niet laten falen
    }

    console.log(
      `[stripe/change-plan] ${direction}: ${tenant.subscription_plan} → ${newPlan} voor tenant ${tenantId}`
    );

    return NextResponse.json({
      success: true,
      newPlan,
      previousPlan: tenant.subscription_plan,
      direction,
      effectiveDate,
    });
  } catch (error) {
    console.error("[stripe/change-plan] Fout:", error);

    const message =
      error instanceof Error ? error.message : "Kon plan niet wijzigen";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
