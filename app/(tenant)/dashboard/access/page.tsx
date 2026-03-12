import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AccessMatrix } from "@/components/dashboard/AccessMatrix";
import { AccessInfoDialog } from "@/components/dashboard/AccessInfoDialog";

export default async function AccessPage() {
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

  // ─── Gebruikers, workspaces en toegangsrecords ophalen ───
  const [usersResult, workspacesResult, accessResult] = await Promise.all([
    serviceClient
      .from("tenant_users")
      .select("id, name, email, role")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),

    serviceClient
      .from("workspaces")
      .select("id, name, thumbnail_url")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    serviceClient
      .from("workspace_access")
      .select("workspace_id, user_id, workspaces!inner(tenant_id)")
      .eq("workspaces.tenant_id", tenantId),
  ]);

  const users = usersResult.data || [];
  const workspaces = workspacesResult.data || [];

  // Flatten access records
  const accessRecords = (accessResult.data || []).map((record) => ({
    workspace_id: record.workspace_id,
    user_id: record.user_id,
  }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
              Toegangsbeheer
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Bepaal welke gebruikers toegang hebben tot welke workspaces. Alle
              rapporten in een workspace worden zichtbaar wanneer toegang is
              verleend.
            </p>
          </div>
          <AccessInfoDialog />
        </div>
      </div>

      <AccessMatrix
        users={users}
        workspaces={workspaces}
        accessRecords={accessRecords}
        tenantId={tenantId}
      />
    </div>
  );
}
