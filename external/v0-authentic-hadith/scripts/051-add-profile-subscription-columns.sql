-- Add subscription tier columns to profiles for fast lookups
-- These are updated by both Stripe and RevenueCat webhooks

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Index for subscription tier lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
