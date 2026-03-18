"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileBarChart,
  Users,
  ShieldCheck,
  Settings,
  BarChart3,
  Activity,
  CreditCard,
  ClipboardList,
  Handshake,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  hideForAgency?: boolean;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rapporten", href: "/dashboard/reports", icon: FileBarChart },
  { label: "Gebruikers", href: "/dashboard/users", icon: Users },
  { label: "Toegang", href: "/dashboard/access", icon: ShieldCheck },
  { label: "Meta", href: "/dashboard/meta", icon: Activity },
  { label: "Activiteit", href: "/dashboard/activity", icon: ClipboardList },
  { label: "Facturatie", href: "/dashboard/billing", icon: CreditCard, hideForAgency: true },
  { label: "Partner", href: "/dashboard/affiliate", icon: Handshake, hideForAgency: true },
  { label: "Instellingen", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  role: string;
  tenant: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  agencyManaged?: boolean;
}

export function DashboardSidebar({ role, tenant, agencyManaged }: DashboardSidebarProps) {
  const pathname = usePathname();

  // Alleen admins zien de dashboard sidebar
  // Filter agency-specifieke items weg voor agency-managed tenants
  const navItems = role === "admin"
    ? adminNav.filter((item) => !(agencyManaged && item.hideForAgency))
    : [];

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-surface border-r border-border">
      {/* Logo + Tenant naam */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="font-[family-name:var(--font-syne)] font-bold text-text-primary truncate">
          {tenant.name}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Footer: tenant slug */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-text-secondary truncate">
          {tenant.slug}.dashportal.app
        </p>
      </div>
    </aside>
  );
}
