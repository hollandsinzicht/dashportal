"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Archive, RotateCcw, Ban } from "lucide-react";

interface AdminAgencyActionsProps {
  agencyId: string;
  agencyName: string;
  isActive: boolean;
  clientCount: number;
}

export function AdminAgencyActions({ agencyId, agencyName, isActive, clientCount }: AdminAgencyActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/agencies/${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading("");
      setConfirmAction(null);
    }
  }

  if (confirmAction) {
    const labels: Record<string, string> = {
      archive: `${agencyName} en alle ${clientCount} klant(en) archiveren? Alle portalen en gebruikers worden gedeactiveerd.`,
      suspend: `${agencyName} en alle ${clientCount} klant(en) opschorten? Alle portalen worden geblokkeerd.`,
      activate: `${agencyName} en alle ${clientCount} klant(en) heractiveren?`,
    };

    return (
      <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-3">
        <p className="text-sm text-text-primary">{labels[confirmAction]}</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={confirmAction === "activate" ? "primary" : "danger"}
            loading={loading === confirmAction}
            onClick={() => handleAction(confirmAction)}
          >
            Bevestig
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)} disabled={!!loading}>
            Annuleer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isActive && (
        <Button size="sm" variant="secondary" onClick={() => setConfirmAction("suspend")}>
          <Ban className="w-3.5 h-3.5" />
          Opschorten
        </Button>
      )}
      {isActive && (
        <Button size="sm" variant="danger" onClick={() => setConfirmAction("archive")}>
          <Archive className="w-3.5 h-3.5" />
          Archiveren
        </Button>
      )}
      {!isActive && (
        <Button size="sm" variant="primary" onClick={() => setConfirmAction("activate")}>
          <RotateCcw className="w-3.5 h-3.5" />
          Heractiveren
        </Button>
      )}
    </div>
  );
}
