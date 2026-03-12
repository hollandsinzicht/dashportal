"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreVertical,
  ShieldCheck,
  User,
  UserX,
  UserCheck,
  Trash2,
  Loader2,
} from "lucide-react";

interface UserDropdownMenuProps {
  user: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  tenantId: string;
  isCurrentUser: boolean;
}

export function UserDropdownMenu({
  user,
  tenantId,
  isCurrentUser,
}: UserDropdownMenuProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "delete" | null
  >(null);

  async function handleRoleChange() {
    setLoading(true);
    try {
      const newRole = user.role === "admin" ? "viewer" : "admin";
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Er ging iets mis");
        return;
      }
      router.refresh();
    } catch {
      alert("Er ging iets mis bij het wijzigen van de rol");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Er ging iets mis");
        return;
      }
      router.refresh();
    } catch {
      alert("Er ging iets mis bij het wijzigen van de status");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (confirmAction !== "delete") {
      setConfirmAction("delete");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Er ging iets mis");
        return;
      }
      router.refresh();
    } catch {
      alert("Er ging iets mis bij het verwijderen");
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  }

  if (isCurrentUser) {
    return (
      <div className="p-1.5 opacity-30" title="Dit ben jij">
        <MoreVertical className="w-4 h-4 text-text-secondary" />
      </div>
    );
  }

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (!open) setConfirmAction(null);
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
          ) : (
            <MoreVertical className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[200px] bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in-0 zoom-in-95"
          align="end"
          sideOffset={4}
        >
          {/* Rol wijzigen */}
          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary rounded-lg cursor-pointer outline-none hover:bg-surface-secondary focus:bg-surface-secondary transition-colors"
            onSelect={(e) => {
              e.preventDefault();
              handleRoleChange();
            }}
          >
            {user.role === "admin" ? (
              <>
                <User className="w-4 h-4 text-text-secondary" />
                Wijzig naar Viewer
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-text-secondary" />
                Wijzig naar Admin
              </>
            )}
          </DropdownMenu.Item>

          {/* Activeren / Deactiveren */}
          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary rounded-lg cursor-pointer outline-none hover:bg-surface-secondary focus:bg-surface-secondary transition-colors"
            onSelect={(e) => {
              e.preventDefault();
              handleToggleActive();
            }}
          >
            {user.is_active ? (
              <>
                <UserX className="w-4 h-4 text-text-secondary" />
                Deactiveren
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-text-secondary" />
                Activeren
              </>
            )}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border my-1" />

          {/* Verwijderen (met bevestiging) */}
          <DropdownMenu.Item
            className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors ${
              confirmAction === "delete"
                ? "bg-danger/10 text-danger hover:bg-danger/20 focus:bg-danger/20"
                : "text-danger hover:bg-danger/5 focus:bg-danger/5"
            }`}
            onSelect={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
            {confirmAction === "delete"
              ? "Bevestig verwijderen"
              : "Verwijderen"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
