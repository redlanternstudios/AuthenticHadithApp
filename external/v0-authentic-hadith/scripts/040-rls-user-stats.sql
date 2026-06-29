-- Ensure RLS policies on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own stats" ON user_stats;
CREATE POLICY "Users read own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own stats" ON user_stats;
CREATE POLICY "Users insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own stats" ON user_stats;
CREATE POLICY "Users update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure RLS on user_activity_log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own activity" ON user_activity_log;
CREATE POLICY "Users insert own activity" ON user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own activity" ON user_activity_log;
CREATE POLICY "Users read own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Ensure RLS on user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own achievements" ON user_achievements;
CREATE POLICY "Users read own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own achievements" ON user_achievements;
CREATE POLICY "Users insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- achievements table is readable by all authenticated users
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements visible to authenticated" ON achievements;
CREATE POLICY "Achievements visible to authenticated" ON achievements
  FOR SELECT USING (auth.role() = 'authenticated');
