import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canUseFeature } from "@/lib/features/gates";
import { UsersTable } from "@/components/dashboard/UsersTable";
import { UserLimitMeterWrapper } from "@/components/dashboard/UserLimitMeterWrapper";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function UsersPage() {
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

  // ─── Alle gebruikers + tenant plan ophalen ───
  const [usersResult, tenantResult] = await Promise.all([
    serviceClient
      .from("tenant_users")
      .select(
        "id, name, email, role, auth_provider, last_login, is_active, invited_at"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),

    serviceClient
      .from("tenants")
      .select("subscription_plan, subscription_status, trial_ends_at")
      .eq("id", tenantId)
      .single(),
  ]);

  const users = usersResult.data || [];
  const plan = tenantResult.data?.subscription_plan || "starter";
  const activeUsers = users.filter((u) => u.is_active).length;

  // Microsoft SSO feature gate
  const ssoEnabled = canUseFeature(
    {
      subscription_plan: plan,
      subscription_status: tenantResult.data?.subscription_status,
      trial_ends_at: tenantResult.data?.trial_ends_at,
    },
    "microsoft_sso"
  );

  return (
    <div className="space-y-6">
      <UserLimitMeterWrapper
        tenantId={tenantId}
        plan={plan}
        currentUsers={activeUsers}
      />

      {/* Azure AD Import knop (Business+ only) */}
      {ssoEnabled && (
        <div className="flex justify-end">
          <Link
            href="/dashboard/users/import"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <Users className="w-4 h-4" />
            Importeer uit Azure AD
          </Link>
        </div>
      )}

      <UsersTable
        users={users}
        tenantId={tenantId}
        currentUserEmail={user.email!}
      />
    </div>
  );
}
