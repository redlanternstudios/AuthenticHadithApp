-- Immediate Lifetime Premium Grant for Paul Semeah
-- paul.semeah@siemens.com
-- Execution Date: June 27, 2026
-- Status: LIVE DEPLOYMENT

BEGIN;

-- Step 1: Update auth.users email if he exists
UPDATE auth.users
SET
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'paul.semeah@siemens.com';

-- Step 2: Update profiles table with lifetime subscription
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

-- Step 3: Delete any existing subscription records (clean slate)
DELETE FROM subscriptions
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paul.semeah@siemens.com'
);

-- Step 4: Insert fresh lifetime subscription record
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
)
ON CONFLICT DO NOTHING;

COMMIT;

-- Verification query - run this to confirm
SELECT 
  'VERIFICATION RESULTS' as step,
  u.email,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_expires_at,
  s.status as subscription_status,
  s.plan_type
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'paul.semeah@siemens.com';
