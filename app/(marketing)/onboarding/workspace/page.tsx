"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Card } from "@/components/ui/Card";
import { Check, FolderOpen, Loader2, AlertCircle, Info } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  reportCount?: number;
}

export default function OnboardingWorkspace() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
  const [microsoftSkipped, setMicrosoftSkipped] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_skipped_steps");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSkippedSteps(parsed);
        if (parsed.includes(2)) {
          setMicrosoftSkipped(true);
          setLoading(false);
          return; // Don't load workspaces if Microsoft step was skipped
        }
      } catch { /* ignore */ }
    }

    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      const tenantId = sessionStorage.getItem("onboarding_tenant_id");
      if (!tenantId) {
        setError("Geen tenant gevonden. Ga terug naar stap 1.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || `Kon workspaces niet ophalen (${response.status})`
        );
        return;
      }

      setWorkspaces(data.workspaces || []);
    } catch {
      setError("Er ging iets mis bij het ophalen van workspaces.");
    } finally {
      setLoading(false);
    }
  }

  function toggleWorkspace(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((w) => w !== id)
        : [...prev, id]
    );
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      const tenantId = sessionStorage.getItem("onboarding_tenant_id");

      // 1. Save selected workspace IDs to tenant
      const patchRes = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          pbi_workspace_ids: selected,
        }),
      });

      if (!patchRes.ok) {
        const patchData = await patchRes.json().catch(() => ({}));
        setError(
          patchData.error ||
            `Kon workspace selectie niet opslaan (${patchRes.status})`
        );
        return;
      }

      // 2. Sync reports from selected workspaces into database
      const syncRes = await fetch("/api/reports/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (!syncRes.ok) {
        const syncData = await syncRes.json().catch(() => ({}));
        setError(
          syncData.error || `Rapport synchronisatie mislukt (${syncRes.status})`
        );
        return;
      }

      router.push("/onboarding/branding");
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    const newSkipped = Array.from(new Set([...skippedSteps, 3]));
    sessionStorage.setItem("onboarding_skipped_steps", JSON.stringify(newSkipped));
    router.push("/onboarding/branding");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Workspaces selecteren
          </h1>
          <p className="text-text-secondary mt-2">
            Stap 3: Kies de workspaces die je wilt koppelen
          </p>
        </div>

        <StepIndicator currentStep={3} skippedSteps={skippedSteps} />

        {/* Microsoft skipped banner */}
        {microsoftSkipped && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20 mb-6">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-accent font-medium">
                Microsoft koppeling nog niet ingesteld
              </p>
              <p className="text-sm text-accent/70 mt-0.5">
                Je hebt de Microsoft stap overgeslagen. Om workspaces te koppelen
                moet je eerst je Power BI credentials instellen via Instellingen
                in je dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && !microsoftSkipped && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-danger/10 text-danger mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {microsoftSkipped ? (
          /* When Microsoft was skipped, just show skip option */
          <div className="bg-surface rounded-2xl border border-border p-8 text-center">
            <FolderOpen className="w-10 h-10 text-text-secondary/50 mx-auto mb-3" />
            <p className="text-text-secondary mb-6">
              Workspace selectie is beschikbaar zodra je de Microsoft koppeling
              hebt ingesteld.
            </p>
            <Button onClick={handleSkip} className="w-full" size="lg">
              Ga verder naar Branding
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-3 text-text-secondary">
              Workspaces laden...
            </span>
          </div>
        ) : workspaces.length === 0 && !error ? (
          <Card className="text-center py-12">
            <FolderOpen className="w-10 h-10 text-text-secondary/50 mx-auto mb-3" />
            <p className="text-text-secondary">
              Geen workspaces gevonden. Controleer of de app registratie
              toegang heeft tot je Power BI workspaces.
            </p>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                hover
                onClick={() => toggleWorkspace(ws.id)}
                className={`flex items-center gap-4 transition-all ${
                  selected.includes(ws.id)
                    ? "border-primary bg-primary-light/30"
                    : ""
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    selected.includes(ws.id)
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}
                >
                  {selected.includes(ws.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{ws.name}</p>
                  {ws.reportCount !== undefined && (
                    <p className="text-sm text-text-secondary">
                      {ws.reportCount} rapport(en)
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {!microsoftSkipped && (
          <>
            <Button
              onClick={handleContinue}
              disabled={selected.length === 0}
              loading={saving}
              className="w-full"
              size="lg"
            >
              Volgende stap
            </Button>

            {/* Skip link */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-text-secondary underline hover:text-text-primary transition-colors"
              >
                Sla deze stap over — ik doe dit later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
