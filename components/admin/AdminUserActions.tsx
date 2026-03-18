"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Archive, RotateCcw, Trash2, ShieldCheck, User } from "lucide-react";

interface AdminUserActionsProps {
  userId: string;
  userName: string;
  email: string;
  isActive: boolean;
  role: string;
}

export function AdminUserActions({ userId, userName, email, isActive, role }: AdminUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleAction(action: string, extraBody?: Record<string, string>) {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading("");
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Rol toggle */}
      {isActive && (
        <button
          onClick={() => handleAction("change_role", { role: role === "admin" ? "viewer" : "admin" })}
          disabled={!!loading}
          className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
          title={role === "admin" ? "Maak viewer" : "Maak admin"}
        >
          {role === "admin" ? <User className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Activeer / Deactiveer */}
      {isActive ? (
        <button
          onClick={() => handleAction("deactivate")}
          disabled={!!loading}
          className="p-1.5 rounded-lg text-text-secondary hover:text-warning hover:bg-warning/10 transition-colors"
          title="Deactiveren"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={() => handleAction("activate")}
          disabled={!!loading}
          className="p-1.5 rounded-lg text-text-secondary hover:text-success hover:bg-success/10 transition-colors"
          title="Heractiveren"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Verwijderen */}
      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="danger" loading={loading === "delete"} onClick={() => handleAction("delete")}>
            Bevestig
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
            Annuleer
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={!!loading}
          className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
          title="Permanent verwijderen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
