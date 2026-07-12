-- Add columns to subscriptions table for RevenueCat IAP support
-- These are additive-only; existing Stripe data is not affected

-- Provider column to distinguish between Stripe (web) and RevenueCat (native IAP)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe';

-- product_id for the purchased product identifier (used by both Stripe and RevenueCat)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS product_id text;

-- store: APP_STORE, PLAY_STORE, STRIPE, etc.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS store text;

-- environment: PRODUCTION or SANDBOX
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS environment text DEFAULT 'PRODUCTION';

-- transaction_id from the store receipt
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS transaction_id text;

-- Index for RevenueCat webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON public.subscriptions(provider);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id ON public.subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction_id ON public.subscriptions(transaction_id);
