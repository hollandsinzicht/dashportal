"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface MetaSyncButtonProps {
  tenantId: string;
  lastSyncedAt: string | null;
}

export function MetaSyncButton({
  tenantId,
  lastSyncedAt,
}: MetaSyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync(force: boolean = false) {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, force }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Fout: ${data.error}`);
        return;
      }

      if (data.skipped) {
        setMessage(data.message);
        return;
      }

      setMessage(
        `Gesynchroniseerd: ${data.synced.workspaces} werkruimtes, ${data.synced.reports} rapporten, ${data.synced.datasets} datasets (${data.duration})`
      );

      // Pagina herladen om nieuwe data te tonen
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage("Synchronisatie mislukt");
    } finally {
      setLoading(false);
    }
  }

  const formattedSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleSync(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Synchroniseren…" : "Ververs metadata"}
      </button>

      <div className="text-sm text-text-secondary">
        {message ? (
          <span>{message}</span>
        ) : formattedSync ? (
          <span>Laatste sync: {formattedSync}</span>
        ) : (
          <span>Nog niet gesynchroniseerd</span>
        )}
      </div>
    </div>
  );
}
