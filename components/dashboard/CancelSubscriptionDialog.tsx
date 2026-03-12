"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CancelSubscriptionDialogProps {
  tenantId: string;
  tenantName: string;
  hasStripeSubscription: boolean;
}

const CANCEL_REASONS = [
  { value: "too_expensive", label: "Te duur" },
  { value: "not_using", label: "Gebruik het niet genoeg" },
  { value: "missing_features", label: "Mist functies die ik nodig heb" },
  { value: "switching_provider", label: "Overstappen naar een andere tool" },
  { value: "temporary", label: "Tijdelijke pauze" },
  { value: "other", label: "Anders" },
];

export function CancelSubscriptionDialog({
  tenantId,
  tenantName,
  hasStripeSubscription,
}: CancelSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"reason" | "confirm">("reason");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleOpen() {
    setIsOpen(true);
    setStep("reason");
    setReason("");
    setFeedback("");
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    if (!loading) {
      setIsOpen(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tenant/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, reason, feedback }),
      });

      if (res.ok) {
        setSuccess(true);
        // Na 3 seconden pagina refreshen
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Kon abonnement niet annuleren");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="text-sm text-text-secondary hover:text-danger transition-colors underline underline-offset-2"
      >
        Abonnement opzeggen
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-surface border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-danger/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-danger" />
              </div>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
                Abonnement opzeggen
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Success state */}
          {success && (
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
                Annulering bevestigd
              </h3>
              <p className="text-sm text-text-secondary">
                {hasStripeSubscription
                  ? "Je abonnement wordt aan het einde van de huidige facturatieperiode beëindigd. Je ontvangt een bevestigingsmail."
                  : "Je abonnement is geannuleerd. Je ontvangt een bevestigingsmail."}
              </p>
              <p className="text-xs text-text-secondary mt-3">
                Pagina wordt automatisch herladen...
              </p>
            </div>
          )}

          {/* Step 1: Reason */}
          {!success && step === "reason" && (
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm text-text-secondary mb-4">
                  We vinden het jammer dat je het portaal van{" "}
                  <strong className="text-text-primary">{tenantName}</strong>{" "}
                  wilt opzeggen. Help ons verbeteren door je reden te delen.
                </p>

                <label className="block text-sm font-medium text-text-primary mb-2">
                  Waarom wil je opzeggen?
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                        reason === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-surface-secondary"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={(e) => setReason(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          reason === option.value
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        {reason === option.value && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-sm text-text-primary">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Feedback <span className="text-text-secondary font-normal">(optioneel)</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Vertel ons wat we beter kunnen doen..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-text-primary text-sm placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Toch niet
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setStep("confirm")}
                  disabled={!reason}
                  className="flex-1"
                >
                  Verder
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {!success && step === "confirm" && (
            <div className="p-6 space-y-5">
              {/* Warning */}
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-danger mb-2">
                  Let op — dit kun je niet ongedaan maken
                </p>
                <ul className="text-sm text-danger/80 space-y-1.5">
                  {hasStripeSubscription ? (
                    <>
                      <li>• Je abonnement loopt door tot het einde van de huidige facturatieperiode</li>
                      <li>• Daarna wordt de toegang voor alle gebruikers geblokkeerd</li>
                    </>
                  ) : (
                    <li>• Je portaal wordt direct ontoegankelijk voor alle gebruikers</li>
                  )}
                  <li>• Na 30 dagen worden alle gegevens permanent verwijderd</li>
                  <li>• Download je data vóór die datum via de exportfunctie</li>
                </ul>
              </div>

              {/* Confirm text */}
              <p className="text-sm text-text-secondary">
                Weet je zeker dat je het abonnement voor{" "}
                <strong className="text-text-primary">{tenantName}</strong>{" "}
                wilt opzeggen?
              </p>

              {error && (
                <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep("reason")}
                  disabled={loading}
                  className="flex-1"
                >
                  Terug
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  loading={loading}
                  className="flex-1"
                >
                  Definitief opzeggen
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
