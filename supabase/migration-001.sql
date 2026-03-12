-- ============================================
-- DashPortal — Migration 001
-- Voegt ontbrekende tabellen en kolommen toe
-- 100% idempotent — veilig om meerdere keren te draaien
-- ============================================

-- ============================================
-- ONTBREKENDE KOLOMMEN OP TENANTS
-- ============================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_sync_schedule TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_next_sync_at TIMESTAMPTZ;

-- ============================================
-- ONTBREKENDE KOLOMMEN OP TENANT_USERS
-- ============================================
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS azure_department TEXT;

-- ============================================
-- WORKSPACES
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pbi_workspace_id TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pbi_workspace_id)
);

-- ============================================
-- WORKSPACE ACCESS
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES tenant_users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================
-- AFFILIATES
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  commission_percent NUMERIC(5,2) DEFAULT 15.00,
  commission_type TEXT DEFAULT 'recurring',
  status TEXT DEFAULT 'active',
  total_earned NUMERIC(10,2) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AFFILIATE REFERRALS
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  referred_email TEXT,
  status TEXT DEFAULT 'signed_up',
  commission_amount NUMERIC(10,2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AFFILIATE PAYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXTRA INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_workspace ON workspace_access(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_user ON workspace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_tenant ON affiliates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON tenants(stripe_customer_id);

-- ============================================
-- ROW LEVEL SECURITY + POLICIES
-- Alles in DO-blokken zodat het idempotent is
-- ============================================

-- RLS aanzetten (is idempotent, geen fout als al aan)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Policies: alleen aanmaken als ze nog niet bestaan
DO $$
BEGIN
  -- workspaces
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on workspaces' AND tablename = 'workspaces') THEN
    CREATE POLICY "Service role full access on workspaces" ON workspaces FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read workspaces in their tenant' AND tablename = 'workspaces') THEN
    CREATE POLICY "Users can read workspaces in their tenant" ON workspaces FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));
  END IF;

  -- workspace_access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on workspace_access' AND tablename = 'workspace_access') THEN
    CREATE POLICY "Service role full access on workspace_access" ON workspace_access FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their workspace access' AND tablename = 'workspace_access') THEN
    CREATE POLICY "Users can read their workspace access" ON workspace_access FOR SELECT USING (user_id IN (SELECT public.get_my_tenant_user_ids()));
  END IF;

  -- affiliates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on affiliates' AND tablename = 'affiliates') THEN
    CREATE POLICY "Service role full access on affiliates" ON affiliates FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their affiliate data' AND tablename = 'affiliates') THEN
    CREATE POLICY "Users can read their affiliate data" ON affiliates FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));
  END IF;

  -- affiliate_referrals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on affiliate_referrals' AND tablename = 'affiliate_referrals') THEN
    CREATE POLICY "Service role full access on affiliate_referrals" ON affiliate_referrals FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their affiliate referrals' AND tablename = 'affiliate_referrals') THEN
    CREATE POLICY "Users can read their affiliate referrals" ON affiliate_referrals FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE tenant_id IN (SELECT public.get_my_tenant_ids())));
  END IF;

  -- affiliate_payouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on affiliate_payouts' AND tablename = 'affiliate_payouts') THEN
    CREATE POLICY "Service role full access on affiliate_payouts" ON affiliate_payouts FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their affiliate payouts' AND tablename = 'affiliate_payouts') THEN
    CREATE POLICY "Users can read their affiliate payouts" ON affiliate_payouts FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE tenant_id IN (SELECT public.get_my_tenant_ids())));
  END IF;
END $$;

-- FK van tenants.referred_by_affiliate_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tenants_referred_by_affiliate_id_fkey'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_referred_by_affiliate_id_fkey
      FOREIGN KEY (referred_by_affiliate_id)
      REFERENCES affiliates(id) ON DELETE SET NULL;
  END IF;
END $$;
