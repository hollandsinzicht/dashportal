"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Building2 } from "lucide-react";

export default function AgencyRegisterStep1() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    slug: "",
    contactName: "",
    email: "",
    password: "",
    billingEmail: "",
    kvkNumber: "",
    vatNumber: "",
    website: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleCompanyNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      companyName: value,
      slug: generateSlug(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.companyName) newErrors.companyName = "Verplicht";
    if (form.slug.length < 3) newErrors.slug = "Minimaal 3 karakters";
    if (!/^[a-z0-9-]+$/.test(form.slug)) newErrors.slug = "Alleen kleine letters, cijfers en koppeltekens";
    if (!form.contactName) newErrors.contactName = "Verplicht";
    if (!form.email) newErrors.email = "Verplicht";
    if (!form.password) newErrors.password = "Verplicht";
    if (form.password && form.password.length < 6) newErrors.password = "Minimaal 6 karakters";
    if (!acceptedTerms) newErrors.terms = "Je moet akkoord gaan met de voorwaarden";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Agency + Auth account aanmaken via API
      const response = await fetch("/api/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          slug: form.slug,
          contactName: form.contactName,
          email: form.email,
          password: form.password,
          billingEmail: form.billingEmail || form.email,
          companyDetails: {
            kvk_number: form.kvkNumber || undefined,
            vat_number: form.vatNumber || undefined,
            website: form.website || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Er ging iets mis" });
        setLoading(false);
        return;
      }

      // Inloggen
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        console.warn("[agency/register] Sign-in mislukt:", signInError.message);
      }

      // Bewaar agency data voor volgende stappen
      sessionStorage.setItem("agency_id", data.agency.id);
      sessionStorage.setItem("agency_slug", data.agency.slug);

      router.push("/agency/register/branding");
    } catch {
      setErrors({ general: "Er ging iets mis. Probeer het opnieuw." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Agency account aanmaken
          </h1>
          <p className="text-muted mt-2">
            Stap 1 van 4 — Bedrijfsgegevens & account
          </p>
        </div>

        {/* Stappen indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full ${
                step === 1 ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-lg text-danger text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bedrijfsnaam"
            placeholder="Mijn Consultancy BV"
            value={form.companyName}
            onChange={(e) => handleCompanyNameChange(e.target.value)}
            error={errors.companyName}
            required
          />

          <Input
            label="Agency URL"
            placeholder="mijn-consultancy"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            error={errors.slug}
            hint={form.slug ? `dashportal.app/agency/${form.slug}` : undefined}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Je naam"
              placeholder="Jan Jansen"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              error={errors.contactName}
              required
            />
            <Input
              label="Website"
              placeholder="www.bedrijf.nl"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <Input
            label="E-mailadres"
            type="email"
            placeholder="jan@bedrijf.nl"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Wachtwoord"
            type="password"
            placeholder="Minimaal 6 karakters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="KvK-nummer"
              placeholder="12345678"
              value={form.kvkNumber}
              onChange={(e) => setForm({ ...form, kvkNumber: e.target.value })}
            />
            <Input
              label="BTW-nummer"
              placeholder="NL123456789B01"
              value={form.vatNumber}
              onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
            />
          </div>

          <Input
            label="Facturatie e-mail"
            type="email"
            placeholder="facturen@bedrijf.nl (optioneel)"
            value={form.billingEmail}
            onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
            hint="Leeg laten om je account e-mail te gebruiken"
          />

          {/* Akkoord voorwaarden */}
          <div className="space-y-1.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => { setAcceptedTerms(e.target.checked); setErrors((prev) => { const { terms, ...rest } = prev; return rest; }); }}
                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted">
                Ik ga akkoord met de{" "}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  algemene voorwaarden
                </a>
                {" "}en het{" "}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  privacybeleid
                </a>
                .
              </span>
            </label>
            {errors.terms && (
              <p className="text-sm text-danger">{errors.terms}</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Account aanmaken & doorgaan
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Heb je al een agency account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
