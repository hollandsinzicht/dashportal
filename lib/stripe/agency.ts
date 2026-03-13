import { stripe } from "./config";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Maak een Stripe Customer aan voor een agency en sla de ID op.
 */
export async function createAgencyStripeCustomer(
  agencyId: string,
  email: string,
  companyName: string
): Promise<string> {
  const supabase = await createServiceClient();

  // Check of er al een stripe_customer_id is
  const { data: agency } = await supabase
    .from("agencies")
    .select("stripe_customer_id")
    .eq("id", agencyId)
    .single();

  if (agency?.stripe_customer_id) {
    return agency.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    name: companyName,
    metadata: {
      agency_id: agencyId,
      type: "agency",
    },
  });

  await supabase
    .from("agencies")
    .update({ stripe_customer_id: customer.id })
    .eq("id", agencyId);

  return customer.id;
}

/**
 * Voeg een invoice item toe aan de draft invoice van een agency customer.
 * Wordt gebruikt door de maandelijkse cron job.
 */
export async function addAgencyInvoiceItem(
  stripeCustomerId: string,
  description: string,
  amount: number,
  metadata: Record<string, string> = {}
): Promise<string> {
  const item = await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    amount: Math.round(amount * 100), // EUR in centen
    currency: "eur",
    description,
    metadata,
  });

  return item.id;
}

/**
 * Maak een Stripe factuur aan en finaliseer deze.
 * Stripe stuurt automatisch de factuur via e-mail als collection_method=send_invoice.
 */
export async function createAndFinalizeAgencyInvoice(
  stripeCustomerId: string,
  description: string
): Promise<{ invoiceId: string; invoiceUrl: string | null }> {
  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    auto_advance: true, // automatisch incasso of e-mail
    collection_method: "send_invoice",
    days_until_due: 14,
    description,
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

  return {
    invoiceId: finalized.id,
    invoiceUrl: finalized.hosted_invoice_url || null,
  };
}

/**
 * Maak een Stripe Customer Portal sessie aan voor een agency.
 */
export async function createAgencyPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}
