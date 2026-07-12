-- =============================================
-- Hadith Notes (extends saved_hadiths with notes)
-- =============================================
ALTER TABLE saved_hadiths ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE saved_hadiths ADD COLUMN IF NOT EXISTS folder text DEFAULT 'default';

-- =============================================
-- User Streaks & Daily Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  total_days_active integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- Reading Progress
-- =============================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id),
  book_id uuid REFERENCES books(id),
  chapter_id uuid REFERENCES chapters(id),
  hadith_id uuid REFERENCES hadiths(id),
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, hadith_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON reading_progress FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Quizzes & Quiz Attempts
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_slug text,
  quiz_type text NOT NULL DEFAULT 'general',
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score_percent numeric(5,2),
  time_taken_seconds integer,
  questions jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Community Discussions
-- =============================================
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id uuid NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read discussions" ON discussions FOR SELECT USING (true);
CREATE POLICY "Users can insert own discussions" ON discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discussions" ON discussions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discussions" ON discussions FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read discussion likes" ON discussion_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON discussion_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON discussion_likes FOR DELETE USING (auth.uid() = user_id);
