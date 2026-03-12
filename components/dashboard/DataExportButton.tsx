"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DataExportButtonProps {
  tenantId: string;
}

/**
 * Knop om alle tenant data te exporteren als JSON (GDPR data export).
 * Download het bestand automatisch.
 */
export function DataExportButton({ tenantId }: DataExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/export?tenantId=${tenantId}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Kon data niet exporteren");
        return;
      }

      // Haal filename uit Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "biportal-export.json";

      // Download als bestand
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Er ging iets mis bij het exporteren. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleExport} loading={loading} variant="secondary">
      <Download className="w-4 h-4" />
      Download data-export
    </Button>
  );
}
