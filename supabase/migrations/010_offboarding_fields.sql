-- ============================================
-- BI Portal — Migration 010
-- Offboarding: annulering tracking velden
-- ============================================

-- Wanneer het abonnement is geannuleerd
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Reden voor annulering (dropdown optie)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Vrije feedback bij annulering
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cancel_feedback TEXT;

COMMENT ON COLUMN tenants.canceled_at IS 'Wanneer het abonnement is geannuleerd';
COMMENT ON COLUMN tenants.cancel_reason IS 'Reden voor annulering (categorie)';
COMMENT ON COLUMN tenants.cancel_feedback IS 'Vrije feedback van de klant bij annulering';
