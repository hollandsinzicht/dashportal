-- ============================================
-- Migration 007: Stripe Subscriptions
-- ============================================
-- Voegt Stripe-gerelateerde kolommen toe aan tenants voor abonnementsbeheer.
-- Ondersteunt 4 tiers: starter, business, scale, enterprise
-- Statussen: trialing, active, past_due, canceled, suspended

-- ─── Stripe identifiers ───
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- ─── Trial en billing cycle tracking ───
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- ─── Update subscription_plan constraint voor 4 tiers ───
-- Drop oude constraint als die bestaat
DO $$
BEGIN
  ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_subscription_plan_check;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_plan_check
  CHECK (subscription_plan IN ('starter', 'business', 'scale', 'enterprise'));

-- ─── Update subscription_status constraint ───
DO $$
BEGIN
  ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_subscription_status_check;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended'));

-- ─── Indexes voor snelle webhook lookups ───
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer
  ON tenants(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription
  ON tenants(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
