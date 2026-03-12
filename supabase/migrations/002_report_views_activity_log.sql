-- ============================================
-- BI Portal — Migration 002
-- Report views tracking + Activity log
-- ============================================

-- ============================================
-- REPORT VIEWS — Bijhouden welke rapporten bekeken worden
-- ============================================
CREATE TABLE IF NOT EXISTS report_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_views_tenant ON report_views(tenant_id);
CREATE INDEX idx_report_views_report ON report_views(report_id);
CREATE INDEX idx_report_views_viewed_at ON report_views(viewed_at);

-- RLS
ALTER TABLE report_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on report_views"
  ON report_views FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own report views"
  ON report_views FOR SELECT
  USING (user_id IN (SELECT public.get_my_tenant_user_ids()));

-- ============================================
-- ACTIVITY LOG — Audit trail voor admin acties
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,         -- 'user.invited', 'user.updated', 'access.granted', etc.
  target_type TEXT,             -- 'user', 'report', 'tenant', 'access'
  target_id UUID,               -- ID van het doelwit
  metadata JSONB DEFAULT '{}',  -- Extra context (naam, email, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_action ON activity_log(action);

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on activity_log"
  ON activity_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read activity in their tenant"
  ON activity_log FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ============================================
-- STORAGE — Logo bucket aanmaken
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152,  -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Iedereen mag logo's lezen (public bucket)
CREATE POLICY "Public logo read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Alleen authenticated users mogen uploaden
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Authenticated users mogen hun uploads overschrijven
CREATE POLICY "Authenticated users can update logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Authenticated users mogen logo's verwijderen
CREATE POLICY "Authenticated users can delete logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
