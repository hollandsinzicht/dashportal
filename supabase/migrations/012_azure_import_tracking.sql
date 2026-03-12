-- ============================================
-- 012: Azure AD import tracking kolommen
-- ============================================
-- Voegt tracking velden toe aan tenant_users voor Azure AD import.
-- azure_synced_at: wanneer de gebruiker voor het laatst vanuit Azure AD is gesynchroniseerd
-- azure_department: afdeling uit Azure AD (informatief)

ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS azure_synced_at TIMESTAMPTZ;
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS azure_department TEXT;

-- Index voor efficiënte lookups op azure_oid binnen een tenant
CREATE INDEX IF NOT EXISTS idx_tenant_users_azure_oid
  ON tenant_users(tenant_id, azure_oid) WHERE azure_oid IS NOT NULL;

-- Activity log tabel (als deze nog niet bestaat)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_tenant
  ON activity_log(tenant_id, created_at DESC);
