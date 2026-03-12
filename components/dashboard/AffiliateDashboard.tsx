"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  TrendingUp,
  Copy,
  Check,
  DollarSign,
  Link,
  UserPlus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AffiliateDashboardProps {
  tenantId: string;
  adminEmail: string;
  adminName: string;
  companyName: string;
}

interface Affiliate {
  id: string;
  referral_code: string;
  commission_percent: number;
  commission_type: string;
  status: string;
  total_earned: number;
  total_paid: number;
  total_referrals: number;
}

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  commission_amount: number;
  commission_paid: boolean;
  converted_at: string | null;
  created_at: string;
}

export function AffiliateDashboard({
  tenantId,
  adminEmail,
  adminName,
  companyName,
}: AffiliateDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/affiliate?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setIsAffiliate(data.isAffiliate);
        setAffiliate(data.affiliate);
        setReferrals(data.referrals || []);
      }
    } catch {
      console.error("Affiliate data ophalen mislukt");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRegister() {
    setRegistering(true);
    try {
      const res = await fetch("/api/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: adminName,
          companyName,
          email: adminEmail,
        }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Registratie mislukt");
      }
    } catch {
      alert("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setRegistering(false);
    }
  }

  function handleCopyLink() {
    if (!affiliate) return;
    const url = `https://dashportal.app/onboarding/plan?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    signed_up: { label: "Aangemeld", color: "text-text-secondary" },
    trialing: { label: "Proefperiode", color: "text-accent" },
    active: { label: "Actief", color: "text-success" },
    canceled: { label: "Geannuleerd", color: "text-danger" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ─── Niet-geregistreerd: CTA om affiliate te worden ───
  if (!isAffiliate) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Partner Programma
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Verdien commissie door klanten door te verwijzen naar DashPortal.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>

          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
            Word affiliate partner
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Deel je unieke referral-link en verdien 15% commissie op elke
            nieuwe klant die via jou DashPortal afneemt. De commissie is
            terugkerend — voor zolang de klant actief blijft.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">15%</p>
              <p className="text-xs text-text-secondary">Commissie</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">Recurring</p>
              <p className="text-xs text-text-secondary">Maandelijks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">Levenslang</p>
              <p className="text-xs text-text-secondary">Zolang klant actief</p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleRegister}
            loading={registering}
          >
            <UserPlus className="w-4 h-4" />
            Registreer als affiliate
          </Button>
        </div>
      </div>
    );
  }

  // ─── Affiliate dashboard ───
  const unpaidCommissions = referrals
    .filter((r) => r.commission_amount > 0 && !r.commission_paid)
    .reduce((sum, r) => sum + r.commission_amount, 0);

  const activeReferrals = referrals.filter((r) => r.status === "active").length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Partner Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Beheer je referrals en bekijk je commissie-overzicht.
        </p>
      </div>

      {/* Referral link */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Link className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary mb-1">
              Jouw referral link
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-surface border border-border px-3 py-1.5 rounded-lg text-text-secondary truncate block flex-1">
                https://dashportal.app/onboarding/plan?ref={affiliate?.referral_code}
              </code>
              <button
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Gekopieerd!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Kopieer
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Code: <strong>{affiliate?.referral_code}</strong> — Commissie:{" "}
              {affiliate?.commission_percent}% (
              {affiliate?.commission_type === "recurring"
                ? "terugkerend"
                : "eenmalig"}
              )
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-text-secondary" />
            <p className="text-xs text-text-secondary">Referrals</p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {affiliate?.total_referrals || 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-xs text-text-secondary">Actief</p>
          </div>
          <p className="text-xl font-bold text-success">{activeReferrals}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-text-secondary" />
            <p className="text-xs text-text-secondary">Totaal verdiend</p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {formatCurrency(Number(affiliate?.total_earned) || 0)}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <p className="text-xs text-text-secondary">Openstaand</p>
          </div>
          <p className="text-xl font-bold text-accent">
            {formatCurrency(unpaidCommissions)}
          </p>
        </div>
      </div>

      {/* Referrals lijst */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary">
            Recente doorverwijzingen
          </h3>
        </div>

        {referrals.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="w-10 h-10 text-text-secondary/20 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              Nog geen doorverwijzingen. Deel je referral link om te starten.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-secondary uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Commissie</th>
                  <th className="px-6 py-3 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {referrals.map((ref) => {
                  const statusInfo =
                    statusLabels[ref.status] || statusLabels.signed_up;
                  return (
                    <tr key={ref.id} className="hover:bg-surface-secondary/50">
                      <td className="px-6 py-3 text-sm text-text-primary">
                        {ref.referred_email}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-text-primary">
                        {ref.commission_amount > 0
                          ? formatCurrency(ref.commission_amount)
                          : "—"}
                        {ref.commission_paid && (
                          <span className="text-xs text-success ml-1">
                            (betaald)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-text-secondary">
                        {formatDate(ref.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center py-2">
        <p className="text-xs text-text-secondary">
          Vragen over het partner programma?{" "}
          <a
            href="mailto:partners@dashportal.app"
            className="text-primary hover:underline"
          >
            Neem contact op
          </a>
        </p>
      </div>
    </div>
  );
}
