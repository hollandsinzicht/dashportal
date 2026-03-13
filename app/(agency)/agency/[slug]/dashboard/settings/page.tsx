import { redirect } from "next/navigation";
import { getAgencyBySlug, getAgencyPricingTiers } from "@/lib/agency/queries";
import { formatEuro } from "@/lib/agency/pricing";
import { Settings, Palette, Building2, CreditCard, Globe } from "lucide-react";

export default async function AgencySettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const tiers = await getAgencyPricingTiers(agency.id);
  const details = agency.company_details || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Instellingen</h1>
        <p className="text-muted mt-1">Beheer je agency profiel en configuratie</p>
      </div>

      {/* Bedrijfsgegevens */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Bedrijfsgegevens</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Bedrijfsnaam" value={agency.name} />
          <InfoField label="Agency URL" value={`${agency.slug}.dashportal.app`} />
          <InfoField label="Eigenaar e-mail" value={agency.owner_email} />
          <InfoField label="Facturatie e-mail" value={agency.billing_email || agency.owner_email} />
          <InfoField label="KvK-nummer" value={details.kvk_number} />
          <InfoField label="BTW-nummer" value={details.vat_number} />
          <InfoField label="Website" value={details.website} />
        </div>
      </div>

      {/* Branding */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Branding</h2>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted mb-2">Logo</p>
            {agency.logo_url ? (
              <img
                src={agency.logo_url}
                alt="Agency logo"
                className="h-12 w-auto rounded-lg object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted mb-2">Kleuren</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-border"
                  style={{ backgroundColor: agency.primary_color }}
                />
                <span className="text-xs text-muted">{agency.primary_color}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-border"
                  style={{ backgroundColor: agency.accent_color }}
                />
                <span className="text-xs text-muted">{agency.accent_color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agency URL */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Agency URL</h2>
        </div>
        <div className="flex items-center gap-2">
          <code className="px-3 py-1.5 rounded-lg bg-muted/10 text-sm font-mono text-foreground">
            dashportal.app/agency/{agency.slug}
          </code>
        </div>
        <p className="text-xs text-muted mt-2">
          Dit is de URL waarmee je en je team het dashboard bereiken.
        </p>
      </div>

      {/* Prijsschijven */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Prijsschijven</h2>
        </div>

        {tiers.length === 0 ? (
          <p className="text-muted text-sm">Geen prijsschijven geconfigureerd.</p>
        ) : (
          <div className="space-y-2">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {tier.label || "Schijf"}
                  </p>
                  <p className="text-xs text-muted">
                    {tier.min_users}–{tier.max_users ? tier.max_users : "∞"} gebruikers
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {tier.price_per_month > 0
                    ? `${formatEuro(tier.price_per_month)} / maand`
                    : "Op aanvraag"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-danger/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-danger" />
          <h2 className="font-semibold text-danger">Gevarenzone</h2>
        </div>
        <p className="text-sm text-muted mb-4">
          Het deactiveren van je agency account verbergt je dashboard en stopt de facturatie.
          Klantportalen blijven bereikbaar.
        </p>
        <button
          disabled
          className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium opacity-50 cursor-not-allowed"
        >
          Agency deactiveren (binnenkort)
        </button>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}
