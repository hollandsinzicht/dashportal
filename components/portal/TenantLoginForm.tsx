"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResendInviteButton } from "@/components/portal/ResendInviteButton";
import { AlertTriangle, Mail, CheckCircle } from "lucide-react";
import Image from "next/image";

const ERROR_MESSAGES: Record<string, string> = {
  otp_expired: "Je login-link is verlopen.",
  exchange_failed: "Er ging iets mis bij het inloggen. Probeer het opnieuw.",
  access_denied: "Toegang geweigerd. Neem contact op met je beheerder.",
  auth_timeout: "Inloggen duurde te lang. Probeer het opnieuw.",
  unknown: "Er is een onbekende fout opgetreden.",
};

interface TenantLoginFormProps {
  slug: string;
  tenantName: string;
  logoUrl: string | null;
  /** Microsoft SSO ingeschakeld (Business+ plan) */
  ssoEnabled?: boolean;
}

export function TenantLoginForm({
  slug,
  tenantName,
  logoUrl,
  ssoEnabled,
}: TenantLoginFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Error param uit URL (bv. na otp_expired redirect)
  const urlError = searchParams.get("error");
  const authErrorMessage = urlError
    ? ERROR_MESSAGES[urlError] || ERROR_MESSAGES.unknown
    : null;

  // ─── Wachtwoord login ───
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim()) {
      setError("Vul je e-mailadres in.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        if (signInError.message === "Invalid login credentials") {
          setError("Onjuist e-mailadres of wachtwoord.");
        } else if (signInError.message === "Email not confirmed") {
          setError("Je e-mailadres is nog niet bevestigd. Check je inbox.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Succes → doorsturen naar portal
      // Op subdomain (acme.dashportal.app): /home is voldoende
      // Op localhost: /slug/home is nodig
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      router.replace(isLocal ? `/${slug}/home` : "/home");
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Magic link versturen ───
  async function handleMagicLink() {
    if (!email.trim()) {
      setError("Vul eerst je e-mailadres in.");
      return;
    }

    setMagicLinkLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Op tenant subdomain (lyreco.dashportal.app): origin bevat al de slug,
      // dus next=/home is voldoende. Op localhost: origin = localhost:3001,
      // daar moet /slug/home in next staan.
      const isLocal = window.location.hostname === "localhost";
      const nextPath = isLocal ? `/${slug}/home` : "/home";

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
        },
      });

      if (otpError) {
        console.error("Magic link error:", otpError);
        setError(otpError.message);
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setMagicLinkLoading(false);
    }
  }

  // ─── Microsoft SSO login ───
  async function handleMicrosoftSSO() {
    setSsoLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const isLocal = window.location.hostname === "localhost";
      const nextPath = isLocal ? `/${slug}/home` : "/home";

      const { error: ssoError } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "email profile openid",
          redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
        },
      });

      if (ssoError) {
        console.error("Microsoft SSO error:", ssoError);
        setError(ssoError.message);
      }
      // Browser redirects — geen verdere actie nodig
    } catch {
      setError("Er ging iets mis met Microsoft inloggen. Probeer het opnieuw.");
    } finally {
      setSsoLoading(false);
    }
  }

  // ─── Succes-scherm na magic link ───
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName} className="h-12 mx-auto" />
            ) : (
              <Image src="/favicon-dashportal.png" alt="DashPortal" width={56} height={56} className="mx-auto" />
            )}
          </div>

          <div className="bg-surface rounded-2xl border border-border p-8">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
              Check je inbox
            </h1>
            <p className="text-sm text-text-secondary mb-4">
              We hebben een login-link gestuurd naar{" "}
              <strong className="text-text-primary">{email}</strong>.
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-sm text-primary underline"
            >
              Terug naar inloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login formulier ───
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo + tenant naam */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={tenantName}
              className="h-12 mx-auto mb-4"
            />
          ) : (
            <Image src="/favicon-dashportal.png" alt="DashPortal" width={56} height={56} className="mx-auto mb-4" />
          )}
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary">
            {tenantName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Log in om je rapporten te bekijken
          </p>
        </div>

        {/* Auth error banner */}
        {authErrorMessage && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">
                  {authErrorMessage}
                </p>
                {urlError === "otp_expired" && email && (
                  <ResendInviteButton email={email} tenantSlug={slug} />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-border p-6">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="E-mailadres"
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="password"
              type="password"
              label="Wachtwoord"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              Inloggen
            </Button>
          </form>

          {/* Scheidingslijn */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-text-secondary">of</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Magic link */}
          <Button
            variant="secondary"
            className="w-full"
            loading={magicLinkLoading}
            onClick={handleMagicLink}
          >
            <Mail className="w-4 h-4" />
            Verstuur login-link per e-mail
          </Button>

          {/* Microsoft SSO — alleen voor Business+ plans */}
          {ssoEnabled && (
            <div className="mt-3">
              <Button
                variant="secondary"
                className="w-full"
                loading={ssoLoading}
                onClick={handleMicrosoftSSO}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Log in met Microsoft
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
