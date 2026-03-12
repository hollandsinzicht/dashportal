"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

interface SyncReportsButtonProps {
  tenantId: string;
}

export function SyncReportsButton({ tenantId }: SyncReportsButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch("/api/reports/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(`Fout: ${data.error}`);
        return;
      }

      setResult(data.message || `${data.synced} rapport(en) gesynchroniseerd`);

      // Refresh the page data
      router.refresh();
    } catch {
      setResult("Er ging iets mis bij het synchroniseren.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" onClick={handleSync} loading={syncing}>
        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
        Synchroniseer met Power BI
      </Button>
      {result && (
        <span className="text-sm text-text-secondary">{result}</span>
      )}
    </div>
  );
}
