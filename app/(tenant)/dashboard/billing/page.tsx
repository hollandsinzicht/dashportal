import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPlanConfig } from "@/lib/stripe/config";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  XCircle,
  ShieldAlert,
  Clock,
  Zap,
} from "lucide-react";
import { BillingPortalButton } from "@/components/dashboard/BillingPortalButton";
import { ActivateSubscriptionButton } from "@/components/dashboard/ActivateSubscriptionButton";
import { CancelSubscriptionDialog } from "@/components/dashboard/CancelSubscriptionDialog";
import { DataExportButton } from "@/components/dashboard/DataExportButton";

export default async function BillingPage() {
  // ─── Auth + tenant context ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role, email, name")
    .eq("email", user.email!)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!tenantUser) redirect("/");

  const serviceClient = await createServiceClient();
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select(
      "id, name, subscription_plan, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", tenantUser.tenant_id)
    .single();

  if (!tenant) redirect("/dashboard");

  const plan = getPlanConfig(tenant.subscription_plan || "starter");
  const status = tenant.subscription_status || "active";
  const isTrialing = status === "trialing";
  const isPastDue = status === "past_due";
  const isCanceled = status === "canceled";
  const isActive = status === "active";
  const hasStripe = !!tenant.stripe_customer_id;

  // Trial dagen berekenen
  let trialDaysRemaining = 0;
  let trialEndDate = "";
  if (tenant.trial_ends_at) {
    const diff = new Date(tenant.trial_ends_at).getTime() - Date.now();
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    trialEndDate = new Date(tenant.trial_ends_at).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Trial progress percentage (van 14 dagen)
  const trialProgress = isTrialing
    ? Math.max(0, Math.min(100, ((14 - trialDaysRemaining) / 14) * 100))
    : 0;

  // Urgency level voor trial
  const trialUrgency =
    trialDaysRemaining <= 3
      ? "critical"
      : trialDaysRemaining <= 7
        ? "warning"
        : "normal";

  // Stappen status
  const steps = [
    {
      label: "Account aangemaakt",
      done: true,
      warning: false,
      description: "Je account is actief",
    },
    {
      label: "Plan geselecteerd",
      done: true,
      warning: false,
      description: `${plan.name} — €${plan.price}/maand`,
    },
    {
      label: "Stripe gekoppeld",
      done: hasStripe,
      warning: false,
      description: hasStripe
        ? "Je account is verbonden met Stripe"
        : "Koppel je account om betaalgegevens in te stellen",
    },
    {
      label: "Betaalmethode ingesteld",
      // active = payment works, trialing with stripe = might not have card yet
      done: isActive && !isCanceled,
      warning: isTrialing && hasStripe,
      description: isActive
        ? "Betaalmethode is actief"
        : isPastDue
          ? "Laatste betaling mislukt — werk je betaalgegevens bij"
          : isTrialing && hasStripe
            ? "Voeg een betaalmethode toe vóór het einde van je proefperiode"
            : "Wordt beschikbaar na Stripe koppeling",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Facturatie &amp; Abonnement
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Overzicht van je abonnement, proefperiode en betaalstatus.
        </p>
      </div>

      {/* ═══ Urgente meldingen ═══ */}
      {isPastDue && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="font-semibold text-danger">
              Betaling mislukt — actie vereist
            </p>
            <p className="text-sm text-danger/80 mt-1">
              Je laatste betaling kon niet worden verwerkt. Werk je
              betaalgegevens bij via Stripe om je toegang te behouden.
            </p>
            {hasStripe && (
              <div className="mt-3">
                <BillingPortalButton tenantId={tenant.id} />
              </div>
            )}
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="font-semibold text-danger">Abonnement geannuleerd</p>
            <p className="text-sm text-danger/80 mt-1">
              Je abonnement is beëindigd. Je hebt geen toegang meer tot alle
              functies. Neem contact op om je abonnement te heractiveren.
            </p>
          </div>
        </div>
      )}

      {/* ═══ Hoofdkaart: Plan + Status ═══ */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Status header */}
        <div
          className={`px-6 py-4 ${
            isActive
              ? "bg-success/5 border-b border-success/20"
              : isTrialing
                ? trialUrgency === "critical"
                  ? "bg-danger/5 border-b border-danger/20"
                  : trialUrgency === "warning"
                    ? "bg-accent/5 border-b border-accent/20"
                    : "bg-primary/5 border-b border-primary/20"
                : isPastDue
                  ? "bg-danger/5 border-b border-danger/20"
                  : "bg-surface-secondary border-b border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-semibold text-success">
                      Abonnement actief
                    </p>
                    <p className="text-xs text-success/70">
                      Alles is in orde — je betaling loopt automatisch.
                    </p>
                  </div>
                </>
              )}
              {isTrialing && (
                <>
                  <Clock
                    className={`w-5 h-5 ${
                      trialUrgency === "critical"
                        ? "text-danger"
                        : trialUrgency === "warning"
                          ? "text-accent"
                          : "text-primary"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-semibold ${
                        trialUrgency === "critical"
                          ? "text-danger"
                          : trialUrgency === "warning"
                            ? "text-accent"
                            : "text-primary"
                      }`}
                    >
                      Proefperiode — nog {trialDaysRemaining} dag
                      {trialDaysRemaining !== 1 ? "en" : ""}
                    </p>
                    <p
                      className={`text-xs ${
                        trialUrgency === "critical"
                          ? "text-danger/70"
                          : trialUrgency === "warning"
                            ? "text-accent/70"
                            : "text-primary/70"
                      }`}
                    >
                      Eindigt op {trialEndDate}
                    </p>
                  </div>
                </>
              )}
              {isPastDue && (
                <>
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <div>
                    <p className="font-semibold text-danger">
                      Betaling mislukt
                    </p>
                    <p className="text-xs text-danger/70">
                      Werk je betaalgegevens bij om je toegang te behouden.
                    </p>
                  </div>
                </>
              )}
              {isCanceled && (
                <>
                  <XCircle className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="font-semibold text-text-secondary">
                      Geannuleerd
                    </p>
                    <p className="text-xs text-text-secondary/70">
                      Je abonnement is niet meer actief.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Trial progress bar */}
          {isTrialing && (
            <div className="mt-3">
              <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    trialUrgency === "critical"
                      ? "bg-danger"
                      : trialUrgency === "warning"
                        ? "bg-accent"
                        : "bg-primary"
                  }`}
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Plan info */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary">Huidig plan</p>
              <p className="text-xl font-bold text-text-primary font-[family-name:var(--font-syne)]">
                {plan.name}
              </p>
            </div>
            {plan.price > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">
                  €{plan.price}
                </p>
                <p className="text-xs text-text-secondary">per maand</p>
              </div>
            )}
          </div>

          {/* Volgende factuurdatum */}
          {tenant.current_period_end && !isCanceled && !isTrialing && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="w-4 h-4" />
              <span>
                {tenant.cancel_at_period_end
                  ? "Abonnement eindigt op "
                  : "Volgende factuur op "}
                {new Date(tenant.current_period_end).toLocaleDateString(
                  "nl-NL",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              </span>
            </div>
          )}

          {/* Cancel at period end warning */}
          {tenant.cancel_at_period_end && !isCanceled && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mt-3">
              <p className="text-sm text-accent">
                Je abonnement wordt aan het einde van de huidige periode
                beëindigd.
              </p>
            </div>
          )}

          {/* Plan features (compact) */}
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
              Inbegrepen
            </p>
            <div className="flex flex-wrap gap-2">
              {plan.features.slice(0, 6).map((feature) => (
                <span
                  key={feature}
                  className="text-xs text-text-secondary bg-surface-secondary px-2.5 py-1 rounded-full"
                >
                  {feature}
                </span>
              ))}
              {plan.features.length > 6 && (
                <span className="text-xs text-text-secondary/60 px-2.5 py-1">
                  +{plan.features.length - 6} meer
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Stappen checklist ═══ */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
          Accountstatus
        </h3>
        <p className="text-sm text-text-secondary mb-5">
          {isActive
            ? "Alles is correct ingesteld."
            : "Voltooi de onderstaande stappen om je account compleet te maken."}
        </p>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex gap-4">
              {/* Verticale lijn + icoon */}
              <div className="flex flex-col items-center">
                {step.done ? (
                  <div className="w-7 h-7 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                ) : step.warning ? (
                  <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-surface-secondary rounded-full flex items-center justify-center shrink-0">
                    <Circle className="w-4 h-4 text-text-secondary/40" />
                  </div>
                )}
                {/* Connector lijn */}
                {i < steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 my-1 ${
                      step.done ? "bg-success/20" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-5 flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.done
                      ? "text-text-primary"
                      : step.warning
                        ? "text-accent"
                        : "text-text-secondary"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Actieblok trial: duidelijk wat er moet gebeuren ═══ */}
      {isTrialing && (
        <div
          className={`rounded-xl p-6 ${
            trialUrgency === "critical"
              ? "bg-danger/5 border border-danger/20"
              : trialUrgency === "warning"
                ? "bg-accent/5 border border-accent/20"
                : "bg-primary/5 border border-primary/10"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                trialUrgency === "critical"
                  ? "bg-danger/10"
                  : trialUrgency === "warning"
                    ? "bg-accent/10"
                    : "bg-primary/10"
              }`}
            >
              <Zap
                className={`w-5 h-5 ${
                  trialUrgency === "critical"
                    ? "text-danger"
                    : trialUrgency === "warning"
                      ? "text-accent"
                      : "text-primary"
                }`}
              />
            </div>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  trialUrgency === "critical"
                    ? "text-danger"
                    : trialUrgency === "warning"
                      ? "text-accent"
                      : "text-primary"
                }`}
              >
                {hasStripe
                  ? "Voeg een betaalmethode toe"
                  : "Koppel je account aan Stripe"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  trialUrgency === "critical"
                    ? "text-danger/80"
                    : trialUrgency === "warning"
                      ? "text-accent/80"
                      : "text-primary/70"
                }`}
              >
                {hasStripe ? (
                  <>
                    Open het Stripe portaal en voeg een creditcard of andere
                    betaalmethode toe. Zonder betaalmethode verlies je na{" "}
                    <strong>{trialEndDate}</strong> de toegang tot je portaal en
                    alle rapporten.
                  </>
                ) : (
                  <>
                    Koppel je account aan Stripe om een betaalmethode in te
                    stellen. Zonder betaalmethode verlies je na{" "}
                    <strong>{trialEndDate}</strong> de toegang tot je portaal en
                    alle rapporten.
                  </>
                )}
              </p>

              <div className="mt-4">
                {hasStripe ? (
                  <BillingPortalButton tenantId={tenant.id} />
                ) : (
                  <ActivateSubscriptionButton
                    tenantId={tenant.id}
                    plan={tenant.subscription_plan || "starter"}
                    email={tenantUser.email || user.email!}
                    companyName={tenant.name}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Abonnement beheren (actief, niet trial) ═══ */}
      {hasStripe && !isTrialing && !isCanceled && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
            Abonnement beheren
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Wijzig je plan, werk je betaalgegevens bij of download facturen via
            het Stripe klantenportaal.
          </p>
          <BillingPortalButton tenantId={tenant.id} />
        </div>
      )}

      {/* Activate Stripe voor niet-trialing, niet-gekoppelde users */}
      {!hasStripe && !isTrialing && !isCanceled && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
            Abonnement activeren
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Koppel je account aan Stripe om een betaalmethode in te stellen en
            je abonnement te activeren.
          </p>
          <ActivateSubscriptionButton
            tenantId={tenant.id}
            plan={tenant.subscription_plan || "starter"}
            email={tenantUser.email || user.email!}
            companyName={tenant.name}
          />
        </div>
      )}

      {/* ═══ Data export ═══ */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
          Data export
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Download al je data als JSON-bestand. Bevat: tenant-instellingen,
          gebruikers, rapporten, werkruimtes, toegangsrechten en activiteitslog.
        </p>
        <DataExportButton tenantId={tenant.id} />
      </div>

      {/* ═══ Abonnement opzeggen ═══ */}
      {!isCanceled && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
            Abonnement opzeggen
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {tenant.cancel_at_period_end
              ? "Je abonnement wordt aan het einde van de huidige periode beëindigd."
              : hasStripe
                ? "Bij opzegging behoud je toegang tot het einde van je huidige facturatieperiode. Na 30 dagen worden alle gegevens permanent verwijderd."
                : "Bij opzegging verlies je direct de toegang. Na 30 dagen worden alle gegevens permanent verwijderd."}
          </p>
          {!tenant.cancel_at_period_end ? (
            <CancelSubscriptionDialog
              tenantId={tenant.id}
              tenantName={tenant.name}
              hasStripeSubscription={!!tenant.stripe_subscription_id}
            />
          ) : (
            <p className="text-sm text-accent font-medium">
              ⚠️ Annulering is al ingepland. Neem contact op met support als je
              je abonnement wilt heractiveren.
            </p>
          )}
        </div>
      )}

      {/* ═══ Hulp nodig? ═══ */}
      <div className="text-center py-2">
        <p className="text-xs text-text-secondary">
          Vragen over je abonnement?{" "}
          <a
            href="mailto:support@dashportal.app"
            className="text-primary hover:underline"
          >
            Neem contact op met support
          </a>
        </p>
      </div>
    </div>
  );
}
