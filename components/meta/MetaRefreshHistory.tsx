"use client";

import { RefreshStatusBadge } from "./RefreshStatusBadge";

interface RefreshEntry {
  id: string;
  refresh_type: string | null;
  status: string | null;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
}

interface MetaRefreshHistoryProps {
  entries: RefreshEntry[];
}

export function MetaRefreshHistory({ entries }: MetaRefreshHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-text-secondary py-2">
        Geen vernieuwingsgeschiedenis beschikbaar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const duration =
          entry.start_time && entry.end_time
            ? Math.round(
                (new Date(entry.end_time).getTime() -
                  new Date(entry.start_time).getTime()) /
                  1000
              )
            : null;

        return (
          <div
            key={entry.id}
            className="flex items-center justify-between text-xs border border-border rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <RefreshStatusBadge status={entry.status} />
              <span className="text-text-secondary">
                {entry.refresh_type || "Onbekend"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-text-secondary">
              {duration !== null && <span>{duration}s</span>}
              {entry.start_time && (
                <span>
                  {new Date(entry.start_time).toLocaleString("nl-NL", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            {entry.error_message && entry.status === "Failed" && (
              <div className="w-full mt-1 text-xs text-danger/80 truncate">
                {entry.error_message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
