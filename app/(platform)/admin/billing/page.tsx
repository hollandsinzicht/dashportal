import { Badge } from "@/components/ui/Badge";
import {
  Euro,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  ExternalLink,
  Building2,
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
import { getAllAgenciesWithCounts } from "@/lib/agency/queries";
import { formatEuro } from "@/lib/agency/pricing";
import { createServiceClient } from "@/lib/supabase/server";

interface AdminInvoiceLine {
  id: string;
  agency_id: string;
  tenant_id: string | null;
  period_start: string;
  period_end: string;
  user_count: number;
  tier_label: string | null;
  amount: number;
  created_at: string;
  agency_name?: string;
  tenant_name?: string;
}

async function getAgencyInvoiceLines(): Promise<AdminInvoiceLine[]> {
  const supabase = await createServiceClient();
  const { data: lines } = await supabase
    .from("agency_invoice_lines")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!lines || lines.length === 0) return [];

  // Enrich met agency en tenant namen
  const agencyIds = [...new Set(lines.map((l) => l.agency_id))];
  const tenantIds = [...new Set(lines.filter((l) => l.tenant_id).map((l) => l.tenant_id!))];

  const [agenciesRes, tenantsRes] = await Promise.all([
    supabase.from("agencies").select("id, name").in("id", agencyIds),
    tenantIds.length > 0
      ? supabase.from("tenants").select("id, name").in("id", tenantIds)
      : Promise.resolve({ data: [] }),
  ]);

  const agencyMap = new Map((agenciesRes.data || []).map((a) => [a.id, a.name]));
  const tenantMap = new Map((tenantsRes.data || []).map((t) => [t.id, t.name]));

  return lines.map((line) => ({
    ...line,
    agency_name: agencyMap.get(line.agency_id) || "Onbekend",
    tenant_name: line.tenant_id ? tenantMap.get(line.tenant_id) || "Verwijderd" : "—",
  }));
}

export default async function BillingPage() {
  const [tenants, agencies, invoiceLines] = await Promise.all([
    getTenantsWithCounts(),
    getAllAgenciesWithCounts(),
    getAgencyInvoiceLines(),
  ]);
  const stats = getPlatformStats(tenants);

  const agencyMRR = agencies.reduce((sum, a) => sum + a.monthly_revenue, 0);

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

      {/* ─── Agency Facturatie ─── */}
      <div className="mt-12 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary">
              Agency Facturatie
            </h2>
            <p className="text-text-secondary mt-1 text-sm">
              Overzicht van alle agency factuurlijnen — gebruik dit om maandelijks te factureren.
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border px-4 py-3 text-center">
            <p className="text-xs text-text-secondary">Agency MRR</p>
            <p className="text-xl font-bold text-success">{formatEuro(agencyMRR)}</p>
          </div>
        </div>
      </div>

      {/* Agency samenvatting per agency */}
      {agencies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/admin/agencies/${agency.id}`}
              className="bg-surface rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{agency.name}</p>
                  <p className="text-xs text-text-secondary">{agency.client_count} klanten</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{agency.total_users} gebruikers</span>
                <span className="text-sm font-bold text-text-primary">{formatEuro(agency.monthly_revenue)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Factuurlijnen tabel */}
      {invoiceLines.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border text-center py-12">
          <Receipt className="w-10 h-10 text-text-secondary/20 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            Nog geen agency factuurlijnen. Trigger de billing cron om berekeningen uit te voeren.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Agency
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Klant
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Tier
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Gebruikers
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Bedrag
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Periode
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoiceLines.map((line) => {
                const isProRata = line.tier_label?.includes("pro-rata");
                return (
                  <tr
                    key={line.id}
                    className={`hover:bg-surface-secondary/50 transition-colors ${isProRata ? "bg-warning/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-primary">
                        {line.agency_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-primary">
                        {line.tenant_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${isProRata ? "text-warning font-medium" : "text-text-secondary"}`}>
                        {line.tier_label || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-text-primary">
                        {line.user_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-primary">
                        {formatEuro(line.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-text-secondary">
                        {formatDate(line.period_start)} – {formatDate(line.period_end)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-text-secondary">
                        {formatDate(line.created_at)}
                      </span>
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
