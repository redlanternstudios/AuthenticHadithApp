-- Fix stripe_events table to match the webhook handler's expected columns
-- The webhook writes stripe_event_id, event_type, payload but the table only has id, type, processed_at

ALTER TABLE stripe_events ADD COLUMN IF NOT EXISTS stripe_event_id text;
ALTER TABLE stripe_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE stripe_events ADD COLUMN IF NOT EXISTS payload jsonb;

-- Create index for idempotency lookups
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON stripe_events (stripe_event_id);
