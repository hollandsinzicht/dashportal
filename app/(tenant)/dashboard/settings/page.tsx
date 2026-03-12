import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
      "id, name, slug, logo_url, primary_color, accent_color, custom_domain, subscription_plan, subscription_status, trial_ends_at, pbi_tenant_id, pbi_client_id, pbi_workspace_ids"
    )
    .eq("id", tenantUser.tenant_id)
    .single();

  if (!tenant) redirect("/");

  return <SettingsForm tenant={tenant} />;
}
