"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Upload, BarChart3, AlertCircle, X } from "lucide-react";

export default function OnboardingBranding() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_skipped_steps");
    if (saved) {
      try { setSkippedSteps(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);
  const [primaryColor, setPrimaryColor] = useState("#1E3A5F");
  const [accentColor, setAccentColor] = useState("#F59E0B");
  const [customDomain, setCustomDomain] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validatie
    const allowedTypes = ["image/png", "image/svg+xml", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Alleen PNG, JPG of SVG bestanden toegestaan");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Bestand is te groot (max 2MB)");
      return;
    }

    // Lokale preview
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload naar Supabase Storage
    const tenantId = sessionStorage.getItem("onboarding_tenant_id");
    if (!tenantId) {
      setError("Tenant ID niet gevonden. Ga terug naar stap 1.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${tenantId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;
      setLogoUrl(url);
    } catch (err) {
      console.error("[onboarding/branding] Upload fout:", err);
      setError(
        err instanceof Error ? err.message : "Logo upload mislukt"
      );
      setLogoPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      const tenantId = sessionStorage.getItem("onboarding_tenant_id");
      const response = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          primary_color: primaryColor,
          accent_color: accentColor,
          custom_domain: customDomain || null,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          data.error ||
            `Kon branding niet opslaan (${response.status})`
        );
        return;
      }

      router.push("/onboarding/invite");
    } catch {
      setError("Er ging iets mis bij het opslaan. Probeer het opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Branding instellen
          </h1>
          <p className="text-text-secondary mt-2">
            Stap 4: Geef je portaal je eigen look-and-feel
          </p>
        </div>

        <StepIndicator currentStep={4} skippedSteps={skippedSteps} />

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-danger/10 text-danger mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="bg-surface rounded-2xl border border-border p-8 space-y-6">
            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Logo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />

              {logoPreview ? (
                <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-surface-secondary/30">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-12 w-auto object-contain max-w-[200px]"
                  />
                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-secondary transition-colors text-text-secondary"
                    >
                      Wijzigen
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-1.5 rounded-lg border border-border hover:bg-surface-secondary transition-colors text-text-secondary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer"
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
                      <Upload className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Klik om je logo te uploaden
                      </p>
                      <p className="text-xs text-text-secondary/60 mt-1">
                        PNG, JPG of SVG &middot; Max 2MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Primaire kleur
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border"
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
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Custom domain */}
            <Input
              id="customDomain"
              label="Custom domein (optioneel — Pro plan)"
              placeholder="data.jouwbedrijf.nl"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              hint="Stel een CNAME record in dat verwijst naar cname.dashportal.app"
            />

            <Button
              onClick={handleContinue}
              loading={saving}
              className="w-full"
              size="lg"
            >
              Volgende stap
            </Button>
          </div>

          {/* Preview */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div
              className="p-4 flex items-center gap-3 border-b"
              style={{ backgroundColor: primaryColor + "08" }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="h-8"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-[family-name:var(--font-syne)] font-bold text-sm">
                Jouw Portaal
              </span>
            </div>
            <div className="p-6">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">
                Live preview
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["Omzet Dashboard", "Sales Pipeline", "HR Analytics", "KPIs"].map(
                  (title) => (
                    <div
                      key={title}
                      className="rounded-lg p-3 border"
                      style={{
                        borderColor: primaryColor + "20",
                        backgroundColor: primaryColor + "05",
                      }}
                    >
                      <div
                        className="w-full h-12 rounded mb-2 flex items-center justify-center"
                        style={{ backgroundColor: primaryColor + "10" }}
                      >
                        <BarChart3
                          className="w-5 h-5"
                          style={{ color: primaryColor + "40" }}
                        />
                      </div>
                      <p className="text-xs font-medium text-text-primary">
                        {title}
                      </p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block"
                        style={{
                          backgroundColor: accentColor + "15",
                          color: accentColor,
                        }}
                      >
                        Finance
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
