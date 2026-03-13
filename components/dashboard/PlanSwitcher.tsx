"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Check,
  Crown,
  X,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLANS, type PlanId } from "@/lib/plans";

// Plan volgorde voor upgrade/downgrade bepaling
const PLAN_ORDER: PlanId[] = ["starter", "business", "scale", "enterprise"];

interface PlanSwitcherProps {
  tenantId: string;
  currentPlan: string;
  currentPeriodEnd: string;
}

// Alleen self-service plannen tonen
const SWITCHABLE_PLANS = PLANS.filter(
  (p) => p.id !== "enterprise"
);

export function PlanSwitcher({
  tenantId,
  currentPlan,
  currentPeriodEnd,
}: PlanSwitcherProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    newPlan: string;
    effectiveDate: string;
  } | null>(null);

  const currentIndex = PLAN_ORDER.indexOf(currentPlan as PlanId);

  function getDirection(targetPlan: string): "upgrade" | "downgrade" {
    const targetIndex = PLAN_ORDER.indexOf(targetPlan as PlanId);
    return targetIndex > currentIndex ? "upgrade" : "downgrade";
  }

  function formatDate(isoDate: string): string {
    if (!isoDate) return "de volgende factuurdatum";
    return new Date(isoDate).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function handleSelect(planId: string) {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
    setError(null);
  }

  function handleClose() {
    if (!loading) {
      setSelectedPlan(null);
      setError(null);
    }
  }

  async function handleConfirm() {
    if (!selectedPlan) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, newPlan: selectedPlan }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedPlan(null);
        setSuccess({
          newPlan: selectedPlan,
          effectiveDate: data.effectiveDate,
        });
        // Na 3 seconden pagina herladen
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError(data.error || "Kon plan niet wijzigen. Probeer het opnieuw.");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    const plan = PLANS.find((p) => p.id === success.newPlan);
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-success">Plan gewijzigd</p>
            <p className="text-sm text-success/80 mt-1">
              Je abonnement wordt gewijzigd naar{" "}
              <strong>{plan?.name || success.newPlan}</strong> op{" "}
              {formatDate(success.effectiveDate)}.
            </p>
            <p className="text-xs text-success/60 mt-2">
              Pagina wordt automatisch herladen...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary mb-1">
          Plan wijzigen
        </h3>
        <p className="text-sm text-text-secondary mb-5">
          Upgrade of downgrade je abonnement. De wijziging gaat in bij je
          volgende factuur.
        </p>

        {/* Plan kaarten */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SWITCHABLE_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const direction = !isCurrent ? getDirection(plan.id) : null;

            return (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-4 transition-all ${
                  isCurrent
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/20 hover:bg-surface-secondary cursor-pointer"
                }`}
                onClick={() => !isCurrent && handleSelect(plan.id)}
              >
                {/* Huidig plan badge */}
                {isCurrent && (
                  <div className="absolute -top-2.5 left-3">
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Huidig plan
                    </span>
                  </div>
                )}

                {/* Plan highlighted badge */}
                {plan.highlighted && !isCurrent && (
                  <div className="absolute -top-2.5 left-3">
                    <span className="text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" />
                      Populair
                    </span>
                  </div>
                )}

                {/* Plan info */}
                <div className="mt-1">
                  <p className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-text-primary">
                      &euro;{plan.monthlyPrice}
                    </span>
                    <span className="text-xs text-text-secondary">/maand</span>
                  </div>
                </div>

                {/* Features (max 4) */}
                <ul className="mt-3 space-y-1.5">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-1.5 text-xs text-text-secondary"
                    >
                      <Check className="w-3 h-3 text-success shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-xs text-text-secondary/60 pl-4.5">
                      +{plan.features.length - 4} meer
                    </li>
                  )}
                </ul>

                {/* Actie knop */}
                <div className="mt-4">
                  {isCurrent ? (
                    <div className="h-9 flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        Je huidige plan
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant={direction === "upgrade" ? "primary" : "secondary"}
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(plan.id);
                      }}
                    >
                      {direction === "upgrade" ? (
                        <>
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          Upgraden
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          Downgraden
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise callout */}
        <div className="mt-4 flex items-center justify-between bg-surface-secondary rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent" />
            <span className="text-sm text-text-secondary">
              <strong className="text-text-primary">Enterprise</strong> — op maat
              met SLA en dedicated support
            </span>
          </div>
          <a
            href="mailto:sales@dashportal.app"
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <Mail className="w-3.5 h-3.5" />
            Contact
          </a>
        </div>
      </div>

      {/* ═══ Bevestigingsdialog ═══ */}
      {selectedPlan && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-surface border border-border rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      getDirection(selectedPlan) === "upgrade"
                        ? "bg-primary/10"
                        : "bg-accent/10"
                    }`}
                  >
                    {getDirection(selectedPlan) === "upgrade" ? (
                      <ArrowUpCircle className="w-4.5 h-4.5 text-primary" />
                    ) : (
                      <ArrowDownCircle className="w-4.5 h-4.5 text-accent" />
                    )}
                  </div>
                  <h2 className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
                    Plan{" "}
                    {getDirection(selectedPlan) === "upgrade"
                      ? "upgraden"
                      : "downgraden"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Wat verandert er */}
                <div>
                  <p className="text-sm text-text-secondary">
                    Je schakelt over van{" "}
                    <strong className="text-text-primary">
                      {PLANS.find((p) => p.id === currentPlan)?.name || currentPlan}
                    </strong>{" "}
                    naar{" "}
                    <strong className="text-text-primary">
                      {PLANS.find((p) => p.id === selectedPlan)?.name || selectedPlan}
                    </strong>
                    .
                  </p>
                </div>

                {/* Prijs vergelijking */}
                <div className="bg-surface-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Huidig</span>
                    <span className="text-text-secondary line-through">
                      &euro;
                      {PLANS.find((p) => p.id === currentPlan)?.monthlyPrice || 0}
                      /mnd
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-text-primary font-medium">Nieuw</span>
                    <span className="text-text-primary font-bold">
                      &euro;
                      {PLANS.find((p) => p.id === selectedPlan)?.monthlyPrice || 0}
                      /mnd
                    </span>
                  </div>
                </div>

                {/* Effectieve datum */}
                <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary/90">
                    De nieuwe prijs gaat in op{" "}
                    <strong>{formatDate(currentPeriodEnd)}</strong>. Tot die datum
                    behoud je je huidige plan.
                  </p>
                </div>

                {/* Downgrade waarschuwing */}
                {getDirection(selectedPlan) === "downgrade" && (
                  <div className="flex items-start gap-2 bg-accent/5 border border-accent/20 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <p className="text-sm text-accent/90">
                      Let op: bij een downgrade kunnen bepaalde limieten lager
                      worden (bijv. het aantal gebruikers). Controleer of je
                      huidige gebruik past binnen het nieuwe plan.
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirm}
                    loading={loading}
                    className="flex-1"
                  >
                    {getDirection(selectedPlan) === "upgrade"
                      ? "Upgraden"
                      : "Downgraden"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
