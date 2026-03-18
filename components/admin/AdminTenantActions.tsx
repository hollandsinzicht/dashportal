"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Archive, RotateCcw, Ban } from "lucide-react";

interface AdminTenantActionsProps {
  tenantId: string;
  tenantName: string;
  isActive: boolean;
  subscriptionStatus: string;
}

export function AdminTenantActions({ tenantId, tenantName, isActive, subscriptionStatus }: AdminTenantActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
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
    const labels: Record<string, { text: string; variant: "danger" | "primary" }> = {
      archive: { text: `${tenantName} archiveren? Alle gebruikers worden gedeactiveerd.`, variant: "danger" },
      suspend: { text: `${tenantName} opschorten? Het portaal wordt geblokkeerd.`, variant: "danger" },
      activate: { text: `${tenantName} heractiveren?`, variant: "primary" },
    };
    const label = labels[confirmAction] || { text: "Weet je het zeker?", variant: "danger" as const };

    return (
      <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-3">
        <p className="text-sm text-text-primary">{label.text}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={label.variant} loading={loading === confirmAction} onClick={() => handleAction(confirmAction)}>
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
      {isActive && subscriptionStatus !== "suspended" && (
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
