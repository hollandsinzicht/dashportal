import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getTenantBySlug,
  getTenantUserByEmail,
  getUserWorkspacesWithReports,
  getDebugWorkspaceReportData,
} from "@/lib/tenant/queries";
import { syncAzureOID, extractAzureOID } from "@/lib/auth/sso-match";
import { WorkspaceCard } from "@/components/portal/WorkspaceCard";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { FolderOpen, Settings, RefreshCw } from "lucide-react";
import { DashboardBouwenCTA } from "@/components/shared/DashboardBouwenCTA";
import Link from "next/link";

export default async function TenantHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ "tenant-slug": string }>;
  searchParams: Promise<{ debug?: string }>;
}) {
  const { "tenant-slug": slug } = await params;
  const { debug } = await searchParams;
  const showDebug = debug === "true";

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

  // ─── 3. Tenant user ophalen (rol + naam) ───
  const tenantUser = await getTenantUserByEmail(tenant.id, user.email!);

  if (!tenantUser) {
    redirect(`/${slug}?error=access_denied`);
  }

  // ─── 3b. Azure OID synchroniseren (na Microsoft SSO login) ───
  const azureOid = extractAzureOID(user);
  if (azureOid && !tenantUser.azure_oid) {
    // Fire-and-forget: sla Azure OID op voor RLS matching
    syncAzureOID(tenant.id, user.email!, azureOid).catch(() => {
      // Silently ignore — niet-kritisch voor de gebruikerservaring
    });
  }

  // ─── 4. Workspaces met rapporten ophalen ───
  const workspaces = await getUserWorkspacesWithReports(
    tenant.id,
    tenantUser.id
  );

  // Filter lege workspaces weg (0 gepubliceerde rapporten)
  const visibleWorkspaces = workspaces.filter((ws) => ws.reports.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PortalHeader
        tenant={{
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logo_url,
        }}
        user={{
          name: tenantUser.name || user.email!,
          email: user.email!,
          role: tenantUser.role,
        }}
      />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Werkruimtes
          </h1>
          <p className="text-text-secondary mt-1">
            Selecteer een werkruimte om de rapporten te bekijken.
          </p>
        </div>

        {visibleWorkspaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                id={workspace.id}
                name={workspace.name}
                thumbnailUrl={workspace.thumbnail_url}
                reportCount={workspace.reports.length}
                tenantSlug={slug}
              />
            ))}
          </div>
        ) : tenantUser.role === "admin" ? (
          <div className="text-center py-20">
            <RefreshCw className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
              Nog geen werkruimtes gesynchroniseerd
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
              Synchroniseer je Power BI werkruimtes via het dashboard om
              rapporten beschikbaar te maken in het portaal.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Ga naar Instellingen
            </Link>
          </div>
        ) : (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
              Geen werkruimtes beschikbaar
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              Er zijn nog geen werkruimtes aan je toegewezen. Neem contact op met
              je beheerder.
            </p>

            {/* Dashboard bouwen CTA */}
            <div className="max-w-xl mx-auto">
              <DashboardBouwenCTA variant="inline" />
            </div>
          </div>
        )}

        {/* Debug panel — voeg ?debug=true toe aan URL om te tonen */}
        {showDebug && <DebugPanel tenantId={tenant.id} tenantUserId={tenantUser.id} role={tenantUser.role} workspaces={workspaces} visibleWorkspaces={visibleWorkspaces} />}
      </main>
    </div>
  );
}

