-- Grant lifetime premium to roryleesemeah@icloud.com

-- Update profiles table (fast path for subscription checks)
UPDATE profiles
SET
  subscription_tier = 'lifetime',
  subscription_status = 'active',
  subscription_started_at = now(),
  subscription_expires_at = '2099-12-31T23:59:59Z',
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'roryleesemeah@icloud.com'
);

-- Also set role to admin
UPDATE profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'roryleesemeah@icloud.com'
);

-- Delete any existing subscription records for this user
DELETE FROM subscriptions
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'roryleesemeah@icloud.com'
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
WHERE email = 'roryleesemeah@icloud.com';

-- Verify the grant
SELECT p.subscription_tier, p.subscription_status, p.role, s.status as sub_status, s.plan_type
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.user_id
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'roryleesemeah@icloud.com');
