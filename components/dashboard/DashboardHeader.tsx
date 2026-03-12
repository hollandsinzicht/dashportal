"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileBarChart,
  Users,
  ShieldCheck,
  Settings,
  Activity,
  CreditCard,
} from "lucide-react";

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  tenant: {
    name: string;
    logoUrl: string | null;
  };
}

const adminNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rapporten", href: "/dashboard/reports", icon: FileBarChart },
  { label: "Gebruikers", href: "/dashboard/users", icon: Users },
  { label: "Toegang", href: "/dashboard/access", icon: ShieldCheck },
  { label: "Meta", href: "/dashboard/meta", icon: Activity },
  { label: "Facturatie", href: "/dashboard/billing", icon: CreditCard },
  { label: "Instellingen", href: "/dashboard/settings", icon: Settings },
];

export function DashboardHeader({ user, tenant }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <>
      <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo — alleen op mobile (desktop heeft sidebar) */}
          <div className="flex items-center gap-2 lg:hidden">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-[family-name:var(--font-syne)] font-bold text-text-primary text-sm">
              {tenant.name}
            </span>
          </div>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-secondary">{user.role}</p>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-text-secondary hover:text-danger rounded-lg hover:bg-surface-secondary transition-colors"
            title="Uitloggen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-50 flex flex-col">
            <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-[family-name:var(--font-syne)] font-bold text-text-primary truncate">
                {tenant.name}
              </span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {(user.role === "admin" ? adminNav : []).map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                      }
                    `}
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
