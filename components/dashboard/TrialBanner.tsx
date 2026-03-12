"use client";

import { useState } from "react";
import { useTenant } from "@/lib/tenant/context";
import { Sparkles, ArrowRight, X } from "lucide-react";

/**
 * Trial banner die bovenaan het dashboard verschijnt
 * wanneer de tenant een actieve proefperiode heeft.
 *
 * Kleuren escaleren op basis van resterende dagen:
 * - Blauw: > 7 dagen
 * - Oranje: 3-7 dagen
 * - Rood: < 3 dagen
 */
export function TrialBanner() {
  const tenant = useTenant();
  const [dismissed, setDismissed] = useState(false);

  // Alleen tonen tijdens trial
  if (!tenant.isTrialActive || dismissed) return null;

  const days = tenant.trialDaysRemaining;

  // Kleur op basis van urgentie
  let bgClass = "bg-primary/5 border-primary/20";
  let textClass = "text-primary";
  let iconClass = "text-primary";

  if (days <= 3) {
    bgClass = "bg-danger/5 border-danger/20";
    textClass = "text-danger";
    iconClass = "text-danger";
  } else if (days <= 7) {
    bgClass = "bg-warning/5 border-warning/20";
    textClass = "text-warning";
    iconClass = "text-warning";
  }

  return (
    <div className={`${bgClass} border rounded-xl px-4 py-3 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        <Sparkles className={`w-4 h-4 ${iconClass} shrink-0`} />
        <p className={`text-sm font-medium ${textClass}`}>
          {days === 0
            ? "Je proefperiode eindigt vandaag"
            : days === 1
            ? "Je proefperiode eindigt morgen"
            : `Je proefperiode eindigt over ${days} dagen`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/dashboard/billing"
          className={`text-sm font-medium ${textClass} hover:underline flex items-center gap-1`}
        >
          Abonnement activeren
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-surface-secondary/50 text-text-secondary"
          aria-label="Sluiten"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
