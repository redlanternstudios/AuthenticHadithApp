-- RPC Function for Redeeming Promo Codes
-- Atomically validates and redeems a promo code, updating user premium status.
--
-- Aligned with the v0-authentic-hadith subscription system:
--   profiles.subscription_tier  (enum: 'free' | 'premium' | 'lifetime')
--   profiles.subscription_status (enum: 'active' | 'trialing' | 'cancelled' | 'expired' | 'past_due')
--   profiles.subscription_expires_at (TIMESTAMPTZ; NULL for lifetime)
-- Lifetime users are preserved (no downgrade); free/premium upgrade to premium
-- with their expiry extended by the promo's premium_days.

CREATE OR REPLACE FUNCTION redeem_promo_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo_code      promo_codes%ROWTYPE;
  v_user_id         UUID;
  v_current_tier    TEXT;
  v_current_expires TIMESTAMPTZ;
  v_new_tier        TEXT;
  v_new_expires     TIMESTAMPTZ;
  v_result          JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT * INTO v_promo_code
  FROM promo_codes
  WHERE code = UPPER(p_code) AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive promo code';
  END IF;

  IF v_promo_code.expires_at IS NOT NULL AND v_promo_code.expires_at < NOW() THEN
    RAISE EXCEPTION 'Promo code has expired';
  END IF;

  IF v_promo_code.max_uses IS NOT NULL AND v_promo_code.current_uses >= v_promo_code.max_uses THEN
    RAISE EXCEPTION 'Promo code has reached maximum uses';
  END IF;

  IF EXISTS (
    SELECT 1 FROM redemptions
    WHERE user_id = v_user_id AND promo_code_id = v_promo_code.id
  ) THEN
    RAISE EXCEPTION 'You have already redeemed this code';
  END IF;

  SELECT subscription_tier, subscription_expires_at
    INTO v_current_tier, v_current_expires
  FROM profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_current_tier = 'lifetime' THEN
    v_new_tier    := 'lifetime';
    v_new_expires := NULL;
  ELSE
    v_new_tier    := 'premium';
    v_new_expires := GREATEST(COALESCE(v_current_expires, NOW()), NOW())
                     + (v_promo_code.premium_days || ' days')::INTERVAL;
  END IF;

  UPDATE profiles
  SET
    subscription_tier       = v_new_tier,
    subscription_status     = 'active',
    subscription_expires_at = v_new_expires,
    subscription_started_at = COALESCE(subscription_started_at, NOW()),
    updated_at              = NOW()
  WHERE id = v_user_id;

  INSERT INTO redemptions (user_id, promo_code_id)
  VALUES (v_user_id, v_promo_code.id);

  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = v_promo_code.id;

  v_result := json_build_object(
    'success',       true,
    'premium_days',  v_promo_code.premium_days,
    'new_tier',      v_new_tier,
    'new_expires_at', v_new_expires,
    'message',       'Promo code redeemed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION redeem_promo_code(TEXT) TO authenticated;
