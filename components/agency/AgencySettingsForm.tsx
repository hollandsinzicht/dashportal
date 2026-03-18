"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Building2, Palette, Check, Upload } from "lucide-react";

interface AgencySettingsFormProps {
  agencyId: string;
  initialData: {
    name: string;
    billing_email: string | null;
    primary_color: string;
    accent_color: string;
    logo_url: string | null;
    company_details: {
      kvk_number?: string;
      vat_number?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      website?: string;
    };
  };
}

export function AgencySettingsForm({ agencyId, initialData }: AgencySettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Bedrijfsgegevens
  const [name, setName] = useState(initialData.name);
  const [billingEmail, setBillingEmail] = useState(initialData.billing_email || "");
  const [kvk, setKvk] = useState(initialData.company_details.kvk_number || "");
  const [vat, setVat] = useState(initialData.company_details.vat_number || "");
  const [address, setAddress] = useState(initialData.company_details.address || "");
  const [city, setCity] = useState(initialData.company_details.city || "");
  const [postalCode, setPostalCode] = useState(initialData.company_details.postal_code || "");
  const [website, setWebsite] = useState(initialData.company_details.website || "");

  // Branding
  const [primaryColor, setPrimaryColor] = useState(initialData.primary_color);
  const [accentColor, setAccentColor] = useState(initialData.accent_color);
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url || "");
  const [uploading, setUploading] = useState(false);

  async function save(fields: Record<string, unknown>, label: string) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agencyId, ...fields }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Opslaan mislukt (HTTP ${res.status})`);
        return;
      }

      setSuccess(`${label} opgeslagen`);
      router.refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCompany() {
    await save({
      name,
      billing_email: billingEmail || null,
      company_details: {
        kvk_number: kvk || undefined,
        vat_number: vat || undefined,
        address: address || undefined,
        city: city || undefined,
        postal_code: postalCode || undefined,
        website: website || undefined,
      },
    }, "Bedrijfsgegevens");
  }

  async function handleSaveBranding() {
    await save({
      primary_color: primaryColor,
      accent_color: accentColor,
      logo_url: logoUrl || null,
    }, "Branding");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo mag maximaal 2MB zijn");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("agencyId", agencyId);
      formData.append("file", file);

      const res = await fetch("/api/agency/logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload mislukt");
        return;
      }

      setLogoUrl(data.url);
      setSuccess("Logo geupload");
      router.refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status messages */}
      {success && (
        <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          <p className="text-sm text-success font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Bedrijfsgegevens */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Bedrijfsgegevens</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Bedrijfsnaam" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Facturatie e-mail" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
          <Input label="KvK-nummer" value={kvk} onChange={(e) => setKvk(e.target.value)} />
          <Input label="BTW-nummer" value={vat} onChange={(e) => setVat(e.target.value)} />
          <Input label="Adres" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Stad" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Postcode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveCompany} loading={saving}>
            <Check className="w-4 h-4" />
            Bedrijfsgegevens opslaan
          </Button>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Branding</h2>
        </div>

        {/* Logo */}
        <div className="mb-6">
          <p className="text-xs text-muted mb-2">Logo</p>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-auto rounded-lg object-contain border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted/10 flex items-center justify-center border border-dashed border-border">
                <Building2 className="w-5 h-5 text-muted" />
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground hover:bg-surface-secondary transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Uploaden..." : "Logo uploaden"}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Kleuren */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted mb-2">Primaire kleur</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-2">Accent kleur</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        </div>

        <Button onClick={handleSaveBranding} loading={saving}>
          <Check className="w-4 h-4" />
          Branding opslaan
        </Button>
      </div>
    </div>
  );
}
