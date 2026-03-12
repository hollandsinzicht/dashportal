"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { BarChart3 } from "lucide-react";

export default function OnboardingStep1() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    slug: "",
    contactName: "",
    email: "",
    password: "",
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

  function handleCompanyNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      companyName: value,
      slug: generateSlug(value),
    }));
  }

  function validateSlug(slug: string) {
    if (slug.length < 3) return "Minimaal 3 karakters";
    if (!/^[a-z0-9-]+$/.test(slug))
      return "Alleen kleine letters, cijfers en koppeltekens";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.companyName) newErrors.companyName = "Verplicht";
    const slugError = validateSlug(form.slug);
    if (slugError) newErrors.slug = slugError;
    if (!form.contactName) newErrors.contactName = "Verplicht";
    if (!form.email) newErrors.email = "Verplicht";
    if (!form.password) newErrors.password = "Verplicht";
    if (form.password && form.password.length < 6)
      newErrors.password = "Minimaal 6 karakters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // ─── Stap A: Tenant + Auth account aanmaken via API (server-side) ───
      // De API maakt het Supabase Auth account aan met email_confirm: true,
      // zodat we daarna direct kunnen inloggen zonder e-mailbevestiging.
      const selectedPlan = sessionStorage.getItem("onboarding_plan") || "starter";
      const referralCode = sessionStorage.getItem("onboarding_referral_code") || undefined;

      const response = await fetch("/api/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          slug: form.slug,
          contactName: form.contactName,
          email: form.email,
          password: form.password,
          plan: selectedPlan,
          referralCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ slug: data.error || "Er ging iets mis" });
        return;
      }

      const { tenant } = await response.json();

      // ─── Stap B: Client-side inloggen om sessie-cookies te zetten ───
      // Het auth account bestaat nu (email is bevestigd), dus signIn werkt.
      const supabase = createClient();
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

      if (signInError) {
        console.error("[onboarding] SignIn error:", signInError);
        setErrors({
          email: "Account aangemaakt, maar inloggen mislukt. Probeer opnieuw.",
        });
        return;
      }

      // Store tenant ID for subsequent steps
      sessionStorage.setItem("onboarding_tenant_id", tenant.id);
      sessionStorage.setItem("onboarding_slug", tenant.slug);
      sessionStorage.setItem("onboarding_skipped_steps", "[]");

      // ─── Stap C: Stripe subscription aanmaken met trial ───
      if (selectedPlan !== "enterprise") {
        try {
          const stripeRes = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: tenant.id,
              plan: selectedPlan,
              email: form.email,
              companyName: form.companyName,
            }),
          });
          if (!stripeRes.ok) {
            const stripeData = await stripeRes.json().catch(() => ({}));
            console.warn("[onboarding] Stripe checkout failed:", stripeData.error || stripeRes.status);
          }
        } catch (err) {
          console.warn("[onboarding] Stripe checkout error (non-blocking):", err);
        }
      }

      router.push("/onboarding/microsoft");
    } catch {
      setErrors({ slug: "Er ging iets mis. Probeer het opnieuw." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Maak jouw dataportaal aan
          </h1>
          <p className="text-text-secondary mt-2">
            Stap 1: Registreer je organisatie
          </p>
        </div>

        <StepIndicator currentStep={1} />

        <div className="bg-surface rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="companyName"
              label="Bedrijfsnaam"
              placeholder="Van der Berg Groep"
              value={form.companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              error={errors.companyName}
            />

            <div>
              <Input
                id="slug"
                label="Portaal adres"
                placeholder="vanderberg-groep"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                error={errors.slug}
              />
              {form.slug && !errors.slug && (
                <p className="text-sm text-primary mt-1.5 font-mono">
                  {form.slug}.dashportal.app
                </p>
              )}
            </div>

            <Input
              id="contactName"
              label="Naam contactpersoon"
              placeholder="Jan de Vries"
              value={form.contactName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, contactName: e.target.value }))
              }
              error={errors.contactName}
            />

            <Input
              id="email"
              label="E-mailadres"
              type="email"
              placeholder="jan@vanderberg.nl"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              error={errors.email}
            />

            <Input
              id="password"
              label="Wachtwoord"
              type="password"
              placeholder="Minimaal 6 karakters"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              error={errors.password}
              hint="Hiermee log je later in op je portaal"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Account aanmaken
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
