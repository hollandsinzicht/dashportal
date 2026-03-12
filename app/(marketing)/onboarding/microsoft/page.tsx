"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { CheckCircle, AlertCircle, ExternalLink, Info } from "lucide-react";
import { validateUUID } from "@/lib/utils/validation";

export default function OnboardingMicrosoft() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    pbiTenantId: "",
    pbiClientId: "",
    pbiClientSecret: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_skipped_steps");
    if (saved) {
      try { setSkippedSteps(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function handleBlur(field: "pbiTenantId" | "pbiClientId") {
    const labels: Record<string, string> = {
      pbiTenantId: "Azure Tenant ID",
      pbiClientId: "Application (Client) ID",
    };
    const error = validateUUID(form[field], labels[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  const hasUUIDErrors = !!(errors.pbiTenantId || errors.pbiClientId);
  const hasAllFields = !!(form.pbiTenantId && form.pbiClientId && form.pbiClientSecret);

  async function handleTestConnection() {
    setLoading(true);
    setTestResult(null);

    try {
      const tenantId = sessionStorage.getItem("onboarding_tenant_id");
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          pbiTenantId: form.pbiTenantId,
          pbiClientId: form.pbiClientId,
          pbiClientSecret: form.pbiClientSecret,
          test: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: `Verbinding geslaagd! ${data.workspaces?.length || 0} workspace(s) gevonden.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Verbinding mislukt",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Er ging iets mis. Controleer je gegevens.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setLoading(true);
    setTestResult(null);
    try {
      const tenantId = sessionStorage.getItem("onboarding_tenant_id");
      const response = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          pbi_tenant_id: form.pbiTenantId,
          pbi_client_id: form.pbiClientId,
          pbi_client_secret: form.pbiClientSecret,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setTestResult({
          success: false,
          message:
            data.error ||
            `Kon instellingen niet opslaan (${response.status})`,
        });
        return;
      }

      router.push("/onboarding/workspace");
    } catch {
      setTestResult({
        success: false,
        message: "Er ging iets mis bij het opslaan. Probeer het opnieuw.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    // Skip Microsoft (2) én Workspace (3) — workspace heeft Microsoft credentials nodig
    const newSkipped = Array.from(new Set([...skippedSteps, 2, 3]));
    sessionStorage.setItem("onboarding_skipped_steps", JSON.stringify(newSkipped));
    router.push("/onboarding/branding");
  }

  const instructions = [
    {
      step: 1,
      title: "App registratie aanmaken",
      description:
        'Ga naar portal.azure.com → App registrations → New registration. Geef de app de naam "DashPortal Koppeling".',
    },
    {
      step: 2,
      title: "Gegevens kopiëren",
      description:
        "Na registratie: kopieer de Application (client) ID en maak een Client Secret aan onder Certificates & secrets.",
    },
    {
      step: 3,
      title: "API permissions instellen",
      description:
        "Ga naar API permissions → Add permission → Power BI Service. Voeg toe: Dataset.Read.All, Report.Read.All, Workspace.Read.All. Klik op Grant admin consent.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Microsoft koppeling
          </h1>
          <p className="text-text-secondary mt-2">
            Stap 2: Verbind je Power BI omgeving
          </p>
        </div>

        <StepIndicator currentStep={2} skippedSteps={skippedSteps} />

        {/* Optioneel info callout */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-primary font-medium">
              Deze stap is optioneel
            </p>
            <p className="text-sm text-primary/70 mt-0.5">
              Heb je nog geen Azure App Registration? Geen probleem — je kunt dit
              later instellen via je dashboard onder Instellingen.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-primary-light rounded-2xl border border-primary/10 p-6 mb-8">
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-primary mb-4">
            Voordat je begint
          </h3>
          <div className="space-y-4">
            {instructions.map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">
                    {item.step}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    {item.title}
                  </p>
                  <p className="text-sm text-primary/70 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-4 hover:underline"
          >
            Open Azure Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-2xl border border-border p-8">
          <div className="space-y-5">
            <Input
              id="pbiTenantId"
              label="Azure Tenant ID"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.pbiTenantId}
              onChange={(e) => handleChange("pbiTenantId", e.target.value)}
              onBlur={() => handleBlur("pbiTenantId")}
              error={errors.pbiTenantId}
              hint="Te vinden onder Azure Active Directory → Overview → Tenant ID"
            />

            <Input
              id="pbiClientId"
              label="Application (Client) ID"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.pbiClientId}
              onChange={(e) => handleChange("pbiClientId", e.target.value)}
              onBlur={() => handleBlur("pbiClientId")}
              error={errors.pbiClientId}
            />

            <Input
              id="pbiClientSecret"
              label="Client Secret"
              type="password"
              placeholder="Plak hier je client secret"
              value={form.pbiClientSecret}
              onChange={(e) => handleChange("pbiClientSecret", e.target.value)}
              hint="Je secret wordt versleuteld opgeslagen"
            />

            {testResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  testResult.success
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{testResult.message}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                loading={loading && !testResult?.success}
                disabled={!hasAllFields || hasUUIDErrors}
                className="flex-1"
              >
                Test verbinding
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!testResult?.success}
                loading={loading && !!testResult?.success}
                className="flex-1"
              >
                Volgende stap
              </Button>
            </div>

            {/* Skip link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-text-secondary underline hover:text-text-primary transition-colors"
              >
                Sla deze stap over — ik doe dit later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