// ─── Debug Panel (server component, alleen bij ?debug=true) ───
async function DebugPanel({
  tenantId,
  tenantUserId,
  role,
  workspaces,
  visibleWorkspaces,
}: {
  tenantId: string;
  tenantUserId: string;
  role: string;
  workspaces: Awaited<ReturnType<typeof getUserWorkspacesWithReports>>;
  visibleWorkspaces: Awaited<ReturnType<typeof getUserWorkspacesWithReports>>;
}) {
  // Haal ruwe data op om matching te diagnosticeren
  const debugData = await getDebugWorkspaceReportData(tenantId);

  // Bereken matching
  const wsPbiIds = new Set(debugData.workspaces.map((ws) => ws.pbi_workspace_id));
  const matchedReports = debugData.reports.filter((r) => wsPbiIds.has(r.pbi_workspace_id));
  const unmatchedReports = debugData.reports.filter((r) => !wsPbiIds.has(r.pbi_workspace_id));

  return (
    <div className="mt-12 p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs font-mono space-y-4">
      <h4 className="font-bold text-amber-700 text-sm">🔍 Debug Info</h4>

      {/* Basis info */}
      <div className="grid grid-cols-2 gap-2">
        <p><strong>Tenant ID:</strong> {tenantId}</p>
        <p><strong>Tenant User ID:</strong> {tenantUserId}</p>
        <p><strong>Rol:</strong> {role}</p>
        <p><strong>Gefilterde workspaces (met reports):</strong> {visibleWorkspaces.length}</p>
      </div>

      {/* Ruwe database data */}
      <div className="border-t border-amber-300/50 pt-4">
        <h5 className="font-bold text-amber-700 mb-2">📦 Ruwe Database Data</h5>
        <p><strong>Workspaces in DB:</strong> {debugData.workspaces.length} {debugData.workspacesError && <span className="text-red-600">⚠️ {debugData.workspacesError}</span>}</p>
        <p><strong>Reports in DB:</strong> {debugData.reports.length} {debugData.reportsError && <span className="text-red-600">⚠️ {debugData.reportsError}</span>}</p>
        <p><strong>Reports published:</strong> {debugData.reports.filter((r) => r.is_published).length}</p>
        <p><strong>Reports matched to workspace:</strong> {matchedReports.length}</p>
        <p><strong>Reports NIET matched:</strong> {unmatchedReports.length}</p>
      </div>

      {/* Workspaces met pbi_workspace_id */}
      <div className="border-t border-amber-300/50 pt-4">
        <h5 className="font-bold text-amber-700 mb-2">🗂️ Workspaces (pbi_workspace_id)</h5>
        {debugData.workspaces.map((ws) => (
          <div key={ws.id} className="pl-4 border-l-2 border-amber-300 mb-2">
            <p><strong>{ws.name}</strong> (active: {String(ws.is_active)})</p>
            <p className="text-text-secondary">id: {ws.id}</p>
            <p className="text-blue-600">pbi_workspace_id: {ws.pbi_workspace_id}</p>
          </div>
        ))}
      </div>

      {/* Reports met pbi_workspace_id */}
      <div className="border-t border-amber-300/50 pt-4">
        <h5 className="font-bold text-amber-700 mb-2">📊 Reports (pbi_workspace_id)</h5>
        {debugData.reports.length === 0 && (
          <p className="text-red-600">⚠️ Geen reports gevonden in de database voor deze tenant!</p>
        )}
        {debugData.reports.map((r) => {
          const matched = wsPbiIds.has(r.pbi_workspace_id);
          return (
            <div key={r.id} className={`pl-4 border-l-2 mb-2 ${matched ? "border-green-400" : "border-red-400"}`}>
              <p><strong>{r.title}</strong> (published: {String(r.is_published)})</p>
              <p className={matched ? "text-green-600" : "text-red-600"}>
                pbi_workspace_id: {r.pbi_workspace_id} {matched ? "✅ match" : "❌ GEEN match met workspace"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Unmatched reports detail */}
      {unmatchedReports.length > 0 && (
        <div className="border-t border-red-300/50 pt-4">
          <h5 className="font-bold text-red-600 mb-2">❌ Unmatched pbi_workspace_ids in reports</h5>
          <p className="text-red-600 mb-1">Deze pbi_workspace_ids in reports matchen niet met enige workspace:</p>
          {[...new Set(unmatchedReports.map((r) => r.pbi_workspace_id))].map((id) => (
            <p key={id} className="text-red-600 pl-4">• {id}</p>
          ))}
          <p className="text-amber-700 mt-2">Workspace pbi_workspace_ids:</p>
          {debugData.workspaces.map((ws) => (
            <p key={ws.id} className="text-amber-700 pl-4">• {ws.pbi_workspace_id} ({ws.name})</p>
          ))}
        </div>
      )}
    </div>
  );
}
