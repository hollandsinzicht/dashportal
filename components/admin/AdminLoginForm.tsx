"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogIn, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
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

      // Refresh de pagina zodat de server-side layout de sessie ziet
      router.refresh();
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
          htmlFor="admin-email"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          E-mailadres
        </label>
        <Input
          id="admin-email"
          type="email"
          placeholder="admin@voorbeeld.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Wachtwoord
        </label>
        <Input
          id="admin-password"
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
    </form>
  );
}
