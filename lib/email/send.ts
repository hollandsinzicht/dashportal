import { Resend } from "resend";
import { createElement } from "react";
import WelcomeEmail from "@/emails/welcome";
import TrialReminderEmail from "@/emails/trial-reminder";
import TrialExpiredEmail from "@/emails/trial-expired";
import InvoiceEmail from "@/emails/invoice";
import CancellationConfirmationEmail from "@/emails/cancellation-confirmation";
import InviteEmail from "@/emails/invite";
import { createServiceClient } from "@/lib/supabase/server";
import { getPlanConfig } from "@/lib/stripe/config";

// ─── Resend instance ───

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is niet geconfigureerd");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@dashportal.app";

// ─── Types ───

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  trial_ends_at: string | null;
}

interface UserInfo {
  email: string;
  name: string | null;
}

// ─── Welkom e-mail ───
// Trigger: Na voltooiing onboarding (success pagina)

export async function sendWelcomeEmail(tenant: TenantInfo, user: UserInfo) {
  const plan = getPlanConfig(tenant.subscription_plan || "starter");

  const trialEndDate = tenant.trial_ends_at
    ? new Date(tenant.trial_ends_at).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "over 14 dagen";

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Welkom bij DashPortal — je portaal staat klaar 🎉",
      react: createElement(WelcomeEmail, {
        userName: user.name || "daar",
        companyName: tenant.name,
        slug: tenant.slug,
        plan: plan.name,
        trialEndDate,
      }),
    });
    console.log("[email] Welkom e-mail verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email] Welkom e-mail mislukt:", err);
  }
}

// ─── Trial reminder e-mail ───
// Trigger: Stripe webhook customer.subscription.trial_will_end

export async function sendTrialReminderEmail(tenant: TenantInfo, user: UserInfo) {
  const plan = getPlanConfig(tenant.subscription_plan || "starter");
  const supabase = await createServiceClient();

  // Haal usage stats op voor de e-mail
  const [reportsResult, usersResult] = await Promise.all([
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id),
    supabase
      .from("tenant_users")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("is_active", true),
  ]);

  const trialEndDate = tenant.trial_ends_at
    ? new Date(tenant.trial_ends_at).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "binnenkort";

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Je proefperiode eindigt over 3 dagen",
      react: createElement(TrialReminderEmail, {
        userName: user.name || "daar",
        companyName: tenant.name,
        slug: tenant.slug,
        plan: plan.name,
        planPrice: plan.price,
        trialEndDate,
        reportCount: reportsResult.count || 0,
        userCount: usersResult.count || 0,
      }),
    });
    console.log("[email] Trial reminder verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email] Trial reminder mislukt:", err);
  }
}

// ─── Trial expired e-mail ───
// Trigger: Stripe webhook customer.subscription.deleted (bij trial)
// of cron job als trial_ends_at verstreken

export async function sendTrialExpiredEmail(tenant: TenantInfo, user: UserInfo) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Je proefperiode is verlopen",
      react: createElement(TrialExpiredEmail, {
        userName: user.name || "daar",
        companyName: tenant.name,
        slug: tenant.slug,
      }),
    });
    console.log("[email] Trial expired verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email] Trial expired mislukt:", err);
  }
}

// ─── Factuur e-mail ───
// Trigger: Stripe webhook invoice.paid

interface InvoiceInfo {
  number: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  amount: string;
  invoiceUrl: string;
}

export async function sendInvoiceEmail(
  tenant: TenantInfo,
  user: UserInfo,
  invoice: InvoiceInfo
) {
  const plan = getPlanConfig(tenant.subscription_plan || "starter");

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Factuur ${invoice.number} — DashPortal ${plan.name}`,
      react: createElement(InvoiceEmail, {
        userName: user.name || "daar",
        companyName: tenant.name,
        plan: plan.name,
        invoiceNumber: invoice.number,
        invoiceDate: invoice.date,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        amount: invoice.amount,
        invoiceUrl: invoice.invoiceUrl,
      }),
    });
    console.log("[email] Factuur e-mail verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email] Factuur e-mail mislukt:", err);
  }
}

// ─── Annuleringsbevestiging e-mail ───
// Trigger: Na annulering van het abonnement

export async function sendCancellationEmail(
  tenant: TenantInfo,
  user: UserInfo,
  cancelDate: string | null
) {
  const cancelDateFormatted = cancelDate
    ? new Date(cancelDate).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "het einde van je huidige periode";

  // Data retention: 30 dagen na cancellation
  const retentionDate = cancelDate
    ? new Date(
        new Date(cancelDate).getTime() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "30 dagen na beëindiging";

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Bevestiging: je DashPortal abonnement wordt beëindigd",
      react: createElement(CancellationConfirmationEmail, {
        userName: user.name || "daar",
        companyName: tenant.name,
        slug: tenant.slug,
        cancelDate: cancelDateFormatted,
        dataRetentionDate: retentionDate,
      }),
    });
    console.log("[email] Annuleringsbevestiging verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email] Annuleringsbevestiging mislukt:", err);
  }
}

// ─── Uitnodigings e-mail ───
// Trigger: Wanneer een admin een gebruiker uitnodigt via het dashboard

interface InviteInfo {
  inviterName: string;
  companyName: string;
  slug: string;
  role: string;
  inviteUrl: string;
}

export async function sendInviteEmail(user: UserInfo, invite: InviteInfo) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${invite.inviterName} heeft je uitgenodigd voor ${invite.companyName}`,
      react: createElement(InviteEmail, {
        userName: user.name || "daar",
        inviterName: invite.inviterName,
        companyName: invite.companyName,
        slug: invite.slug,
        role: invite.role,
        inviteUrl: invite.inviteUrl,
      }),
    });
    console.log("[email] Uitnodiging verstuurd naar:", user.email);
    return true;
  } catch (err) {
    console.error("[email] Uitnodiging mislukt:", err);
    return false;
  }
}

// ─── Helper: Haal admin(s) van een tenant op ───

export async function getTenantAdmins(tenantId: string): Promise<UserInfo[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("tenant_users")
    .select("email, name")
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .eq("is_active", true);

  return data || [];
}

// ─── Helper: Haal tenant info op via Stripe customer ID ───

export async function getTenantByStripeCustomer(
  customerId: string
): Promise<TenantInfo | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, slug, subscription_plan, trial_ends_at")
    .eq("stripe_customer_id", customerId)
    .single();

  return data;
}
