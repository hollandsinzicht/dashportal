import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AffiliateDashboard } from "@/components/dashboard/AffiliateDashboard";

export default async function AffiliatePage() {
  // ─── Auth + tenant context ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role, email, name")
    .eq("email", user.email!)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!tenantUser) redirect("/");

  const serviceClient = await createServiceClient();
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("id, name")
    .eq("id", tenantUser.tenant_id)
    .single();

  if (!tenant) redirect("/dashboard");

  return (
    <AffiliateDashboard
      tenantId={tenant.id}
      adminEmail={tenantUser.email || user.email!}
      adminName={tenantUser.name || user.email!}
      companyName={tenant.name}
    />
  );
}
