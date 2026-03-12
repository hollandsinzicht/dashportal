import { Badge } from "@/components/ui/Badge";
import {
  Euro,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getTenantsWithCounts, getPlatformStats } from "@/lib/admin/queries";
import { getPlanConfig } from "@/lib/stripe/config";
import {
  getSubscriptionStatusBadge,
  formatCurrency,
  formatDate,
  getPlanPrice,
  getStripeDashboardUrl,
} from "@/lib/admin/helpers";

export default async function BillingPage() {
  const tenants = await getTenantsWithCounts();
  const stats = getPlatformStats(tenants);

  const activeSubs = tenants.filter(
    (t) => t.subscription_status === "active"
  ).length;
  const trials = tenants.filter(
    (t) => t.subscription_status === "trialing"
  ).length;
  const pastDue = tenants.filter(
    (t) => t.subscription_status === "past_due"
  ).length;

  const kpis = [
    {
      label: "MRR",
      value: formatCurrency(stats.mrr),
      icon: Euro,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Actieve abonnementen",
      value: String(activeSubs),
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Trials",
      value: String(trials),
      icon: Clock,
      color: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]/10",
    },
    {
      label: "Achterstallig",
      value: String(pastDue),
      icon: AlertTriangle,
      color: pastDue > 0 ? "text-danger" : "text-text-secondary",
      bg: pastDue > 0 ? "bg-danger/10" : "bg-surface-secondary",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Facturatie
        </h1>
        <p className="text-text-secondary mt-1">
          Overzicht van alle abonnementen en inkomsten.
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
              <p className="text-2xl font-bold text-text-primary">
                {kpi.value}
              </p>
              <p className="text-xs text-text-secondary">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Billing tabel */}
      {tenants.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border text-center py-16">
          <Receipt className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
            Nog geen abonnementen
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            Zodra klanten zich registreren verschijnt de facturatie hier.
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
                  Plan
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Prijs
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Volgende betaling
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
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{planConfig.name}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-text-primary">
                        {getPlanPrice(tenant.subscription_plan)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {tenant.current_period_end
                          ? formatDate(tenant.current_period_end)
                          : "—"}
                      </span>
                      {tenant.cancel_at_period_end && (
                        <span className="block text-xs text-danger">
                          Stopt na periode
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {tenant.stripe_customer_id ? (
                        <a
                          href={getStripeDashboardUrl(
                            tenant.stripe_customer_id
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Bekijk
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-text-secondary">—</span>
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
