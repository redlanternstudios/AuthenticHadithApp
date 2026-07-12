-- Create ai_usage table for tracking daily/monthly AI query counts
CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  query_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage' AND policyname = 'ai_usage_select_own'
  ) THEN
    CREATE POLICY ai_usage_select_own ON ai_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage' AND policyname = 'ai_usage_insert_own'
  ) THEN
    CREATE POLICY ai_usage_insert_own ON ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage' AND policyname = 'ai_usage_update_own'
  ) THEN
    CREATE POLICY ai_usage_update_own ON ai_usage FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role needs full access for the RPC functions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage' AND policyname = 'ai_usage_service_role'
  ) THEN
    CREATE POLICY ai_usage_service_role ON ai_usage FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- check_user_quota: Returns quota info for a user based on their subscription tier
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier text;
  v_daily_limit integer;
  v_monthly_limit integer;
  v_daily_used integer;
  v_monthly_used integer;
  v_allowed boolean;
BEGIN
  -- Determine user tier from subscriptions table
  SELECT
    CASE
      WHEN s.status IN ('active', 'trialing') AND s.plan_type = 'lifetime' THEN 'lifetime'
      WHEN s.status IN ('active', 'trialing') THEN 'premium'
      ELSE 'free'
    END INTO v_tier
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing', 'lifetime')
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Default to free if no subscription found
  IF v_tier IS NULL THEN
    -- Also check profiles.subscription_tier as fallback
    SELECT COALESCE(p.subscription_tier, 'free') INTO v_tier
    FROM profiles p
    WHERE p.user_id = p_user_id;

    IF v_tier IS NULL THEN
      v_tier := 'free';
    END IF;
  END IF;

  -- Set limits based on tier
  CASE v_tier
    WHEN 'lifetime' THEN
      v_daily_limit := 100;
      v_monthly_limit := 3000;
    WHEN 'premium' THEN
      v_daily_limit := 50;
      v_monthly_limit := 1500;
    ELSE -- free
      v_daily_limit := 5;
      v_monthly_limit := 30;
  END CASE;

  -- Count today's usage
  SELECT COALESCE(SUM(query_count), 0) INTO v_daily_used
  FROM ai_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  -- Count this month's usage
  SELECT COALESCE(SUM(query_count), 0) INTO v_monthly_used
  FROM ai_usage
  WHERE user_id = p_user_id
    AND usage_date >= date_trunc('month', CURRENT_DATE)::date;

  -- Determine if allowed
  v_allowed := (v_daily_used < v_daily_limit) AND (v_monthly_used < v_monthly_limit);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'daily_remaining', GREATEST(v_daily_limit - v_daily_used, 0),
    'monthly_remaining', GREATEST(v_monthly_limit - v_monthly_used, 0),
    'daily_limit', v_daily_limit,
    'monthly_limit', v_monthly_limit,
    'tier', v_tier
  );
END;
$$;

-- increment_ai_usage: Bumps today's query count by 1
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_usage (user_id, usage_date, query_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    query_count = ai_usage.query_count + 1,
    updated_at = now();
END;
$$;
