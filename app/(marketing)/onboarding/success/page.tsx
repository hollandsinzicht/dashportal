"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import { getPlatformUrl } from "@/lib/utils/urls";

export default function OnboardingSuccess() {
  const [slug, setSlug] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("starter");
  const [hasSkippedSteps, setHasSkippedSteps] = useState(false);

  useEffect(() => {
    const savedSlug = sessionStorage.getItem("onboarding_slug");
    const savedPlan = sessionStorage.getItem("onboarding_plan");
    const savedSkipped = sessionStorage.getItem("onboarding_skipped_steps");

    setSlug(savedSlug);
    if (savedPlan) setPlan(savedPlan);

    if (savedSkipped) {
      try {
        const skipped = JSON.parse(savedSkipped);
        if (Array.isArray(skipped) && skipped.length > 0) {
          setHasSkippedSteps(true);
        }
      } catch { /* ignore */ }
    }

    // Cleanup onboarding sessionStorage
    return () => {
      sessionStorage.removeItem("onboarding_tenant_id");
      sessionStorage.removeItem("onboarding_slug");
      sessionStorage.removeItem("onboarding_plan");
      sessionStorage.removeItem("onboarding_skipped_steps");
    };
  }, []);

  const planNames: Record<string, string> = {
    starter: "Starter",
    business: "Business",
    scale: "Scale",
    enterprise: "Enterprise",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-success" />
        </div>

        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Je dataportaal is klaar!
        </h1>

        <p className="text-text-secondary mt-3 mb-2">
          Je account is succesvol aangemaakt op het{" "}
          <span className="font-semibold text-primary">{planNames[plan] || plan}</span> plan.
        </p>

        <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            14 dagen gratis proefperiode gestart
          </span>
        </div>

        {/* Skipped steps warning */}
        {hasSkippedSteps && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20 mb-6 text-left">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-accent font-medium">
                Power BI koppeling nog niet ingesteld
              </p>
              <p className="text-sm text-accent/70 mt-0.5">
                Je hebt de Microsoft koppeling en/of workspace selectie overgeslagen.
                Ga naar <strong>Instellingen</strong> in je dashboard om dit te voltooien.
              </p>
            </div>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-text-secondary mb-1">Je portaal adres</p>
          <p className="text-lg font-mono font-medium text-text-primary">
            {slug ? `${slug}.dashportal.app` : "..."}
          </p>
        </div>

        <Button
          onClick={() => {
            // Cross-subdomain navigatie: op productie gaat dit naar
            // app.dashportal.app/dashboard, op localhost naar /dashboard
            window.location.href = getPlatformUrl("/dashboard");
          }}
          size="lg"
          className="w-full"
        >
          Ga naar je dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-xs text-text-secondary mt-4">
          Je kunt je abonnement op elk moment wijzigen via Facturatie in het dashboard.
        </p>
      </div>
    </div>
  );
}
