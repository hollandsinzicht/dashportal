"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import * as Checkbox from "@radix-ui/react-checkbox";
import {
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  Shield,
  ShieldOff,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Users,
  UserCheck,
  Lock,
  Globe,
  Info,
  Loader2,
} from "lucide-react";
import { ThumbnailUpload } from "@/components/dashboard/ThumbnailUpload";

// ─── Types ───
interface Report {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  access_type: string;
  rls_type: string;
  rls_role_field: string | null;
  is_published: boolean;
  pbi_report_id: string;
  pbi_workspace_id: string;
  pbi_dataset_id: string | null;
  thumbnail_url: string | null;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RlsRole {
  id: string;
  user_id: string;
  role_name: string;
  role_value: string;
}

interface ReportConfigFormProps {
  report: Report;
  users: TenantUser[];
  rlsRoles: RlsRole[];
  reportAccessUserIds: string[];
  tenantId: string;
}

export function ReportConfigForm({
  report,
  users,
  rlsRoles,
  reportAccessUserIds,
  tenantId,
}: ReportConfigFormProps) {
  const router = useRouter();

  // ─── Rapport instellingen state ───
  const [category, setCategory] = useState(report.category || "");
  const [isPublished, setIsPublished] = useState(report.is_published);
  const [accessType, setAccessType] = useState(report.access_type || "all_users");
  const [rlsType, setRlsType] = useState(report.rls_type || "none");
  const [rlsRoleField, setRlsRoleField] = useState(
    report.rls_role_field || ""
  );

  // ─── Toegangsbeheer: geselecteerde gebruikers ───
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    () => new Set(reportAccessUserIds)
  );
  const [savingAccess, setSavingAccess] = useState(false);

  // ─── RLS waarden per gebruiker ───
  const [roleValues, setRoleValues] = useState<
    Record<string, { roleName: string; roleValue: string }>
  >(() => {
    const initial: Record<string, { roleName: string; roleValue: string }> = {};
    for (const role of rlsRoles) {
      initial[role.user_id] = {
        roleName: role.role_name,
        roleValue: role.role_value,
      };
    }
    return initial;
  });

  // ─── Thumbnail state ───
  const [thumbnailUrl, setThumbnailUrl] = useState(report.thumbnail_url || "");

