-- Add remaining profile columns that the Stripe webhook references
-- These were missing from the live schema

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Index for Stripe customer lookups (used by webhook handlers)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
