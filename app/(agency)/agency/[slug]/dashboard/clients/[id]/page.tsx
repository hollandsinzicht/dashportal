import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getAgencyBySlug } from "@/lib/agency/queries";
import { Building2, Users, FileText, ArrowLeft, ExternalLink } from "lucide-react";
import { DeleteClientButton } from "@/components/agency/DeleteClientButton";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const supabase = await createServiceClient();

  // Haal tenant + users op
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .eq("agency_id", agency.id)
    .single();

  if (!tenant) redirect(`/agency/${slug}/dashboard/clients`);

  const { data: users } = await supabase
    .from("tenant_users")
    .select("id, email, name, role, is_active, created_at")
    .eq("tenant_id", id)
    .order("created_at", { ascending: true });

  const { count: reportCount } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", id)
    .eq("is_published", true);

  const activeUsers = (users || []).filter((u) => u.is_active);

  return (
    <div className="space-y-6">
      <a
        href={`/agency/${slug}/dashboard/clients`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar klanten
      </a>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{tenant.name}</h1>
            <p className="text-sm text-muted">{tenant.slug}.dashportal.app</p>
          </div>
        </div>
        <a
          href={`/${tenant.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open portaal
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted">Gebruikers</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeUsers.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted">Reports</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{reportCount || 0}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted">Status</span>
          </div>
          <p className="text-lg font-semibold text-foreground capitalize">
            {tenant.subscription_status || "actief"}
          </p>
        </div>
      </div>

      {/* Gebruikers tabel */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Gebruikers ({activeUsers.length})</h2>
        </div>
        {activeUsers.length === 0 ? (
          <div className="p-8 text-center text-muted">Geen gebruikers gevonden</div>
        ) : (
          <div className="divide-y divide-border">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="border border-border rounded-xl p-4">
        <h2 className="font-semibold text-foreground mb-3">Gevarenzone</h2>
        <DeleteClientButton
          agencyId={agency.id}
          agencySlug={slug}
          clientId={id}
          clientName={tenant.name}
        />
      </div>
    </div>
  );
}
