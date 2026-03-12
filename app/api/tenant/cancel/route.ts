import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { getStripe } from "@/lib/stripe/config";
import { logActivity } from "@/lib/activity/log";
import { sendCancellationEmail, getTenantAdmins } from "@/lib/email/send";

/**
 * POST /api/tenant/cancel
 *
 * Annuleer het abonnement van een tenant.
 * Markeert cancel_at_period_end in Stripe zodat de klant toegang houdt
 * tot het einde van de huidige facturatieperiode.
 *
 * Body: { tenantId, reason?, feedback? }
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, reason, feedback } = await req.json();

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
    const { currentUser, serviceClient, user } = ctx;

    // ─── Tenant ophalen ───
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select(
        "id, name, slug, stripe_subscription_id, stripe_customer_id, subscription_plan, subscription_status, trial_ends_at, cancel_at_period_end"
      )
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant niet gevonden" },
        { status: 404 }
      );
    }

    // Al geannuleerd?
    if (tenant.subscription_status === "canceled") {
      return NextResponse.json(
        { error: "Abonnement is al geannuleerd" },
        { status: 400 }
      );
    }

    if (tenant.cancel_at_period_end) {
      return NextResponse.json(
        { error: "Annulering is al ingepland" },
        { status: 400 }
      );
    }

    let cancelDate: string | null = null;

    // ─── Stripe annulering ───
    if (tenant.stripe_subscription_id) {
      const stripe = getStripe();

      // Cancel at period end (klant houdt toegang tot einde periode)
      const subscription = await stripe.subscriptions.update(
        tenant.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // Bereken einddatum
      const periodEnd = subscription.items.data[0]?.current_period_end;
      cancelDate = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null;

      // Update tenant in database
      await serviceClient
        .from("tenants")
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          cancel_reason: reason || null,
          cancel_feedback: feedback || null,
        })
        .eq("id", tenantId);
    } else {
      // Geen Stripe — direct annuleren (trial zonder betaling)
      cancelDate = new Date().toISOString();

      await serviceClient
        .from("tenants")
        .update({
          subscription_status: "canceled",
          cancel_at_period_end: false,
          canceled_at: new Date().toISOString(),
          cancel_reason: reason || null,
          cancel_feedback: feedback || null,
        })
        .eq("id", tenantId);
    }

    // ─── Activity log ───
    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "tenant.canceled",
      targetType: "tenant",
      targetId: tenantId,
      metadata: {
        reason: reason || "Geen reden opgegeven",
        feedback: feedback || null,
        cancelDate,
      },
    });

    // ─── Bevestigingsmail sturen ───
    try {
      const admins = await getTenantAdmins(tenantId);
      for (const admin of admins) {
        await sendCancellationEmail(
          {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            subscription_plan: tenant.subscription_plan,
            trial_ends_at: tenant.trial_ends_at,
          },
          admin,
          cancelDate
        );
      }
    } catch (emailErr) {
      console.warn("[tenant/cancel] Bevestigingsmail mislukt:", emailErr);
    }

    return NextResponse.json({
      success: true,
      cancelDate,
      message: tenant.stripe_subscription_id
        ? "Je abonnement wordt aan het einde van de huidige periode beëindigd."
        : "Je abonnement is geannuleerd.",
    });
  } catch (error) {
    console.error("[tenant/cancel] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Kon abonnement niet annuleren. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
