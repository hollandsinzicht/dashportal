import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ReportConfigForm } from "@/components/dashboard/ReportConfigForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: reportId } = await params;

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

  const serviceClient = await createServiceClient();
  const tenantId = tenantUser.tenant_id;

  // ─── Rapport ophalen ───
  const { data: report } = await serviceClient
    .from("reports")
    .select(
      "id, title, description, category, access_type, rls_type, rls_role_field, is_published, pbi_report_id, pbi_workspace_id, pbi_dataset_id, thumbnail_url"
    )
    .eq("id", reportId)
    .eq("tenant_id", tenantId)
    .single();

  if (!report) redirect("/dashboard/reports");

  // ─── Actieve gebruikers, RLS-rollen en rapport-toegang ophalen ───
  const [usersResult, rlsRolesResult, reportAccessResult] = await Promise.all([
    serviceClient
      .from("tenant_users")
      .select("id, name, email, role")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),

    serviceClient
      .from("rls_roles")
      .select("id, user_id, role_name, role_value")
      .eq("report_id", reportId),

    serviceClient
      .from("report_access")
      .select("user_id")
      .eq("report_id", reportId),
  ]);

  const users = usersResult.data || [];
  const rlsRoles = rlsRolesResult.data || [];
  const reportAccessUserIds = (reportAccessResult.data || []).map(
    (r) => r.user_id
  );

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar rapporten
        </Link>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
          {report.title}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Configureer de instellingen, toegang en RLS van dit rapport.
        </p>
      </div>

      <ReportConfigForm
        report={report}
        users={users}
        rlsRoles={rlsRoles}
        reportAccessUserIds={reportAccessUserIds}
        tenantId={tenantId}
      />
    </div>
  );
}
