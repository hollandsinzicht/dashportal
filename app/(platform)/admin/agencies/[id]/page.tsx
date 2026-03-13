import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  ArrowLeft,
  Building2,
  Users,
  Euro,
  Clock,
  Mail,
  Globe,
  Calendar,
  Palette,
} from "lucide-react";
import {
  getAgencyById,
  getAgencyClients,
  getAgencyDashboardStats,
  getAgencyUsers,
  getAgencyPricingTiers,
} from "@/lib/agency/queries";
import { formatEuro } from "@/lib/agency/pricing";
import { formatDate } from "@/lib/admin/helpers";

export default async function AdminAgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agency = await getAgencyById(id);

  if (!agency) notFound();

  const [stats, clients, users, tiers] = await Promise.all([
    getAgencyDashboardStats(agency.id),
    getAgencyClients(agency.id),
    getAgencyUsers(agency.id),
    getAgencyPricingTiers(agency.id),
  ]);

  const owner = users.find((u) => u.role === "owner");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/admin/agencies"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar agencies
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            {agency.name}
          </h1>
          <Badge variant={agency.is_active ? "success" : "danger"}>
            {agency.is_active ? "Actief" : "Inactief"}
          </Badge>
        </div>
        <p className="text-text-secondary text-sm font-mono">{agency.slug}</p>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI
          icon={<Building2 className="w-5 h-5 text-primary" />}
          bg="bg-primary/10"
          value={String(stats.total_clients)}
          label="Klanten"
        />
        <KPI
          icon={<Users className="w-5 h-5 text-[var(--color-accent)]" />}
          bg="bg-[var(--color-accent)]/10"
          value={String(stats.total_users)}
          label="Gebruikers"
        />
        <KPI
          icon={<Euro className="w-5 h-5 text-success" />}
          bg="bg-success/10"
          value={formatEuro(stats.monthly_revenue)}
          label="Maandelijks"
        />
        <KPI
          icon={<Clock className="w-5 h-5 text-warning" />}
          bg="bg-warning/10"
          value={String(stats.trial_clients)}
          label="In proefperiode"
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Account Info */}
        <Card>
          <CardTitle className="mb-4">Account & Contact</CardTitle>
          <dl className="space-y-3 text-sm">
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Bedrijf"
              value={agency.name}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="Eigenaar"
              value={agency.owner_email}
            />
            {agency.billing_email && (
              <InfoRow
                icon={<Mail className="w-4 h-4" />}
                label="Facturatie"
                value={agency.billing_email}
              />
            )}
            <InfoRow
              icon={<Globe className="w-4 h-4" />}
              label="Slug"
              value={agency.slug}
              mono
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Aangemaakt"
              value={formatDate(agency.created_at)}
            />
          </dl>
        </Card>

        {/* Branding & Pricing */}
        <Card>
          <CardTitle className="mb-4">Branding & Pricing</CardTitle>
          <dl className="space-y-3 text-sm">
            {agency.primary_color && (
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-text-secondary shrink-0" />
                <dt className="text-text-secondary w-32 shrink-0">Primaire kleur</dt>
                <dd className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded border border-border"
                    style={{ backgroundColor: agency.primary_color }}
                  />
                  <span className="font-mono text-xs text-text-primary">
                    {agency.primary_color}
                  </span>
                </dd>
              </div>
            )}
            {agency.accent_color && (
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-text-secondary shrink-0" />
                <dt className="text-text-secondary w-32 shrink-0">Accent kleur</dt>
                <dd className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded border border-border"
                    style={{ backgroundColor: agency.accent_color }}
                  />
                  <span className="font-mono text-xs text-text-primary">
                    {agency.accent_color}
                  </span>
                </dd>
              </div>
            )}
            {tiers.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Pricing Tiers
                </p>
                <div className="space-y-1.5">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-primary">
                        {tier.label}{" "}
                        <span className="text-text-secondary text-xs">
                          ({tier.min_users}–{tier.max_users ?? "∞"} gebruikers)
                        </span>
                      </span>
                      <span className="font-medium text-text-primary">
                        {tier.price_per_month > 0
                          ? formatEuro(tier.price_per_month)
                          : "Op maat"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Klanten tabel */}
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-4">
          Klanten ({clients.length})
        </h2>
        {clients.length === 0 ? (
          <Card className="text-center py-8">
            <Building2 className="w-8 h-8 text-text-secondary/20 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              Deze agency heeft nog geen klanten.
            </p>
          </Card>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Klant
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Gebruikers
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Rapporten
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Tier
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Maandelijks
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Aangemaakt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-surface-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tenants/${client.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {client.name}
                      </Link>
                      <p className="text-xs text-text-secondary font-mono">
                        {client.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          client.subscription_status === "active"
                            ? "success"
                            : client.subscription_status === "trialing"
                              ? "accent"
                              : "default"
                        }
                      >
                        {client.subscription_status === "active"
                          ? "Actief"
                          : client.subscription_status === "trialing"
                            ? "Trial"
                            : client.subscription_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-primary">
                        {client.user_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-text-primary">
                        {client.report_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary">
                        {client.tier_label || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-primary">
                        {client.monthly_cost > 0
                          ? formatEuro(client.monthly_cost)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {formatDate(client.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team leden */}
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-4">
          Teamleden ({users.length})
        </h2>
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Naam
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  E-mail
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Rol
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-text-primary">
                      {user.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        user.role === "owner"
                          ? "accent"
                          : user.role === "admin"
                            ? "success"
                            : "default"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? "success" : "default"}>
                      {user.is_active ? "Actief" : "Inactief"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function KPI({
  icon,
  bg,
  value,
  label,
}: {
  icon: React.ReactNode;
  bg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? (
        <span className="text-text-secondary shrink-0 mt-0.5">{icon}</span>
      ) : (
        <span className="w-4 shrink-0" />
      )}
      <dt className="text-text-secondary w-32 shrink-0">{label}</dt>
      <dd
        className={`text-text-primary ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
