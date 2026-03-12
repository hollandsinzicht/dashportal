import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canUseFeature } from "@/lib/features/gates";
import { AzureADImport } from "@/components/dashboard/AzureADImport";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function AzureImportPage() {
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

  if (!tenantUser || tenantUser.role !== "admin") redirect("/");

  const tenantId = tenantUser.tenant_id;
  const serviceClient = await createServiceClient();

  // ─── Tenant data ophalen ───
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select(
      "subscription_plan, subscription_status, trial_ends_at, pbi_tenant_id, pbi_client_id, pbi_client_secret"
    )
    .eq("id", tenantId)
    .single();

  // ─── Feature gate check ───
  const ssoEnabled = canUseFeature(
    {
      subscription_plan: tenant?.subscription_plan || "starter",
      subscription_status: tenant?.subscription_status,
      trial_ends_at: tenant?.trial_ends_at,
    },
    "microsoft_sso"
  );

  const hasCredentials = !!(
    tenant?.pbi_tenant_id &&
    tenant?.pbi_client_id &&
    tenant?.pbi_client_secret
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar gebruikers
        </Link>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          Importeer uit Azure AD
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Importeer gebruikers vanuit je Microsoft Azure Active Directory en koppel
          ze automatisch aan dit portaal.
        </p>
      </div>

      {/* Checks */}
      {!ssoEnabled ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
            Microsoft SSO vereist
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
            Azure AD import is beschikbaar vanaf het Business plan. Upgrade je
            plan om deze functie te gebruiken.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Bekijk plannen
          </Link>
        </div>
      ) : !hasCredentials ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
            Power BI credentials vereist
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
            Configureer eerst je Power BI verbinding in de instellingen. De Azure
            AD import gebruikt dezelfde app registratie.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ga naar Instellingen
          </Link>
        </div>
      ) : (
        <AzureADImport tenantId={tenantId} />
      )}
    </div>
  );
}
