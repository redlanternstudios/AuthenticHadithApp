-- Grant lifetime premium to paul.semeah@siemens.com
-- This migration sets up full lifetime access

BEGIN;

-- Update profiles table with lifetime subscription
UPDATE profiles
SET
  subscription_tier = 'lifetime',
  subscription_status = 'active',
  subscription_started_at = now(),
  subscription_expires_at = '2099-12-31T23:59:59Z',
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paul.semeah@siemens.com'
);

-- Delete any existing subscription records (clean slate)
DELETE FROM subscriptions
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paul.semeah@siemens.com'
);

-- Insert lifetime subscription record
INSERT INTO subscriptions (
  user_id,
  status,
  plan_type,
  provider,
  product_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
)
SELECT
  id,
  'lifetime',
  'lifetime',
  'manual',
  'lifetime_premium',
  now(),
  '2099-12-31T23:59:59Z',
  false,
  now(),
  now()
FROM auth.users
WHERE email = 'paul.semeah@siemens.com'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = auth.users.id
);

COMMIT;
