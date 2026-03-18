"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import {
  Upload,
  Check,
  AlertCircle,
  X,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  Loader2,
  FolderOpen,
  Plug,
  Headphones,
  Mail,
  MessageCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { validateUUID } from "@/lib/utils/validation";
import {
  getSupportTier,
  SUPPORT_CONFIG,
  SUPPORT_EMAIL,
  type SupportTier,
} from "@/components/shared/CrispChat";

interface Workspace {
  id: string;
  name: string;
  reportCount?: number;
}

interface SettingsFormProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    accent_color: string | null;
    custom_domain: string | null;
    subscription_plan: string | null;
    subscription_status?: string | null;
    trial_ends_at?: string | null;
    pbi_tenant_id?: string | null;
    pbi_client_id?: string | null;
    pbi_workspace_ids?: string[] | null;
    agency_id?: string | null;
  };
  readOnly?: boolean;
}

export function SettingsForm({ tenant, readOnly = false }: SettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Form state ───
  const [name, setName] = useState(tenant.name);
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || "");
  const [primaryColor, setPrimaryColor] = useState(
    tenant.primary_color || "#1E3A5F"
  );
  const [accentColor, setAccentColor] = useState(
    tenant.accent_color || "#F59E0B"
  );
  const [customDomain, setCustomDomain] = useState(
    tenant.custom_domain || ""
  );

  // ─── Power BI state ───
  const [pbiTenantId, setPbiTenantId] = useState(tenant.pbi_tenant_id || "");
  const [pbiClientId, setPbiClientId] = useState(tenant.pbi_client_id || "");
  const [pbiClientSecret, setPbiClientSecret] = useState("");
  const [pbiErrors, setPbiErrors] = useState<Record<string, string>>({});
  const [pbiTesting, setPbiTesting] = useState(false);
  const [pbiSaving, setPbiSaving] = useState(false);
  const [pbiTestResult, setPbiTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(
    tenant.pbi_workspace_ids || []
  );
  const pbiConfigured = !!(tenant.pbi_tenant_id && tenant.pbi_client_id);

  // ─── UI state ───
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ─── Logo upload ───
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validatie
    const allowedTypes = ["image/png", "image/svg+xml", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({ type: "error", message: "Alleen PNG, JPG of SVG bestanden" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Bestand is te groot (max 2MB)" });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${tenant.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(filePath);

      // Cache-busting timestamp toevoegen
      const url = `${publicUrl}?t=${Date.now()}`;
      setLogoUrl(url);

      // Direct opslaan in database
      await saveTenantField({ logo_url: url });
      setFeedback({ type: "success", message: "Logo geupload!" });
    } catch (err) {
      console.error("[settings] Upload fout:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Upload mislukt",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    saveTenantField({ logo_url: "" });
    setFeedback({ type: "success", message: "Logo verwijderd" });
  }

  // ─── Branding opslaan ───
  async function handleSaveBranding() {
    setSaving(true);
    setFeedback(null);

    try {
      await saveTenantField({
        name,
        primary_color: primaryColor,
        accent_color: accentColor,
      });
      setFeedback({ type: "success", message: "Branding opgeslagen!" });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Opslaan mislukt",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── Custom domain opslaan ───
  async function handleSaveDomain() {
    setSaving(true);
    setFeedback(null);

    try {
      await saveTenantField({ custom_domain: customDomain || null });
      setFeedback({ type: "success", message: "Domein opgeslagen!" });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Opslaan mislukt",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── Helper: tenant veld(en) opslaan ───
  async function saveTenantField(fields: Record<string, unknown>) {
    const res = await fetch("/api/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, ...fields }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Opslaan mislukt");
    }
  }

  // ─── Power BI: UUID validatie on blur ───
  function handlePbiBlur(field: "pbiTenantId" | "pbiClientId") {
    const labels: Record<string, string> = {
      pbiTenantId: "Azure Tenant ID",
      pbiClientId: "Application (Client) ID",
    };
    const value = field === "pbiTenantId" ? pbiTenantId : pbiClientId;
    const error = validateUUID(value, labels[field]);
    setPbiErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function handlePbiChange(
    field: "pbiTenantId" | "pbiClientId" | "pbiClientSecret",
    value: string
  ) {
    if (field === "pbiTenantId") setPbiTenantId(value);
    if (field === "pbiClientId") setPbiClientId(value);
    if (field === "pbiClientSecret") setPbiClientSecret(value);

    // Reset test resultaat bij wijziging
    setPbiTestResult(null);
    setWorkspaces([]);

    // Clear error bij typing
    if (pbiErrors[field]) {
      setPbiErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  const hasPbiUUIDErrors = !!(pbiErrors.pbiTenantId || pbiErrors.pbiClientId);
  // Secret is nodig als PBI nog niet geconfigureerd is, OF als user een nieuw secret wil invullen
  const hasPbiAllFields = !!(
    pbiTenantId &&
    pbiClientId &&
    (pbiClientSecret || pbiConfigured)
  );

  // ─── Power BI: Test verbinding ───
  async function handlePbiTestConnection() {
    setPbiTesting(true);
    setPbiTestResult(null);
    setWorkspaces([]);

    try {
      // Als PBI al geconfigureerd is en er geen nieuw secret is ingevuld,
      // test dan met de opgeslagen credentials
      const useStoredCredentials = pbiConfigured && !pbiClientSecret;

      const body = useStoredCredentials
        ? { tenantId: tenant.id }
        : {
            tenantId: tenant.id,
            pbiTenantId,
            pbiClientId,
            pbiClientSecret,
            test: true,
          };

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setPbiTestResult({
          success: false,
          message: errorData.error || `Verbinding mislukt (HTTP ${res.status})`,
        });
        return;
      }

      const data = await res.json();

      if (data.success) {
        setWorkspaces(data.workspaces || []);
        setPbiTestResult({
          success: true,
          message: `Verbinding geslaagd! ${data.workspaces?.length || 0} workspace(s) gevonden.`,
        });
      } else {
        setPbiTestResult({
          success: false,
          message: data.error || "Verbinding mislukt",
        });
      }
    } catch (err) {
      setPbiTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Er ging iets mis. Controleer je gegevens.",
      });
    } finally {
      setPbiTesting(false);
    }
  }

  // ─── Power BI: Workspace toggle ───
  function toggleWorkspace(id: string) {
    setSelectedWorkspaces((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  // ─── Power BI: Opslaan ───
  async function handleSavePbi() {
    setPbiSaving(true);
    setFeedback(null);

    try {
      // Bouw update object
      const updates: Record<string, unknown> = {
        pbi_tenant_id: pbiTenantId,
        pbi_client_id: pbiClientId,
        pbi_workspace_ids: selectedWorkspaces,
      };

      // Alleen client secret meesturen als er een nieuw secret is ingevuld
      if (pbiClientSecret) {
        updates.pbi_client_secret = pbiClientSecret;
      }

      await saveTenantField(updates);

      // Sync rapporten als er workspaces geselecteerd zijn
      if (selectedWorkspaces.length > 0) {
        try {
          await fetch("/api/reports/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: tenant.id }),
          });
        } catch {
          // Sync fout is niet-blokkerend
          console.warn("[settings] Rapport sync mislukt na PBI opslag");
        }
      }

      setFeedback({
        type: "success",
        message: "Power BI koppeling opgeslagen! Rapporten worden gesynchroniseerd.",
      });
      setPbiClientSecret(""); // Reset secret veld na opslaan
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Opslaan mislukt",
      });
    } finally {
      setPbiSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Instellingen
        </h1>
        <p className="text-text-secondary mt-1">
          Pas de branding en configuratie van je portaal aan.
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-danger/10 text-danger border border-danger/20"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {feedback.message}
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto p-0.5 hover:opacity-70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {/* Branding */}
        <Card>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Pas het uiterlijk van je portaal aan.
          </CardDescription>

          <div className="mt-6 space-y-5">
            {/* Organisatienaam */}
            <Input
              id="org-name"
              label="Organisatienaam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jouw organisatie"
            />

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Logo
              </label>

              {logoUrl ? (
                <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-surface-secondary/30">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 w-auto object-contain max-w-[200px]"
                  />
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      loading={uploading}
                    >
                      Wijzigen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-text-secondary">
                        Uploaden...
                      </p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-text-secondary/30 mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Klik om logo te uploaden
                      </p>
                      <p className="text-xs text-text-secondary/60 mt-1">
                        PNG, JPG of SVG &middot; Max 2MB
                      </p>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Kleuren */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Primaire kleur
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Accentkleur
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 border border-border rounded-lg bg-surface-secondary/30">
              <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider font-medium">
                Preview
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                />
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="ml-2 flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveBranding} loading={saving}>
              <Check className="w-4 h-4" />
              Branding opslaan
            </Button>
          </div>
        </Card>

        {/* Custom domain — Business+ */}
        <FeatureGate
          feature="custom_domain"
          plan={tenant.subscription_plan || "starter"}
          subscriptionStatus={tenant.subscription_status || undefined}
          trialEndsAt={tenant.trial_ends_at || undefined}
        >
          <Card>
            <CardTitle>Custom domein</CardTitle>
            <CardDescription>
              Gebruik je eigen domein voor het portaal.
            </CardDescription>

            <div className="mt-6 space-y-4">
              <Input
                id="customDomain"
                label="Domein"
                placeholder="data.jouwbedrijf.nl"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                hint="Stel een CNAME record in dat verwijst naar cname.dashportal.app"
              />
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleSaveDomain} loading={saving}>
                  Domein opslaan
                </Button>
                {tenant.custom_domain && (
                  <span className="text-xs text-text-secondary">
                    Huidig: {tenant.custom_domain}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </FeatureGate>

        {/* Power BI koppeling */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Power BI koppeling</CardTitle>
              <CardDescription>
                Verbind je Microsoft Power BI omgeving om rapporten te delen.
              </CardDescription>
            </div>
            {pbiConfigured && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Verbonden
              </span>
            )}
          </div>

          <div className="mt-6 space-y-5">
            {/* Azure instructies (alleen tonen als nog niet geconfigureerd) */}
            {!pbiConfigured && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-primary font-medium mb-2">
                  Hoe stel ik dit in?
                </p>
                <ol className="text-sm text-primary/70 space-y-1 list-decimal list-inside">
                  <li>
                    Maak een App Registration aan in{" "}
                    <a
                      href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-primary hover:text-primary/80"
                    >
                      Azure Portal
                      <ExternalLink className="w-3 h-3 inline ml-0.5" />
                    </a>
                  </li>
                  <li>Kopieer de Tenant ID en Application (Client) ID</li>
                  <li>Maak een Client Secret aan onder Certificates &amp; secrets</li>
                  <li>
                    Voeg Power BI API permissions toe: Dataset.Read.All,
                    Report.Read.All, Workspace.Read.All
                  </li>
                </ol>
              </div>
            )}

            {/* Azure Tenant ID */}
            <Input
              id="pbiTenantId"
              label="Azure Tenant ID"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={pbiTenantId}
              onChange={(e) => handlePbiChange("pbiTenantId", e.target.value)}
              onBlur={() => handlePbiBlur("pbiTenantId")}
              error={pbiErrors.pbiTenantId}
              hint="Te vinden onder Azure Active Directory → Overview → Tenant ID"
            />

            {/* Client ID */}
            <Input
              id="pbiClientId"
              label="Application (Client) ID"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={pbiClientId}
              onChange={(e) => handlePbiChange("pbiClientId", e.target.value)}
              onBlur={() => handlePbiBlur("pbiClientId")}
              error={pbiErrors.pbiClientId}
            />

            {/* Client Secret */}
            <Input
              id="pbiClientSecret"
              label={
                pbiConfigured
                  ? "Client Secret (laat leeg om huidige te behouden)"
                  : "Client Secret"
              }
              type="password"
              placeholder={
                pbiConfigured
                  ? "••••••••••••••••"
                  : "Plak hier je client secret"
              }
              value={pbiClientSecret}
              onChange={(e) =>
                handlePbiChange("pbiClientSecret", e.target.value)
              }
              hint="Je secret wordt versleuteld opgeslagen"
            />

            {/* Test resultaat */}
            {pbiTestResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  pbiTestResult.success
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {pbiTestResult.success ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{pbiTestResult.message}</p>
              </div>
            )}

            {/* Test verbinding knop */}
            <Button
              variant="secondary"
              onClick={handlePbiTestConnection}
              loading={pbiTesting}
              disabled={!hasPbiAllFields || hasPbiUUIDErrors}
            >
              <Plug className="w-4 h-4" />
              Test verbinding
            </Button>

            {/* Workspace selectie (na succesvolle test) */}
            {workspaces.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Selecteer workspaces
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <div
                      key={ws.id}
                      onClick={() => toggleWorkspace(ws.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedWorkspaces.includes(ws.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                          selectedWorkspaces.includes(ws.id)
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedWorkspaces.includes(ws.id) && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {ws.name}
                        </p>
                        {ws.reportCount !== undefined && (
                          <p className="text-xs text-text-secondary">
                            {ws.reportCount} rapport(en)
                          </p>
                        )}
                      </div>
                      <FolderOpen className="w-4 h-4 text-text-secondary/50 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opslaan knop (alleen tonen als er iets gewijzigd is) */}
            {(pbiTestResult?.success || pbiConfigured) && (
              <Button
                onClick={handleSavePbi}
                loading={pbiSaving}
                disabled={
                  // Disable als:
                  // - Niet geconfigureerd EN test niet geslaagd
                  (!pbiConfigured && !pbiTestResult?.success) ||
                  // - Geen Tenant ID of Client ID
                  !pbiTenantId ||
                  !pbiClientId
                }
              >
                <Check className="w-4 h-4" />
                Power BI koppeling opslaan
              </Button>
            )}
          </div>
        </Card>

        {/* Support info card — voor agency clients: agency support info */}
        {tenant.agency_id ? (
          <Card>
            <CardTitle>Support</CardTitle>
            <CardDescription>
              Voor ondersteuning kun je contact opnemen met je agency.
            </CardDescription>
            <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-lg">
              <p className="text-sm text-text-primary">
                Je portaal wordt beheerd door je agency. Neem contact op met je agency beheerder voor vragen over je account, gebruikers of rapporten.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <SupportInfoCard
              plan={tenant.subscription_plan || "starter"}
              subscriptionStatus={tenant.subscription_status || "active"}
              trialEndsAt={tenant.trial_ends_at || null}
            />

            {/* Subscription info — niet voor agency-managed */}
            <Card>
              <CardTitle>Abonnement</CardTitle>
              <CardDescription>
                Je huidige plan en portaal informatie.
              </CardDescription>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-secondary rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary capitalize">
                    {tenant.subscription_plan || "Starter"}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Huidig plan</p>
                </div>
                <div className="p-4 bg-surface-secondary rounded-lg text-center">
                  <p className="text-sm font-mono text-text-primary">
                    {tenant.slug}.dashportal.app
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Portaal URL</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Support Info Card ───

const TIER_LABELS: Record<SupportTier, string> = {
  starter: "Basis",
  business: "Standaard",
  scale: "Priority",
  enterprise: "Dedicated",
};

const TIER_COLORS: Record<SupportTier, string> = {
  starter: "bg-surface-secondary text-text-secondary",
  business: "bg-primary/10 text-primary",
  scale: "bg-accent/10 text-accent",
  enterprise: "bg-success/10 text-success",
};

const UPGRADE_SUGGESTIONS: Partial<Record<SupportTier, { plan: string; benefit: string }>> = {
  starter: {
    plan: "Business",
    benefit: "live chat met 1 werkdag responstijd",
  },
  business: {
    plan: "Scale",
    benefit: "priority support met 4 uur responstijd",
  },
  scale: {
    plan: "Enterprise",
    benefit: "dedicated support met < 1 uur responstijd",
  },
};

function SupportInfoCard({
  plan,
  subscriptionStatus,
  trialEndsAt,
}: {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
}) {
  const tier = getSupportTier(plan, subscriptionStatus, trialEndsAt);
  const config = SUPPORT_CONFIG[tier];
  const upgrade = UPGRADE_SUGGESTIONS[tier];

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Support</CardTitle>
          <CardDescription>
            Je huidige support niveau en contactgegevens.
          </CardDescription>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${TIER_COLORS[tier]}`}
        >
          <Headphones className="w-3.5 h-3.5" />
          {TIER_LABELS[tier]}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {/* Support details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* E-mail */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary/50 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">E-mail</p>
              <p className="text-sm font-medium text-text-primary truncate">
                {SUPPORT_EMAIL}
              </p>
            </div>
          </div>

          {/* Chat */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary/50 rounded-lg">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                config.hasCrisp ? "bg-success/10" : "bg-surface-secondary"
              }`}
            >
              <MessageCircle
                className={`w-4 h-4 ${
                  config.hasCrisp ? "text-success" : "text-text-secondary/40"
                }`}
              />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Live chat</p>
              <p className="text-sm font-medium text-text-primary">
                {config.hasCrisp ? "Beschikbaar" : "Niet beschikbaar"}
              </p>
            </div>
          </div>

          {/* Responstijd */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary/50 rounded-lg">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Responstijd</p>
              <p className="text-sm font-medium text-text-primary">
                {config.responseTime}
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade suggestion */}
        {upgrade && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-sm text-primary/80">
              Upgrade naar{" "}
              <span className="font-semibold text-primary">
                {upgrade.plan}
              </span>{" "}
              voor {upgrade.benefit}.
            </p>
            <a
              href="/dashboard/billing"
              className="shrink-0 ml-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Upgraden
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
