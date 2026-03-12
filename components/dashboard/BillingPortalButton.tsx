"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
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

  async function handleClick() {
    setLoading(true);
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
        alert(data.error || "Kon facturatieportaal niet openen");
      }
    } catch {
      alert("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} loading={loading} variant="primary">
      <ExternalLink className="w-4 h-4" />
      Beheer abonnement in Stripe
    </Button>
  );
}