  // ─── UI state ───
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [showRlsWarning, setShowRlsWarning] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ─── Rapport instellingen opslaan ───
  async function handleSaveSettings() {
    setSavingSettings(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          category: category || null,
          is_published: isPublished,
          access_type: accessType,
          rls_type: rlsType,
          rls_role_field: rlsType === "row" ? rlsRoleField || null : null,
          thumbnail_url: thumbnailUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Opslaan mislukt");
      }

      setFeedback({ type: "success", message: "Instellingen opgeslagen!" });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Opslaan mislukt",
      });
    } finally {
      setSavingSettings(false);
    }
  }

  // ─── Toegang opslaan (batch grant/revoke) ───
  async function handleSaveAccess() {
    setSavingAccess(true);
    setFeedback(null);

    try {
      const currentIds = new Set(reportAccessUserIds);
      const promises: Promise<Response>[] = [];

      // Grant: nieuwe selecties die nog geen toegang hebben
      for (const userId of selectedUserIds) {
        if (!currentIds.has(userId)) {
          promises.push(
            fetch("/api/report-access", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reportId: report.id,
                userId,
                tenantId,
                action: "grant",
              }),
            })
          );
        }
      }

      // Revoke: huidige toegang die niet meer geselecteerd is
      for (const userId of currentIds) {
        if (!selectedUserIds.has(userId)) {
          promises.push(
            fetch("/api/report-access", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reportId: report.id,
                userId,
                tenantId,
                action: "revoke",
              }),
            })
          );
        }
      }

      if (promises.length === 0) {
        setFeedback({ type: "success", message: "Geen wijzigingen." });
        setSavingAccess(false);
        return;
      }

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`${failed.length} van ${results.length} acties mislukt`);
      }

      setFeedback({
        type: "success",
        message: `Toegang bijgewerkt voor ${promises.length} gebruiker(s)!`,
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Opslaan mislukt",
      });
    } finally {
      setSavingAccess(false);
    }
  }

  // ─── Toggle gebruiker selectie ───
  function toggleUserAccess(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  // ─── Toggle alles aan/uit ───
  function toggleAllUsers() {
    const viewerUsers = users.filter((u) => u.role !== "admin");
    const allSelected = viewerUsers.every((u) => selectedUserIds.has(u.id));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      for (const u of viewerUsers) {
        if (allSelected) {
          next.delete(u.id);
        } else {
          next.add(u.id);
        }
      }
      return next;
    });
  }

  // ─── RLS waarden opslaan (batch) ───
  async function handleSaveRlsRoles() {
    setSavingRoles(true);
    setFeedback(null);

    try {
      const roleName = rlsRoleField || "default";
      const promises: Promise<Response>[] = [];

      for (const user of users) {
        const entry = roleValues[user.id];
        if (entry && entry.roleValue.trim()) {
          promises.push(
            fetch("/api/rls-roles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reportId: report.id,
                userId: user.id,
                tenantId,
                roleName,
                roleValue: entry.roleValue.trim(),
              }),
            })
          );
        } else {
          const existingRole = rlsRoles.find((r) => r.user_id === user.id);
          if (existingRole) {
            promises.push(
              fetch("/api/rls-roles", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  reportId: report.id,
                  userId: user.id,
                  tenantId,
                }),
              })
            );
          }
        }
      }

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`${failed.length} van ${results.length} acties mislukt`);
      }

      setFeedback({
        type: "success",
        message: `RLS-waarden opgeslagen voor ${results.length} gebruiker(s)!`,
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Opslaan mislukt",
      });
    } finally {
      setSavingRoles(false);
    }
  }

  // ─── RLS waarde verwijderen ───
  async function handleRemoveRlsRole(userId: string) {
    const existingRole = rlsRoles.find((r) => r.user_id === userId);
    if (!existingRole) {
      setRoleValues((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      return;
    }

    try {
      const res = await fetch("/api/rls-roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          userId,
          tenantId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verwijderen mislukt");
      }

      setRoleValues((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setFeedback({ type: "success", message: "RLS-waarde verwijderd" });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Verwijderen mislukt",
      });
    }
  }

  const viewerUsers = users.filter((u) => u.role !== "admin");

  // ─── Render ───
  return (
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-danger/10 text-danger border border-danger/20"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {feedback.message}
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto p-0.5 hover:opacity-70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {/* ─── Sectie A: Rapport instellingen ─── */}
        <Card>
          <CardTitle>Rapport instellingen</CardTitle>
          <CardDescription>
            Pas de weergave en beveiliging van dit rapport aan.
          </CardDescription>

          <div className="mt-6 space-y-5">
            {/* Titel (readonly) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Titel
              </label>
              <p className="h-10 px-3 flex items-center rounded-lg border border-border bg-surface-secondary/30 text-sm text-text-primary">
                {report.title}
              </p>
              <p className="text-xs text-text-secondary">
                Titel wordt gesynchroniseerd vanuit Power BI.
              </p>
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Thumbnail
              </label>
              <ThumbnailUpload
                entityId={report.id}
                entityType="report"
                tenantId={tenantId}
                currentUrl={thumbnailUrl || null}
                onUploaded={(url) => setThumbnailUrl(url)}
                onRemoved={() => setThumbnailUrl("")}
              />
              <p className="text-xs text-text-secondary">
                Optioneel. Wordt getoond als afbeelding bij het rapport in het
                portaal.
              </p>
            </div>

            {/* Categorie */}
            <Input
              id="category"
              label="Categorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Bijv. Financieel, Marketing, HR"
              hint="Optioneel. Wordt getoond als label in het portaal."
            />

            {/* Publicatiestatus */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublished(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    isPublished
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Gepubliceerd
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublished(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    !isPublished
                      ? "border-warning/30 bg-warning/10 text-warning"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                  Concept
                </button>
              </div>
            </div>

            {/* ─── Toegangsbeheer ─── */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                Toegang
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setAccessType("all_users")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    accessType === "all_users"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Alle gebruikers
                </button>
                <button
                  type="button"
                  onClick={() => setAccessType("specific_users")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    accessType === "specific_users"
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Specifieke gebruikers
                </button>
                <button
                  type="button"
                  onClick={() => setAccessType("admin_only")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    accessType === "admin_only"
                      ? "border-danger/30 bg-danger/10 text-danger"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Alleen admins
                </button>
              </div>

              {/* Info per type */}
              {accessType === "all_users" && (
                <p className="text-xs text-text-secondary">
                  Alle gebruikers met workspace-toegang kunnen dit rapport zien.
                </p>
              )}
              {accessType === "specific_users" && (
                <p className="text-xs text-text-secondary">
                  Alleen de hieronder geselecteerde gebruikers (en admins) hebben
                  toegang. Sla eerst de instellingen op en beheer daarna de
                  toegang in de sectie hieronder.
                </p>
              )}
              {accessType === "admin_only" && (
                <p className="text-xs text-text-secondary">
                  Alleen admins kunnen dit rapport bekijken. Viewers zien het
                  niet in het portaal.
                </p>
              )}
            </div>

            {/* RLS toggle */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                Row-Level Security (RLS)
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (rlsType === "row") {
                      setShowRlsWarning(true);
                    } else {
                      setRlsType("none");
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    rlsType === "none"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <ShieldOff className="w-4 h-4" />
                  Uit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRlsType("row");
                    setShowRlsWarning(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    rlsType === "row"
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Aan
                </button>
              </div>

              {/* RLS uitschakelen waarschuwing */}
              {showRlsWarning && (
                <div className="p-4 bg-danger/5 border border-danger/30 rounded-lg">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-danger text-sm mb-1">
                        Beveiligingswaarschuwing
                      </p>
                      <p className="text-text-secondary text-xs mb-3">
                        Als Row-Level Security in Power BI is ingeschakeld maar
                        hier wordt uitgeschakeld, zien alle gebruikers de
                        volledige dataset zonder filters. Dit kan leiden tot
                        ongeautoriseerde toegang tot gevoelige gegevens.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRlsType("none");
                            setShowRlsWarning(false);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-danger text-white hover:bg-danger/90 transition-colors"
                        >
                          Ja, RLS uitschakelen
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRlsWarning(false)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-secondary hover:bg-surface-secondary transition-colors"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RLS info */}
              {rlsType === "row" && (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <div className="flex gap-2 text-sm text-accent">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">
                        RLS is actief voor dit rapport
                      </p>
                      <p className="text-text-secondary text-xs">
                        Zorg dat de rolnaam hieronder exact overeenkomt met de
                        RLS-rolnaam die is geconfigureerd in Power BI Desktop.
                        De filterwaarde per gebruiker bepaalt welke data
                        zichtbaar is.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RLS rolnaam (alleen als RLS aan staat) */}
            {rlsType === "row" && (
              <Input
                id="rlsRoleField"
                label="RLS-rolnaam"
                value={rlsRoleField}
                onChange={(e) => setRlsRoleField(e.target.value)}
                placeholder="Bijv. RegioFilter, KlantRol"
                hint="Moet exact overeenkomen met de rolnaam in Power BI Desktop."
              />
            )}

            {/* PBI info */}
            <div className="p-4 border border-border rounded-lg bg-surface-secondary/30">
              <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider font-medium">
                Power BI referenties
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary">Report ID: </span>
                  <span className="font-mono text-text-primary">
                    {report.pbi_report_id}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Workspace ID: </span>
                  <span className="font-mono text-text-primary">
                    {report.pbi_workspace_id}
                  </span>
                </div>
                {report.pbi_dataset_id && (
                  <div>
                    <span className="text-text-secondary">Dataset ID: </span>
                    <span className="font-mono text-text-primary">
                      {report.pbi_dataset_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleSaveSettings} loading={savingSettings}>
              <Save className="w-4 h-4" />
              Instellingen opslaan
            </Button>
          </div>
        </Card>

        {/* ─── Sectie B: Gebruikerstoegang (alleen bij specific_users) ─── */}
        {accessType === "specific_users" && (
          <Card>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-accent" />
              <CardTitle>Rapporttoegang per gebruiker</CardTitle>
            </div>
            <CardDescription>
              Selecteer welke gebruikers toegang hebben tot dit rapport. Admins
              hebben altijd toegang.
            </CardDescription>

            <div className="mt-6">
              {viewerUsers.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">
                  Nog geen viewers. Nodig eerst gebruikers uit.
                </p>
              ) : (
                <>
                  <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 w-10">
                            <Checkbox.Root
                              checked={
                                viewerUsers.every((u) =>
                                  selectedUserIds.has(u.id)
                                )
                                  ? true
                                  : viewerUsers.some((u) =>
                                      selectedUserIds.has(u.id)
                                    )
                                  ? "indeterminate"
                                  : false
                              }
                              onCheckedChange={toggleAllUsers}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                viewerUsers.every((u) =>
                                  selectedUserIds.has(u.id)
                                )
                                  ? "bg-primary border-primary"
                                  : viewerUsers.some((u) =>
                                      selectedUserIds.has(u.id)
                                    )
                                  ? "bg-primary/30 border-primary"
                                  : "bg-surface border-border hover:border-primary/50"
                              }`}
                            >
                              <Checkbox.Indicator>
                                <Check className="w-3.5 h-3.5 text-white" />
                              </Checkbox.Indicator>
                            </Checkbox.Root>
                          </th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                            Gebruiker
                          </th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                            E-mail
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewerUsers.map((user) => {
                          const isSelected = selectedUserIds.has(user.id);

                          return (
                            <tr
                              key={user.id}
                              className="border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors cursor-pointer"
                              onClick={() => toggleUserAccess(user.id)}
                            >
                              <td className="px-4 py-3">
                                <Checkbox.Root
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleUserAccess(user.id)
                                  }
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "bg-surface border-border hover:border-primary/50"
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox.Indicator>
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </Checkbox.Indicator>
                                </Checkbox.Root>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-text-primary">
                                  {user.name || user.email}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-text-secondary">
                                  {user.email}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Admin info */}
                  {users.filter((u) => u.role === "admin").length > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-text-secondary">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Admins ({users.filter((u) => u.role === "admin").map((u) => u.name || u.email).join(", ")}) hebben altijd toegang en worden niet in de lijst getoond.
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-text-secondary">
                      {selectedUserIds.size} van {viewerUsers.length}{" "}
                      viewer(s) geselecteerd
                    </p>
                    <Button
                      onClick={handleSaveAccess}
                      loading={savingAccess}
                      variant="secondary"
                    >
                      {savingAccess ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Toegang opslaan
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* ─── Sectie C: RLS waarden per gebruiker ─── */}
        {rlsType === "row" && (
          <Card>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <CardTitle>RLS-waarden per gebruiker</CardTitle>
            </div>
            <CardDescription>
              Wijs per gebruiker een filterwaarde toe. Deze waarde wordt als
              USERNAME() naar Power BI gestuurd.
            </CardDescription>

            <div className="mt-6">
              {users.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">
                  Nog geen gebruikers. Nodig eerst gebruikers uit.
                </p>
              ) : (
                <>
                  <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                            Gebruiker
                          </th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                            E-mail
                          </th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                            Filterwaarde
                          </th>
                          <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 w-12" />
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => {
                          const entry = roleValues[user.id];
                          const hasValue = entry && entry.roleValue.trim();

                          return (
                            <tr
                              key={user.id}
                              className="border-b border-border last:border-0"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text-primary">
                                    {user.name}
                                  </span>
                                  <Badge
                                    variant={
                                      user.role === "admin"
                                        ? "accent"
                                        : "default"
                                    }
                                  >
                                    {user.role}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-text-secondary">
                                  {user.email}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={entry?.roleValue || ""}
                                  onChange={(e) =>
                                    setRoleValues((prev) => ({
                                      ...prev,
                                      [user.id]: {
                                        roleName:
                                          rlsRoleField || "default",
                                        roleValue: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Bijv. Noord, Amsterdam, 12345"
                                  className="w-full h-8 px-2.5 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                />
                              </td>
                              <td className="px-4 py-3">
                                {hasValue && (
                                  <button
                                    onClick={() =>
                                      handleRemoveRlsRole(user.id)
                                    }
                                    className="p-1.5 rounded-md text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                                    title="RLS-waarde verwijderen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-text-secondary">
                      {Object.values(roleValues).filter(
                        (v) => v.roleValue.trim()
                      ).length}{" "}
                      van {users.length} gebruiker(s) hebben een filterwaarde
                    </p>
                    <Button
                      onClick={handleSaveRlsRoles}
                      loading={savingRoles}
                      variant="secondary"
                    >
                      <Save className="w-4 h-4" />
                      RLS-waarden opslaan
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
