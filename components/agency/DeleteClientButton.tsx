"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

export function DeleteClientButton({
  agencyId,
  agencySlug,
  clientId,
  clientName,
}: {
  agencyId: string;
  agencySlug: string;
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/agency/clients/${clientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Verwijderen mislukt");
        setLoading(false);
        return;
      }

      router.push(`/agency/${agencySlug}/dashboard/clients`);
      router.refresh();
    } catch {
      setError("Er ging iets mis");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="danger"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Klant verwijderen
      </Button>
    );
  }

  return (
    <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-3">
      <p className="text-sm text-danger font-medium">
        Weet je zeker dat je <strong>{clientName}</strong> wilt verwijderen?
      </p>
      <p className="text-xs text-muted">
        Het portaal wordt gedeactiveerd en alle gebruikers verliezen toegang.
        Dit kan niet ongedaan worden.
      </p>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={loading}
        >
          Ja, verwijder
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setConfirming(false); setError(""); }}
          disabled={loading}
        >
          Annuleren
        </Button>
      </div>
    </div>
  );
}
