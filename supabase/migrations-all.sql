-- ============================================
-- DashPortal — Alle Migrations (Geconsolideerd)
-- Draai dit NA schema.sql in Supabase SQL Editor
-- 100% idempotent — veilig om meerdere keren te draaien
-- ============================================

-- ============================================
-- EXTRA KOLOMMEN OP TENANTS
-- (uit migrations 006, 007, 011)
-- ============================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_sync_schedule TEXT DEFAULT 'manual';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS meta_next_sync_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Unique constraints (idempotent via DO-blok)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_stripe_customer_id_key'
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- Constraints voor subscription_plan en subscription_status
DO $$
BEGIN
  ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_subscription_plan_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_plan_check
  CHECK (subscription_plan IN ('starter', 'business', 'scale', 'enterprise'));

DO $$
BEGIN
  ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_subscription_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended'));

-- ============================================
-- EXTRA KOLOMMEN OP TENANT_USERS
-- (uit migration 012)
-- ============================================
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS azure_synced_at TIMESTAMPTZ;
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS azure_department TEXT;

-- ============================================
-- EXTRA KOLOMMEN OP REPORTS
-- (uit migration 003)
-- ============================================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- ============================================
-- WORKSPACES + WORKSPACE ACCESS
-- (uit migration 003)
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pbi_workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pbi_workspace_id)
);

CREATE TABLE IF NOT EXISTS workspace_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES tenant_users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- FK van reports.workspace_id naar workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_workspace_id_fkey'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- META DASHBOARD TABLES
-- (uit migration 004)
-- ============================================
CREATE TABLE IF NOT EXISTS meta_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  workspace_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  dataset_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pbi_workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT,
  report_count INTEGER DEFAULT 0,
  dataset_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pbi_workspace_id)
);

CREATE TABLE IF NOT EXISTS meta_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pbi_workspace_id TEXT NOT NULL,
  pbi_report_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dataset_id TEXT,
  report_type TEXT,
  web_url TEXT,
  modified_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pbi_report_id)
);

CREATE TABLE IF NOT EXISTS meta_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pbi_workspace_id TEXT NOT NULL,
  pbi_dataset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  configured_by TEXT,
  is_refreshable BOOLEAN DEFAULT false,
  last_refresh_status TEXT,
  last_refresh_at TIMESTAMPTZ,
  last_refresh_error TEXT,
  datasource_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pbi_dataset_id)
);

CREATE TABLE IF NOT EXISTS meta_refresh_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pbi_workspace_id TEXT NOT NULL,
  pbi_dataset_id TEXT NOT NULL,
  refresh_type TEXT,
  status TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AFFILIATE SYSTEM
-- (uit migration 011)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  commission_percent NUMERIC(5,2) DEFAULT 15.00,
  commission_type TEXT DEFAULT 'recurring',
  status TEXT DEFAULT 'active',
  payout_method TEXT DEFAULT 'bank_transfer',
  payout_details JSONB DEFAULT '{}',
  total_earned NUMERIC(10,2) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  status TEXT DEFAULT 'signed_up',
  commission_amount NUMERIC(10,2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  payout_reference TEXT,
  referral_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FK van tenants.referred_by_affiliate_id
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_referred_by_affiliate_id_fkey'
  ) THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_referred_by_affiliate_id_fkey
      FOREIGN KEY (referred_by_affiliate_id) REFERENCES affiliates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- ALLE INDEXES
