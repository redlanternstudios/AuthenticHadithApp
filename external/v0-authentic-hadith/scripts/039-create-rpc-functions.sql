-- Create RPC functions for gamification

-- increment_user_xp: Adds XP to user_stats
CREATE OR REPLACE FUNCTION increment_user_xp(p_user_id uuid, p_xp_amount int)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_xp)
  VALUES (p_user_id, p_xp_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = user_stats.total_xp + p_xp_amount,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_stat: Increment a named stat on user_stats
CREATE OR REPLACE FUNCTION increment_stat(p_user_id uuid, p_stat_name text)
RETURNS void AS $$
BEGIN
  -- Dynamic column update using CASE to prevent SQL injection
  INSERT INTO user_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format(
    'UPDATE user_stats SET %I = COALESCE(%I, 0) + 1, updated_at = now() WHERE user_id = $1',
    p_stat_name, p_stat_name
  ) USING p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_streak: Called to update streak when activity is logged
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_last_active date;
  v_current_streak int;
  v_longest_streak int;
BEGIN
  SELECT last_active_date, current_streak_days, longest_streak_days
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM user_stats
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, current_streak_days, longest_streak_days, last_active_date)
    VALUES (NEW.user_id, 1, 1, CURRENT_DATE);
    RETURN NEW;
  END IF;

  -- If already active today, no change
  IF v_last_active = CURRENT_DATE THEN
    RETURN NEW;
  END IF;

  -- If active yesterday, increment streak
  IF v_last_active = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;

  -- Update longest streak
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE user_stats
  SET current_streak_days = v_current_streak,
      longest_streak_days = v_longest_streak,
      last_active_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_activity_log to auto-update streaks
DROP TRIGGER IF EXISTS trigger_update_streak ON user_activity_log;
CREATE TRIGGER trigger_update_streak
AFTER INSERT ON user_activity_log
FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_user_xp TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stat TO authenticated;
