import { createServiceClient } from "@/lib/supabase/server";
import { getAgencyBySlug } from "@/lib/agency/queries";
import { getAgencyDashboardStats, getAgencyClients } from "@/lib/agency/queries";
import { redirect } from "next/navigation";
import { Building2, Users, TrendingUp, Clock } from "lucide-react";
import { formatEuro } from "@/lib/agency/pricing";

export default async function AgencyDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const [stats, clients] = await Promise.all([
    getAgencyDashboardStats(agency.id),
    getAgencyClients(agency.id),
  ]);

  const recentClients = clients.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Overzicht
        </h1>
        <p className="text-muted mt-1">
          Welkom bij het dashboard van {agency.name}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Klanten"
          value={stats.total_clients}
          sub={`${stats.active_clients} actief`}
          icon={<Building2 className="w-5 h-5" />}
        />
        <KPICard
          label="Gebruikers"
          value={stats.total_users}
          sub="over alle klanten"
          icon={<Users className="w-5 h-5" />}
        />
        <KPICard
          label="Maandelijks"
          value={formatEuro(stats.monthly_revenue)}
          sub="geschatte omzet"
          icon={<TrendingUp className="w-5 h-5" />}
          isText
        />
        <KPICard
          label="In proefperiode"
          value={stats.trial_clients}
          sub="klanten"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Recente klanten */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recente klanten</h2>
          <a
            href={`/agency/${slug}/dashboard/clients`}
            className="text-sm text-primary hover:underline"
          >
            Bekijk alle →
          </a>
        </div>
        {recentClients.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nog geen klanten. Maak je eerste klant aan.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentClients.map((client) => (
              <a
                key={client.id}
                href={`/agency/${slug}/dashboard/clients/${client.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.name}
                      className="w-8 h-8 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">{client.name}</p>
                    <p className="text-xs text-muted">{client.user_count} gebruikers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {client.monthly_cost > 0 ? formatEuro(client.monthly_cost) : "—"}
                  </p>
                  <p className="text-xs text-muted">{client.tier_label || "—"}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  icon,
  isText,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  isText?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted">{label}</span>
        <div className="text-primary">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {isText ? value : value}
      </p>
      <p className="text-xs text-muted mt-1">{sub}</p>
    </div>
  );
}