-- ============================================
-- Workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_pbi_id ON workspaces(tenant_id, pbi_workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_workspace ON workspace_access(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_user ON workspace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);

-- Stripe
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON tenants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription ON tenants(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Meta sync
CREATE INDEX IF NOT EXISTS idx_tenants_next_sync ON tenants(meta_next_sync_at) WHERE meta_sync_schedule != 'manual' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_tenant ON meta_sync_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_status ON meta_sync_log(tenant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_workspaces_tenant ON meta_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_reports_tenant ON meta_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_reports_workspace ON meta_reports(tenant_id, pbi_workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_datasets_tenant ON meta_datasets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_datasets_workspace ON meta_datasets(tenant_id, pbi_workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_refresh_dataset ON meta_refresh_history(tenant_id, pbi_dataset_id);
CREATE INDEX IF NOT EXISTS idx_meta_refresh_workspace ON meta_refresh_history(tenant_id, pbi_workspace_id);

-- Affiliates
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_tenant_id ON affiliates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_tenant ON affiliate_referrals(referred_tenant_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tenants_referred_by ON tenants(referred_by_affiliate_id);

-- Azure import
CREATE INDEX IF NOT EXISTS idx_tenant_users_azure_oid ON tenant_users(tenant_id, azure_oid) WHERE azure_oid IS NOT NULL;

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_access_type ON reports(access_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_refresh_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (DROP IF EXISTS + CREATE)
-- ============================================

-- Workspaces
DROP POLICY IF EXISTS "Service role full access on workspaces" ON workspaces;
CREATE POLICY "Service role full access on workspaces" ON workspaces FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read workspaces in their tenant" ON workspaces;
CREATE POLICY "Users can read workspaces in their tenant" ON workspaces FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Workspace Access
DROP POLICY IF EXISTS "Service role full access on workspace_access" ON workspace_access;
CREATE POLICY "Service role full access on workspace_access" ON workspace_access FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read their own workspace access" ON workspace_access;
CREATE POLICY "Users can read their own workspace access" ON workspace_access FOR SELECT USING (user_id IN (SELECT public.get_my_tenant_user_ids()));

-- Meta Sync Log
DROP POLICY IF EXISTS "Service role full access on meta_sync_log" ON meta_sync_log;
CREATE POLICY "Service role full access on meta_sync_log" ON meta_sync_log FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read meta sync log in their tenant" ON meta_sync_log;
CREATE POLICY "Users can read meta sync log in their tenant" ON meta_sync_log FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Meta Workspaces
DROP POLICY IF EXISTS "Service role full access on meta_workspaces" ON meta_workspaces;
CREATE POLICY "Service role full access on meta_workspaces" ON meta_workspaces FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read meta workspaces in their tenant" ON meta_workspaces;
CREATE POLICY "Users can read meta workspaces in their tenant" ON meta_workspaces FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Meta Reports
DROP POLICY IF EXISTS "Service role full access on meta_reports" ON meta_reports;
CREATE POLICY "Service role full access on meta_reports" ON meta_reports FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read meta reports in their tenant" ON meta_reports;
CREATE POLICY "Users can read meta reports in their tenant" ON meta_reports FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Meta Datasets
DROP POLICY IF EXISTS "Service role full access on meta_datasets" ON meta_datasets;
CREATE POLICY "Service role full access on meta_datasets" ON meta_datasets FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read meta datasets in their tenant" ON meta_datasets;
CREATE POLICY "Users can read meta datasets in their tenant" ON meta_datasets FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Meta Refresh History
DROP POLICY IF EXISTS "Service role full access on meta_refresh_history" ON meta_refresh_history;
CREATE POLICY "Service role full access on meta_refresh_history" ON meta_refresh_history FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read meta refresh history in their tenant" ON meta_refresh_history;
CREATE POLICY "Users can read meta refresh history in their tenant" ON meta_refresh_history FOR SELECT USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- Affiliates
DROP POLICY IF EXISTS "Service role full access on affiliates" ON affiliates;
CREATE POLICY "Service role full access on affiliates" ON affiliates FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Affiliates can read own record" ON affiliates;
CREATE POLICY "Affiliates can read own record" ON affiliates FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()) OR email = (auth.jwt() ->> 'email'));

-- Affiliate Referrals
DROP POLICY IF EXISTS "Service role full access on affiliate_referrals" ON affiliate_referrals;
CREATE POLICY "Service role full access on affiliate_referrals" ON affiliate_referrals FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Affiliates can read own referrals" ON affiliate_referrals;
CREATE POLICY "Affiliates can read own referrals" ON affiliate_referrals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE tenant_id IN (SELECT public.get_my_tenant_ids()) OR email = (auth.jwt() ->> 'email')));

-- Affiliate Payouts
DROP POLICY IF EXISTS "Service role full access on affiliate_payouts" ON affiliate_payouts;
CREATE POLICY "Service role full access on affiliate_payouts" ON affiliate_payouts FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Affiliates can read own payouts" ON affiliate_payouts;
CREATE POLICY "Affiliates can read own payouts" ON affiliate_payouts FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE tenant_id IN (SELECT public.get_my_tenant_ids()) OR email = (auth.jwt() ->> 'email')));

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies (idempotent via DO-blok)
DO $$
BEGIN
  -- Logos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public logo read access' AND tablename = 'objects') THEN
    CREATE POLICY "Public logo read access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload logos' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update logos' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete logos' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;

  -- Thumbnails
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Thumbnails public read' AND tablename = 'objects') THEN
    CREATE POLICY "Thumbnails public read" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Thumbnails authenticated write' AND tablename = 'objects') THEN
    CREATE POLICY "Thumbnails authenticated write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Thumbnails authenticated update' AND tablename = 'objects') THEN
    CREATE POLICY "Thumbnails authenticated update" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Thumbnails authenticated delete' AND tablename = 'objects') THEN
    CREATE POLICY "Thumbnails authenticated delete" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================
-- DATA MIGRATIE (veilig, alleen als er bestaande data is)
-- ============================================

-- Maak workspace records aan van bestaande rapporten
INSERT INTO workspaces (tenant_id, pbi_workspace_id, name)
SELECT DISTINCT r.tenant_id, r.pbi_workspace_id, 'Workspace ' || LEFT(r.pbi_workspace_id, 8)
FROM reports r
WHERE r.pbi_workspace_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.tenant_id = r.tenant_id AND w.pbi_workspace_id = r.pbi_workspace_id)
ON CONFLICT (tenant_id, pbi_workspace_id) DO NOTHING;

-- Vul reports.workspace_id in
UPDATE reports r
SET workspace_id = w.id
FROM workspaces w
WHERE w.tenant_id = r.tenant_id
  AND w.pbi_workspace_id = r.pbi_workspace_id
  AND r.workspace_id IS NULL;
