"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DollarSign, Check } from "lucide-react";
import { DEFAULT_AGENCY_TIERS } from "@/lib/agency/pricing";
import { formatEuro } from "@/lib/agency/pricing";

export default function AgencyRegisterPricing() {
  const router = useRouter();
  const [agencySlug, setAgencySlug] = useState<string | null>(null);

  useEffect(() => {
    const slug = sessionStorage.getItem("agency_slug");
    if (!slug) {
      router.push("/agency/register");
      return;
    }
    setAgencySlug(slug);
  }, [router]);

  function handleContinue() {
    router.push("/agency/register/success");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Prijsmodel bevestigen
          </h1>
          <p className="text-muted mt-2">
            Stap 3 van 4 — Je standaard prijsschijven
          </p>
        </div>

        {/* Stappen indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full ${
                step <= 3 ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">
            Je klanten worden per maand gefactureerd op basis van het aantal gebruikers:
          </h2>

          <div className="space-y-3">
            {DEFAULT_AGENCY_TIERS.map((tier, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {tier.label}
                  </p>
                  <p className="text-sm text-muted">
                    {tier.min_users}–{tier.max_users ?? "∞"} gebruikers
                  </p>
                </div>
                <div className="text-right">
                  {tier.price_per_month > 0 ? (
                    <p className="font-semibold text-foreground">
                      {formatEuro(tier.price_per_month)}
                      <span className="text-sm text-muted font-normal">/mnd</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted">Op aanvraag</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-foreground">
              <Check className="w-4 h-4 inline-block text-success mr-1" />
              Je kunt deze prijzen later aanpassen in je agency dashboard.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="font-medium text-foreground mb-2">Hoe werkt facturatie?</h3>
            <ul className="text-sm text-muted space-y-1">
              <li>• Per klant wordt het aantal actieve gebruikers geteld</li>
              <li>• Op basis daarvan wordt de juiste prijsschijf bepaald</li>
              <li>• Je ontvangt één geconsolideerde factuur per maand</li>
              <li>• Facturatie start pas wanneer je klanten toevoegt</li>
            </ul>
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={handleContinue}
          >
            Bevestigen & afronden
          </Button>
        </div>
      </div>
    </div>
  );
}
