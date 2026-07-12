-- ============================================
-- Migration 012: Fix RLS Policies + Auto Streak Tracking
-- Run this in Supabase SQL Editor or via CLI
-- ============================================
-- ============================================
-- PART 1: Fix saved_hadiths UPDATE Policy
-- ============================================
-- This was missing and breaks inline note/folder editing
-- First, check if policy exists and drop it to avoid conflicts
DROP POLICY IF EXISTS "Users can update own saved" ON saved_hadiths;
-- Create the UPDATE policy
CREATE POLICY "Users can update own saved" ON saved_hadiths FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- ============================================
-- PART 2: Auto Streak Tracking System
-- ============================================
-- Ensure user_streaks table exists with correct structure
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
-- Enable RLS on user_streaks if not already enabled
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
-- Function: Update user streak on activity
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak() RETURNS TRIGGER AS $$
DECLARE v_user_id uuid;
v_today date := CURRENT_DATE;
v_last_active date;
v_current_streak integer;
v_longest_streak integer;
v_total_days integer;
BEGIN -- Get user_id from the trigger source
IF TG_TABLE_NAME = 'hadith_views' THEN v_user_id := NEW.user_id;
ELSIF TG_TABLE_NAME = 'reading_progress' THEN v_user_id := NEW.user_id;
ELSIF TG_TABLE_NAME = 'reflections' THEN v_user_id := NEW.user_id;
ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN v_user_id := NEW.user_id;
ELSE RETURN NEW;
END IF;
-- Get current streak data
SELECT last_active_date,
  current_streak,
  longest_streak,
  total_days_active INTO v_last_active,
  v_current_streak,
  v_longest_streak,
  v_total_days
FROM user_streaks
WHERE user_id = v_user_id;
-- If no streak record exists, create one
IF NOT FOUND THEN
INSERT INTO user_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_active_date,
    total_days_active
  )
VALUES (v_user_id, 1, 1, v_today, 1);
RETURN NEW;
END IF;
-- If already active today, no update needed
IF v_last_active = v_today THEN RETURN NEW;
END IF;
-- Calculate new streak
IF v_last_active = v_today - INTERVAL '1 day' THEN -- Consecutive day: increment streak
v_current_streak := v_current_streak + 1;
v_total_days := v_total_days + 1;
-- Update longest streak if current exceeds it
IF v_current_streak > v_longest_streak THEN v_longest_streak := v_current_streak;
END IF;
ELSIF v_last_active < v_today - INTERVAL '1 day' THEN -- Streak broken: reset to 1
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
WHERE user_id = v_user_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- Triggers: Auto-update streaks on activity
-- ============================================
-- Trigger for hadith_views
DROP TRIGGER IF EXISTS update_streak_on_hadith_view ON hadith_views;
CREATE TRIGGER update_streak_on_hadith_view
AFTER
INSERT ON hadith_views FOR EACH ROW EXECUTE FUNCTION update_user_streak();
-- Trigger for reading_progress
DROP TRIGGER IF EXISTS update_streak_on_reading_progress ON reading_progress;
CREATE TRIGGER update_streak_on_reading_progress
AFTER
INSERT ON reading_progress FOR EACH ROW EXECUTE FUNCTION update_user_streak();
-- Trigger for reflections
DROP TRIGGER IF EXISTS update_streak_on_reflection ON reflections;
CREATE TRIGGER update_streak_on_reflection
AFTER
INSERT ON reflections FOR EACH ROW EXECUTE FUNCTION update_user_streak();
-- Trigger for quiz_attempts
DROP TRIGGER IF EXISTS update_streak_on_quiz ON quiz_attempts;
CREATE TRIGGER update_streak_on_quiz
AFTER
INSERT ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION update_user_streak();
-- ============================================
-- Initialize streaks for existing users
-- ============================================
-- This populates streaks for users who have activity but no streak record
INSERT INTO user_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_active_date,
    total_days_active
  )
SELECT DISTINCT hv.user_id,
  1 as current_streak,
  1 as longest_streak,
  MAX(hv.viewed_at::date) as last_active_date,
  COUNT(DISTINCT hv.viewed_at::date) as total_days_active
FROM hadith_views hv
WHERE hv.user_id NOT IN (
    SELECT user_id
    FROM user_streaks
    WHERE user_id IS NOT NULL
  )
GROUP BY hv.user_id ON CONFLICT (user_id) DO NOTHING;
-- ============================================
-- Verification Queries (run to confirm setup)
-- ============================================
-- Uncomment these to verify the migration worked:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'saved_hadiths';
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
-- SELECT * FROM user_streaks LIMIT 5;
-- ============================================
-- Success Message
-- ============================================
DO $$ BEGIN RAISE NOTICE '✅ Migration 012 complete: RLS UPDATE policy added, streak tracking enabled';
END $$;
