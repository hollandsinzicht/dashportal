import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SyncReportsButton } from "@/components/dashboard/SyncReportsButton";
import {
  FileBarChart,
  Eye,
  EyeOff,
  ChevronRight,
  Settings2,
} from "lucide-react";

export default async function ReportsPage() {
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

  if (!tenantUser) redirect("/");

  // ─── Reports ophalen met workspace naam ───
  const serviceClient = await createServiceClient();
  const { data: reports } = await serviceClient
    .from("reports")
    .select("id, title, rls_type, is_published, pbi_report_id, pbi_workspace_id, workspace_id, workspaces(name)")
    .eq("tenant_id", tenantUser.tenant_id)
    .order("sort_order", { ascending: true });

  const reportList = (reports || []).map((r) => ({
    ...r,
    workspace_name:
      (r.workspaces as unknown as { name: string } | null)?.name || null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
            Rapporten
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Beheer de rapporten in je portaal.
          </p>
        </div>
        <SyncReportsButton tenantId={tenantUser.tenant_id} />
      </div>

      {reportList.length === 0 ? (
        <Card className="text-center py-16">
          <FileBarChart className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
            Nog geen rapporten
          </h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
            Klik op &ldquo;Synchroniseer met Power BI&rdquo; om je rapporten op
            te halen uit je gekoppelde workspaces.
          </p>
          <SyncReportsButton tenantId={tenantUser.tenant_id} />
        </Card>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Rapport
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Workspace
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  RLS
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {reportList.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-border last:border-0 hover:bg-surface-secondary/50 group"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="text-sm font-medium text-text-primary hover:text-primary transition-colors"
                    >
                      {report.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-text-secondary">
                      {report.workspace_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge
                      variant={
                        report.rls_type === "row" ? "accent" : "default"
                      }
                    >
                      {report.rls_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {report.is_published ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-success">
                        <Eye className="w-3.5 h-3.5" /> Gepubliceerd
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                        <EyeOff className="w-3.5 h-3.5" /> Concept
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      title="Configureer rapport"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
