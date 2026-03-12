"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import {
  CheckCircle,
  UserPlus,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface InviteResult {
  email: string;
  success: boolean;
  tempPassword?: string;
  authCreated?: boolean;
  error?: string;
}

export default function OnboardingInvite() {
  const router = useRouter();
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("viewer");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_skipped_steps");
    if (saved) {
      try { setSkippedSteps(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  async function handleInvite() {
    setSending(true);
    setError(null);
    try {
      const tenantId = sessionStorage.getItem("onboarding_tenant_id");
      const emailList = emails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter(Boolean);

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          emails: emailList,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          data.error ||
            `Kon uitnodigingen niet versturen (${response.status})`
        );
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
      setSent(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSending(false);
    }
  }

  function handleCopy(password: string, idx: number) {
    navigator.clipboard.writeText(password);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleFinish() {
    // Naar success pagina — cleanup gebeurt daar niet zodat success page data kan lezen
    router.push("/onboarding/success");
  }

  // Filter results met wachtwoorden
  const withPasswords = results.filter((r) => r.tempPassword);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Gebruikers uitnodigen
          </h1>
          <p className="text-text-secondary mt-2">
            Stap 5: Nodig je eerste gebruikers uit
          </p>
        </div>

        <StepIndicator currentStep={5} skippedSteps={skippedSteps} />

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-danger/10 text-danger mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-border p-8">
          {sent ? (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg text-text-primary mb-2">
                  Accounts aangemaakt!
                </h3>
                <p className="text-text-secondary text-sm">
                  {results.filter((r) => r.success).length} gebruiker(s)
                  uitgenodigd.
                </p>
              </div>

              {/* Wachtwoorden tabel */}
              {withPasswords.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-primary uppercase tracking-wider">
                    Tijdelijke wachtwoorden
                  </p>
                  <div className="space-y-2">
                    {withPasswords.map((r, idx) => (
                      <div
                        key={r.email}
                        className="flex items-center gap-2 bg-white/80 dark:bg-black/20 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-text-secondary truncate min-w-0 flex-1">
                          {r.email}
                        </span>
                        <code className="text-sm font-[family-name:var(--font-mono)] font-semibold text-text-primary shrink-0">
                          {r.tempPassword}
                        </code>
                        <button
                          onClick={() => handleCopy(r.tempPassword!, idx)}
                          className="shrink-0 p-1.5 rounded hover:bg-surface-secondary transition-colors"
                          title="Kopieer"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-text-secondary" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary">
                    Deel deze wachtwoorden veilig met je collega&apos;s. Ze
                    kunnen ze later wijzigen.
                  </p>
                </div>
              )}

              <Button onClick={handleFinish} size="lg" className="w-full">
                Naar je portaal
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-text-secondary" />
                  <label className="text-sm font-medium text-text-primary">
                    E-mailadressen
                  </label>
                </div>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder={
                    "jan@bedrijf.nl\npiet@bedrijf.nl\nklaas@bedrijf.nl"
                  }
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Eén e-mailadres per regel of gescheiden door komma&apos;s
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Rol
                </label>
                <div className="flex gap-3">
                  {[
                    {
                      value: "viewer",
                      label: "Viewer",
                      desc: "Kan rapporten bekijken",
                    },
                    {
                      value: "admin",
                      label: "Admin",
                      desc: "Kan alles beheren",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRole(option.value)}
                      className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                        role === option.value
                          ? "border-primary bg-primary-light/30"
                          : "border-border hover:border-primary/20"
                      }`}
                    >
                      <p className="text-sm font-medium text-text-primary">
                        {option.label}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {option.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleFinish}
                  className="flex-1"
                >
                  Sla over
                </Button>
                <Button
                  onClick={handleInvite}
                  loading={sending}
                  disabled={!emails.trim()}
                  className="flex-1"
                >
                  Uitnodigingen versturen
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
