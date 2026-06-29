-- Create subscriptions table to track Stripe subscription status
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'inactive',
  plan_type text, -- 'monthly-intro', 'monthly-premium', 'annual-premium', 'lifetime-access'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for webhook writes)
CREATE POLICY "Service role full access" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');
