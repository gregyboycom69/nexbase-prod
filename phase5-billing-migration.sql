-- Phase 5: Billing and Subscriptions Migration
-- Run this SQL in Supabase SQL Editor

-- Add billing columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS workspace_limit INT DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pages_limit INT DEFAULT 5;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rows_limit INT DEFAULT 1000;

-- Create billing events table
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT,
  plan TEXT,
  amount INT,
  currency TEXT DEFAULT 'eur',
  stripe_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on billing_events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Policy for billing_events
DROP POLICY IF EXISTS billing_owner ON billing_events;
CREATE POLICY billing_owner ON billing_events FOR ALL USING (user_id = auth.uid());

-- Update existing users with plan limits
UPDATE user_profiles SET
  workspace_limit = CASE plan
    WHEN 'starter' THEN 1
    WHEN 'builder' THEN 10
    WHEN 'agency' THEN 999
    ELSE 1
  END,
  pages_limit = CASE plan
    WHEN 'starter' THEN 5
    WHEN 'builder' THEN 999
    WHEN 'agency' THEN 999
    ELSE 5
  END,
  rows_limit = CASE plan
    WHEN 'starter' THEN 1000
    WHEN 'builder' THEN 50000
    WHEN 'agency' THEN 9999999
    ELSE 1000
  END
WHERE workspace_limit IS NULL OR pages_limit IS NULL OR rows_limit IS NULL;

COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN user_profiles.plan_expires_at IS 'When the current paid plan expires';
COMMENT ON COLUMN user_profiles.trial_ends_at IS 'When the free trial period ends';
COMMENT ON COLUMN user_profiles.workspace_limit IS 'Maximum workspaces allowed';
COMMENT ON COLUMN user_profiles.pages_limit IS 'Maximum pages per workspace';
COMMENT ON COLUMN user_profiles.rows_limit IS 'Maximum data rows per month';
