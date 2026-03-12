"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface WorkspaceHealth {
  failedRefreshCount: number;
  staleDatasetCount: number;
  failedDatasetNames: string[];
  staleDatasetNames: string[];
}

interface EnrichedWorkspace {
  id: string;
  pbi_workspace_id: string;
  name: string;
  state: string | null;
  report_count: number;
  dataset_count: number;
  synced_at: string;
  health: WorkspaceHealth;
}

interface MetaWorkspaceTableProps {
  workspaces: EnrichedWorkspace[];
}

export function MetaWorkspaceTable({ workspaces }: MetaWorkspaceTableProps) {
  if (workspaces.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-text-secondary text-sm">
          Geen werkruimtes gevonden. Klik op &quot;Ververs metadata&quot; om te
          synchroniseren.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-border bg-surface-secondary/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Werkruimte
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Rapporten
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Datasets
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Gezondheid
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Gesynchroniseerd
            </th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {workspaces.map((ws) => (
            <tr
              key={ws.id}
              className="hover:bg-surface-secondary/30 transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/meta/${ws.pbi_workspace_id}`}
                  className="font-medium text-text-primary hover:text-primary transition-colors"
                >
                  {ws.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge
                  variant={ws.state === "Active" ? "success" : "warning"}
                >
                  {ws.state || "Onbekend"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-center text-sm text-text-primary font-medium">
                {ws.report_count}
              </td>
              <td className="px-4 py-3 text-center text-sm text-text-primary font-medium">
                {ws.dataset_count}
              </td>
              <td className="px-4 py-3">
                <HealthIndicator health={ws.health} />
              </td>
              <td className="px-4 py-3 text-right text-xs text-text-secondary whitespace-nowrap">
                {formatSyncTime(ws.synced_at)}
              </td>
              <td className="px-2 py-3">
                <Link href={`/dashboard/meta/${ws.pbi_workspace_id}`}>
                  <ChevronRight className="w-4 h-4 text-text-secondary/40" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Gezondheids-indicator per workspace.
 */
function HealthIndicator({ health }: { health: WorkspaceHealth }) {
  const { failedRefreshCount, staleDatasetCount, failedDatasetNames, staleDatasetNames } = health;

  if (failedRefreshCount === 0 && staleDatasetCount === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Gezond
      </span>
    );
  }

  return (
    <div className="space-y-1">
      {failedRefreshCount > 0 && (
        <div className="inline-flex items-center gap-1.5 text-xs text-danger" title={failedDatasetNames.join(", ")}>
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{failedRefreshCount} gefaalde refresh{failedRefreshCount !== 1 ? "es" : ""}</span>
        </div>
      )}
      {staleDatasetCount > 0 && (
        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)]" title={staleDatasetNames.join(", ")}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{staleDatasetCount} verouderd{staleDatasetCount !== 1 ? "e" : ""} dataset{staleDatasetCount !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Formatteer sync-tijdstip.
 */
function formatSyncTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diff = now - date.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return "Zojuist";
  if (hours < 24) return `${hours} uur geleden`;

  return date.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
