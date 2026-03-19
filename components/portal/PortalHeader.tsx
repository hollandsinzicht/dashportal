"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface PortalHeaderProps {
  tenant: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  user: {
    name: string;
    email: string;
    role: string;
  };
  /** Demo modus: verbergt logout en admin link */
  demo?: boolean;
  /** Optioneel badge naast tenant naam (bijv. "DEMO") */
  badge?: string;
  /** Agency-managed tenant: verbergt "Beheer" knop */
  agencyManaged?: boolean;
}

export function PortalHeader({ tenant, user, demo, badge, agencyManaged }: PortalHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${tenant.slug}`);
  }

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + tenant naam */}
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <img src="/favicon-dashportal.png" alt="DashPortal" className="w-8 h-8" />
            )}
            <span className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
              {tenant.name}
            </span>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                {badge}
              </span>
            )}
          </div>

          {/* Rechts: admin link + user info + logout */}
          <div className="flex items-center gap-4">
            {/* Admin link — alleen zichtbaar voor admins, niet in demo */}
            {!demo && user.role === "admin" && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Beheer
              </Link>
            )}

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-text-secondary">{user.name}</span>
            </div>

            {/* Logout — niet in demo */}
            {!demo && (
              <button
                onClick={handleLogout}
                className="p-2 text-text-secondary hover:text-danger rounded-lg hover:bg-surface-secondary transition-colors"
                title="Uitloggen"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
