import { redirect } from "next/navigation";
import { getAgencyBySlug, getAgencyClients } from "@/lib/agency/queries";
import { formatEuro } from "@/lib/agency/pricing";
import { Building2, Plus, Users } from "lucide-react";

export default async function AgencyClientsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const clients = await getAgencyClients(agency.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Klanten</h1>
          <p className="text-muted mt-1">{clients.length} klantportalen</p>
        </div>
        <a
          href={`/agency/${slug}/dashboard/clients/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe klant
        </a>
      </div>

      {clients.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" />
          <h2 className="font-semibold text-foreground mb-2">Nog geen klanten</h2>
          <p className="text-muted mb-4">Maak je eerste klantportaal aan om te beginnen.</p>
          <a
            href={`/agency/${slug}/dashboard/clients/new`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Eerste klant aanmaken
          </a>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Klant</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-right text-xs font-medium text-muted px-4 py-3">Gebruikers</th>
                <th className="text-right text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">Reports</th>
                <th className="text-right text-xs font-medium text-muted px-4 py-3">Kosten/mnd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={`/agency/${slug}/dashboard/clients/${client.id}`}
                      className="flex items-center gap-3"
                    >
                      {client.logo_url ? (
                        <img src={client.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">{client.name}</p>
                        <p className="text-xs text-muted">{client.slug}</p>
                      </div>
                    </a>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={client.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-foreground">
                      <Users className="w-3.5 h-3.5 text-muted" />
                      {client.user_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-sm text-foreground">
                    {client.report_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {client.monthly_cost > 0 ? formatEuro(client.monthly_cost) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    active: "bg-success/10 text-success",
    trialing: "bg-accent/10 text-accent",
    canceled: "bg-danger/10 text-danger",
    past_due: "bg-warning/10 text-warning",
  };
  const labels: Record<string, string> = {
    active: "Actief",
    trialing: "Proef",
    canceled: "Geannuleerd",
    past_due: "Achterstallig",
  };

  const s = status || "active";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[s] || "bg-border text-muted"}`}>
      {labels[s] || s}
    </span>
  );
}
