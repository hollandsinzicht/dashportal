-- ============================================
-- Migration: Add unique constraint on reports
-- Required for report sync upsert to work
-- ============================================

-- Add unique constraint for (tenant_id, pbi_report_id) on reports table
-- This allows upserts to detect existing reports and update them
ALTER TABLE reports
  ADD CONSTRAINT reports_tenant_pbi_report_unique
  UNIQUE (tenant_id, pbi_report_id);
