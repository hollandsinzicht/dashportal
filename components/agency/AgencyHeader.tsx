"use client";

import { User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AgencyRole } from "@/lib/agency/types";

interface AgencyHeaderProps {
  user: {
    name: string;
    email: string;
    role: AgencyRole;
  };
  agency: {
    name: string;
  };
}

const ROLE_LABELS: Record<AgencyRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  viewer: "Meekijker",
};

export function AgencyHeader({ user }: AgencyHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">
              {user.name}
            </p>
            <p className="text-xs text-muted">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
          title="Uitloggen"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
