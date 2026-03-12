-- ============================================
-- 008: Report Access Type
-- Voegt per-rapport toegangsbeheer toe
-- ============================================

-- access_type kolom toevoegen aan reports
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'all_users';

-- Commentaar voor documentatie
COMMENT ON COLUMN reports.access_type IS 'Wie heeft toegang: all_users (iedereen met workspace toegang), specific_users (alleen geselecteerde gebruikers), admin_only (alleen admins)';

-- Index voor snelle filtering op access_type
CREATE INDEX IF NOT EXISTS idx_reports_access_type ON reports(access_type);
