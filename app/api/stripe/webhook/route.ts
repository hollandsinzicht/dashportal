import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendTrialReminderEmail,
  sendTrialExpiredEmail,
  sendInvoiceEmail,
  getTenantAdmins,
  getTenantByStripeCustomer,
} from "@/lib/email/send";

// Webhook heeft raw body nodig — geen JSON parsing door Next.js
export const runtime = "nodejs";

// Disable body parser zodat we de raw body kunnen lezen voor signature verificatie
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 *
 * Ontvangt Stripe webhook events en synchroniseert subscription status
 * met de tenants tabel in Supabase.
 *
 * Events die we afhandelen:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - invoice.payment_failed
 * - invoice.paid
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Geen Stripe signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET niet geconfigureerd");
    return NextResponse.json(
      { error: "Webhook niet geconfigureerd" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(
      "[stripe/webhook] Signature verificatie mislukt:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Ongeldige signature" },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      // ─── Subscription bijgewerkt (plan change, trial end, etc.) ───
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        // current_period_end zit op subscription items in nieuwere Stripe API versies
        const periodEnd = subscription.items.data[0]?.current_period_end;

        const updates: Record<string, unknown> = {
          subscription_status: mapSubscriptionStatus(subscription.status),
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        };

        // Trial end date
        if (subscription.trial_end) {
          updates.trial_ends_at = new Date(
            subscription.trial_end * 1000
          ).toISOString();
        }

        // Plan uit subscription items halen
        const priceId = subscription.items.data[0]?.price?.id;
        if (priceId) {
          const plan = mapPriceIdToPlan(priceId);
          if (plan) {
            updates.subscription_plan = plan;
          }
        }

        // Stripe subscription ID opslaan
        updates.stripe_subscription_id = subscription.id;

        await supabase
          .from("tenants")
          .update(updates)
          .eq("stripe_customer_id", customerId);

        console.log(
          `[stripe/webhook] Subscription ${event.type} voor customer ${customerId}:`,
          updates
        );
        break;
      }

      // ─── Trial loopt bijna af (3 dagen voor einde) ───
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        // Stuur trial reminder naar alle admins
        const tenant = await getTenantByStripeCustomer(customerId);
        if (tenant) {
          const admins = await getTenantAdmins(tenant.id);
          for (const admin of admins) {
            await sendTrialReminderEmail(tenant, admin);
          }
          console.log(
            `[stripe/webhook] Trial reminder verstuurd voor ${tenant.name} (${admins.length} admins)`
          );
        }
        break;
      }

      // ─── Subscription verwijderd (geannuleerd) ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        // Haal tenant op VOOR de status update
        const tenant = await getTenantByStripeCustomer(customerId);

        await supabase
          .from("tenants")
          .update({
            subscription_status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("stripe_customer_id", customerId);

        // Stuur trial expired e-mail als dit een trial was
        if (tenant && subscription.status === "trialing") {
          const admins = await getTenantAdmins(tenant.id);
          for (const admin of admins) {
            await sendTrialExpiredEmail(tenant, admin);
          }
          console.log(
            `[stripe/webhook] Trial expired e-mail verstuurd voor ${tenant.name}`
          );
        }

        console.log(
          `[stripe/webhook] Subscription deleted voor customer ${customerId}`
        );
        break;
      }

      // ─── Betaling mislukt ───
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from("tenants")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);

          console.log(
            `[stripe/webhook] Payment failed voor customer ${customerId}`
          );
        }
        break;
      }

      // ─── Betaling geslaagd → factuur e-mail ───
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from("tenants")
            .update({ subscription_status: "active" })
            .eq("stripe_customer_id", customerId);

          // Stuur factuur e-mail (alleen voor echte betalingen, geen $0 invoices)
          if (invoice.amount_paid > 0) {
            const tenant = await getTenantByStripeCustomer(customerId);
            if (tenant) {
              const admins = await getTenantAdmins(tenant.id);
              const invoiceInfo = {
                number: invoice.number || `INV-${invoice.id.slice(-8)}`,
                date: new Date(invoice.created * 1000).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
                periodStart: invoice.lines.data[0]?.period?.start
                  ? new Date(invoice.lines.data[0].period.start * 1000).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "",
                periodEnd: invoice.lines.data[0]?.period?.end
                  ? new Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "",
                amount: `€${(invoice.amount_paid / 100).toFixed(2).replace(".", ",")}`,
                invoiceUrl: invoice.hosted_invoice_url || "#",
              };

              for (const admin of admins) {
                await sendInvoiceEmail(tenant, admin, invoiceInfo);
              }
              console.log(
                `[stripe/webhook] Factuur e-mail verstuurd voor ${tenant.name}`
              );
            }
          }

          console.log(
            `[stripe/webhook] Payment succeeded voor customer ${customerId}`
          );
        }
        break;
      }

      default:
        // Onbekend event — loggen maar geen actie
        console.log(`[stripe/webhook] Onverwerkt event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/webhook] Verwerkingsfout:", error);
    return NextResponse.json(
      { error: "Webhook verwerking mislukt" },
      { status: 500 }
    );
  }
}

/**
 * Map Stripe subscription status naar onze interne statussen.
 */
function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "suspended";
    default:
      return "active";
  }
}

/**
 * Map Stripe Price ID terug naar plan naam.
 */
function mapPriceIdToPlan(priceId: string): string | null {
  const mapping: Record<string, string> = {};

  if (process.env.STRIPE_PRICE_STARTER) {
    mapping[process.env.STRIPE_PRICE_STARTER] = "starter";
  }
  if (process.env.STRIPE_PRICE_BUSINESS) {
    mapping[process.env.STRIPE_PRICE_BUSINESS] = "business";
  }
  if (process.env.STRIPE_PRICE_SCALE) {
    mapping[process.env.STRIPE_PRICE_SCALE] = "scale";
  }

  return mapping[priceId] || null;
}
