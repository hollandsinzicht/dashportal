"use client";

import { ReportTile } from "./ReportTile";

interface Report {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
}

interface TileGridProps {
  reports: Report[];
  tenantSlug: string;
  /** Demo-modus: callback bij klik op een rapport */
  onReportClick?: (reportId: string) => void;
}

export function TileGrid({ reports, tenantSlug, onReportClick }: TileGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {reports.map((report) => (
        <ReportTile
          key={report.id}
          id={report.id}
          title={report.title}
          description={report.description}
          category={report.category}
          thumbnailUrl={report.thumbnail_url}
          tenantSlug={tenantSlug}
          onClick={onReportClick ? () => onReportClick(report.id) : undefined}
        />
      ))}
    </div>
  );
}
