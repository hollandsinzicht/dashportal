"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  isTrialActive as checkTrialActive,
  getTrialDaysRemaining as calcTrialDays,
} from "@/lib/features/gates";

// ─── Types ───
export interface TenantContextValue {
  tenantId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  // Agency-managed velden
  agencyId: string | null;
  billingOwner: string;
  clientCanInviteUsers: boolean;
  clientCanEditBranding: boolean;
}

// ─── Context ───
const TenantContext = createContext<TenantContextValue | null>(null);

// ─── Provider Props ───
interface TenantProviderProps {
  tenant: {
    id: string;
    slug: string;
    name: string;
    logo_url?: string | null;
    subscription_plan?: string;
    subscription_status?: string;
    trial_ends_at?: string | null;
    stripe_customer_id?: string | null;
    agency_id?: string | null;
    billing_owner?: string | null;
    client_can_invite_users?: boolean | null;
    client_can_edit_branding?: boolean | null;
  };
  children: ReactNode;
}

/**
 * TenantProvider — server-naar-client bridge voor tenant subscription data.
 *
 * Wrap dit om children in dashboard/portal layouts zodat
 * client components (FeatureGate, TrialBanner, CrispChat) tenant data kunnen lezen.
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
  const tenantForGating = {
    subscription_plan: tenant.subscription_plan || "starter",
    subscription_status: tenant.subscription_status || "active",
    trial_ends_at: tenant.trial_ends_at || null,
  };

  const value: TenantContextValue = {
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    logoUrl: tenant.logo_url || null,
    subscriptionPlan: tenant.subscription_plan || "starter",
    subscriptionStatus: tenant.subscription_status || "active",
    trialEndsAt: tenant.trial_ends_at || null,
    stripeCustomerId: tenant.stripe_customer_id || null,
    isTrialActive: checkTrialActive(tenantForGating),
    trialDaysRemaining: calcTrialDays(tenantForGating),
    agencyId: tenant.agency_id || null,
    billingOwner: tenant.billing_owner || "self",
    clientCanInviteUsers: tenant.client_can_invite_users !== false,
    clientCanEditBranding: tenant.client_can_edit_branding !== false,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

/**
 * Hook om tenant data op te halen in client components.
 * Gooit een error als het buiten een TenantProvider wordt gebruikt.
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant() moet binnen een <TenantProvider> worden gebruikt");
  }
  return context;
}

/**
 * Optionele hook — geeft null als er geen TenantProvider is.
 * Handig voor componenten die zowel binnen als buiten een provider werken.
 */
export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
