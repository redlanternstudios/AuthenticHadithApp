-- Create stripe_events table for idempotent webhook processing
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY, -- Stripe event ID (evt_...)
  type text NOT NULL,
  processed_at timestamp with time zone DEFAULT now()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at ON public.stripe_events(processed_at);

-- Enable RLS (only service role writes)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.stripe_events
  FOR ALL USING (auth.role() = 'service_role');
