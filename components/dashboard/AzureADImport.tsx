"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Users,
  FolderTree,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
} from "lucide-react";

// ─── Types ───

interface AzureUser {
  id: string;
  displayName: string;
  email: string;
  mail: string | null;
  userPrincipalName: string;
  department: string | null;
  jobTitle: string | null;
  accountEnabled: boolean;
  status: "new" | "existing";
  tenantRole: string | null;
  isLinked: boolean;
}

interface AzureGroup {
  id: string;
  displayName: string;
  description: string | null;
}

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  message: string;
}

interface AzureADImportProps {
  tenantId: string;
}

type ViewMode = "users" | "groups";

export function AzureADImport({ tenantId }: AzureADImportProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("users");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AzureUser[]>([]);
  const [groups, setGroups] = useState<AzureGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<AzureGroup | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [bulkRole, setBulkRole] = useState<"viewer" | "admin">("viewer");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  // ─── Zoeken ───

  const handleSearch = useCallback(
    async (searchTerm?: string) => {
      setLoading(true);
      setError("");

      try {
        const q = searchTerm ?? search;
        const params = new URLSearchParams();

        if (viewMode === "groups" && !selectedGroup) {
          params.set("mode", "groups");
          if (q) params.set("search", q);
        } else if (selectedGroup) {
          params.set("mode", "group-members");
          params.set("groupId", selectedGroup.id);
        } else {
          params.set("mode", "users");
          if (q) params.set("search", q);
        }

        const res = await fetch(`/api/users/azure-import?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Fout bij ophalen gegevens.");
          return;
        }

        if (data.groups) {
          setGroups(data.groups);
        }

        if (data.users) {
          setUsers(data.users);
        }
      } catch {
        setError("Kon geen verbinding maken met Azure AD.");
      } finally {
        setLoading(false);
      }
    },
    [search, viewMode, selectedGroup]
  );

  // ─── Selectie ───

  function toggleUser(userId: string) {
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

  function toggleAll() {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  }

  // ─── Import ───

  async function handleImport() {
    if (selectedUserIds.size === 0) return;

    setImporting(true);
    setError("");
    setImportResult(null);

    try {
      const selectedUsers = users.filter((u) => selectedUserIds.has(u.id));

      const payload = {
        users: selectedUsers.map((u) => ({
          azureOid: u.id,
          email: u.email || u.userPrincipalName,
          name: u.displayName,
          department: u.department,
          role: bulkRole,
        })),
      };

      const res = await fetch("/api/users/azure-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fout bij importeren.");
        return;
      }

      setImportResult(data);
      setSelectedUserIds(new Set());

      // Ververs de lijst om status bij te werken
      await handleSearch();
    } catch {
      setError("Er ging iets mis bij het importeren.");
    } finally {
      setImporting(false);
    }
  }

  // ─── Groep selectie ───

  function handleGroupSelect(group: AzureGroup) {
    setSelectedGroup(group);
    setUsers([]);
    setSelectedUserIds(new Set());
    // Auto-load groep leden
    setTimeout(() => {
      handleSearch();
    }, 0);
  }

  function handleBackToGroups() {
    setSelectedGroup(null);
    setUsers([]);
    setSelectedUserIds(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Modus toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setViewMode("users");
            setSelectedGroup(null);
            setUsers([]);
            setGroups([]);
            setSelectedUserIds(new Set());
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "users"
              ? "bg-primary text-white"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          <Users className="w-4 h-4" />
          Alle gebruikers
        </button>
        <button
          onClick={() => {
            setViewMode("groups");
            setSelectedGroup(null);
            setUsers([]);
            setGroups([]);
            setSelectedUserIds(new Set());
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "groups"
              ? "bg-primary text-white"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Selecteer groep
        </button>
      </div>

      {/* Zoekbalk */}
      {(!selectedGroup || viewMode === "users") && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="azure-search"
              placeholder={
                viewMode === "users"
                  ? "Zoek op naam of e-mail..."
                  : "Zoek op groepsnaam..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
          <Button onClick={() => handleSearch()} loading={loading}>
            <Search className="w-4 h-4" />
            Zoeken
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Import resultaat */}
      {importResult && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Import voltooid
            </p>
            <p className="text-sm text-text-secondary">{importResult.message}</p>
          </div>
        </div>
      )}

      {/* Groepen lijst */}
      {viewMode === "groups" && !selectedGroup && groups.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-surface-secondary border-b border-border">
            <p className="text-sm font-medium text-text-primary">
              Azure AD groepen ({groups.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-secondary transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {group.displayName}
                  </p>
                  {group.description && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      {group.description}
                    </p>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-text-secondary -rotate-90" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geselecteerde groep header */}
      {selectedGroup && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToGroups}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Groepen
          </button>
          <span className="text-border">/</span>
          <span className="text-sm font-medium text-text-primary">
            {selectedGroup.displayName}
          </span>
        </div>
      )}

      {/* Gebruikers tabel */}
      {users.length > 0 && (
        <>
          {/* Bulk acties */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    selectedUserIds.size === users.length && users.length > 0
                  }
                  onChange={toggleAll}
                  className="rounded border-border"
                />
                <span className="text-sm text-text-secondary">
                  {selectedUserIds.size > 0
                    ? `${selectedUserIds.size} geselecteerd`
                    : "Alles selecteren"}
                </span>
              </label>
            </div>

            {selectedUserIds.size > 0 && (
              <div className="flex items-center gap-3">
                <select
                  value={bulkRole}
                  onChange={(e) =>
                    setBulkRole(e.target.value as "viewer" | "admin")
                  }
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-surface text-text-primary"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  onClick={handleImport}
                  loading={importing}
                  variant="primary"
                >
                  <Download className="w-4 h-4" />
                  Importeer {selectedUserIds.size} gebruiker
                  {selectedUserIds.size !== 1 ? "s" : ""}
                </Button>
              </div>
            )}
          </div>

          {/* Tabel */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary border-b border-border">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    Naam
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden md:table-cell">
                    Afdeling
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`${
                      selectedUserIds.has(user.id)
                        ? "bg-primary/5"
                        : "hover:bg-surface-secondary"
                    } transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">
                        {user.displayName}
                      </p>
                      {user.jobTitle && (
                        <p className="text-xs text-text-secondary">
                          {user.jobTitle}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.email || user.userPrincipalName}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {user.department || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {user.status === "existing" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {user.isLinked ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Gekoppeld
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Niet gekoppeld
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                          Nieuw
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Lege staat */}
      {!loading && users.length === 0 && groups.length === 0 && !error && (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <Users className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
            {viewMode === "users"
              ? "Zoek Azure AD gebruikers"
              : "Zoek een Azure AD groep"}
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            {viewMode === "users"
              ? "Gebruik de zoekbalk om gebruikers te vinden in je Azure Active Directory. Je kunt zoeken op naam of e-mailadres."
              : "Zoek op groepsnaam en selecteer een groep om de leden te bekijken en importeren."}
          </p>
        </div>
      )}
    </div>
  );
}
