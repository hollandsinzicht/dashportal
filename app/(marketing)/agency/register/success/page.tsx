"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ArrowRight, Users, Building2 } from "lucide-react";

export default function AgencyRegisterSuccess() {
  const router = useRouter();
  const [agencySlug, setAgencySlug] = useState<string | null>(null);

  useEffect(() => {
    const slug = sessionStorage.getItem("agency_slug");
    if (!slug) {
      router.push("/agency/register");
      return;
    }
    setAgencySlug(slug);

    // Cleanup sessionStorage
    return () => {
      sessionStorage.removeItem("agency_id");
      sessionStorage.removeItem("agency_slug");
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Stappen indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="h-2 w-12 rounded-full bg-primary" />
          ))}
        </div>

        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Je agency is klaar!
        </h1>
        <p className="text-muted mb-8">
          Je kunt nu klantportalen aanmaken en beheren vanuit je dashboard.
        </p>

        {/* Volgende stappen */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-foreground mb-4">Volgende stappen</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Maak je eerste klant aan</p>
                <p className="text-sm text-muted">
                  Ga naar Klanten → Nieuwe klant en vul de gegevens in.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Nodig je team uit</p>
                <p className="text-sm text-muted">
                  Voeg collega&apos;s toe als beheerder of meekijker.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => router.push(`/agency/${agencySlug}/dashboard`)}
        >
          Ga naar je dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
