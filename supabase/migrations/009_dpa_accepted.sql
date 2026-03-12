-- ============================================
-- BI Portal — Migration 009
-- DPA (verwerkersovereenkomst) acceptance tracking
-- ============================================

-- Timestamp wanneer de tenant de verwerkersovereenkomst accepteerde
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dpa_accepted_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dpa_accepted_by TEXT; -- email van degene die accepteerde

COMMENT ON COLUMN tenants.dpa_accepted_at IS 'Wanneer de verwerkersovereenkomst is geaccepteerd';
COMMENT ON COLUMN tenants.dpa_accepted_by IS 'E-mailadres van de persoon die de DPA accepteerde';
