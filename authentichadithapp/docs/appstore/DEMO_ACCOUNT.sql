-- =============================================================================
-- DEMO_ACCOUNT.sql
-- DO NOT RUN AUTOMATICALLY — KP runs this manually in Supabase SQL editor
--
-- Purpose: Creates the Apple reviewer demo account with full premium access
-- for App Review of Authentic Hadith v1.0.
--
-- Prerequisites before running:
--   1. The Supabase project must be live (production).
--   2. Run this entire script in the Supabase SQL Editor.
--   3. After running, log into the RevenueCat dashboard and grant a
--      Promotional Entitlement named "premium" to the user whose RC App User
--      ID matches the UUID below ('00000000-0000-0000-0000-000000000001').
--      RC App User ID is set to the Supabase user UUID by RevenueCatProvider.tsx.
--
-- Credentials the reviewer will use:
--   Email:    apple.reviewer@authentichadith.app
--   Password: AppleReview2026!
--
-- PREMIUM NOTE:
--   The app checks premium status exclusively via RevenueCat
--   (lib/revenuecat/RevenueCatProvider.tsx, entitlement ID = 'premium').
--   There is NO is_premium column in the profiles table — Supabase does not
--   gate any premium feature. The SQL below creates a valid authenticated
--   account only. KP must separately grant the "premium" entitlement in the
--   RevenueCat dashboard under Customers > [UUID below] > Grant Entitlement.
-- =============================================================================

-- Step 1: Create the auth user
-- Uses a fixed UUID so the RevenueCat Promotional Entitlement can be
-- pre-granted before review begins.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'apple.reviewer@authentichadith.app',
  -- Password hashed inline via pgcrypto. No placeholder, no two-step.
  -- Supabase ships pgcrypto enabled; crypt()+gen_salt('bf') = bcrypt hash GoTrue accepts.
  -- If you hit "function crypt does not exist", prefix with the schema: extensions.crypt(...).
  -- Rotate this password after each review cycle.
  crypt('AppleReview2026!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Apple Reviewer"}',
  false,
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create the profile row
-- Column names sourced from AuthProvider.tsx:75-82 (the live signUp INSERT).
-- Schema: id (uuid), username (text), avatar_url (text nullable), role (text)
INSERT INTO public.profiles (
  id,
  username,
  avatar_url,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Apple Reviewer',
  null,
  'user'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- AFTER RUNNING THIS SQL:
--
-- 1. Open RevenueCat dashboard: https://app.revenuecat.com
-- 2. Navigate to: Customers > search App User ID:
--    00000000-0000-0000-0000-000000000001
-- 3. Click "Grant Promotional Entitlement"
-- 4. Select entitlement: "premium"
-- 5. Set duration: "Lifetime" (or a date past the review window)
-- 6. Save.
--
-- The reviewer can then log in, and isPro will return true on first launch.
-- =============================================================================
