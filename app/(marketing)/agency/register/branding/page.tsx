"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Palette, Upload } from "lucide-react";

export default function AgencyRegisterBranding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    primaryColor: "#1E3A5F",
    accentColor: "#F59E0B",
    logoUrl: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("agency_id");
    if (!id) {
      router.push("/agency/register");
      return;
    }
    setAgencyId(id);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          primary_color: form.primaryColor,
          accent_color: form.accentColor,
          logo_url: form.logoUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Kon branding niet opslaan");
        setLoading(false);
        return;
      }

      router.push("/agency/register/pricing");
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push("/agency/register/pricing");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Branding instellen
          </h1>
          <p className="text-muted mt-2">
            Stap 2 van 4 — Logo & kleuren (optioneel)
          </p>
        </div>

        {/* Stappen indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full ${
                step <= 2 ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo upload placeholder */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Logo URL
            </label>
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center shrink-0">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-muted" />
                )}
              </div>
              <Input
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                hint="Upload functie komt binnenkort. Plak nu een URL."
              />
            </div>
          </div>

          {/* Kleuren */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Primaire kleur
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Accent kleur
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                <Input
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="rounded-xl p-6 text-white text-center"
            style={{ backgroundColor: form.primaryColor }}
          >
            <p className="text-sm opacity-75">Preview</p>
            <p className="font-display font-bold text-lg mt-1">Je Agency Dashboard</p>
            <div
              className="mt-3 inline-block px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: form.accentColor, color: form.primaryColor }}
            >
              Accent knop
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleSkip}
            >
              Overslaan
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>
              Opslaan & doorgaan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
