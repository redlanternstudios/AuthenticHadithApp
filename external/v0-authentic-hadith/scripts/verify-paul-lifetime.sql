-- Verification Script for Paul Semeah Lifetime Premium Setup
-- Run this after Paul has signed up to confirm his lifetime access

-- Check 1: Verify trigger exists
SELECT 
  'TRIGGER CHECK' as check_type,
  COUNT(*) as trigger_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ PASS: Trigger exists'
    ELSE '✗ FAIL: Trigger not found'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'auto_grant_lifetime_on_profile_insert';

-- Check 2: Verify Paul's account exists
SELECT 
  'ACCOUNT CHECK' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ PASS: Paul account found'
    ELSE '✗ FAIL: Paul account not found'
  END as status,
  COUNT(*) as account_count,
  MAX(au.email) as email
FROM auth.users au
WHERE au.email = 'paul.semeah@siemens.com';

-- Check 3: Verify Paul's profile and subscription status
SELECT 
  'PROFILE & SUBSCRIPTION CHECK' as check_type,
  p.name,
  au.email,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_expires_at,
  CASE 
    WHEN p.subscription_tier = 'lifetime' 
         AND p.subscription_status = 'active'
         AND p.subscription_expires_at >= '2099-01-01'::timestamp with time zone
    THEN '✓ PASS: Lifetime premium active'
    ELSE '✗ FAIL: Subscription not properly configured'
  END as status
FROM profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'paul.semeah@siemens.com';

-- Check 4: Function exists
SELECT 
  'FUNCTION CHECK' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ PASS: Auto-grant function exists'
    ELSE '✗ FAIL: Function not found'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_grant_lifetime_for_vip_emails'
  AND n.nspname = 'public';
