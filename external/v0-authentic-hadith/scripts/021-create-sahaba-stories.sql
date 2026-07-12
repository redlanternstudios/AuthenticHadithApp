-- Sahaba Stories System: Tables + Content
-- Creates sahaba, story_parts, sahaba_reading_progress, shareable_snippets

-- 1. Sahaba master table
CREATE TABLE IF NOT EXISTS public.sahaba (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  icon text NOT NULL,
  color_theme text NOT NULL,
  birth_year_hijri int,
  death_year_hijri int,
  notable_for text[],
  total_parts int NOT NULL DEFAULT 3,
  estimated_read_time_minutes int,
  theme_primary text NOT NULL,
  theme_secondary text,
  portrait_url text,
  background_image_url text,
  is_published boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sahaba_slug_idx ON sahaba(slug);
CREATE INDEX IF NOT EXISTS sahaba_display_order_idx ON sahaba(display_order);

ALTER TABLE sahaba ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sahaba_select_published" ON sahaba;
CREATE POLICY "sahaba_select_published" ON sahaba FOR SELECT TO authenticated, anon USING (is_published = true);

-- 2. Story parts table
CREATE TABLE IF NOT EXISTS public.story_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sahabi_id uuid NOT NULL REFERENCES public.sahaba(id) ON DELETE CASCADE,
  part_number int NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  content_en text NOT NULL,
  content_ar text,
  opening_hook text,
  key_lesson text,
  historical_context text,
  featured_image_url text,
  timeline_data jsonb,
  word_count int,
  estimated_read_minutes int,
  related_hadith_refs text[],
  related_quran_ayat jsonb,
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_sahabi_part UNIQUE (sahabi_id, part_number)
);

CREATE INDEX IF NOT EXISTS story_parts_sahabi_id_idx ON story_parts(sahabi_id);

ALTER TABLE story_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_parts_select_published" ON story_parts;
CREATE POLICY "story_parts_select_published" ON story_parts FOR SELECT TO authenticated, anon USING (is_published = true);

-- 3. Sahaba reading progress (separate from hadith reading_progress)
CREATE TABLE IF NOT EXISTS public.sahaba_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sahabi_id uuid NOT NULL REFERENCES public.sahaba(id) ON DELETE CASCADE,
  current_part int NOT NULL DEFAULT 1,
  parts_completed int[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  is_bookmarked boolean DEFAULT false,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  total_time_spent_seconds int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_sahabi UNIQUE (user_id, sahabi_id)
);

CREATE INDEX IF NOT EXISTS sahaba_rp_user_idx ON sahaba_reading_progress(user_id);

ALTER TABLE sahaba_reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sahaba_rp_select_own" ON sahaba_reading_progress;
DROP POLICY IF EXISTS "sahaba_rp_insert_own" ON sahaba_reading_progress;
DROP POLICY IF EXISTS "sahaba_rp_update_own" ON sahaba_reading_progress;
CREATE POLICY "sahaba_rp_select_own" ON sahaba_reading_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sahaba_rp_insert_own" ON sahaba_reading_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sahaba_rp_update_own" ON sahaba_reading_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Shareable snippets
CREATE TABLE IF NOT EXISTS public.shareable_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sahabi_id uuid NOT NULL REFERENCES public.sahaba(id) ON DELETE CASCADE,
  story_part_id uuid REFERENCES public.story_parts(id) ON DELETE CASCADE,
  snippet_type text NOT NULL CHECK (snippet_type IN ('quote', 'lesson', 'moment', 'full_part')),
  text_en text NOT NULL,
  text_ar text,
  attribution_en text,
  source_reference text,
  background_color text DEFAULT '#1a1a1a',
  text_color text DEFAULT '#ffffff',
  accent_color text,
  share_count int DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snippets_sahabi_idx ON shareable_snippets(sahabi_id);

ALTER TABLE shareable_snippets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "snippets_select_published" ON shareable_snippets;
CREATE POLICY "snippets_select_published" ON shareable_snippets FOR SELECT TO authenticated, anon USING (is_published = true);

-- Increment share count function
CREATE OR REPLACE FUNCTION increment_share_count(snippet_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE shareable_snippets SET share_count = share_count + 1 WHERE id = snippet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
