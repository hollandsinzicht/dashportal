"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { MetaDatasetTable } from "./MetaDatasetTable";
import { RefreshStatusBadge } from "./RefreshStatusBadge";
import { FileBarChart, Database, Activity, ExternalLink } from "lucide-react";

interface EnrichedReport {
  id: string;
  pbi_report_id: string;
  name: string;
  dataset_id: string | null;
  report_type: string | null;
  web_url: string | null;
  modified_at: string | null;
  owner: string | null;
  users30d: number;
  users60d: number;
  lastRefreshStatus: string | null;
  lastRefreshAt: string | null;
}

interface MetaDataset {
  id: string;
  pbi_dataset_id: string;
  pbi_workspace_id: string;
  name: string;
  configured_by: string | null;
  is_refreshable: boolean;
  last_refresh_status: string | null;
  last_refresh_at: string | null;
  last_refresh_error: string | null;
  datasource_count: number;
}

interface RefreshEntry {
  id: string;
  pbi_dataset_id: string;
  refresh_type: string | null;
  status: string | null;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
}

interface ActivityEntry {
  action: string;
  target_id: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
}

interface MetaDetailTabsProps {
  reports: EnrichedReport[];
  datasets: MetaDataset[];
  refreshHistory: RefreshEntry[];
  recentViews: ActivityEntry[];
}

export function MetaDetailTabs({
  reports,
  datasets,
  refreshHistory,
  recentViews,
}: MetaDetailTabsProps) {
  return (
    <Tabs.Root defaultValue="reports">
      <Tabs.List className="flex border-b border-border gap-1 mb-6">
        <Tabs.Trigger
          value="reports"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
        >
          <FileBarChart className="w-4 h-4" />
          Rapporten
          <span className="text-xs text-text-secondary/60 ml-1">
            ({reports.length})
          </span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="datasets"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
        >
          <Database className="w-4 h-4" />
          Datasets
          <span className="text-xs text-text-secondary/60 ml-1">
            ({datasets.length})
          </span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="activity"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
        >
          <Activity className="w-4 h-4" />
          Activiteit
        </Tabs.Trigger>
      </Tabs.List>

      {/* Rapporten tab — tabel met eigenaar, gebruikers, refresh */}
      <Tabs.Content value="reports">
        {reports.length > 0 ? (
          <div className="bg-surface border border-border rounded-xl overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Rapport
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Eigenaar
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    Gebruikers 30d
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    Gebruikers 60d
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    Laatste vernieuwing
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-surface-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary text-sm">
                        {report.name}
                      </p>
                      {report.modified_at && (
                        <p className="text-xs text-text-secondary/60 mt-0.5">
                          Gewijzigd{" "}
                          {new Date(report.modified_at).toLocaleDateString(
                            "nl-NL"
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary truncate max-w-[160px]">
                      {report.owner || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span
                        className={
                          report.users30d > 0
                            ? "text-text-primary font-medium"
                            : "text-text-secondary/40"
                        }
                      >
                        {report.users30d}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span
                        className={
                          report.users60d > 0
                            ? "text-text-primary font-medium"
                            : "text-text-secondary/40"
                        }
                      >
                        {report.users60d}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {report.lastRefreshAt ? (
                        <div className="flex items-center gap-2">
                          <RefreshStatusBadge
                            status={report.lastRefreshStatus}
                          />
                          <span className="text-xs text-text-secondary whitespace-nowrap">
                            {formatRelativeTime(report.lastRefreshAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary/40">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {report.report_type || "—"}
                    </td>
                    <td className="px-2 py-3">
                      {report.web_url && (
                        <a
                          href={report.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary/40 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-surface border border-border rounded-xl">
            <FileBarChart className="w-8 h-8 text-text-secondary/20 mx-auto mb-2" />
            <p className="text-text-secondary text-sm">
              Geen rapporten gevonden in deze werkruimte.
            </p>
          </div>
        )}
      </Tabs.Content>

      {/* Datasets tab */}
      <Tabs.Content value="datasets">
        <MetaDatasetTable
          datasets={datasets}
          refreshHistory={refreshHistory}
        />
      </Tabs.Content>

      {/* Activiteit tab */}
      <Tabs.Content value="activity">
        {recentViews.length > 0 ? (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actie
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Details
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Tijdstip
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentViews.map((view, idx) => (
                  <tr key={idx} className="hover:bg-surface-secondary/30">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      Rapport bekeken
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {view.metadata?.reportTitle ||
                        view.target_id ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary text-right">
                      {new Date(view.created_at).toLocaleString("nl-NL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-surface border border-border rounded-xl">
            <Activity className="w-8 h-8 text-text-secondary/20 mx-auto mb-2" />
            <p className="text-text-secondary text-sm">
              Nog geen recente activiteit.
            </p>
          </div>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}

/**
 * Formatteer een ISO timestamp als relatieve tijd.
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diff = now - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min geleden`;
  if (hours < 24) return `${hours} uur geleden`;
  if (days === 1) {
    return `gisteren ${date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return date.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
