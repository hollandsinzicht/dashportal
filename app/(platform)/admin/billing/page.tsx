import { Badge } from "@/components/ui/Badge";
import {
  Euro,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  ExternalLink,
  Building2,
  CreditCard,
  XCircle,
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

// ─── Agency invoice lines ophalen ───

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

// ─── Page ───

export default async function BillingPage() {
  const [allTenants, agencies, invoiceLines] = await Promise.all([
    getTenantsWithCounts(),
    getAllAgenciesWithCounts(),
    getAgencyInvoiceLines(),
  ]);

  // Alleen directe klanten (niet via agency)
  const directTenants = allTenants.filter((t) => !t.agency_id);
  const stats = getPlatformStats(directTenants);
  const agencyMRR = agencies.reduce((sum, a) => sum + a.monthly_revenue, 0);

  const activeSubs = directTenants.filter((t) => t.subscription_status === "active").length;
  const trials = directTenants.filter((t) => t.subscription_status === "trialing").length;
  const pastDue = directTenants.filter((t) => t.subscription_status === "past_due").length;
  const noStripe = directTenants.filter((t) => !t.stripe_customer_id);
  const agenciesNoStripe = agencies.filter((a) => !("stripe_customer_id" in a));

  // Sorteer directe klanten op volgende betaling
  const sortedDirect = [...directTenants].sort((a, b) => {
    if (!a.current_period_end && !b.current_period_end) return 0;
    if (!a.current_period_end) return 1;
    if (!b.current_period_end) return -1;
    return new Date(a.current_period_end).getTime() - new Date(b.current_period_end).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Facturatie
        </h1>
        <p className="text-text-secondary mt-1">
          Alleen directe klanten. Agency klanten worden apart gefactureerd.
        </p>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPI icon={<Euro className="w-5 h-5 text-success" />} bg="bg-success/10" value={formatCurrency(stats.mrr)} label="MRR (direct)" />
        <KPI icon={<CheckCircle2 className="w-5 h-5 text-success" />} bg="bg-success/10" value={String(activeSubs)} label="Actief" />
        <KPI icon={<Clock className="w-5 h-5 text-[var(--color-accent)]" />} bg="bg-[var(--color-accent)]/10" value={String(trials)} label="Trials" />
        <KPI icon={<AlertTriangle className={`w-5 h-5 ${pastDue > 0 ? "text-danger" : "text-text-secondary"}`} />} bg={pastDue > 0 ? "bg-danger/10" : "bg-surface-secondary"} value={String(pastDue)} label="Achterstallig" />
        <KPI icon={<CreditCard className={`w-5 h-5 ${noStripe.length > 0 ? "text-danger" : "text-success"}`} />} bg={noStripe.length > 0 ? "bg-danger/10" : "bg-success/10"} value={String(noStripe.length)} label="Zonder Stripe" />
      </div>

      {/* Waarschuwingen */}
      {noStripe.length > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-danger" />
            <p className="text-sm font-medium text-danger">Klanten zonder Stripe koppeling:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {noStripe.map((t) => (
              <Link key={t.id} href={`/admin/tenants/${t.id}`} className="text-xs px-2 py-1 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors">
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── Directe Klanten Facturatie ─── */}
      <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-4">
        Directe klanten ({directTenants.length})
      </h2>

      {sortedDirect.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border text-center py-12 mb-10">
          <Receipt className="w-10 h-10 text-text-secondary/20 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Nog geen directe klanten.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden mb-10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Bedrijf</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">Prijs</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Volgende incasso</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Stripe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedDirect.map((tenant) => {
                const statusBadge = getSubscriptionStatusBadge(tenant.subscription_status);
                const planConfig = getPlanConfig(tenant.subscription_plan);
                const nextPayment = tenant.current_period_end ? new Date(tenant.current_period_end) : null;
                const isOverdue = nextPayment && nextPayment < new Date();
                const isSoon = nextPayment && !isOverdue && (nextPayment.getTime() - Date.now()) < 7 * 86400000;

                return (
                  <tr key={tenant.id} className={`hover:bg-surface-secondary/50 transition-colors ${tenant.subscription_status === "past_due" ? "bg-danger/5" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tenants/${tenant.id}`} className="text-sm font-medium text-primary hover:underline">
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{planConfig.name}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-text-primary">{getPlanPrice(tenant.subscription_plan)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      {tenant.cancel_at_period_end && (
                        <span className="block text-[10px] text-danger mt-0.5">Stopt na periode</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {nextPayment ? (
                        <div>
                          <span className={`text-sm font-medium ${isOverdue ? "text-danger" : isSoon ? "text-warning" : "text-text-primary"}`}>
                            {formatDate(tenant.current_period_end!)}
                          </span>
                          {isOverdue && <span className="block text-[10px] text-danger">Verlopen!</span>}
                          {isSoon && !isOverdue && <span className="block text-[10px] text-warning">Binnen 7 dagen</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {tenant.stripe_customer_id ? (
                        <a
                          href={getStripeDashboardUrl(tenant.stripe_customer_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <CreditCard className="w-3 h-3" />
                          Bekijk
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-danger font-medium">
                          <XCircle className="w-3 h-3" />
                          Ontbreekt
                        </span>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary">
            Agency facturatie ({agencies.length})
          </h2>
          <p className="text-text-secondary text-sm mt-0.5">
            Maandelijks te factureren aan agencies op basis van gebruikersaantallen.
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border px-4 py-3 text-center">
          <p className="text-xs text-text-secondary">Agency MRR</p>
          <p className="text-xl font-bold text-success">{formatEuro(agencyMRR)}</p>
        </div>
      </div>

      {/* Agency kaarten */}
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
                  <p className="text-xs text-text-secondary">{agency.client_count} klanten · {agency.total_users} gebruikers</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Maandelijks</span>
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
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Agency</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Klant</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Tier</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">Users</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Bedrag</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Periode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoiceLines.map((line) => {
                const isProRata = line.tier_label?.includes("pro-rata");
                return (
                  <tr key={line.id} className={`hover:bg-surface-secondary/50 transition-colors ${isProRata ? "bg-warning/5" : ""}`}>
                    <td className="px-4 py-3"><span className="text-sm font-medium text-text-primary">{line.agency_name}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-text-primary">{line.tenant_name}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs ${isProRata ? "text-warning font-medium" : "text-text-secondary"}`}>{line.tier_label || "—"}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-text-primary">{line.user_count}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-medium text-text-primary">{formatEuro(line.amount)}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-text-secondary">{formatDate(line.period_start)} – {formatDate(line.period_end)}</span></td>
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

// ─── KPI Component ───

function KPI({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: string; label: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
