import { redirect } from "next/navigation";
import { getAgencyBySlug, getAgencyInvoiceLines, getAgencyClients } from "@/lib/agency/queries";
import { getAgencyPricingTiers } from "@/lib/agency/queries";
import { formatEuro, calculateTierPrice } from "@/lib/agency/pricing";
import { CreditCard, FileText } from "lucide-react";

export default async function AgencyBillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const [tiers, clients, invoiceLines] = await Promise.all([
    getAgencyPricingTiers(agency.id),
    getAgencyClients(agency.id),
    getAgencyInvoiceLines(agency.id, 20),
  ]);

  // Bereken huidige kosten per klant
  const clientCosts = clients.map((client) => {
    const result = calculateTierPrice(client.user_count, tiers);
    return { ...client, calculated_cost: result.price, calculated_label: result.label };
  });

  const totalMonthly = clientCosts.reduce((sum, c) => sum + c.calculated_cost, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Facturatie</h1>
        <p className="text-muted mt-1">Overzicht van kosten en factuurregels</p>
      </div>

      {/* Huidige kosten samenvatting */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Huidige maandelijkse kosten</h2>
        </div>

        {clientCosts.length === 0 ? (
          <p className="text-muted">Nog geen klanten — geen kosten.</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {clientCosts.map((client) => (
                <div key={client.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.name}</p>
                    <p className="text-xs text-muted">
                      {client.user_count} gebruikers — {client.calculated_label || "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {client.calculated_cost > 0 ? formatEuro(client.calculated_cost) : "Op aanvraag"}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="font-semibold text-foreground">Totaal per maand</p>
              <p className="text-lg font-bold text-primary">{formatEuro(totalMonthly)}</p>
            </div>
          </>
        )}
      </div>

      {/* Recente factuurregels */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Recente factuurregels</h2>
        </div>
        {invoiceLines.length === 0 ? (
          <div className="p-8 text-center text-muted">
            Nog geen factuurregels. Deze verschijnen na de eerste facturatiecyclus.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoiceLines.map((line) => (
              <div key={line.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {line.tier_label || "—"} — {line.user_count} gebruikers
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(line.period_start).toLocaleDateString("nl-NL")} t/m{" "}
                    {new Date(line.period_end).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatEuro(line.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
