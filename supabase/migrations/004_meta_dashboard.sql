-- ============================================
-- Migration 004: Meta Dashboard Cache Tables
-- ============================================

-- ─── 1. meta_sync_log ───
-- Houdt bij wanneer de laatste sync is uitgevoerd per tenant.
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

-- ─── 2. meta_workspaces ───
-- Cache van Power BI workspaces met tellingen.
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

-- ─── 3. meta_reports ───
-- Cache van Power BI rapporten.
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

-- ─── 4. meta_datasets ───
-- Cache van Power BI datasets met refresh-status.
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

-- ─── 5. meta_refresh_history ───
-- Refresh geschiedenis per dataset.
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

-- ─── 6. Indexes ───
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_tenant ON meta_sync_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_sync_log_status ON meta_sync_log(tenant_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_meta_workspaces_tenant ON meta_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_reports_tenant ON meta_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_reports_workspace ON meta_reports(tenant_id, pbi_workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_datasets_tenant ON meta_datasets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_datasets_workspace ON meta_datasets(tenant_id, pbi_workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_refresh_dataset ON meta_refresh_history(tenant_id, pbi_dataset_id);
CREATE INDEX IF NOT EXISTS idx_meta_refresh_workspace ON meta_refresh_history(tenant_id, pbi_workspace_id);

-- ─── 7. RLS ───
ALTER TABLE meta_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_refresh_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on meta_sync_log"
  ON meta_sync_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on meta_workspaces"
  ON meta_workspaces FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on meta_reports"
  ON meta_reports FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on meta_datasets"
  ON meta_datasets FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on meta_refresh_history"
  ON meta_refresh_history FOR ALL
  USING (auth.role() = 'service_role');
