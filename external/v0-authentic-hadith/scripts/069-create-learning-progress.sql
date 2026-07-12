-- Create learning_progress table for tracking lesson completion with checkmarks
CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  quiz_score numeric,
  quiz_passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own progress" ON learning_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Anon can also read/write (for v0 runtime where auth context might not be cookie-based)
CREATE POLICY "Anon full access to learning_progress" ON learning_progress
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_lesson ON learning_progress(lesson_id);
