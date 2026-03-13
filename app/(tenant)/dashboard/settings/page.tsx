import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canClientEditBranding } from "@/lib/features/gates";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
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

  // ─── Tenant data ophalen ───
  const serviceClient = await createServiceClient();
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select(
      "id, name, slug, logo_url, primary_color, accent_color, custom_domain, subscription_plan, subscription_status, trial_ends_at, pbi_tenant_id, pbi_client_id, pbi_workspace_ids, agency_id, billing_owner, client_can_edit_branding"
    )
    .eq("id", tenantUser.tenant_id)
    .single();

  if (!tenant) redirect("/");

  const brandingEditable = canClientEditBranding({
    agency_id: tenant.agency_id,
    billing_owner: tenant.billing_owner,
    client_can_edit_branding: tenant.client_can_edit_branding,
  });

  return (
    <>
      {!brandingEditable && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-sm text-text-secondary">
          Branding wordt beheerd door je agency. Sommige instellingen zijn
          niet aanpasbaar.
        </div>
      )}
      <SettingsForm tenant={tenant} readOnly={!brandingEditable} />
    </>
  );
}
