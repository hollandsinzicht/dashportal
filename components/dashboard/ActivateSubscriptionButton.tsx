"use client";

import { useState } from "react";
import { CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ActivateSubscriptionButtonProps {
  tenantId: string;
  plan: string;
  email: string;
  companyName: string;
}

/**
 * Knop om een Stripe abonnement te activeren voor tenants
 * die nog geen stripe_customer_id hebben (bijv. na trial-only onboarding).
 *
 * Maakt een Stripe Customer + Subscription aan via /api/stripe/checkout.
 * Na succes wordt de pagina herladen zodat de Stripe portal knop verschijnt.
 */
export function ActivateSubscriptionButton({
  tenantId,
  plan,
  email,
  companyName,
}: ActivateSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          plan,
          email,
          companyName,
        }),
      });

      if (res.ok) {
        // Herlaad de pagina zodat de Stripe portal knop verschijnt
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Kon abonnement niet activeren");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleActivate} loading={loading} variant="primary">
        <CreditCard className="w-4 h-4" />
        Koppel aan Stripe
        <ArrowRight className="w-4 h-4" />
      </Button>
      <p className="text-xs text-text-secondary">
        Dit koppelt je account aan Stripe zodat je na de proefperiode kunt
        doorbetalen. Er wordt nu nog niets afgeschreven.
      </p>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
