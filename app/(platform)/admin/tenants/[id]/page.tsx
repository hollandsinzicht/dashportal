import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Building2,
  Globe,
  Calendar,
  CreditCard,
  Plug,
  Handshake,
} from "lucide-react";
import { getTenantDetail } from "@/lib/admin/queries";
import { getPlanConfig } from "@/lib/stripe/config";
import {
  getSubscriptionStatusBadge,
  formatDate,
  formatTimeAgo,
  getPlanPrice,
  getUserLimitLabel,
  getStripeDashboardUrl,
} from "@/lib/admin/helpers";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminTenantActions } from "@/components/admin/AdminTenantActions";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTenantDetail(id);

  if (!data) notFound();

  const { tenant, users, reportCount, workspaceCount, activity, usage } = data;
  const planConfig = getPlanConfig(tenant.subscription_plan || "starter");
  const statusBadge = getSubscriptionStatusBadge(
    tenant.subscription_status || "trialing"
  );
  const adminUser = users.find((u) => u.role === "admin");
  const hasPbiConnection = !!(tenant.pbi_tenant_id && tenant.pbi_client_id);
  const isAgencyManaged = !!(tenant as Record<string, unknown>).agency_id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar overzicht
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            {tenant.name}
          </h1>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          <Badge variant="accent">{planConfig.name}</Badge>
          {isAgencyManaged && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
              <Handshake className="w-3 h-3" />
              Via agency
            </span>
          )}
          {!tenant.is_active && (
            <Badge variant="danger">Gearchiveerd</Badge>
          )}
        </div>
        <p className="text-text-secondary text-sm font-mono">{tenant.slug}</p>
      </div>

      {/* Tenant acties */}
      <div className="mb-6">
        <AdminTenantActions
          tenantId={tenant.id}
          tenantName={tenant.name}
          isActive={tenant.is_active}
          subscriptionStatus={tenant.subscription_status || "active"}
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Card A: Account & Contact */}
        <Card>
          <CardTitle className="mb-4">Account & Contact</CardTitle>
          <dl className="space-y-3 text-sm">
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="Admin"
              value={adminUser?.name || "—"}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="E-mail"
              value={adminUser?.email || "—"}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Bedrijf"
              value={tenant.name}
            />
            <InfoRow
              icon={<Globe className="w-4 h-4" />}
              label="Custom domein"
              value={tenant.custom_domain || "Niet ingesteld"}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Aangemaakt"
              value={formatDate(tenant.created_at)}
            />
          </dl>
        </Card>

        {/* Card B: Abonnement (leeg voor agency-managed) */}
        <Card>
          <CardTitle className="mb-4">{isAgencyManaged ? "Agency" : "Abonnement"}</CardTitle>
          {isAgencyManaged ? (
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 rounded-lg">
                <p className="text-sm text-text-primary">
                  Deze klant wordt beheerd en gefactureerd door een agency. Facturatie loopt niet via jouw Stripe.
                </p>
              </div>
              <InfoRow
                icon={<Handshake className="w-4 h-4" />}
                label="Billing"
                value="Via agency"
              />
            </div>
          ) : (
          <dl className="space-y-3 text-sm">
            <InfoRow
              icon={<CreditCard className="w-4 h-4" />}
              label="Plan"
              value={`${planConfig.name} — ${getPlanPrice(tenant.subscription_plan || "starter")}`}
            />
            <div className="flex items-start gap-3">
              <span className="text-text-secondary shrink-0 w-4 h-4" />
              <dt className="text-text-secondary w-32 shrink-0">Status</dt>
              <dd className="text-text-primary">
                <Badge variant={statusBadge.variant}>
                  {statusBadge.label}
                </Badge>
              </dd>
            </div>
            <InfoRow
              label="Trial eindigt"
              value={
                tenant.trial_ends_at
                  ? formatDate(tenant.trial_ends_at)
                  : "N.v.t."
              }
            />
            <InfoRow
              label="Periode tot"
              value={
                tenant.current_period_end
                  ? formatDate(tenant.current_period_end)
                  : "N.v.t."
              }
            />
            <InfoRow
              label="Opzeggen na periode"
              value={tenant.cancel_at_period_end ? "Ja" : "Nee"}
            />
            {tenant.stripe_customer_id && (
              <div className="flex items-start gap-3 pt-2 border-t border-border">
                <span className="w-4" />
                <dt className="text-text-secondary w-32 shrink-0">Stripe</dt>
                <dd>
                  <a
                    href={getStripeDashboardUrl(tenant.stripe_customer_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Bekijk in Stripe
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
          )}
        </Card>

        {/* Card C: Gebruik */}
        <Card>
          <CardTitle className="mb-4">Gebruik</CardTitle>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-secondary">Gebruikers</span>
                <span className="text-sm font-medium text-text-primary">
                  {usage.currentUsers} / {usage.isUnlimited ? "\u221E" : usage.maxUsers}
                </span>
              </div>
              {!usage.isUnlimited && (
                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.percentageUsed > 80
                        ? "bg-danger"
                        : usage.percentageUsed > 60
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                    style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {workspaceCount}
                </p>
                <p className="text-xs text-text-secondary">Werkruimtes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {reportCount}
                </p>
                <p className="text-xs text-text-secondary">Rapporten</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card D: Power BI Koppeling */}
        <Card>
          <CardTitle className="mb-4">Power BI Koppeling</CardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Plug className="w-4 h-4 text-text-secondary" />
              <dt className="text-text-secondary w-32 shrink-0">Status</dt>
              <dd className="flex items-center gap-1.5">
                {hasPbiConnection ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-success font-medium">Gekoppeld</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-danger" />
                    <span className="text-danger font-medium">
                      Niet gekoppeld
                    </span>
                  </>
                )}
              </dd>
            </div>
            <InfoRow
              label="Tenant ID"
              value={
                tenant.pbi_tenant_id
                  ? `${tenant.pbi_tenant_id.slice(0, 8)}...`
                  : "—"
              }
              mono
            />
            <InfoRow
              label="Client ID"
              value={
                tenant.pbi_client_id
                  ? `${tenant.pbi_client_id.slice(0, 8)}...`
                  : "—"
              }
              mono
            />
            <InfoRow
              label="Werkruimtes"
              value={`${workspaceCount} actief`}
            />
          </dl>
        </Card>
      </div>

      {/* Users Table */}
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-4">
          Gebruikers ({users.length})
        </h2>
        {users.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-text-secondary">
              Geen gebruikers gevonden.
            </p>
          </Card>
        ) : (
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
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Provider
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Aangemaakt
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-surface-secondary/50 transition-colors ${!user.is_active ? "opacity-50" : ""}`}
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
                          user.role === "admin" ? "accent" : "default"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-text-secondary">
                        {user.auth_provider || "email"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={user.is_active ? "success" : "default"}
                      >
                        {user.is_active ? "Actief" : "Inactief"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminUserActions
                        userId={user.id}
                        userName={user.name || user.email}
                        email={user.email}
                        isActive={user.is_active}
                        role={user.role}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-4">
          Recente activiteit
        </h2>
        {activity.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-text-secondary">
              Nog geen activiteit gelogd.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm text-text-primary">
                      {formatAction(item.action, item.details)}
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary shrink-0 ml-4">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───

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

// ─── Activity helpers ───

function formatAction(
  action: string,
  details: Record<string, string> | null
): string {
  const meta = details || {};
  const actionMap: Record<string, string> = {
    "user.invited": `Gebruiker ${meta.email || ""} uitgenodigd`,
    "user.removed": `Gebruiker ${meta.email || ""} verwijderd`,
    "user.role_changed": `Rol gewijzigd voor ${meta.email || ""}`,
    "user.azure_import": `${meta.count || "?"} gebruikers geimporteerd uit Azure AD`,
    "access.updated": "Toegangsrechten bijgewerkt",
    "report.published": `Rapport "${meta.title || ""}" gepubliceerd`,
    "report.unpublished": `Rapport "${meta.title || ""}" gedepubliceerd`,
    "settings.updated": "Instellingen bijgewerkt",
    "tenant.canceled": "Abonnement opgezegd",
  };
  return actionMap[action] || action;
}
