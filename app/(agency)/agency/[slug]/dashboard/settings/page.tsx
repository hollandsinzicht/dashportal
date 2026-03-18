import { redirect } from "next/navigation";
import { getAgencyBySlug, getAgencyPricingTiers, getAgencyDashboardStats } from "@/lib/agency/queries";
import { formatEuro } from "@/lib/agency/pricing";
import { Settings, CreditCard, Globe } from "lucide-react";
import { DeactivateAgencyButton } from "@/components/agency/DeactivateAgencyButton";
import { AgencySettingsForm } from "@/components/agency/AgencySettingsForm";

export default async function AgencySettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const [tiers, stats] = await Promise.all([
    getAgencyPricingTiers(agency.id),
    getAgencyDashboardStats(agency.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Instellingen</h1>
        <p className="text-muted mt-1">Beheer je agency profiel en configuratie</p>
      </div>

      {/* Bewerkbaar formulier: bedrijfsgegevens + branding */}
      <AgencySettingsForm
        agencyId={agency.id}
        initialData={{
          name: agency.name,
          billing_email: agency.billing_email,
          primary_color: agency.primary_color,
          accent_color: agency.accent_color,
          logo_url: agency.logo_url,
          company_details: agency.company_details || {},
        }}
      />

      {/* Agency URL (read-only) */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Agency URL</h2>
        </div>
        <code className="px-3 py-1.5 rounded-lg bg-muted/10 text-sm font-mono text-foreground">
          dashportal.app/agency/{agency.slug}
        </code>
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
        <p className="text-xs text-muted mb-3">
          Je prijsschijven bepalen de maandelijkse kosten per klantportaal op basis van actieve gebruikers.
        </p>

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
          Het deactiveren van je agency account deactiveert je dashboard, alle teamleden
          en alle klantportalen. Neem contact op met DashPortal support om te heractiveren.
        </p>
        <DeactivateAgencyButton
          agencyId={agency.id}
          agencyName={agency.name}
          clientCount={stats.total_clients}
        />
      </div>
    </div>
  );
}
