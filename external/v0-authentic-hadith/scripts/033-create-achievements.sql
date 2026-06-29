-- 033: Create achievements + user_achievements + user_stats + activity_log + seed achievements

-- Achievement category enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_category') THEN
    CREATE TYPE achievement_category AS ENUM ('learning', 'consistency', 'social', 'mastery', 'milestone');
  END IF;
END $$;

-- Achievements definition table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text,
  description_en text NOT NULL,
  description_ar text,
  icon text NOT NULL,
  category achievement_category NOT NULL,
  tier int DEFAULT 1,
  criteria jsonb NOT NULL,
  xp_reward int DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS achievements_category_idx ON achievements(category);
CREATE INDEX IF NOT EXISTS achievements_is_active_idx ON achievements(is_active) WHERE is_active = true;

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'achievements_select_all' AND tablename = 'achievements') THEN
    CREATE POLICY "achievements_select_all" ON achievements FOR SELECT TO authenticated, anon USING (is_active = true);
  END IF;
END $$;

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  progress jsonb,
  is_new boolean DEFAULT true,
  viewed_at timestamptz,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS user_achievements_unlocked_at_idx ON user_achievements(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS user_achievements_is_new_idx ON user_achievements(is_new) WHERE is_new = true;

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_achievements_select_own' AND tablename = 'user_achievements') THEN
    CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_achievements_insert_own' AND tablename = 'user_achievements') THEN
    CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_achievements_update_own' AND tablename = 'user_achievements') THEN
    CREATE POLICY "user_achievements_update_own" ON user_achievements FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- User stats (centralized)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hadith_read_count int DEFAULT 0,
  hadith_read_unique int DEFAULT 0,
  stories_completed int DEFAULT 0,
  total_read_time_minutes int DEFAULT 0,
  shares_count int DEFAULT 0,
  bookmarks_count int DEFAULT 0,
  notes_count int DEFAULT 0,
  current_streak_days int DEFAULT 0,
  longest_streak_days int DEFAULT 0,
  last_activity_date date,
  total_xp int DEFAULT 0,
  level int DEFAULT 1,
  achievements_unlocked int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_stats_total_xp_idx ON user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS user_stats_level_idx ON user_stats(level DESC);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_stats_select_own' AND tablename = 'user_stats') THEN
    CREATE POLICY "user_stats_select_own" ON user_stats FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_stats_insert_own' AND tablename = 'user_stats') THEN
    CREATE POLICY "user_stats_insert_own" ON user_stats FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_stats_update_own' AND tablename = 'user_stats') THEN
    CREATE POLICY "user_stats_update_own" ON user_stats FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Level calculation trigger
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS trigger AS $$
BEGIN
  NEW.level := GREATEST(1, FLOOR(SQRT(NEW.total_xp / 100.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_level_trigger ON user_stats;
CREATE TRIGGER update_user_level_trigger BEFORE UPDATE OF total_xp ON user_stats FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Activity log for streak tracking
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  activity_type text NOT NULL,
  item_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Use a unique index instead of constraint for ON CONFLICT support
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_date_type_item ON user_activity_log(user_id, activity_date, activity_type, COALESCE(item_id, ''));

CREATE INDEX IF NOT EXISTS user_activity_log_user_id_idx ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS user_activity_log_activity_date_idx ON user_activity_log(activity_date DESC);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_activity_log_select_own' AND tablename = 'user_activity_log') THEN
    CREATE POLICY "user_activity_log_select_own" ON user_activity_log FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_activity_log_insert_own' AND tablename = 'user_activity_log') THEN
    CREATE POLICY "user_activity_log_insert_own" ON user_activity_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Streak update trigger
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS trigger AS $$
DECLARE
  v_yesterday date;
  v_last_activity date;
  v_current_streak int;
BEGIN
  v_yesterday := CURRENT_DATE - INTERVAL '1 day';

  SELECT last_activity_date, current_streak_days INTO v_last_activity, v_current_streak
  FROM user_stats WHERE user_id = NEW.user_id;

  IF v_last_activity IS NULL THEN
    -- First activity ever: create stats row if needed, set streak to 1
    INSERT INTO user_stats (user_id, current_streak_days, longest_streak_days, last_activity_date)
    VALUES (NEW.user_id, 1, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak_days = 1,
      longest_streak_days = GREATEST(user_stats.longest_streak_days, 1),
      last_activity_date = CURRENT_DATE,
      updated_at = now();
  ELSIF v_last_activity = CURRENT_DATE THEN
    -- Already counted today, do nothing
    NULL;
  ELSIF v_last_activity = v_yesterday THEN
    -- Streak continues
    UPDATE user_stats SET
      current_streak_days = v_current_streak + 1,
      longest_streak_days = GREATEST(longest_streak_days, v_current_streak + 1),
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSE
    -- Streak broken
    UPDATE user_stats SET
      current_streak_days = 1,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_streak_trigger ON user_activity_log;
CREATE TRIGGER update_user_streak_trigger AFTER INSERT ON user_activity_log FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- Helper RPC functions
CREATE OR REPLACE FUNCTION increment_user_xp(p_user_id uuid, p_xp_amount int)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_xp, achievements_unlocked)
  VALUES (p_user_id, p_xp_amount, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_stats.total_xp + p_xp_amount,
    achievements_unlocked = user_stats.achievements_unlocked + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stat(p_user_id uuid, p_stat_name text)
RETURNS void AS $$
BEGIN
  -- Ensure user_stats row exists
  INSERT INTO user_stats (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  
  EXECUTE format(
    'UPDATE user_stats SET %I = %I + 1, updated_at = now() WHERE user_id = $1',
    p_stat_name, p_stat_name
  ) USING p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Seed achievements
INSERT INTO achievements (slug, name_en, description_en, icon, category, tier, criteria, xp_reward, display_order) VALUES
-- Learning
('first_hadith', 'First Steps', 'Read your first hadith', '1', 'learning', 1, '{"type": "hadith_read_count", "threshold": 1}', 10, 1),
('hadith_explorer', 'Hadith Explorer', 'Read 10 hadiths', '2', 'learning', 1, '{"type": "hadith_read_count", "threshold": 10}', 50, 2),
('knowledge_seeker', 'Knowledge Seeker', 'Read 50 hadiths', '3', 'learning', 2, '{"type": "hadith_read_count", "threshold": 50}', 200, 3),
('scholar_in_training', 'Scholar in Training', 'Read 100 hadiths', '4', 'learning', 2, '{"type": "hadith_read_count", "threshold": 100}', 500, 4),
('hadith_master', 'Hadith Master', 'Read 500 hadiths', '5', 'learning', 3, '{"type": "hadith_read_count", "threshold": 500}', 2000, 5),
('first_note', 'Thoughtful Reader', 'Write your first note on a hadith', '6', 'learning', 1, '{"type": "notes_count", "threshold": 1}', 20, 6),
('note_taker', 'Note Taker', 'Write 10 notes', '7', 'learning', 2, '{"type": "notes_count", "threshold": 10}', 100, 7),
-- Consistency
('daily_devotion', 'Daily Devotion', 'Use the app 3 days in a row', '8', 'consistency', 1, '{"type": "streak_days", "threshold": 3}', 30, 10),
('weekly_warrior', 'Weekly Warrior', 'Use the app 7 days in a row', '9', 'consistency', 2, '{"type": "streak_days", "threshold": 7}', 100, 11),
('monthly_dedication', 'Monthly Dedication', 'Use the app 30 days in a row', '10', 'consistency', 3, '{"type": "streak_days", "threshold": 30}', 1000, 12),
('quarterly_scholar', 'Quarterly Scholar', 'Use the app 90 days in a row', '11', 'consistency', 4, '{"type": "streak_days", "threshold": 90}', 3000, 13),
-- Social
('first_share', 'First Share', 'Share a hadith or story', '12', 'social', 1, '{"type": "shares", "threshold": 1}', 20, 20),
('spreading_knowledge', 'Spreading Knowledge', 'Share 10 times', '13', 'social', 2, '{"type": "shares", "threshold": 10}', 150, 21),
('community_builder', 'Community Builder', 'Share 50 times', '14', 'social', 3, '{"type": "shares", "threshold": 50}', 500, 22),
-- Mastery
('story_complete', 'Story Complete', 'Complete a companion story', '15', 'mastery', 1, '{"type": "story_complete", "threshold": 1}', 100, 30),
('all_companions', 'All Companions', 'Complete all companion stories', '16', 'mastery', 3, '{"type": "all_stories_complete"}', 1000, 31),
('first_bookmark', 'Collector', 'Save your first hadith', '17', 'mastery', 1, '{"type": "bookmarks_count", "threshold": 1}', 10, 32),
('avid_collector', 'Avid Collector', 'Save 25 hadiths', '18', 'mastery', 2, '{"type": "bookmarks_count", "threshold": 25}', 200, 33),
('master_curator', 'Master Curator', 'Save 100 hadiths', '19', 'mastery', 3, '{"type": "bookmarks_count", "threshold": 100}', 500, 34),
-- Milestones
('early_adopter', 'Early Adopter', 'Join in the first month', '20', 'milestone', 2, '{"type": "account_age_before", "date": "2026-04-01"}', 200, 40),
('ramadan_2026', 'Ramadan 2026', 'Use the app during Ramadan 2026', '21', 'milestone', 2, '{"type": "active_during_ramadan", "year": 2026}', 500, 41)
ON CONFLICT (slug) DO NOTHING;
