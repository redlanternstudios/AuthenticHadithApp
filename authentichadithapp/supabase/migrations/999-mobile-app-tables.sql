-- Mobile App Tables Migration
-- Creates tables for promo codes, learning paths, lessons, and progress tracking
-- NOTE: learning_paths already exists in DB, so CREATE TABLE IF NOT EXISTS will skip it

-- Promo Codes Table (for referral and campaign codes)
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('referral', 'campaign')),
  premium_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Redemptions Table (tracks who redeemed what)
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);

-- Learning Paths Table (already exists with title, level, estimated_hours, sort_order columns)
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'scholar')),
  estimated_hours INTEGER DEFAULT 30,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Path-Lessons Join Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS path_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(learning_path_id, lesson_id)
);

-- Lesson-Hadith Join Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS lesson_hadith (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  hadith_id UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(lesson_id, hadith_id)
);

-- User Lesson Progress Table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_sort ON learning_paths(sort_order);
CREATE INDEX IF NOT EXISTS idx_path_lessons_path ON path_lessons(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_path_lessons_lesson ON path_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_hadith_lesson ON lesson_hadith(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_lesson_progress(lesson_id);

-- Row Level Security (RLS) Policies

-- Promo Codes: Public can view active codes, only authenticated users can use them
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view active promo codes"
    ON promo_codes FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own created codes"
    ON promo_codes FOR SELECT
    USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Redemptions: Users can only see their own redemptions
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own redemptions"
    ON redemptions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own redemptions"
    ON redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Learning Paths: Public read access (may already exist)
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view learning paths"
    ON learning_paths FOR SELECT
    TO authenticated, anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lessons: Public read access
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view lessons"
    ON lessons FOR SELECT
    TO authenticated, anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Path-Lessons: Public read access
ALTER TABLE path_lessons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view path lessons"
    ON path_lessons FOR SELECT
    TO authenticated, anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lesson-Hadith: Public read access
ALTER TABLE lesson_hadith ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view lesson hadiths"
    ON lesson_hadith FOR SELECT
    TO authenticated, anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User Lesson Progress: Users can only see and update their own progress
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own progress"
    ON user_lesson_progress FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own progress"
    ON user_lesson_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own progress"
    ON user_lesson_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
