-- 012: Create My Hadith feature tables (folders, collaborators, comments, shares)

-- 1. Create hadith_folders table
CREATE TABLE IF NOT EXISTS public.hadith_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#D4A574',
  icon TEXT DEFAULT '📚',
  parent_folder_id UUID REFERENCES hadith_folders(id) ON DELETE CASCADE,
  is_smart BOOLEAN DEFAULT false,
  smart_filter JSONB,
  privacy TEXT CHECK (privacy IN ('private', 'public', 'unlisted')) DEFAULT 'private',
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON hadith_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_share_token ON hadith_folders(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_folders_parent ON hadith_folders(parent_folder_id);

-- 2. Update saved_hadiths table with new columns
ALTER TABLE public.saved_hadiths 
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES hadith_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS notes_html TEXT,
  ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_saved_hadiths_folder ON saved_hadiths(folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_hadiths_tags ON saved_hadiths USING gin(tags);

-- 3. Create hadith_note_versions table
CREATE TABLE IF NOT EXISTS public.hadith_note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_hadith_id UUID NOT NULL REFERENCES saved_hadiths(id) ON DELETE CASCADE,
  notes TEXT,
  notes_html TEXT,
  version INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_note_versions_saved_hadith ON hadith_note_versions(saved_hadith_id, version DESC);

-- 4. Create folder_collaborators table
CREATE TABLE IF NOT EXISTS public.folder_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES hadith_folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('viewer', 'contributor', 'editor')) NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(folder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_folder ON folder_collaborators(folder_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON folder_collaborators(user_id);

-- 5. Create folder_comments table
CREATE TABLE IF NOT EXISTS public.folder_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_hadith_id UUID NOT NULL REFERENCES saved_hadiths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_saved_hadith ON folder_comments(saved_hadith_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON folder_comments(user_id);

-- 6. Create folder_shares table (analytics)
CREATE TABLE IF NOT EXISTS public.folder_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES hadith_folders(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL,
  views INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  viewer_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_folder ON folder_shares(folder_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON folder_shares(share_token);

-- Enable Row Level Security
ALTER TABLE hadith_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;

-- hadith_folders policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own and shared folders' AND tablename = 'hadith_folders') THEN
    CREATE POLICY "Users read own and shared folders" ON hadith_folders
      FOR SELECT USING (
        user_id = auth.uid() OR
        id IN (
          SELECT folder_id FROM folder_collaborators
          WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        ) OR
        privacy = 'public'
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create own folders' AND tablename = 'hadith_folders') THEN
    CREATE POLICY "Users create own folders" ON hadith_folders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own folders' AND tablename = 'hadith_folders') THEN
    CREATE POLICY "Users update own folders" ON hadith_folders
      FOR UPDATE USING (
        user_id = auth.uid() OR
        id IN (
          SELECT folder_id FROM folder_collaborators
          WHERE user_id = auth.uid() AND role = 'editor' AND accepted_at IS NOT NULL
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own folders' AND tablename = 'hadith_folders') THEN
    CREATE POLICY "Users delete own folders" ON hadith_folders
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Update saved_hadiths policies (drop old and create new)
DROP POLICY IF EXISTS "Users can read own saved" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can insert own saved" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can delete own saved" ON saved_hadiths;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read saved hadiths' AND tablename = 'saved_hadiths') THEN
    CREATE POLICY "Users read saved hadiths" ON saved_hadiths
      FOR SELECT USING (
        user_id = auth.uid() OR
        folder_id IN (
          SELECT folder_id FROM folder_collaborators
          WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create saved hadiths' AND tablename = 'saved_hadiths') THEN
    CREATE POLICY "Users create saved hadiths" ON saved_hadiths
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update saved hadiths' AND tablename = 'saved_hadiths') THEN
    CREATE POLICY "Users update saved hadiths" ON saved_hadiths
      FOR UPDATE USING (
        user_id = auth.uid() OR
        folder_id IN (
          SELECT folder_id FROM folder_collaborators
          WHERE user_id = auth.uid() AND role IN ('contributor', 'editor') AND accepted_at IS NOT NULL
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete saved hadiths' AND tablename = 'saved_hadiths') THEN
    CREATE POLICY "Users delete saved hadiths" ON saved_hadiths
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- hadith_note_versions policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read note versions' AND tablename = 'hadith_note_versions') THEN
    CREATE POLICY "Users read note versions" ON hadith_note_versions
      FOR SELECT USING (
        saved_hadith_id IN (SELECT id FROM saved_hadiths WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- folder_collaborators policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read collaborators' AND tablename = 'folder_collaborators') THEN
    CREATE POLICY "Users read collaborators" ON folder_collaborators
      FOR SELECT USING (
        user_id = auth.uid() OR
        folder_id IN (SELECT id FROM hadith_folders WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Folder owners manage collaborators' AND tablename = 'folder_collaborators') THEN
    CREATE POLICY "Folder owners manage collaborators" ON folder_collaborators
      FOR ALL USING (
        folder_id IN (SELECT id FROM hadith_folders WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- folder_comments policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read comments' AND tablename = 'folder_comments') THEN
    CREATE POLICY "Users read comments" ON folder_comments
      FOR SELECT USING (
        saved_hadith_id IN (
          SELECT id FROM saved_hadiths 
          WHERE user_id = auth.uid() OR folder_id IN (
            SELECT folder_id FROM folder_collaborators WHERE user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create comments' AND tablename = 'folder_comments') THEN
    CREATE POLICY "Users create comments" ON folder_comments
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own comments' AND tablename = 'folder_comments') THEN
    CREATE POLICY "Users update own comments" ON folder_comments
      FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own comments' AND tablename = 'folder_comments') THEN
    CREATE POLICY "Users delete own comments" ON folder_comments
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- folder_shares policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read shares' AND tablename = 'folder_shares') THEN
    CREATE POLICY "Anyone can read shares" ON folder_shares
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System inserts shares' AND tablename = 'folder_shares') THEN
    CREATE POLICY "System inserts shares" ON folder_shares
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
