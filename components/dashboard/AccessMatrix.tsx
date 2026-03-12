"use client";

import { useState, useCallback } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, Lock, Users, FolderOpen, Loader2 } from "lucide-react";

interface AccessUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AccessWorkspace {
  id: string;
  name: string;
  thumbnail_url: string | null;
}

interface AccessMatrixProps {
  users: AccessUser[];
  workspaces: AccessWorkspace[];
  accessRecords: { workspace_id: string; user_id: string }[];
  tenantId: string;
}

export function AccessMatrix({
  users,
  workspaces,
  accessRecords,
  tenantId,
}: AccessMatrixProps) {
  // ─── Access map: Set van "userId:workspaceId" strings ───
  const [accessMap, setAccessMap] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const record of accessRecords) {
      set.add(`${record.user_id}:${record.workspace_id}`);
    }
    return set;
  });

  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

  const hasAccess = useCallback(
    (userId: string, workspaceId: string) =>
      accessMap.has(`${userId}:${workspaceId}`),
    [accessMap]
  );

  const isLoading = useCallback(
    (userId: string, workspaceId: string) =>
      loadingCells.has(`${userId}:${workspaceId}`),
    [loadingCells]
  );

  async function toggleAccess(userId: string, workspaceId: string) {
    const key = `${userId}:${workspaceId}`;
    const currentlyHasAccess = accessMap.has(key);
    const action = currentlyHasAccess ? "revoke" : "grant";

    // Optimistic update
    setAccessMap((prev) => {
      const next = new Set(prev);
      if (currentlyHasAccess) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    setLoadingCells((prev) => new Set(prev).add(key));

    try {
      const res = await fetch("/api/workspace-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, userId, tenantId, action }),
      });

      if (!res.ok) {
        // Rollback
        setAccessMap((prev) => {
          const next = new Set(prev);
          if (currentlyHasAccess) {
            next.add(key);
          } else {
            next.delete(key);
          }
          return next;
        });
        const data = await res.json();
        console.error("[access-matrix] API fout:", data.error);
      }
    } catch (err) {
      // Rollback
      setAccessMap((prev) => {
        const next = new Set(prev);
        if (currentlyHasAccess) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      console.error("[access-matrix] Network fout:", err);
    } finally {
      setLoadingCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  // ─── Selecteer alles per gebruiker ───
  async function toggleAllForUser(userId: string) {
    const allGranted = workspaces.every((ws) => hasAccess(userId, ws.id));
    const action = allGranted ? "revoke" : "grant";

    // Optimistic update
    setAccessMap((prev) => {
      const next = new Set(prev);
      for (const ws of workspaces) {
        const key = `${userId}:${ws.id}`;
        if (action === "grant") {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      return next;
    });

    // Fire API calls
    await Promise.allSettled(
      workspaces.map((ws) =>
        fetch("/api/workspace-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: ws.id,
            userId,
            tenantId,
            action,
          }),
        })
      )
    );
  }

  // ─── Lege states ───
  if (users.length === 0 || workspaces.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border text-center py-16">
        <Lock className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
        <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
          Toegangsmatrix
        </h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          {users.length === 0 && workspaces.length === 0
            ? "Synchroniseer eerst je workspaces en voeg gebruikers toe om toegang te kunnen beheren."
            : users.length === 0
            ? "Voeg eerst gebruikers toe om toegang te kunnen beheren."
            : "Synchroniseer eerst je Power BI workspaces."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Stats */}
      <div className="px-4 py-3 border-b border-border bg-surface-secondary/30 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users className="w-4 h-4" />
          <span>
            <strong className="text-text-primary">{users.length}</strong>{" "}
            gebruiker{users.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <FolderOpen className="w-4 h-4" />
          <span>
            <strong className="text-text-primary">{workspaces.length}</strong>{" "}
            workspace{workspaces.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Check className="w-4 h-4" />
          <span>
            <strong className="text-text-primary">{accessMap.size}</strong>{" "}
            koppelingen
          </span>
        </div>
      </div>

      {/* Matrix tabel */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3 sticky left-0 bg-surface z-10 min-w-[200px]">
                Gebruiker
              </th>
              {workspaces.map((ws) => (
                <th
                  key={ws.id}
                  className="text-center text-xs font-medium text-text-secondary px-3 py-3 min-w-[100px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    {ws.thumbnail_url ? (
                      <img
                        src={ws.thumbnail_url}
                        alt={ws.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-text-secondary/40" />
                    )}
                    <div className="truncate max-w-[120px]" title={ws.name}>
                      {ws.name}
                    </div>
                  </div>
                </th>
              ))}
              <th className="text-center text-xs font-medium text-text-secondary uppercase tracking-wider px-3 py-3 min-w-[80px]">
                Alles
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const allGranted = workspaces.every((ws) =>
                hasAccess(user.id, ws.id)
              );
              const someGranted = workspaces.some((ws) =>
                hasAccess(user.id, ws.id)
              );

              return (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-surface-secondary/30 transition-colors"
                >
                  {/* Gebruiker info */}
                  <td className="px-4 py-3 sticky left-0 bg-surface z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-text-secondary truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Checkboxes per workspace */}
                  {workspaces.map((ws) => {
                    const checked = hasAccess(user.id, ws.id);
                    const loading = isLoading(user.id, ws.id);

                    return (
                      <td key={ws.id} className="text-center px-3 py-3">
                        {loading ? (
                          <div className="flex justify-center">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          </div>
                        ) : (
                          <Checkbox.Root
                            checked={checked}
                            onCheckedChange={() =>
                              toggleAccess(user.id, ws.id)
                            }
                            className={`
                              mx-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                              ${
                                checked
                                  ? "bg-primary border-primary"
                                  : "bg-surface border-border hover:border-primary/50"
                              }
                            `}
                          >
                            <Checkbox.Indicator>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                        )}
                      </td>
                    );
                  })}

                  {/* Alles aan/uit */}
                  <td className="text-center px-3 py-3">
                    <Checkbox.Root
                      checked={allGranted ? true : someGranted ? "indeterminate" : false}
                      onCheckedChange={() => toggleAllForUser(user.id)}
                      className={`
                        mx-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${
                          allGranted
                            ? "bg-primary border-primary"
                            : someGranted
                            ? "bg-primary/30 border-primary"
                            : "bg-surface border-border hover:border-primary/50"
                        }
                      `}
                    >
                      <Checkbox.Indicator>
                        <Check className="w-3.5 h-3.5 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
