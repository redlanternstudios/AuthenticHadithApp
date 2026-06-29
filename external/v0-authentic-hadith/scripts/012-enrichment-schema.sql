-- ============================================
-- ENRICHMENT LAYER: Full schema migration
-- Adapted from spec to use uuid FKs (hadiths.id)
-- ============================================

-- 0. Utility: set_updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 0b. Add role column to profiles (for reviewer/admin access)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Allow anyone authenticated to read profiles (needed for discussion avatars, reviewer checks)
-- Drop the restrictive "own profile only" select policy if it exists, replace with public read
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Users can read own profile" ON profiles;
  END IF;
END $$;

CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- 1. Categories Table (7 Fixed)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text,
  description text,
  icon text,
  display_order int NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO categories (slug, name_en, name_ar, description, icon, display_order) VALUES
('worship', 'Worship & Devotion', 'العبادة والتقوى', 'Prayer, fasting, hajj, remembrance of Allah, and acts of devotion', '🕌', 1),
('character', 'Character & Ethics', 'الأخلاق والآداب', 'Patience, honesty, kindness, forgiveness, and moral conduct', '🤝', 2),
('family', 'Family & Relationships', 'الأسرة والعلاقات', 'Parents, marriage, children, relatives, and neighbors', '👨‍👩‍👧‍👦', 3),
('daily-life', 'Daily Life & Conduct', 'الحياة اليومية والسلوك', 'Work, food, speech, cleanliness, and daily routines', '🛠️', 4),
('knowledge', 'Knowledge & Faith', 'العلم والإيمان', 'Learning, intention, belief, Quran, and spiritual understanding', '📚', 5),
('community', 'Community & Justice', 'المجتمع والعدل', 'Justice, leadership, rights, brotherhood, and social responsibility', '⚖️', 6),
('afterlife', 'Afterlife & Spiritual Reality', 'الآخرة والحقائق الروحانية', 'Death, judgment, paradise, hellfire, and the unseen', '🌙', 7)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- ============================================
-- 2. Tags Table (Controlled Vocabulary, 50-120 max)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL UNIQUE,
  name_ar text,
  synonyms text[],
  category_id uuid REFERENCES public.categories(id),
  usage_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial tags
