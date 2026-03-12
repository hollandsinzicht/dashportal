-- ============================================
-- BI Portal — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TENANTS
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1E3A5F',
  accent_color TEXT DEFAULT '#F59E0B',
  custom_domain TEXT,

  -- Power BI koppeling
  pbi_tenant_id TEXT,
  pbi_client_id TEXT,
  pbi_client_secret TEXT, -- Encrypted
  pbi_workspace_ids TEXT[],

  -- Abonnement
  subscription_plan TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'active',

  -- GDPR / DPA
  dpa_accepted_at TIMESTAMPTZ,
  dpa_accepted_by TEXT,

  -- Offboarding
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancel_feedback TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANT USERS
-- ============================================
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'viewer',
  auth_provider TEXT DEFAULT 'email',
  azure_oid TEXT,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ============================================
-- REPORTS
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Power BI referenties
  pbi_workspace_id TEXT NOT NULL,
  pbi_report_id TEXT NOT NULL,
  pbi_dataset_id TEXT,

  -- Portaal weergave
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Toegangsbeheer
  access_type TEXT DEFAULT 'all_users', -- all_users | specific_users | admin_only

  -- RLS configuratie
  rls_type TEXT DEFAULT 'none',
  rls_role_field TEXT,

  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pbi_report_id)
);

-- ============================================
-- REPORT ACCESS
-- ============================================
CREATE TABLE report_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES tenant_users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- ============================================
-- RLS ROLES
-- ============================================
CREATE TABLE rls_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

-- ============================================
-- REPORT VIEWS — Bijhouden welke rapporten bekeken worden
-- ============================================
CREATE TABLE report_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOG — Audit trail voor admin acties
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,         -- 'user.invited', 'user.updated', 'access.granted', etc.
  target_type TEXT,             -- 'user', 'report', 'tenant', 'access'
  target_id UUID,               -- ID van het doelwit
  metadata JSONB DEFAULT '{}',  -- Extra context (naam, email, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_email ON tenant_users(email);
CREATE INDEX idx_reports_tenant ON reports(tenant_id);
CREATE INDEX idx_report_access_report ON report_access(report_id);
CREATE INDEX idx_report_access_user ON report_access(user_id);
CREATE INDEX idx_rls_roles_user_report ON rls_roles(user_id, report_id);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_report_views_tenant ON report_views(tenant_id);
CREATE INDEX idx_report_views_report ON report_views(report_id);
CREATE INDEX idx_report_views_viewed_at ON report_views(viewed_at);
CREATE INDEX idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_action ON activity_log(action);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE rls_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER HELPER FUNCTIES
-- Voorkomt "infinite recursion" in RLS policies
-- die tenant_users refereren vanuit tenant_users
-- ============================================
CREATE OR REPLACE FUNCTION public.get_my_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM public.tenant_users
  WHERE email = (auth.jwt() ->> 'email');
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_user_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.tenant_users
  WHERE email = (auth.jwt() ->> 'email');
$$;

-- ============================================
-- POLICIES
-- ============================================

-- Service role: volledige toegang (voor API routes)
CREATE POLICY "Service role full access on tenants"
  ON tenants FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on tenant_users"
  ON tenant_users FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on reports"
  ON reports FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on report_access"
  ON report_access FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on rls_roles"
  ON rls_roles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on report_views"
  ON report_views FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on activity_log"
  ON activity_log FOR ALL
  USING (auth.role() = 'service_role');

-- Tenants: gebruikers kunnen hun eigen tenant lezen
CREATE POLICY "Users can read their tenant"
  ON tenants FOR SELECT
  USING (id IN (SELECT public.get_my_tenant_ids()));

-- Tenant users: gebruikers kunnen hun eigen record + collega's lezen
CREATE POLICY "Users can read own record"
  ON tenant_users FOR SELECT
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can read users in their tenant"
  ON tenant_users FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Reports: gebruikers kunnen gepubliceerde rapporten in hun tenant lezen
CREATE POLICY "Users can read published reports in their tenant"
  ON reports FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Report access: gebruikers kunnen hun eigen toegangsrechten lezen
CREATE POLICY "Users can read their own report access"
  ON report_access FOR SELECT
  USING (user_id IN (SELECT public.get_my_tenant_user_ids()));

-- RLS roles: gebruikers kunnen hun eigen rollen lezen
CREATE POLICY "Users can read their own rls_roles"
  ON rls_roles FOR SELECT
  USING (user_id IN (SELECT public.get_my_tenant_user_ids()));

-- Report views: gebruikers kunnen hun eigen report views lezen
CREATE POLICY "Users can read their own report views"
  ON report_views FOR SELECT
  USING (user_id IN (SELECT public.get_my_tenant_user_ids()));

-- Activity log: gebruikers kunnen activiteiten in hun tenant lezen
CREATE POLICY "Users can read activity in their tenant"
  ON activity_log FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
