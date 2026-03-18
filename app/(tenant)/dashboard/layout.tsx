import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TenantProvider } from "@/lib/tenant/context";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { CrispChat } from "@/components/shared/CrispChat";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // ─── 1. Sessie ophalen ───
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const userEmail = user.email!;

  // ─── 2. Tenant user record ophalen ───
  // Filter op admin rol + actief. Bij multi-tenant gebruikers pakken we
  // de eerste actieve admin-tenant. Viewers horen via de portal in te loggen.
  const { data: tenantUser, error: tuError } = await supabase
    .from("tenant_users")
    .select("id, role, tenant_id, name, email")
    .eq("email", userEmail)
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (tuError) console.error("[Dashboard Layout] tenant_users query error:", tuError);

  // Als de query faalt, toon een debug pagina in plaats van redirect
  if (tuError || !tenantUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-surface border border-border rounded-2xl p-8">
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-4">
            ⚠️ Dashboard kon niet laden
          </h1>

          <div className="space-y-3 text-sm">
            <div className="bg-surface-secondary rounded-lg p-4">
              <p className="font-medium text-text-primary">Ingelogd als:</p>
              <p className="text-text-secondary font-mono">{userEmail}</p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-4">
              <p className="font-medium text-text-primary">tenant_users record:</p>
              <p className="text-text-secondary font-mono">
                {tenantUser ? JSON.stringify(tenantUser) : "Niet gevonden"}
              </p>
            </div>

            {tuError && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
                <p className="font-medium text-danger">Supabase fout:</p>
                <p className="text-danger/80 font-mono text-xs mt-1">
                  {tuError.message} ({tuError.code})
                </p>
              </div>
            )}

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <p className="font-medium text-text-primary mb-2">Mogelijke oorzaken:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                <li>
                  Geen <code className="text-xs bg-surface px-1 rounded">tenant_users</code> record
                  voor dit e-mailadres
                </li>
                <li>
                  RLS policy ontbreekt — voer in Supabase SQL Editor uit:<br />
                  <code className="text-xs bg-surface px-1 rounded block mt-1">
                    CREATE POLICY &quot;Users can read own record&quot; ON tenant_users
                    FOR SELECT USING (email = auth.jwt() -&gt;&gt; &apos;email&apos;);
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. Tenant data ophalen ───
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name, logo_url, primary_color, accent_color, subscription_plan, subscription_status, trial_ends_at, stripe_customer_id, agency_id, billing_owner, client_can_invite_users, client_can_edit_branding")
    .eq("id", tenantUser.tenant_id)
    .single();

  if (tenantError) console.error("[Dashboard Layout] tenant query error:", tenantError);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-surface border border-border rounded-2xl p-8">
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-4">
            ⚠️ Tenant niet gevonden
          </h1>
          <div className="bg-surface-secondary rounded-lg p-4 text-sm">
            <p className="text-text-secondary">
              tenant_id: <code className="font-mono">{tenantUser.tenant_id}</code>
            </p>
            {tenantError && (
              <p className="text-danger mt-2 font-mono text-xs">
                {tenantError.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── 4. Subscription status check ───
  const subStatus = tenant.subscription_status || "active";
  const isSuspended = subStatus === "canceled" || subStatus === "suspended";

  // ─── 5. Dashboard renderen met sidebar + header ───
  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar — alleen op desktop */}
        <DashboardSidebar
          role={tenantUser.role}
          tenant={{
            name: tenant.name,
            slug: tenant.slug,
            logoUrl: tenant.logo_url,
          }}
          agencyManaged={!!tenant.agency_id}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <DashboardHeader
            user={{
              name: tenantUser.name || userEmail,
              email: userEmail,
              role: tenantUser.role,
            }}
            tenant={{
              name: tenant.name,
              logoUrl: tenant.logo_url,
            }}
          />

          {/* Page content */}
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            {/* Trial banner */}
            <TrialBanner />

            {/* Past due waarschuwing */}
            {subStatus === "past_due" && (
              <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                <span className="text-sm font-medium text-danger">
                  Je laatste betaling is mislukt. Werk je betaalgegevens bij om je account actief te houden.
                </span>
                <a href="/dashboard/billing" className="text-sm text-danger underline shrink-0">
                  Betaalgegevens bijwerken
                </a>
              </div>
            )}

            {/* Suspended → alleen suspended pagina tonen, rest blokkeren */}
            {isSuspended ? (
              <>{children}</>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      {/* Crisp chat — alleen voor Business+ of trial */}
      <CrispChat />
    </TenantProvider>
  );
}
