-- Add missing columns to hadiths table if they don't exist

-- Add arabic_text column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'arabic_text' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN arabic_text TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add english_translation column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'english_translation' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN english_translation TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add collection column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'collection' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN collection TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add book_number column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'book_number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN book_number INTEGER;
  END IF;
END $$;

-- Add hadith_number column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'hadith_number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN hadith_number INTEGER;
  END IF;
END $$;

-- Add reference column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'reference' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN reference TEXT;
  END IF;
END $$;

-- Add grade column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'grade' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN grade TEXT CHECK (grade IN ('sahih', 'hasan', 'daif')) DEFAULT 'sahih';
  END IF;
END $$;

-- Add narrator column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'narrator' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN narrator TEXT;
  END IF;
END $$;

-- Add is_featured column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hadiths' AND column_name = 'is_featured' AND table_schema = 'public'
  ) THEN
    ALTER TABLE hadiths ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_hadiths_collection ON hadiths(collection);
CREATE INDEX IF NOT EXISTS idx_hadiths_hadith_number ON hadiths(hadith_number);
CREATE INDEX IF NOT EXISTS idx_hadiths_grade ON hadiths(grade);
CREATE INDEX IF NOT EXISTS idx_hadiths_featured ON hadiths(is_featured);
