import { redirect } from "next/navigation";
import { getAgencyBySlug, getAgencyUsers } from "@/lib/agency/queries";
import { Users, Shield, Eye, Crown, Mail } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: "Eigenaar", icon: Crown, color: "text-amber-600 bg-amber-50" },
  admin: { label: "Beheerder", icon: Shield, color: "text-primary bg-primary/10" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted bg-muted/10" },
};

export default async function AgencyTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) redirect("/");

  const users = await getAgencyUsers(agency.id);
  const activeUsers = users.filter((u) => u.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Team</h1>
          <p className="text-muted mt-1">Beheer wie toegang heeft tot het agency dashboard</p>
        </div>
        <a
          href={`/agency/${slug}/dashboard/team/invite`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Teamlid uitnodigen
        </a>
      </div>

      {/* Team overzicht */}
      <div className="bg-surface border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">
            Teamleden ({activeUsers.length})
          </h2>
        </div>

        {activeUsers.length === 0 ? (
          <div className="p-8 text-center text-muted">
            Nog geen teamleden. Nodig je eerste collega uit.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeUsers.map((user) => {
              const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
              const RoleIcon = roleConfig.icon;
              return (
                <div key={user.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {user.last_login && (
                      <p className="text-xs text-muted hidden sm:block">
                        Laatst actief:{" "}
                        {new Date(user.last_login).toLocaleDateString("nl-NL")}
                      </p>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${roleConfig.color}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rollen uitleg */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3">Rollen</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Crown className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Eigenaar</p>
              <p className="text-xs text-muted">
                Volledige toegang inclusief facturatie, instellingen en teambeheer.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Beheerder</p>
              <p className="text-xs text-muted">
                Kan klanten beheren, teamleden uitnodigen en facturatie inzien.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Eye className="w-4 h-4 text-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Viewer</p>
              <p className="text-xs text-muted">
                Kan het dashboard en klantoverzicht bekijken, maar niets wijzigen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
