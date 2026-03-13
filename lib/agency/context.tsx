"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AgencyRole } from "./types";

export interface AgencyContextValue {
  agencyId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  userRole: AgencyRole;
  userEmail: string;
}

const AgencyContext = createContext<AgencyContextValue | null>(null);

interface AgencyProviderProps {
  agency: {
    id: string;
    slug: string;
    name: string;
    logo_url?: string | null;
    primary_color?: string;
    accent_color?: string;
  };
  user: {
    role: AgencyRole;
    email: string;
  };
  children: ReactNode;
}

export function AgencyProvider({ agency, user, children }: AgencyProviderProps) {
  const value: AgencyContextValue = {
    agencyId: agency.id,
    slug: agency.slug,
    name: agency.name,
    logoUrl: agency.logo_url || null,
    primaryColor: agency.primary_color || "#1E3A5F",
    accentColor: agency.accent_color || "#F59E0B",
    userRole: user.role,
    userEmail: user.email,
  };

  return (
    <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>
  );
}

export function useAgency(): AgencyContextValue {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error("useAgency() moet binnen een <AgencyProvider> worden gebruikt");
  }
  return context;
}
