"use client";

import { AlertTriangle, Clock, XCircle } from "lucide-react";

interface MetaDataset {
  pbi_dataset_id: string;
  pbi_workspace_id: string;
  name: string;
  configured_by: string | null;
  last_refresh_status: string | null;
  last_refresh_at: string | null;
  last_refresh_error: string | null;
}

interface MetaAlertsProps {
  datasets: MetaDataset[];
  lastSyncedAt: string | null;
}

export function MetaAlerts({ datasets, lastSyncedAt }: MetaAlertsProps) {
  const now = Date.now();

  // Gefaalde refreshes
  const failedDatasets = datasets.filter(
    (d) => d.last_refresh_status === "Failed"
  );

  // Verouderde datasets (> 72 uur niet ververst)
  const staleDatasets = datasets.filter((d) => {
    if (!d.last_refresh_at) return false;
    const hoursSince =
      (now - new Date(d.last_refresh_at).getTime()) / (1000 * 60 * 60);
    return hoursSince > 72;
  });

  // Verouderde cache (> 24 uur)
  const isStale =
    lastSyncedAt &&
    now - new Date(lastSyncedAt).getTime() > 24 * 60 * 60 * 1000;

  if (failedDatasets.length === 0 && staleDatasets.length === 0 && !isStale) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Gefaalde refreshes */}
      {failedDatasets.length > 0 && (
        <div className="bg-danger/5 border border-danger/30 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger text-sm">
              {failedDatasets.length} dataset
              {failedDatasets.length !== 1 ? "s" : ""} met gefaalde vernieuwing
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {failedDatasets.slice(0, 5).map((d) => (
                <li
                  key={d.pbi_dataset_id}
                  className="text-xs text-text-secondary"
                >
                  • <span className="font-medium text-text-primary">{d.name}</span>
                  {d.last_refresh_at && (
                    <span className="ml-1 text-text-secondary/60">
                      — laatste poging{" "}
                      {new Date(d.last_refresh_at).toLocaleDateString("nl-NL")}
                    </span>
                  )}
                  {d.last_refresh_error && (
                    <span className="ml-1 text-danger/70">
                      ({d.last_refresh_error.slice(0, 80)}
                      {d.last_refresh_error.length > 80 ? "…" : ""})
                    </span>
                  )}
                </li>
              ))}
              {failedDatasets.length > 5 && (
                <li className="text-xs text-text-secondary/60">
                  + {failedDatasets.length - 5} meer
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Verouderde datasets */}
      {staleDatasets.length > 0 && (
        <div className="bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[var(--color-accent)] text-sm">
              {staleDatasets.length} dataset
              {staleDatasets.length !== 1 ? "s" : ""} al meer dan 3 dagen niet
              ververst
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {staleDatasets.slice(0, 5).map((d) => {
                const daysSince = Math.floor(
                  (now - new Date(d.last_refresh_at!).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <li
                    key={d.pbi_dataset_id}
                    className="text-xs text-text-secondary"
                  >
                    • <span className="font-medium text-text-primary">{d.name}</span>
                    <span className="ml-1 text-text-secondary/60">
                      — {daysSince} dag{daysSince !== 1 ? "en" : ""} geleden
                      ververst
                    </span>
                  </li>
                );
              })}
              {staleDatasets.length > 5 && (
                <li className="text-xs text-text-secondary/60">
                  + {staleDatasets.length - 5} meer
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Verouderde metadata cache */}
      {isStale && (
        <div className="bg-surface-secondary border border-border rounded-lg p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary text-sm">
              Verouderde metadata
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              De laatste synchronisatie is meer dan 24 uur geleden. Klik op
              &quot;Ververs metadata&quot; voor actuele gegevens.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
