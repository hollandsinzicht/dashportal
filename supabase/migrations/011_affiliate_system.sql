-- ============================================
-- BI Portal — Migration 011
-- Affiliate / Reseller systeem
-- ============================================

-- ─── Affiliates tabel ───
-- Elk affiliate account is gekoppeld aan een tenant (de partner zelf)
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,    -- bijv. "PBR-ACME" of "REF-A1B2C3"
  commission_percent NUMERIC(5,2) DEFAULT 15.00,  -- 15% standaard
  commission_type TEXT DEFAULT 'recurring',  -- 'one_time' | 'recurring'
  status TEXT DEFAULT 'active',            -- 'active' | 'paused' | 'suspended'
  payout_method TEXT DEFAULT 'bank_transfer',  -- 'bank_transfer' | 'stripe'
  payout_details JSONB DEFAULT '{}',       -- IBAN, Stripe account ID, etc.
  total_earned NUMERIC(10,2) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Affiliate referrals tabel ───
-- Elke conversie (tenant die via affiliate is aangemeld)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  status TEXT DEFAULT 'signed_up',  -- 'signed_up' | 'trialing' | 'active' | 'canceled'
  commission_amount NUMERIC(10,2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,          -- Wanneer eerste betaling binnenkwam
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Affiliate payouts tabel ───
-- Track alle uitbetalingen aan affiliates
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'paid' | 'failed'
  payout_reference TEXT,           -- Bank referentie of Stripe transfer ID
  referral_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Referral tracking op tenants tabel ───
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_tenant_id ON affiliates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_tenant ON affiliate_referrals(referred_tenant_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tenants_referred_by ON tenants(referred_by_affiliate_id);

-- ─── RLS ───
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Service role: volledige toegang
CREATE POLICY "Service role full access on affiliates"
  ON affiliates FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on affiliate_referrals"
  ON affiliate_referrals FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on affiliate_payouts"
  ON affiliate_payouts FOR ALL
  USING (auth.role() = 'service_role');

-- Affiliates kunnen hun eigen record lezen
CREATE POLICY "Affiliates can read own record"
  ON affiliates FOR SELECT
  USING (
    tenant_id IN (SELECT public.get_my_tenant_ids())
    OR email = (auth.jwt() ->> 'email')
  );

-- Affiliates kunnen hun eigen referrals lezen
CREATE POLICY "Affiliates can read own referrals"
  ON affiliate_referrals FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates
      WHERE tenant_id IN (SELECT public.get_my_tenant_ids())
         OR email = (auth.jwt() ->> 'email')
    )
  );

-- Affiliates kunnen hun eigen payouts lezen
CREATE POLICY "Affiliates can read own payouts"
  ON affiliate_payouts FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates
      WHERE tenant_id IN (SELECT public.get_my_tenant_ids())
         OR email = (auth.jwt() ->> 'email')
    )
  );

COMMENT ON TABLE affiliates IS 'Affiliate / reseller partners die klanten doorverwijzen';
COMMENT ON TABLE affiliate_referrals IS 'Individuele doorverwijzingen en conversies';
COMMENT ON TABLE affiliate_payouts IS 'Uitbetalingen aan affiliate partners';
