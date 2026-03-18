"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export function DeactivateAgencyButton({
  agencyId,
  agencyName,
  clientCount,
}: {
  agencyId: string;
  agencyName: string;
  clientCount: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "final">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDeactivate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agency/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Deactiveren mislukt");
        setLoading(false);
        return;
      }

      router.push("/agency/login");
    } catch {
      setError("Er ging iets mis");
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <Button variant="danger" onClick={() => setStep("confirm")}>
        Agency deactiveren
      </Button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger">
              Weet je zeker dat je {agencyName} wilt deactiveren?
            </p>
            <p className="text-sm text-muted mt-1">
              Dit heeft de volgende gevolgen:
            </p>
            <ul className="text-sm text-muted mt-2 space-y-1 list-disc list-inside">
              <li>Je agency dashboard wordt onbereikbaar</li>
              <li>Alle teamleden verliezen toegang</li>
              {clientCount > 0 && (
                <li className="text-danger font-medium">
                  {clientCount} klantportaal{clientCount !== 1 ? "en worden" : " wordt"} gedeactiveerd
                </li>
              )}
              {clientCount > 0 && (
                <li className="text-danger font-medium">
                  Alle gebruikers van je klanten verliezen direct toegang
                </li>
              )}
              <li>Facturatie wordt gestopt</li>
            </ul>
            <p className="text-xs text-muted mt-3">
              Neem contact op met DashPortal support om je account later te heractiveren.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={() => setStep("final")}>
            Ik begrijp de gevolgen
          </Button>
          <Button variant="ghost" onClick={() => { setStep("idle"); setError(""); }}>
            Annuleren
          </Button>
        </div>
      </div>
    );
  }

  // Final confirmation
  return (
    <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-danger">
            Laatste bevestiging
          </p>
          <p className="text-sm text-muted mt-1">
            Typ <strong className="text-danger">{agencyName}</strong> om te bevestigen:
          </p>
          <input
            type="text"
            className="mt-2 w-full px-3 py-2 rounded-lg border border-danger/30 bg-surface text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-danger"
            placeholder={agencyName}
            onChange={(e) => {
              if (e.target.value === agencyName) {
                handleDeactivate();
              }
            }}
            disabled={loading}
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-2">
        <Button variant="danger" loading={loading} disabled>
          Wacht op bevestiging...
        </Button>
        <Button variant="ghost" onClick={() => { setStep("idle"); setError(""); }} disabled={loading}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
