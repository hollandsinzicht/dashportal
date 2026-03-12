"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Mail, User, ShieldCheck, Check, Send } from "lucide-react";

interface InviteUserModalProps {
  tenantId: string;
  onClose: () => void;
}

export function InviteUserModal({ tenantId, onClose }: InviteUserModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"viewer" | "admin">("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, tenantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Er ging iets mis");
      }

      setSuccess(true);
      setEmailSent(!!data.emailSent);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary">
            Gebruiker uitnodigen
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="px-6 py-8">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {emailSent ? (
                  <Send className="w-6 h-6 text-success" />
                ) : (
                  <Check className="w-6 h-6 text-success" />
                )}
              </div>
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-1">
                {emailSent ? "Uitnodiging verstuurd!" : "Gebruiker toegevoegd!"}
              </h3>
              <p className="text-sm text-text-secondary">
                {emailSent
                  ? `Er is een uitnodigingsmail gestuurd naar ${email}. De gebruiker kan via de link in de e-mail inloggen.`
                  : `${email} is toegevoegd en kan inloggen met het bestaande account.`}
              </p>
            </div>

            {emailSent && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">
                      E-mail met uitnodigingslink
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      De gebruiker ontvangt een e-mail met een link om een
                      wachtwoord in te stellen en in te loggen. De link is 24 uur
                      geldig.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button onClick={onClose}>Sluiten</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">
              {/* E-mail */}
              <Input
                id="invite-email"
                label="E-mailadres"
                type="email"
                placeholder="naam@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              {/* Naam (optioneel) */}
              <Input
                id="invite-name"
                label="Naam (optioneel)"
                type="text"
                placeholder="Volledige naam"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* Rol selectie */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  Rol
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("viewer")}
                    className={`
                      flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                      ${
                        role === "viewer"
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-surface text-text-secondary hover:border-border hover:bg-surface-secondary"
                      }
                    `}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div>Viewer</div>
                      <div className="text-xs font-normal opacity-70">
                        Bekijkt rapporten
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`
                      flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                      ${
                        role === "admin"
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-surface text-text-secondary hover:border-border hover:bg-surface-secondary"
                      }
                    `}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div>Admin</div>
                      <div className="text-xs font-normal opacity-70">
                        Volledige toegang
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 text-xs text-text-secondary bg-surface-secondary/50 rounded-lg px-3 py-2.5">
                <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  De gebruiker ontvangt een e-mail met een link om een wachtwoord
                  in te stellen en in te loggen.
                </span>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary/30">
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" loading={loading} disabled={!email}>
                <Mail className="w-4 h-4" />
                Uitnodigen
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
