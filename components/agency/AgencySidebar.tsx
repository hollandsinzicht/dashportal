"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AgencyRole } from "@/lib/agency/types";

interface AgencySidebarProps {
  role: AgencyRole;
  agency: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

const NAV_ITEMS = [
  { label: "Overzicht", href: "", icon: LayoutDashboard },
  { label: "Klanten", href: "/clients", icon: Building2 },
  { label: "Team", href: "/team", icon: Users, minRole: "admin" as const },
  { label: "Facturatie", href: "/billing", icon: CreditCard, minRole: "admin" as const },
  { label: "Instellingen", href: "/settings", icon: Settings, minRole: "owner" as const },
];

const ROLE_ORDER: AgencyRole[] = ["viewer", "admin", "owner"];

function hasMinRole(userRole: AgencyRole, minRole: AgencyRole): boolean {
  return ROLE_ORDER.indexOf(userRole) >= ROLE_ORDER.indexOf(minRole);
}

export function AgencySidebar({ role, agency }: AgencySidebarProps) {
  const pathname = usePathname();
  const basePath = `/agency/${agency.slug}/dashboard`;

  return (
    <aside className="hidden lg:flex w-64 bg-surface border-r border-border flex-col">
      {/* Agency logo/naam */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {agency.logoUrl ? (
            <img
              src={agency.logoUrl}
              alt={agency.name}
              className="w-8 h-8 rounded-lg object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {agency.name}
            </p>
            <p className="text-xs text-muted">Agency Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.filter(
          (item) => !item.minRole || hasMinRole(role, item.minRole)
        ).map((item) => {
          const fullHref = `${basePath}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === basePath
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface-secondary"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
