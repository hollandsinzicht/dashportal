-- ============================================================
-- Agency/Reseller Model — Migratie 001
-- ============================================================
-- Voegt het agency datamodel toe aan DashPortal.
-- Alle statements zijn idempotent (veilig om opnieuw uit te voeren).
-- ============================================================

-- ─── 1. Agencies tabel ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1E3A5F',
  accent_color TEXT DEFAULT '#F59E0B',

  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Facturatie
  billing_email TEXT,
  company_details JSONB DEFAULT '{}',  -- KvK, BTW-nummer, adres, etc.

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_owner_email ON agencies(owner_email);
CREATE INDEX IF NOT EXISTS idx_agencies_stripe_customer ON agencies(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ─── 2. Agency Users tabel ───────────────────────────────────

CREATE TABLE IF NOT EXISTS agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  invited_by TEXT,
  invited_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: 1 email per agency
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_users_agency_id_email_key') THEN
    ALTER TABLE agency_users ADD CONSTRAINT agency_users_agency_id_email_key UNIQUE (agency_id, email);
  END IF;
END $$;

-- Check constraint: geldige rollen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_users_role_check') THEN
    ALTER TABLE agency_users ADD CONSTRAINT agency_users_role_check
      CHECK (role IN ('owner', 'admin', 'viewer'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agency_users_agency ON agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_email ON agency_users(email);

-- ─── 3. Agency Pricing Tiers tabel ──────────────────────────

CREATE TABLE IF NOT EXISTS agency_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  min_users INTEGER NOT NULL,
  max_users INTEGER,  -- NULL = onbeperkt
  price_per_month NUMERIC(10,2) NOT NULL,
  label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_pricing_tiers_agency ON agency_pricing_tiers(agency_id);

-- ─── 4. Agency Invoice Lines tabel ──────────────────────────

CREATE TABLE IF NOT EXISTS agency_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  user_count INTEGER NOT NULL,
  tier_label TEXT,
  amount NUMERIC(10,2) NOT NULL,
  stripe_invoice_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_invoice_lines_agency ON agency_invoice_lines(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_invoice_lines_tenant ON agency_invoice_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agency_invoice_lines_period ON agency_invoice_lines(agency_id, period_start);

-- ─── 5. Tenants tabel uitbreiden ─────────────────────────────

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_owner TEXT DEFAULT 'self';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS client_can_invite_users BOOLEAN DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS client_can_edit_branding BOOLEAN DEFAULT true;

-- FK naar agencies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_agency_id_fkey') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_agency_id_fkey
      FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Check constraint: billing_owner waarden
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_billing_owner_check') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_billing_owner_check
      CHECK (billing_owner IN ('self', 'agency'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_agency ON tenants(agency_id) WHERE agency_id IS NOT NULL;

-- ─── 6. RLS Policies ────────────────────────────────────────

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_invoice_lines ENABLE ROW LEVEL SECURITY;

-- Helper functie: agency IDs van de huidige gebruiker
CREATE OR REPLACE FUNCTION public.get_my_agency_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT agency_id FROM public.agency_users
  WHERE email = (auth.jwt() ->> 'email')
    AND is_active = true;
$$;

-- agencies policies
DROP POLICY IF EXISTS "Service role full access on agencies" ON agencies;
CREATE POLICY "Service role full access on agencies" ON agencies
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read their agencies" ON agencies;
CREATE POLICY "Users can read their agencies" ON agencies
  FOR SELECT USING (id IN (SELECT public.get_my_agency_ids()));

-- agency_users policies
DROP POLICY IF EXISTS "Service role full access on agency_users" ON agency_users;
CREATE POLICY "Service role full access on agency_users" ON agency_users
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read agency_users in their agency" ON agency_users;
CREATE POLICY "Users can read agency_users in their agency" ON agency_users
  FOR SELECT USING (agency_id IN (SELECT public.get_my_agency_ids()));

-- agency_pricing_tiers policies
DROP POLICY IF EXISTS "Service role full access on agency_pricing_tiers" ON agency_pricing_tiers;
CREATE POLICY "Service role full access on agency_pricing_tiers" ON agency_pricing_tiers
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read pricing tiers in their agency" ON agency_pricing_tiers;
CREATE POLICY "Users can read pricing tiers in their agency" ON agency_pricing_tiers
  FOR SELECT USING (agency_id IN (SELECT public.get_my_agency_ids()));

-- agency_invoice_lines policies
DROP POLICY IF EXISTS "Service role full access on agency_invoice_lines" ON agency_invoice_lines;
CREATE POLICY "Service role full access on agency_invoice_lines" ON agency_invoice_lines
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can read invoice lines in their agency" ON agency_invoice_lines;
CREATE POLICY "Users can read invoice lines in their agency" ON agency_invoice_lines
  FOR SELECT USING (agency_id IN (SELECT public.get_my_agency_ids()));

-- ─── 7. Updated_at trigger ───────────────────────────────────

-- Hergebruik bestaande update_updated_at() functie (aanwezig in schema.sql)
DROP TRIGGER IF EXISTS set_agencies_updated_at ON agencies;
CREATE TRIGGER set_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