INSERT INTO tags (slug, name_en, name_ar, synonyms, category_id) VALUES
-- Worship
('prayer', 'Prayer', 'الصلاة', ARRAY['salah', 'namaz'], (SELECT id FROM categories WHERE slug='worship')),
('fasting', 'Fasting', 'الصيام', ARRAY['sawm', 'ramadan'], (SELECT id FROM categories WHERE slug='worship')),
('charity', 'Charity', 'الصدقة', ARRAY['sadaqah', 'zakat'], (SELECT id FROM categories WHERE slug='worship')),
('pilgrimage', 'Pilgrimage', 'الحج', ARRAY['hajj', 'umrah'], (SELECT id FROM categories WHERE slug='worship')),
('remembrance', 'Remembrance of Allah', 'الذكر', ARRAY['dhikr', 'remembering'], (SELECT id FROM categories WHERE slug='worship')),
-- Character
('patience', 'Patience', 'الصبر', ARRAY['sabr', 'perseverance'], (SELECT id FROM categories WHERE slug='character')),
('truthfulness', 'Truthfulness', 'الصدق', ARRAY['honesty', 'sincerity'], (SELECT id FROM categories WHERE slug='character')),
('kindness', 'Kindness', 'اللطف', ARRAY['compassion', 'gentleness'], (SELECT id FROM categories WHERE slug='character')),
('forgiveness', 'Forgiveness', 'المغفرة', ARRAY['pardoning', 'mercy'], (SELECT id FROM categories WHERE slug='character')),
('humility', 'Humility', 'التواضع', ARRAY['modesty', 'humble'], (SELECT id FROM categories WHERE slug='character')),
('anger', 'Anger Control', 'الغضب', ARRAY['temper', 'rage'], (SELECT id FROM categories WHERE slug='character')),
-- Family
('parents', 'Parents', 'الوالدين', ARRAY['mother', 'father'], (SELECT id FROM categories WHERE slug='family')),
('marriage', 'Marriage', 'الزواج', ARRAY['spouse', 'husband', 'wife'], (SELECT id FROM categories WHERE slug='family')),
('children', 'Children', 'الأطفال', ARRAY['kids', 'parenting'], (SELECT id FROM categories WHERE slug='family')),
('relatives', 'Relatives', 'الأقارب', ARRAY['family ties', 'kinship'], (SELECT id FROM categories WHERE slug='family')),
('neighbors', 'Neighbors', 'الجيران', ARRAY['neighbourhood'], (SELECT id FROM categories WHERE slug='family')),
-- Daily Life
('work', 'Work & Earning', 'العمل', ARRAY['job', 'employment', 'trade'], (SELECT id FROM categories WHERE slug='daily-life')),
('food', 'Food & Eating', 'الطعام', ARRAY['meals', 'eating'], (SELECT id FROM categories WHERE slug='daily-life')),
('speech', 'Speech & Words', 'الكلام', ARRAY['talking', 'conversation'], (SELECT id FROM categories WHERE slug='daily-life')),
('cleanliness', 'Cleanliness', 'النظافة', ARRAY['purity', 'hygiene'], (SELECT id FROM categories WHERE slug='daily-life')),
('greetings', 'Greetings', 'التحية', ARRAY['salam', 'salutations'], (SELECT id FROM categories WHERE slug='daily-life')),
-- Knowledge
('seeking-knowledge', 'Seeking Knowledge', 'طلب العلم', ARRAY['learning', 'study'], (SELECT id FROM categories WHERE slug='knowledge')),
('intention', 'Intention', 'النية', ARRAY['niyyah', 'purpose'], (SELECT id FROM categories WHERE slug='knowledge')),
('faith', 'Faith', 'الإيمان', ARRAY['iman', 'belief'], (SELECT id FROM categories WHERE slug='knowledge')),
('quran', 'Quran', 'القرآن', ARRAY['recitation', 'reading quran'], (SELECT id FROM categories WHERE slug='knowledge')),
-- Community
('justice', 'Justice', 'العدل', ARRAY['fairness', 'equity'], (SELECT id FROM categories WHERE slug='community')),
('leadership', 'Leadership', 'القيادة', ARRAY['authority', 'governance'], (SELECT id FROM categories WHERE slug='community')),
('rights', 'Rights', 'الحقوق', ARRAY['obligations', 'duties'], (SELECT id FROM categories WHERE slug='community')),
('brotherhood', 'Brotherhood', 'الأخوة', ARRAY['unity', 'community'], (SELECT id FROM categories WHERE slug='community')),
-- Afterlife
('death', 'Death', 'الموت', ARRAY['dying', 'mortality'], (SELECT id FROM categories WHERE slug='afterlife')),
('judgment', 'Day of Judgment', 'يوم القيامة', ARRAY['resurrection', 'afterlife'], (SELECT id FROM categories WHERE slug='afterlife')),
('paradise', 'Paradise', 'الجنة', ARRAY['jannah', 'heaven'], (SELECT id FROM categories WHERE slug='afterlife')),
('hellfire', 'Hellfire', 'النار', ARRAY['jahannam', 'punishment'], (SELECT id FROM categories WHERE slug='afterlife'))
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS tags_category_id_idx ON tags(category_id);
CREATE INDEX IF NOT EXISTS tags_usage_count_idx ON tags(usage_count DESC);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_select_all" ON tags;
CREATE POLICY "tags_select_all" ON tags
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- ============================================
-- 3. Enrichment Status Enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE enrichment_status AS ENUM ('suggested', 'approved', 'published', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 4. Hadith Enrichment Table
-- Uses hadiths.id (uuid) as FK instead of text hadith_id
-- ============================================
CREATE TABLE IF NOT EXISTS public.hadith_enrichment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id uuid NOT NULL REFERENCES public.hadiths(id) ON DELETE CASCADE,
  
  summary_line text,
  category_id uuid REFERENCES public.categories(id),
  
  status enrichment_status NOT NULL DEFAULT 'suggested',
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  rationale text,
  
  suggested_by text DEFAULT 'system',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  published_at timestamptz,
  methodology_version text DEFAULT 'v1.0',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT summary_line_length CHECK (
    summary_line IS NULL OR 
    (char_length(summary_line) BETWEEN 5 AND 80)
  )
);

-- Unique: only one enrichment per hadith (any status)
CREATE UNIQUE INDEX IF NOT EXISTS hadith_enrichment_hadith_unique ON hadith_enrichment(hadith_id);

