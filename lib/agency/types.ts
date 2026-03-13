/**
 * TypeScript types voor het Agency/Reseller model.
 */

// ─── Agency ──────────────────────────────────────────────────

export type AgencyRole = "owner" | "admin" | "viewer";

export interface Agency {
  id: string;
  slug: string;
  name: string;
  owner_email: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_email: string | null;
  company_details: AgencyCompanyDetails;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgencyCompanyDetails {
  kvk_number?: string;
  vat_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  website?: string;
}

// ─── Agency Users ────────────────────────────────────────────

export interface AgencyUser {
  id: string;
  agency_id: string;
  email: string;
  name: string | null;
  role: AgencyRole;
  is_active: boolean;
  invited_by: string | null;
  invited_at: string | null;
  last_login: string | null;
  created_at: string;
}

// ─── Pricing Tiers ───────────────────────────────────────────

export interface AgencyPricingTier {
  id: string;
  agency_id: string;
  min_users: number;
  max_users: number | null; // null = onbeperkt
  price_per_month: number;
  label: string | null;
  sort_order: number;
  created_at: string;
}

// ─── Invoice Lines ───────────────────────────────────────────

export interface AgencyInvoiceLine {
  id: string;
  agency_id: string;
  tenant_id: string | null;
  period_start: string;
  period_end: string;
  user_count: number;
  tier_label: string | null;
  amount: number;
  stripe_invoice_item_id: string | null;
  created_at: string;
}

// ─── Samengestelde types (voor dashboard views) ──────────────

export interface AgencyClient {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  user_count: number;
  report_count: number;
  monthly_cost: number;
  tier_label: string | null;
  created_at: string;
}

export interface AgencyDashboardStats {
  total_clients: number;
  active_clients: number;
  total_users: number;
  monthly_revenue: number;
  trial_clients: number;
}

export interface AgencyWithCounts {
  id: string;
  slug: string;
  name: string;
  owner_email: string;
  is_active: boolean;
  client_count: number;
  total_users: number;
  monthly_revenue: number;
  created_at: string;
}
