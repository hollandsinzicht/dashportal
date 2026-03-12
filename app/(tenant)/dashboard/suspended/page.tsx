"use client";

import { useState } from "react";
import { useTenant } from "@/lib/tenant/context";
import { AlertTriangle, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Suspended pagina — wordt getoond wanneer een abonnement
 * is geannuleerd of verlopen.
 */
export default function SuspendedPage() {
  const tenant = useTenant();
  const [loading, setLoading] = useState(false);

  async function handleReactivate() {
    if (!tenant.stripeCustomerId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.tenantId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (err) {
      console.error("[suspended] Portal error:", err);
    } finally {
      setLoading(false);
    }
  }

  const isCanceled = tenant.subscriptionStatus === "canceled";
  const isPastDue = tenant.subscriptionStatus === "past_due";

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-9 h-9 text-danger" />
        </div>

        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary mb-3">
          {isCanceled
            ? "Je abonnement is beëindigd"
            : isPastDue
            ? "Betaling mislukt"
            : "Account is opgeschort"}
        </h1>

        <p className="text-text-secondary mb-8">
          {isCanceled
            ? "Je hebt geen actief abonnement meer. Heractiveer je abonnement om weer toegang te krijgen tot je dataportaal."
            : isPastDue
            ? "We konden je laatste betaling niet verwerken. Werk je betaalgegevens bij om je account te herstellen."
            : "Je account is tijdelijk opgeschort. Neem contact op met support of heractiveer je abonnement."}
        </p>

        <div className="space-y-3">
          {tenant.stripeCustomerId && (
            <Button
              onClick={handleReactivate}
              size="lg"
              className="w-full"
              loading={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isPastDue ? "Betaalgegevens bijwerken" : "Abonnement heractiveren"}
            </Button>
          )}

          <a
            href="mailto:support@dashportal.app"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            Neem contact op met support
          </a>
        </div>
      </div>
    </div>
  );
}