CREATE INDEX IF NOT EXISTS hadith_enrichment_status_idx ON hadith_enrichment(status);
CREATE INDEX IF NOT EXISTS hadith_enrichment_category_id_idx ON hadith_enrichment(category_id);
CREATE INDEX IF NOT EXISTS hadith_enrichment_reviewed_by_idx ON hadith_enrichment(reviewed_by);

ALTER TABLE hadith_enrichment ENABLE ROW LEVEL SECURITY;

-- Public can only see published enrichments
DROP POLICY IF EXISTS "enrichment_select_published" ON hadith_enrichment;
CREATE POLICY "enrichment_select_published" ON hadith_enrichment
  FOR SELECT TO authenticated, anon
  USING (status = 'published');

-- Reviewers/admins can see all statuses
DROP POLICY IF EXISTS "enrichment_select_review_queue" ON hadith_enrichment;
CREATE POLICY "enrichment_select_review_queue" ON hadith_enrichment
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

-- Only reviewers can update
DROP POLICY IF EXISTS "enrichment_update_reviewer" ON hadith_enrichment;
CREATE POLICY "enrichment_update_reviewer" ON hadith_enrichment
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

-- System inserts (service role handles this, but add policy for completeness)
DROP POLICY IF EXISTS "enrichment_insert_admin" ON hadith_enrichment;
CREATE POLICY "enrichment_insert_admin" ON hadith_enrichment
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

CREATE TRIGGER set_hadith_enrichment_updated_at
BEFORE UPDATE ON hadith_enrichment
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 5. Hadith Tags Junction Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.hadith_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id uuid NOT NULL REFERENCES public.hadiths(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  enrichment_id uuid REFERENCES public.hadith_enrichment(id) ON DELETE CASCADE,
  status enrichment_status NOT NULL DEFAULT 'suggested',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_hadith_tag UNIQUE (hadith_id, tag_id)
);

CREATE INDEX IF NOT EXISTS hadith_tags_hadith_id_idx ON hadith_tags(hadith_id);
CREATE INDEX IF NOT EXISTS hadith_tags_tag_id_idx ON hadith_tags(tag_id);
CREATE INDEX IF NOT EXISTS hadith_tags_status_idx ON hadith_tags(status);
CREATE INDEX IF NOT EXISTS hadith_tags_enrichment_id_idx ON hadith_tags(enrichment_id);

ALTER TABLE hadith_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hadith_tags_select_published" ON hadith_tags;
CREATE POLICY "hadith_tags_select_published" ON hadith_tags
  FOR SELECT TO authenticated, anon USING (status = 'published');

DROP POLICY IF EXISTS "hadith_tags_select_review_queue" ON hadith_tags;
CREATE POLICY "hadith_tags_select_review_queue" ON hadith_tags
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

DROP POLICY IF EXISTS "hadith_tags_update_reviewer" ON hadith_tags;
CREATE POLICY "hadith_tags_update_reviewer" ON hadith_tags
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

DROP POLICY IF EXISTS "hadith_tags_insert_admin" ON hadith_tags;
CREATE POLICY "hadith_tags_insert_admin" ON hadith_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

-- Tag usage count trigger
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status != 'published' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hadith_tags_usage_count_trigger ON hadith_tags;
CREATE TRIGGER hadith_tags_usage_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON hadith_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- ============================================
-- 6. Enrichment Reviews Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrichment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrichment_id uuid NOT NULL REFERENCES public.hadith_enrichment(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'edit', 'publish')),
  old_status enrichment_status,
  new_status enrichment_status,
  changes jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrichment_reviews_enrichment_id_idx ON enrichment_reviews(enrichment_id);
CREATE INDEX IF NOT EXISTS enrichment_reviews_reviewer_id_idx ON enrichment_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS enrichment_reviews_created_at_idx ON enrichment_reviews(created_at DESC);

ALTER TABLE enrichment_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrichment_reviews_select_reviewer" ON enrichment_reviews;
CREATE POLICY "enrichment_reviews_select_reviewer" ON enrichment_reviews
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );

DROP POLICY IF EXISTS "enrichment_reviews_insert_reviewer" ON enrichment_reviews;
CREATE POLICY "enrichment_reviews_insert_reviewer" ON enrichment_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'reviewer'))
  );
