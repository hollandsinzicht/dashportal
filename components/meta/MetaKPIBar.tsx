"use client";

import { FolderOpen, FileBarChart, Database, AlertTriangle } from "lucide-react";

interface MetaKPIBarProps {
  totalWorkspaces: number;
  totalReports: number;
  totalDatasets: number;
  failedRefreshes: number;
}

export function MetaKPIBar({
  totalWorkspaces,
  totalReports,
  totalDatasets,
  failedRefreshes,
}: MetaKPIBarProps) {
  const kpis = [
    {
      label: "Werkruimtes",
      value: totalWorkspaces,
      icon: FolderOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Rapporten",
      value: totalReports,
      icon: FileBarChart,
      color: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]/10",
    },
    {
      label: "Datasets",
      value: totalDatasets,
      icon: Database,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Vernieuwfouten",
      value: failedRefreshes,
      icon: AlertTriangle,
      color: failedRefreshes > 0 ? "text-danger" : "text-text-secondary",
      bg: failedRefreshes > 0 ? "bg-danger/10" : "bg-surface-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4"
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}
          >
            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
            <p className="text-xs text-text-secondary">{kpi.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
