-- Create missing tables for hadith collections

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

-- Chapters table (one book has many chapters) - book_id is INTEGER to match books.id
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
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

-- Many-to-many: Hadiths can appear in multiple collections - book_id is INTEGER
CREATE TABLE IF NOT EXISTS collection_hadiths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  hadith_id UUID REFERENCES hadiths(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_collection_hadiths_collection_id ON collection_hadiths(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_hadiths_chapter_id ON collection_hadiths(chapter_id);

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_collections ENABLE ROW LEVEL SECURITY;

-- Public read access for collections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'collections_read_all' AND tablename = 'collections'
  ) THEN
    CREATE POLICY "collections_read_all" ON collections FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'chapters_read_all' AND tablename = 'chapters'
  ) THEN
    CREATE POLICY "chapters_read_all" ON chapters FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'topics_read_all' AND tablename = 'topics'
  ) THEN
    CREATE POLICY "topics_read_all" ON topics FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'hadith_topics_read_all' AND tablename = 'hadith_topics'
  ) THEN
    CREATE POLICY "hadith_topics_read_all" ON hadith_topics FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'collection_hadiths_read_all' AND tablename = 'collection_hadiths'
  ) THEN
    CREATE POLICY "collection_hadiths_read_all" ON collection_hadiths FOR SELECT USING (true);
  END IF;
END $$;

-- Users can manage their own saved collections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'saved_collections_user_all' AND tablename = 'saved_collections'
  ) THEN
    CREATE POLICY "saved_collections_user_all" ON saved_collections FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
