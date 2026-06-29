-- Combined SQL Initialization
-- Run this in Supabase SQL Editor


-- ========== 003-create-hadiths-tables.sql ==========

-- Create hadiths table
CREATE TABLE IF NOT EXISTS hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic_text TEXT NOT NULL,
  english_translation TEXT NOT NULL,
  collection TEXT NOT NULL,
  book_number INTEGER,
  hadith_number INTEGER,
  reference TEXT,
  grade TEXT CHECK (grade IN ('sahih', 'hasan', 'daif')) DEFAULT 'sahih',
  narrator TEXT,
  is_featured BOOLEAN DEFAULT false,
  featured_date DATE,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hadith_views table for tracking recently viewed
CREATE TABLE IF NOT EXISTS hadith_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hadith_id UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hadith_id)
);

-- Create saved_hadiths table for bookmarks
CREATE TABLE IF NOT EXISTS saved_hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hadith_id UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hadith_id)
);

-- Enable RLS
ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_hadiths ENABLE ROW LEVEL SECURITY;

-- Hadiths are publicly readable
CREATE POLICY "Anyone can read hadiths" ON hadiths
  FOR SELECT USING (true);

-- Users can only see their own views
CREATE POLICY "Users can read own views" ON hadith_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own views" ON hadith_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own views" ON hadith_views
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only manage their own saved hadiths
CREATE POLICY "Users can read own saved" ON saved_hadiths
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved" ON saved_hadiths
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved" ON saved_hadiths
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hadiths_featured ON hadiths(is_featured, featured_date);
CREATE INDEX IF NOT EXISTS idx_hadith_views_user ON hadith_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_hadiths_user ON saved_hadiths(user_id, created_at DESC);


-- ========== 005-create-collections-tables.sql ==========

-- Collections table for hadith collections (Sahih Bukhari, Muslim, etc.)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  total_hadiths INT DEFAULT 0,
  total_books INT DEFAULT 0,
  scholar TEXT NOT NULL,
  scholar_dates TEXT,
  is_featured BOOLEAN DEFAULT false,
  grade_distribution JSONB DEFAULT '{"sahih": 0, "hasan": 0, "daif": 0}',
  thumbnail_pattern TEXT DEFAULT 'geometric-1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table (one collection has many books)
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  number INT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  total_hadiths INT DEFAULT 0,
  total_chapters INT DEFAULT 0,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters table (one book has many chapters)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  number INT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  total_hadiths INT DEFAULT 0,
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics for categorization
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: Hadiths can have multiple topics
CREATE TABLE IF NOT EXISTS hadith_topics (
  hadith_id UUID REFERENCES hadiths(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (hadith_id, topic_id)
);

-- Many-to-many: Hadiths can appear in multiple collections
CREATE TABLE IF NOT EXISTS collection_hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  hadith_id UUID REFERENCES hadiths(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  hadith_number INT NOT NULL,
  UNIQUE(collection_id, hadith_id)
);

-- Saved collections for users
CREATE TABLE IF NOT EXISTS saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, collection_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_books_collection_id ON books(collection_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_collection_hadiths_collection_id ON collection_hadiths(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_hadiths_chapter_id ON collection_hadiths(chapter_id);

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_collections ENABLE ROW LEVEL SECURITY;

-- Public read access for collections
CREATE POLICY "collections_read_all" ON collections FOR SELECT USING (true);
CREATE POLICY "books_read_all" ON books FOR SELECT USING (true);
CREATE POLICY "chapters_read_all" ON chapters FOR SELECT USING (true);
CREATE POLICY "topics_read_all" ON topics FOR SELECT USING (true);
CREATE POLICY "hadith_topics_read_all" ON hadith_topics FOR SELECT USING (true);
CREATE POLICY "collection_hadiths_read_all" ON collection_hadiths FOR SELECT USING (true);

-- Users can manage their own saved collections
CREATE POLICY "saved_collections_user_all" ON saved_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "saved_collections_read_own" ON saved_collections FOR SELECT USING (auth.uid() = user_id);


-- ========== 012-fix-rls-and-streaks.sql ==========

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
