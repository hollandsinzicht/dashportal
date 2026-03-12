import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  FileBarChart,
  Users,
  Eye,
  Activity,
  CheckCircle2,
  Circle,
  UserPlus,
  Shield,
  Palette,
  Link2,
  BarChart3,
} from "lucide-react";
import { DashboardBouwenCTA } from "@/components/shared/DashboardBouwenCTA";
import { UserLimitMeterWrapper } from "@/components/dashboard/UserLimitMeterWrapper";

export default async function DashboardOverview() {
  // ─── Auth + tenant context ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role")
    .eq("email", user.email!)
    .limit(1)
    .maybeSingle();

  if (!tenantUser) redirect("/");

  const tenantId = tenantUser.tenant_id;
  const serviceClient = await createServiceClient();

  // ─── Statistieken ophalen ───
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [reportsCount, usersCount, viewsCount, activeCount, tenant, recentActivity] =
    await Promise.all([
      // Gepubliceerde rapporten
      serviceClient
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_published", true),

      // Actieve gebruikers
      serviceClient
        .from("tenant_users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true),

      // Views deze maand
      serviceClient
        .from("report_views")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("viewed_at", startOfMonth),

      // Actieve sessies (ingelogd in afgelopen 24u)
      serviceClient
        .from("tenant_users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .gte("last_login", last24h),

      // Tenant data voor onboarding checklist + plan info
      serviceClient
        .from("tenants")
        .select(
          "pbi_client_id, pbi_tenant_id, logo_url, primary_color, custom_domain, subscription_plan"
        )
        .eq("id", tenantId)
        .single(),

      // Recente activiteit (laatste 8)
      serviceClient
        .from("activity_log")
        .select("id, action, target_type, metadata, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const stats = [
    {
      label: "Rapporten",
      value: String(reportsCount.count ?? 0),
      icon: FileBarChart,
      color: "text-primary",
    },
    {
      label: "Gebruikers",
      value: String(usersCount.count ?? 0),
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Views deze maand",
      value: String(viewsCount.count ?? 0),
      icon: Eye,
      color: "text-success",
    },
    {
      label: "Actieve sessies",
      value: String(activeCount.count ?? 0),
      icon: Activity,
      color: "text-primary",
    },
  ];

  // ─── Onboarding checklist ───
  const tenantData = tenant.data;
  const hasPbiConfig = !!(tenantData?.pbi_client_id && tenantData?.pbi_tenant_id);
  const hasReports = (reportsCount.count ?? 0) > 0;
  const hasUsers = (usersCount.count ?? 0) > 1; // > 1 want admin zelf telt mee
  const hasBranding = !!(
    tenantData?.logo_url ||
    (tenantData?.primary_color && tenantData.primary_color !== "#1E3A5F")
  );

  const onboardingSteps = [
    {
      label: "Power BI koppeling instellen",
      done: hasPbiConfig,
      href: "/dashboard/settings",
      icon: Link2,
    },
    {
      label: "Rapporten synchroniseren",
      done: hasReports,
      href: "/dashboard/reports",
      icon: BarChart3,
    },
    {
      label: "Gebruikers uitnodigen",
      done: hasUsers,
      href: "/dashboard/users",
      icon: UserPlus,
    },
    {
      label: "Toegang configureren",
      done: hasReports && hasUsers,
      href: "/dashboard/access",
      icon: Shield,
    },
    {
      label: "Branding aanpassen",
      done: hasBranding,
      href: "/dashboard/settings",
      icon: Palette,
    },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.done).length;
  const allDone = completedSteps === onboardingSteps.length;

  // ─── Activity log formatting ───
  const activityItems = (recentActivity.data || []).map((item) => {
    const meta = (item.metadata || {}) as Record<string, string>;
    return {
      id: item.id,
      label: formatAction(item.action, meta),
      time: formatTimeAgo(item.created_at),
      icon: getActionIcon(item.action),
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Welkom terug. Hier is een overzicht van je portaal.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gebruikerslimiet meter */}
      <div className="mb-8">
        <UserLimitMeterWrapper
          tenantId={tenantId}
          plan={tenantData?.subscription_plan || "starter"}
          currentUsers={usersCount.count ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding checklist */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <CardTitle>Aan de slag</CardTitle>
            {!allDone && (
              <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-full">
                {completedSteps}/{onboardingSteps.length}
              </span>
            )}
          </div>
          <CardDescription>
            {allDone
              ? "Je portaal is volledig ingericht!"
              : "Volg deze stappen om je portaal in te richten."}
          </CardDescription>

          {/* Progress bar */}
          <div className="mt-4 mb-5">
            <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${(completedSteps / onboardingSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {onboardingSteps.map((step) => (
              <a
                key={step.label}
                href={step.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${
                    step.done
                      ? "bg-success/5 hover:bg-success/10"
                      : "hover:bg-surface-secondary"
                  }
                `}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-text-secondary/40 shrink-0" />
                )}
                <step.icon
                  className={`w-4 h-4 shrink-0 ${
                    step.done ? "text-success/60" : "text-text-secondary/60"
                  }`}
                />
                <span
                  className={`text-sm ${
                    step.done
                      ? "text-text-secondary line-through"
                      : "text-text-primary font-medium"
                  }`}
                >
                  {step.label}
                </span>
              </a>
            ))}
          </div>
        </Card>

        {/* Recente activiteit */}
        <Card>
          <CardTitle>Recente activiteit</CardTitle>
          <CardDescription>
            {activityItems.length === 0
              ? "Nog geen activiteit geregistreerd."
              : "Laatste acties in je portaal."}
          </CardDescription>

          {activityItems.length > 0 && (
            <div className="mt-4 space-y-1">
              {activityItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary/50 transition-colors"
                >
                  <div className="w-7 h-7 bg-surface-secondary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-text-secondary">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dashboard bouwen CTA */}
      <div className="mt-8">
        <DashboardBouwenCTA variant="inline" />
      </div>
    </div>
  );
}

// ─── Helpers ───

function formatAction(
  action: string,
  meta: Record<string, string>
): string {
  switch (action) {
    case "user.invited":
      return `${meta.email || "Gebruiker"} uitgenodigd`;
    case "user.updated":
      return `${meta.email || "Gebruiker"} bijgewerkt`;
    case "user.deleted":
      return `${meta.email || "Gebruiker"} verwijderd`;
    case "user.activated":
      return `${meta.email || "Gebruiker"} geactiveerd`;
    case "user.deactivated":
      return `${meta.email || "Gebruiker"} gedeactiveerd`;
    case "access.granted":
      return `Toegang verleend aan ${meta.email || "gebruiker"}`;
    case "access.revoked":
      return `Toegang ingetrokken van ${meta.email || "gebruiker"}`;
    case "report.synced":
      return `Rapporten gesynchroniseerd (${meta.count || "?"} rapporten)`;
    case "report.viewed":
      return `${meta.title || "Rapport"} bekeken`;
    case "tenant.updated":
      return `Instellingen bijgewerkt (${meta.field || "?"})`;
    default:
      return action;
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  if (diffHour < 24) return `${diffHour} uur geleden`;
  if (diffDay === 1) return "Gisteren";
  if (diffDay < 7) return `${diffDay} dagen geleden`;

  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

function getActionIcon(action: string) {
  if (action.startsWith("user.")) return Users;
  if (action.startsWith("access.")) return Shield;
  if (action.startsWith("report.")) return FileBarChart;
  if (action.startsWith("tenant.")) return Palette;
  return Activity;
}
