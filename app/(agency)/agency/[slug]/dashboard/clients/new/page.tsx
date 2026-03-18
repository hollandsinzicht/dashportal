"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAgency } from "@/lib/agency/context";
import { Building2, ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { agencyId } = useAgency();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientSlug: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.clientName) newErrors.clientName = "Verplicht";
    if (form.clientSlug.length < 3) newErrors.clientSlug = "Minimaal 3 karakters";
    if (!/^[a-z0-9-]+$/.test(form.clientSlug)) newErrors.clientSlug = "Alleen kleine letters, cijfers en streepjes";
    if (!form.adminEmail) newErrors.adminEmail = "Verplicht";
    if (form.adminPassword && form.adminPassword.length < 6) newErrors.adminPassword = "Minimaal 6 karakters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          clientName: form.clientName,
          clientSlug: form.clientSlug,
          adminEmail: form.adminEmail,
          adminName: form.adminName || undefined,
          adminPassword: form.adminPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || "Er ging iets mis" });
        setLoading(false);
        return;
      }

      router.push(`/agency/${slug}/dashboard/clients/${data.tenant.id}`);
    } catch {
      setErrors({ general: "Er ging iets mis. Probeer het opnieuw." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            Nieuwe klant aanmaken
          </h1>
          <p className="text-sm text-muted">Maak een nieuw klantportaal aan</p>
        </div>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-lg text-danger text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bedrijfsnaam klant"
          placeholder="Acme BV"
          value={form.clientName}
          onChange={(e) => {
            setForm({
              ...form,
              clientName: e.target.value,
              clientSlug: generateSlug(e.target.value),
            });
          }}
          error={errors.clientName}
          required
        />

        <Input
          label="Portaal URL"
          placeholder="acme-bv"
          value={form.clientSlug}
          onChange={(e) => setForm({ ...form, clientSlug: e.target.value })}
          error={errors.clientSlug}
          hint={form.clientSlug ? `${form.clientSlug}.dashportal.app` : undefined}
          required
        />

        <Input
          label="E-mail klant-beheerder"
          type="email"
          placeholder="admin@acme.nl"
          value={form.adminEmail}
          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
          error={errors.adminEmail}
          hint="Ontvangt een uitnodiging om in te loggen"
          required
        />

        <Input
          label="Naam klant-beheerder"
          placeholder="Piet Pietersen (optioneel)"
          value={form.adminName}
          onChange={(e) => setForm({ ...form, adminName: e.target.value })}
        />

        <Input
          label="Wachtwoord klant-beheerder"
          type="password"
          placeholder="Minimaal 6 karakters (optioneel)"
          value={form.adminPassword}
          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
          error={errors.adminPassword}
          hint="Als je dit leeg laat wordt een tijdelijk wachtwoord gegenereerd"
        />

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Klant aanmaken
        </Button>
      </form>
    </div>
  );
}
