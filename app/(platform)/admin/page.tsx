import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  Users,
  Euro,
  Clock,
  CreditCard,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { getTenantsWithCounts, getPlatformStats } from "@/lib/admin/queries";
import { getPlanConfig } from "@/lib/stripe/config";
import {
  getSubscriptionStatusBadge,
  formatCurrency,
  formatDate,
  getUserLimitLabel,
} from "@/lib/admin/helpers";

export default async function SuperAdminPage() {
  const tenants = await getTenantsWithCounts();
  const stats = getPlatformStats(tenants);

  const directClients = tenants.filter((t) => !t.agency_id);
  const agencyClients = tenants.filter((t) => !!t.agency_id);
  const noStripe = tenants.filter((t) => !t.agency_id && !t.stripe_customer_id);

  const kpis = [
    {
      label: "Directe klanten",
      value: String(directClients.length),
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Via agencies",
      value: String(agencyClients.length),
      icon: Handshake,
      color: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]/10",
    },
    {
      label: "MRR (direct)",
      value: formatCurrency(stats.mrr),
      icon: Euro,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Zonder Stripe",
      value: String(noStripe.length),
      icon: CreditCard,
      color: noStripe.length > 0 ? "text-danger" : "text-text-secondary",
      bg: noStripe.length > 0 ? "bg-danger/10" : "bg-surface-secondary",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Platform Admin
        </h1>
        <p className="text-text-secondary mt-1">
          Overzicht van alle tenants op het platform.
        </p>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}
            >
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
              <p className="text-xs text-text-secondary">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trials binnenkort */}
      {stats.trialsExpiringSoon > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <Clock className="w-4 h-4 text-warning shrink-0" />
          <p className="text-sm text-text-primary">
            <strong>{stats.trialsExpiringSoon}</strong> trial(s) verlopen binnen 7 dagen
          </p>
        </div>
      )}

      {/* Tenant tabel */}
      {tenants.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border text-center py-16">
          <Building2 className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
            Nog geen tenants
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            Zodra klanten zich registreren verschijnen ze hier.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Bedrijf
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Gebruikers
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Stripe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant) => {
                const statusBadge = getSubscriptionStatusBadge(
                  tenant.subscription_status
                );
                const planConfig = getPlanConfig(tenant.subscription_plan);
                const userLimit = getUserLimitLabel(tenant.subscription_plan);

                return (
                  <tr
                    key={tenant.id}
                    className="hover:bg-surface-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-text-secondary font-mono">
                        {tenant.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {tenant.agency_name ? (
                        <Link
                          href={`/admin/agencies/${tenant.agency_id}`}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium hover:bg-[var(--color-accent)]/20 transition-colors"
                        >
                          <Handshake className="w-3 h-3" />
                          {tenant.agency_name}
                        </Link>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Direct
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {tenant.admin_name && (
                        <p className="text-sm text-text-primary">
                          {tenant.admin_name}
                        </p>
                      )}
                      <p className="text-xs text-text-secondary">
                        {tenant.admin_email || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{planConfig.name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-primary">
                        {tenant.user_count}{" "}
                        <span className="text-text-secondary">
                          / {userLimit}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {tenant.agency_id ? (
                        <span className="text-xs text-text-secondary">via agency</span>
                      ) : tenant.stripe_customer_id ? (
                        <span className="text-xs text-success font-medium">Actief</span>
                      ) : (
                        <span className="text-xs text-danger font-medium">Ontbreekt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
