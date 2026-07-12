-- Add columns needed by the RevenueCat webhook to the subscriptions table
-- These are safe IF NOT EXISTS / ADD COLUMN IF NOT EXISTS operations

-- provider column to distinguish stripe vs revenuecat
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe';

-- store column (app_store, play_store, stripe)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS store text;

-- environment (production, sandbox)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS environment text DEFAULT 'production';

-- transaction_id for store receipts
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS transaction_id text;

-- product_id to track which product was purchased
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS product_id text;

-- Ensure profiles has the columns the webhook updates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_provider
  ON subscriptions(user_id, provider);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
