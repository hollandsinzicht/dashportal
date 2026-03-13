"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogIn, XCircle, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AgencyLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Stap 1: Inloggen met Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Ongeldig e-mailadres of wachtwoord."
            : authError.message
        );
        return;
      }

      // Stap 2: Agency opzoeken via API
      const res = await fetch("/api/agency/me");
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || "Geen agency gevonden voor dit account."
        );
        // Uitloggen als er geen agency is
        await supabase.auth.signOut();
        return;
      }

      // Stap 3: Redirect naar agency dashboard
      router.push(`/agency/${data.slug}/dashboard`);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="agency-email"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          E-mailadres
        </label>
        <Input
          id="agency-email"
          type="email"
          placeholder="naam@agency.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="agency-password"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Wachtwoord
        </label>
        <Input
          id="agency-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        <LogIn className="w-4 h-4" />
        Inloggen
      </Button>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-text-secondary text-center">
          Nog geen agency account?{" "}
          <a
            href="/agency/register"
            className="text-primary hover:underline font-medium"
          >
            Registreer als agency
          </a>
        </p>
      </div>
    </form>
  );
}
