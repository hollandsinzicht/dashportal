-- ============================================
-- Migration 003: Workspaces & Workspace Access
-- ============================================

-- ─── 1. Workspaces tabel ───
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

-- ─── 2. Workspace Access tabel (vervangt report_access) ───
CREATE TABLE IF NOT EXISTS workspace_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES tenant_users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES tenant_users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ─── 3. Reports tabel: workspace_id FK toevoegen ───
ALTER TABLE reports ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- ─── 4. Indexes ───
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_pbi_id ON workspaces(tenant_id, pbi_workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_workspace ON workspace_access(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_user ON workspace_access(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);

-- ─── 5. RLS Policies ───
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on workspaces"
  ON workspaces FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on workspace_access"
  ON workspace_access FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 6. Thumbnails storage bucket ───
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy
CREATE POLICY "Thumbnails public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

-- Authenticated upload/update/delete
CREATE POLICY "Thumbnails authenticated write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Thumbnails authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Thumbnails authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- ─── 7. Data migratie: bestaande data overzetten ───

-- 7a. Maak workspace records aan van bestaande rapporten
INSERT INTO workspaces (tenant_id, pbi_workspace_id, name)
SELECT DISTINCT
  r.tenant_id,
  r.pbi_workspace_id,
  'Workspace ' || LEFT(r.pbi_workspace_id, 8)
FROM reports r
WHERE r.pbi_workspace_id IS NOT NULL
ON CONFLICT (tenant_id, pbi_workspace_id) DO NOTHING;

-- 7b. Vul reports.workspace_id in
UPDATE reports r
SET workspace_id = w.id
FROM workspaces w
WHERE w.tenant_id = r.tenant_id
  AND w.pbi_workspace_id = r.pbi_workspace_id
  AND r.workspace_id IS NULL;

-- 7c. Migreer report_access naar workspace_access
INSERT INTO workspace_access (workspace_id, user_id, granted_by, granted_at)
SELECT DISTINCT ON (w.id, ra.user_id)
  w.id AS workspace_id,
  ra.user_id,
  ra.granted_by,
  MIN(ra.granted_at)
FROM report_access ra
JOIN reports r ON ra.report_id = r.id
JOIN workspaces w ON w.tenant_id = r.tenant_id AND w.pbi_workspace_id = r.pbi_workspace_id
GROUP BY w.id, ra.user_id, ra.granted_by
ON CONFLICT (workspace_id, user_id) DO NOTHING;
