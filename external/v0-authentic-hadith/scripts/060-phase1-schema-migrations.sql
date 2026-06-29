-- Phase 1: Schema Migrations for Content Expansion
-- Covers: Learning Paths, Prophets, Sunnah expansion, Quiz updates, Taxonomy weight system

-- ============================================
-- 1A. Hadith Tag Weights (weighted tagging system)
-- ============================================
CREATE TABLE IF NOT EXISTS hadith_tag_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id uuid NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  weight numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  source text NOT NULL DEFAULT 'ai' CHECK (source IN ('manual', 'ai', 'enrichment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hadith_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_htw_hadith ON hadith_tag_weights(hadith_id);
CREATE INDEX IF NOT EXISTS idx_htw_tag ON hadith_tag_weights(tag_id);
CREATE INDEX IF NOT EXISTS idx_htw_weight ON hadith_tag_weights(weight DESC);

ALTER TABLE hadith_tag_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hadith_tag_weights_select_all" ON hadith_tag_weights FOR SELECT USING (true);

-- ============================================
-- 1B. Learning Paths Schema
-- ============================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  icon_name text NOT NULL DEFAULT 'book-open',
  level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  sort_order integer NOT NULL DEFAULT 0,
  is_premium boolean NOT NULL DEFAULT false,
  total_modules integer NOT NULL DEFAULT 0,
  total_lessons integer NOT NULL DEFAULT 0,
  estimated_hours integer NOT NULL DEFAULT 0,
  achievement_slug text, -- links to achievements.slug on completion
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(path_id, slug)
);

CREATE TABLE IF NOT EXISTS learning_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'reading' CHECK (content_type IN ('reading', 'activity', 'reflection')),
  hadith_ids uuid[] DEFAULT '{}',
  collection_slug text,
  book_number integer,
  sort_order integer NOT NULL DEFAULT 0,
  has_quiz boolean NOT NULL DEFAULT false,
  UNIQUE(module_id, slug)
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  quiz_score numeric(5,2),
  quiz_passed boolean DEFAULT false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lp_lesson ON learning_progress(lesson_id);

CREATE TABLE IF NOT EXISTS learning_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL,
  hint_text text,
  hadith_id uuid REFERENCES hadiths(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lqq_lesson ON learning_quiz_questions(lesson_id);

-- RLS for learning paths
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_paths_select_all" ON learning_paths FOR SELECT USING (true);

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_modules_select_all" ON learning_modules FOR SELECT USING (true);

ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_lessons_select_all" ON learning_lessons FOR SELECT USING (true);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_progress_select_own" ON learning_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "learning_progress_insert_own" ON learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_progress_update_own" ON learning_progress FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE learning_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_quiz_questions_select_all" ON learning_quiz_questions FOR SELECT USING (true);

-- ============================================
-- 1C. Sunnah Practices Expansion
-- ============================================
ALTER TABLE sunnah_practices ADD COLUMN IF NOT EXISTS day_of_year integer;
ALTER TABLE sunnah_practices ADD COLUMN IF NOT EXISTS hadith_ids text[] DEFAULT '{}';
ALTER TABLE sunnah_practices ADD COLUMN IF NOT EXISTS title_ar text;
ALTER TABLE sunnah_practices ADD COLUMN IF NOT EXISTS description_ar text;

CREATE INDEX IF NOT EXISTS idx_sp_day ON sunnah_practices(day_of_year);

-- Enable RLS on sunnah tables (currently disabled)
ALTER TABLE sunnah_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sunnah_categories_select_all" ON sunnah_categories FOR SELECT USING (true);

ALTER TABLE sunnah_practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sunnah_practices_select_all" ON sunnah_practices FOR SELECT USING (true);

-- Sunnah tracking table for daily practice
CREATE TABLE IF NOT EXISTS sunnah_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id text NOT NULL,
  practiced_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, practice_id, practiced_date)
);

CREATE INDEX IF NOT EXISTS idx_st_user_date ON sunnah_tracking(user_id, practiced_date);

ALTER TABLE sunnah_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sunnah_tracking_select_own" ON sunnah_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sunnah_tracking_insert_own" ON sunnah_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sunnah_tracking_delete_own" ON sunnah_tracking FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 1D. Stories of the Prophets Schema
-- ============================================
CREATE TABLE IF NOT EXISTS prophets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  title_en text, -- e.g. "The Friend of Allah"
  title_ar text,
  era text, -- e.g. "Before Ibrahim", "After Musa"
  quran_mentions integer DEFAULT 0,
  total_parts integer DEFAULT 0,
  estimated_read_time_minutes integer DEFAULT 0,
  color_theme text DEFAULT '#C5A059',
  theme_primary text DEFAULT '#1b5e43',
  theme_secondary text DEFAULT '#C5A059',
  icon text DEFAULT 'star',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prophet_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prophet_id uuid NOT NULL REFERENCES prophets(id) ON DELETE CASCADE,
  part_number integer NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  content_en text NOT NULL,
  content_ar text,
  quran_references jsonb DEFAULT '[]', -- [{surah: "Al-Baqarah", ayah: "30-39", text: "..."}]
  hadith_references jsonb DEFAULT '[]', -- [{collection: "Bukhari", reference: "3326", text: "..."}]
  key_lesson text,
  opening_hook text,
  historical_context text,
  word_count integer DEFAULT 0,
  estimated_read_minutes integer DEFAULT 5,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prophet_id, part_number)
);

CREATE INDEX IF NOT EXISTS idx_ps_prophet ON prophet_stories(prophet_id);

-- Prophet reading progress (mirrors sahaba_reading_progress)
CREATE TABLE IF NOT EXISTS prophet_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prophet_id uuid NOT NULL REFERENCES prophets(id) ON DELETE CASCADE,
  current_part integer DEFAULT 1,
  parts_completed integer[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  is_bookmarked boolean DEFAULT false,
  total_time_spent_seconds integer DEFAULT 0,
  last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, prophet_id)
);

CREATE INDEX IF NOT EXISTS idx_prp_user ON prophet_reading_progress(user_id);

ALTER TABLE prophets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prophets_select_published" ON prophets FOR SELECT USING (is_published = true);

ALTER TABLE prophet_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prophet_stories_select_published" ON prophet_stories FOR SELECT USING (is_published = true);

ALTER TABLE prophet_reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prp_select_own" ON prophet_reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prp_insert_own" ON prophet_reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prp_update_own" ON prophet_reading_progress FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 1E. Quiz Schema Updates
-- ============================================
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES learning_lessons(id) ON DELETE SET NULL;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS learning_path_id uuid REFERENCES learning_paths(id) ON DELETE SET NULL;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS passed boolean;

-- ============================================
-- 1F. Add color column to categories for UI theming
-- ============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS hadith_count integer DEFAULT 0;
