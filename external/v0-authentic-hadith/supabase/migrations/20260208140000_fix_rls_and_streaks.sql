-- ============================================
-- Migration: User Streak Tracking System
-- Creates user_streaks table and core functionality
-- ============================================

-- ============================================
-- PART 1: Create user_streaks table
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  total_days_active integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_streaks
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_streaks
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
CREATE POLICY "Users can view own streaks" ON user_streaks FOR
SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR
INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
CREATE POLICY "Users can update own streaks" ON user_streaks FOR
UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PART 2: Fix saved_hadith UPDATE Policy (if table exists)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_hadith') THEN
    DROP POLICY IF EXISTS "Users can update own saved" ON saved_hadith;
    CREATE POLICY "Users can update own saved" ON saved_hadith FOR
    UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- PART 3: Streak update function (generic)
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak_for_user(p_user_id uuid) 
RETURNS void AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_last_active date;
  v_current_streak integer;
  v_longest_streak integer;
  v_total_days integer;
BEGIN
  -- Get current streak data
  SELECT last_active_date, current_streak, longest_streak, total_days_active 
  INTO v_last_active, v_current_streak, v_longest_streak, v_total_days
  FROM user_streaks
  WHERE user_id = p_user_id;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, total_days_active)
    VALUES (p_user_id, 1, 1, v_today, 1);
    RETURN;
  END IF;

  -- If already active today, no update needed
  IF v_last_active = v_today THEN 
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_active = v_today - INTERVAL '1 day' THEN
    -- Consecutive day: increment streak
    v_current_streak := v_current_streak + 1;
    v_total_days := v_total_days + 1;
    IF v_current_streak > v_longest_streak THEN 
      v_longest_streak := v_current_streak;
    END IF;
  ELSIF v_last_active < v_today - INTERVAL '1 day' THEN
    -- Streak broken: reset to 1
    v_current_streak := 1;
    v_total_days := v_total_days + 1;
  END IF;

  -- Update the streak record
  UPDATE user_streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_active_date = v_today,
      total_days_active = v_total_days,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Success Message
-- ============================================
-- Migration completed successfully!
-- To update a user's streak from application code, call:
-- SELECT update_user_streak_for_user('user-uuid-here');
