import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getTenantBySlug,
  getTenantUserByEmail,
  getWorkspaceWithReports,
  checkWorkspaceAccess,
} from "@/lib/tenant/queries";
import { TileGrid } from "@/components/portal/TileGrid";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ "tenant-slug": string; id: string }>;
}) {
  const { "tenant-slug": slug, id: workspaceId } = await params;

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

  // ─── 4. Workspace access check ───
  const hasAccess = await checkWorkspaceAccess(workspaceId, tenantUser.id);
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary mb-2">
            Geen toegang
          </h2>
          <p className="text-text-secondary mb-6">
            Je hebt geen toegang tot deze werkruimte. Neem contact op met je
            beheerder.
          </p>
          <Link
            href={`/${slug}/home`}
            className="text-primary hover:underline text-sm"
          >
            &larr; Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  // ─── 5. Workspace + rapporten ophalen ───
  const workspace = await getWorkspaceWithReports(workspaceId, tenant.id, tenantUser.id);
  if (!workspace) notFound();

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
        {/* Terug-link + workspace header */}
        <div className="mb-8">
          <Link
            href={`/${slug}/home`}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar werkruimtes
          </Link>

          <div className="flex items-center gap-4">
            {workspace.thumbnail_url && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workspace.thumbnail_url}
                  alt={workspace.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-text-secondary mt-1">
                  {workspace.description}
                </p>
              )}
              {!workspace.description && (
                <p className="text-text-secondary mt-1">
                  {workspace.reports.length} rapport
                  {workspace.reports.length !== 1 ? "en" : ""} beschikbaar
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rapporten grid */}
        {workspace.reports.length > 0 ? (
          <TileGrid reports={workspace.reports} tenantSlug={slug} />
        ) : (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
              Geen rapporten beschikbaar
            </h3>
            <p className="text-sm text-text-secondary">
              Er zijn nog geen rapporten gepubliceerd in deze werkruimte.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
