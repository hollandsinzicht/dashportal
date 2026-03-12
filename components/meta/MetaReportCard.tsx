"use client";

import { FileBarChart, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface MetaReport {
  id: string;
  pbi_report_id: string;
  name: string;
  dataset_id: string | null;
  report_type: string | null;
  web_url: string | null;
  modified_at: string | null;
}

interface MetaReportCardProps {
  report: MetaReport;
}

export function MetaReportCard({ report }: MetaReportCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileBarChart className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-sm text-text-primary truncate">
              {report.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {report.report_type && (
                <Badge variant="default">{report.report_type}</Badge>
              )}
              {report.modified_at && (
                <span className="text-xs text-text-secondary">
                  Gewijzigd:{" "}
                  {new Date(report.modified_at).toLocaleDateString("nl-NL")}
                </span>
              )}
            </div>
          </div>
        </div>

        {report.web_url && (
          <a
            href={report.web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-primary transition-colors shrink-0"
            title="Openen in Power BI"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {report.dataset_id && (
        <p className="text-xs text-text-secondary/60 mt-2 truncate">
          Dataset: {report.dataset_id}
        </p>
      )}
    </div>
  );
}
