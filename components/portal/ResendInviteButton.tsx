"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Mail, CheckCircle } from "lucide-react";

interface ResendInviteButtonProps {
  email: string;
  tenantSlug: string;
}

export function ResendInviteButton({
  email,
  tenantSlug,
}: ResendInviteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Op tenant subdomain: origin = lyreco.dashportal.app, next=/home
      // Op localhost: origin = localhost:3001, next=/slug/home
      const isLocal = window.location.hostname === "localhost";
      const nextPath = isLocal ? `/${tenantSlug}/home` : "/home";

      // Supabase v2 SDK uses "signup" type to resend invite/signup OTP links
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
        },
      });

      if (resendError) {
        setError("Versturen mislukt. Probeer het later opnieuw.");
        return;
      }

      setSent(true);
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-success text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Nieuwe uitnodigingsmail verstuurd. Controleer je inbox.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleResend}
        loading={loading}
      >
        <Mail className="w-3.5 h-3.5" />
        Stuur een nieuwe link naar mijn e-mailadres
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
