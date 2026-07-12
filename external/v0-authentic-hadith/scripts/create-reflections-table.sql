-- Create reflections table for the private journal feature
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hadith_ref TEXT,
  tag TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reflections
CREATE POLICY "Users can read own reflections"
  ON reflections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reflections
CREATE POLICY "Users can insert own reflections"
  ON reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reflections
CREATE POLICY "Users can delete own reflections"
  ON reflections FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own reflections
CREATE POLICY "Users can update own reflections"
  ON reflections FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at DESC);
