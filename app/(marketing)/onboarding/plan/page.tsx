"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { BarChart3, Check, Star } from "lucide-react";
import { PLANS } from "@/lib/plans";

function PlanSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("selected");
  const refCode = searchParams.get("ref");
  const [selectedPlan, setSelectedPlan] = useState(preselected || "business");

  function handleContinue() {
    if (selectedPlan === "enterprise") {
      // Enterprise → contact pagina
      window.location.href = "mailto:info@dashportal.app?subject=Enterprise%20aanvraag";
      return;
    }

    // Sla gekozen plan op en ga naar registratie
    sessionStorage.setItem("onboarding_plan", selectedPlan);

    // Sla referral code op als deze meegegeven is via URL (?ref=REF-XXXXXX)
    if (refCode) {
      sessionStorage.setItem("onboarding_referral_code", refCode);
    }

    router.push("/onboarding");
  }

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Kies je plan
          </h1>
          <p className="text-text-secondary mt-2">
            Elk plan start met 14 dagen gratis proefperiode — geen creditcard nodig
          </p>
        </div>

        <StepIndicator currentStep={0} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`
                relative p-5 rounded-xl border text-left transition-all
                ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary shadow-md"
                    : plan.highlighted
                    ? "border-primary/30 bg-surface hover:border-primary/50 hover:shadow-sm"
                    : "border-border bg-surface hover:border-primary/20 hover:shadow-sm"
                }
              `}
            >
              {plan.highlighted && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Populairst
                </div>
              )}

              <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary text-lg">
                {plan.name}
              </h3>

              <div className="mt-2">
                {plan.monthlyPrice > 0 ? (
                  <p className="text-2xl font-bold text-text-primary">
                    &euro;{plan.monthlyPrice}
                    <span className="text-sm font-normal text-text-secondary">/maand</span>
                  </p>
                ) : (
                  <p className="text-lg font-bold text-text-primary">
                    Op maat
                  </p>
                )}
              </div>

              <p className="text-xs text-text-secondary mt-1 leading-snug">
                {plan.description}
              </p>

              <ul className="mt-4 space-y-1.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.id && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            size="lg"
            className="min-w-[200px]"
          >
            {selectedPlan === "enterprise"
              ? "Neem contact op"
              : `Ga verder met ${selectedPlanData?.name || "plan"}`}
          </Button>
          <p className="text-xs text-text-secondary mt-3">
            Je kunt je plan later altijd wijzigen
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPlanSelection() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Laden...</div>
      </div>
    }>
      <PlanSelectionContent />
    </Suspense>
  );
}
