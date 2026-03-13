"use client";

import { useState } from "react";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BillingPortalButtonProps {
  tenantId: string;
}

/**
 * Knop die een Stripe Customer Portal sessie aanmaakt
 * en de gebruiker daarheen redirect.
 */
export function BillingPortalButton({ tenantId }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Kon facturatieportaal niet openen");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} loading={loading} variant="primary">
        <ExternalLink className="w-4 h-4" />
        Beheer abonnement in Stripe
      </Button>
      {error && (
        <div className="mt-3 bg-danger/5 border border-danger/20 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
