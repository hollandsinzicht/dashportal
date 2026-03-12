import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getTenantBySlug, getTenantUserByEmail } from "@/lib/tenant/queries";
import { ReportViewer } from "@/components/portal/ReportViewer";
import { ArrowLeft, ChevronRight } from "lucide-react";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ "tenant-slug": string; "report-id": string }>;
}) {
  const { "tenant-slug": slug, "report-id": reportId } = await params;

  // ─── 1. Tenant ophalen ───
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  // ─── 2. Auth check ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${slug}`);
  }

  // ─── 3. Tenant user ophalen ───
  const tenantUser = await getTenantUserByEmail(tenant.id, user.email!);
  if (!tenantUser) {
    redirect(`/${slug}?error=access_denied`);
  }

  // ─── 4. Rapport ophalen (via service client voor volledige toegang) ───
  const serviceClient = await createServiceClient();
  const { data: report } = await serviceClient
    .from("reports")
    .select("id, title, pbi_report_id, pbi_workspace_id, workspace_id")
    .eq("id", reportId)
    .eq("tenant_id", tenant.id)
    .single();

  if (!report) {
    notFound();
  }

  const backUrl = report.workspace_id
    ? `/${slug}/workspace/${report.workspace_id}`
    : `/${slug}/home`;

  // ─── 5. Toegangscheck (workspace-niveau + rapport-niveau) ───
  // access_type kolom bestaat mogelijk nog niet — treat als "all_users"
  const accessType = (report as Record<string, unknown>).access_type as string | undefined || "all_users";
  const isAdmin = tenantUser.role === "admin";

  // 5a. Admin-only: alleen admins mogen dit rapport zien
  if (accessType === "admin_only" && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
            Geen toegang
          </h2>
          <p className="text-text-secondary mb-6">
            Dit rapport is alleen beschikbaar voor beheerders.
          </p>
          <Link
            href={backUrl}
            className="text-primary hover:underline text-sm"
          >
            &larr; Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  // 5b. Specific users: check report_access tabel (admins altijd toegang)
  if (accessType === "specific_users" && !isAdmin) {
    const { data: reportAccess } = await serviceClient
      .from("report_access")
      .select("id")
      .eq("report_id", reportId)
      .eq("user_id", tenantUser.id)
      .maybeSingle();

    if (!reportAccess) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
              Geen toegang
            </h2>
            <p className="text-text-secondary mb-6">
              Je hebt geen toegang tot dit rapport. Neem contact op met je
              beheerder.
            </p>
            <Link
              href={backUrl}
              className="text-primary hover:underline text-sm"
            >
              &larr; Terug naar overzicht
            </Link>
          </div>
        </div>
      );
    }
  }

  // 5c. Workspace-level check (aanvullend op rapport-level)
  const { data: access } = await serviceClient
    .from("workspace_access")
    .select("id")
    .eq("workspace_id", report.workspace_id)
    .eq("user_id", tenantUser.id)
    .maybeSingle();

  if (!access) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
            Geen toegang
          </h2>
          <p className="text-text-secondary mb-6">
            Je hebt geen toegang tot dit rapport. Neem contact op met je
            beheerder.
          </p>
          <Link
            href={backUrl}
            className="text-primary hover:underline text-sm"
          >
            &larr; Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  // ─── 6. Pagina renderen met embed ───
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Compact header met breadcrumb */}
      <header className="bg-surface border-b border-border shrink-0">
        <div className="px-4 sm:px-6 flex items-center justify-between h-12">
          {/* Links: terug + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href={backUrl}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Terug</span>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-text-secondary/30" />

            <span className="font-[family-name:var(--font-syne)] text-sm font-semibold text-text-primary truncate max-w-[300px]">
              {report.title}
            </span>
          </div>

          {/* Rechts: tenant + user info uit PortalHeader (compact versie) */}
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-6 w-auto"
              />
            ) : (
              <span className="text-xs font-medium text-text-secondary">
                {tenant.name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Report embed — vult alle resterende ruimte */}
      <ReportViewer
        reportId={report.id}
        tenantId={tenant.id}
        userId={tenantUser.id}
        reportTitle={report.title}
      />
    </div>
  );
}
