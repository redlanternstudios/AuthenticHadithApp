-- Grant lifetime premium to specific users
-- Run this after Supabase is unpaused

-- Update roryleesemeah@icloud.com
UPDATE profiles
SET 
  subscription_tier = 'lifetime',
  subscription_status = 'active',
  subscription_expires_at = '2099-12-31T23:59:59Z',
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'roryleesemeah@icloud.com'
);

-- Update crushon64@gmail.com
UPDATE profiles
SET 
  subscription_tier = 'lifetime',
  subscription_status = 'active',
  subscription_expires_at = '2099-12-31T23:59:59Z',
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'crushon64@gmail.com'
);

-- Verify the updates
SELECT 
  p.id,
  u.email,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_expires_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('roryleesemeah@icloud.com', 'crushon64@gmail.com');
