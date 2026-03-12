-- ============================================
-- Migration 006: Meta Sync Schedule
-- ============================================
-- Voegt een sync schedule kolom toe aan tenants voor automatische metadata synchronisatie.

-- Schedule opties:
-- 'manual'    — Alleen handmatig (standaard)
-- 'daily'     — Dagelijks (1x per 24 uur)
-- 'twice_daily' — 2x per dag (elke 12 uur)
-- 'weekly'    — Wekelijks (1x per 7 dagen)
-- 'hourly'    — Elk uur

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS meta_sync_schedule TEXT DEFAULT 'manual'
  CHECK (meta_sync_schedule IN ('manual', 'hourly', 'twice_daily', 'daily', 'weekly'));

-- Track wanneer de volgende sync gepland is (voor efficiënte cron queries)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS meta_next_sync_at TIMESTAMPTZ;

-- Index voor cron: vind tenants die een sync nodig hebben
CREATE INDEX IF NOT EXISTS idx_tenants_next_sync
  ON tenants(meta_next_sync_at)
  WHERE meta_sync_schedule != 'manual' AND is_active = true;
