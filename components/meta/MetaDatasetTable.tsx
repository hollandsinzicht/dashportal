"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Database } from "lucide-react";
import { RefreshStatusBadge } from "./RefreshStatusBadge";
import { MetaRefreshHistory } from "./MetaRefreshHistory";

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

interface MetaDatasetTableProps {
  datasets: MetaDataset[];
  refreshHistory: RefreshEntry[];
}

export function MetaDatasetTable({
  datasets,
  refreshHistory,
}: MetaDatasetTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (datasets.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <Database className="w-8 h-8 text-text-secondary/20 mx-auto mb-2" />
        <p className="text-text-secondary text-sm">Geen datasets gevonden.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface-secondary/50">
            <th className="w-8"></th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Dataset
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Eigenaar
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Verversbaar
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Laatste vernieuwing
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Bronnen
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {datasets.map((ds) => {
            const isExpanded = expandedId === ds.pbi_dataset_id;
            const dsHistory = refreshHistory.filter(
              (rh) => rh.pbi_dataset_id === ds.pbi_dataset_id
            );

            return (
              <Fragment key={ds.id}>
                <tr
                  className="hover:bg-surface-secondary/30 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : ds.pbi_dataset_id)
                  }
                >
                  <td className="pl-3 py-3">
                    {dsHistory.length > 0 ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-secondary" />
                      )
                    ) : (
                      <span className="w-4 h-4 block" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm text-text-primary">
                      {ds.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {ds.configured_by || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-text-secondary">
                    {ds.is_refreshable ? "Ja" : "Nee"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RefreshStatusBadge status={ds.last_refresh_status} />
                      {ds.last_refresh_at && (
                        <span className="text-xs text-text-secondary">
                          {new Date(ds.last_refresh_at).toLocaleString(
                            "nl-NL",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-text-secondary">
                    {ds.datasource_count}
                  </td>
                </tr>

                {isExpanded && dsHistory.length > 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-3 bg-surface-secondary/20">
                      <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                        Vernieuwingsgeschiedenis
                      </p>
                      <MetaRefreshHistory entries={dsHistory} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
