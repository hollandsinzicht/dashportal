import { stripe, getStripePriceId } from "./config";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Maak een Stripe Customer aan en sla de ID op bij de tenant.
 */
export async function createStripeCustomer(
  tenantId: string,
  email: string,
  companyName: string
): Promise<string> {
  const supabase = await createServiceClient();

  // Check of er al een stripe_customer_id is
  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_customer_id")
    .eq("id", tenantId)
    .single();

  if (tenant?.stripe_customer_id) {
    return tenant.stripe_customer_id;
  }

  // Maak Stripe Customer
  const customer = await stripe.customers.create({
    email,
    name: companyName,
    metadata: {
      tenant_id: tenantId,
    },
  });

  // Sla op in tenants tabel
  await supabase
    .from("tenants")
    .update({ stripe_customer_id: customer.id })
    .eq("id", tenantId);

  return customer.id;
}

/**
 * Maak een Stripe Subscription aan met optionele trial.
 */
export async function createSubscription(
  stripeCustomerId: string,
  plan: string,
  trialDays: number = 14
): Promise<{
  subscriptionId: string;
  trialEnd: Date | null;
  status: string;
}> {
  const priceId = getStripePriceId(plan);

  if (!priceId) {
    throw new Error(
      `Geen Stripe Price ID geconfigureerd voor plan: ${plan}. Stel STRIPE_PRICE_${plan.toUpperCase()} in als environment variable.`
    );
  }

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    trial_settings: {
      end_behavior: {
        missing_payment_method: "cancel",
      },
    },
  });

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  return {
    subscriptionId: subscription.id,
    trialEnd,
    status: subscription.status,
  };
}

/**
 * Maak een Stripe Customer Portal sessie aan.
 */
export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Cancel een subscription aan het einde van de huidige periode.
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Heractiveer een gecancelde subscription.
 */
export async function reactivateSubscription(
  stripeSubscriptionId: string
): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Wijzig het plan van een bestaande subscription.
 *
 * Gebruikt `proration_behavior: "none"` — de nieuwe prijs gaat pas in
 * bij de volgende factuur (geen tussentijdse bijbetaling).
 *
 * De webhook `customer.subscription.updated` vangt de wijziging op
 * en synct het nieuwe plan automatisch naar de database.
 */
export async function changeSubscriptionPlan(
  stripeSubscriptionId: string,
  newPlan: string
): Promise<{ effectiveDate: string }> {
  // Valideer dat het geen enterprise plan is (custom pricing)
  if (newPlan === "enterprise") {
    throw new Error("Enterprise plannen kunnen niet via self-service worden gewijzigd.");
  }

  const newPriceId = getStripePriceId(newPlan);
  if (!newPriceId) {
    throw new Error(
      `Geen Stripe Price ID geconfigureerd voor plan: ${newPlan}. Stel STRIPE_PRICE_${newPlan.toUpperCase()} in.`
    );
  }

  // Huidige subscription ophalen
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  if (!subscription || !subscription.items.data[0]) {
    throw new Error("Subscription niet gevonden of heeft geen items.");
  }

  const currentItemId = subscription.items.data[0].id;

  // Subscription item wijzigen zonder prorating
  const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: currentItemId, price: newPriceId }],
    proration_behavior: "none",
  });

  // current_period_end ophalen — wanneer de nieuwe prijs ingaat
  const periodEnd = updated.items.data[0]?.current_period_end;
  const effectiveDate = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : new Date().toISOString();

  return { effectiveDate };
}
