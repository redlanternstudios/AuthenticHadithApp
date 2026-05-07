-- RPC Function for Redeeming Promo Codes
-- Atomically validates and redeems a promo code, updating user premium status

CREATE OR REPLACE FUNCTION redeem_promo_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo_code promo_codes%ROWTYPE;
  v_user_id UUID;
  v_current_premium_end TIMESTAMPTZ;
  v_new_premium_end TIMESTAMPTZ;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Find and lock the promo code
  SELECT * INTO v_promo_code
  FROM promo_codes
  WHERE code = UPPER(p_code)
    AND is_active = true
  FOR UPDATE;

  -- Validate promo code exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive promo code';
  END IF;

  -- Validate expiration
  IF v_promo_code.expires_at IS NOT NULL AND v_promo_code.expires_at < NOW() THEN
    RAISE EXCEPTION 'Promo code has expired';
  END IF;

  -- Validate max uses
  IF v_promo_code.max_uses IS NOT NULL AND v_promo_code.current_uses >= v_promo_code.max_uses THEN
    RAISE EXCEPTION 'Promo code has reached maximum uses';
  END IF;

  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM redemptions
    WHERE user_id = v_user_id AND promo_code_id = v_promo_code.id
  ) THEN
    RAISE EXCEPTION 'You have already redeemed this code';
  END IF;

  -- Get current premium end date from profiles
  SELECT 
    CASE 
      WHEN is_premium AND subscription_status = 'active' THEN 
        COALESCE((
          SELECT current_period_end 
          FROM subscriptions 
          WHERE user_id = v_user_id 
            AND status = 'active' 
          ORDER BY current_period_end DESC 
          LIMIT 1
        ), NOW())
      ELSE NOW()
    END
  INTO v_current_premium_end
  FROM profiles
  WHERE id = v_user_id;

  -- Calculate new premium end date
  v_new_premium_end := GREATEST(v_current_premium_end, NOW()) + (v_promo_code.premium_days || ' days')::INTERVAL;

  -- Update profile
  UPDATE profiles
  SET 
    is_premium = true,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Create redemption record
  INSERT INTO redemptions (user_id, promo_code_id)
  VALUES (v_user_id, v_promo_code.id);

  -- Increment usage count
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = v_promo_code.id;

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'premium_days', v_promo_code.premium_days,
    'new_premium_end', v_new_premium_end,
    'message', 'Promo code redeemed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception with the error message
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION redeem_promo_code(TEXT) TO authenticated;
