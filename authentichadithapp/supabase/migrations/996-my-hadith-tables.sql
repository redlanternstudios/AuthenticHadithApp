-- My Hadith Feature Migration
-- Creates tables for hadith folders, enhanced saved_hadiths, comments, and collaborators

-- Hadith Folders Table
CREATE TABLE IF NOT EXISTS hadith_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#D4A574',
  icon TEXT NOT NULL DEFAULT '📚',
  parent_folder_id UUID REFERENCES hadith_folders(id) ON DELETE SET NULL,
  is_smart BOOLEAN DEFAULT false,
  smart_filter JSONB,
  privacy TEXT NOT NULL CHECK (privacy IN ('private', 'public', 'unlisted')) DEFAULT 'private',
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alter saved_hadiths table to add new fields
ALTER TABLE saved_hadiths 
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES hadith_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS notes_html TEXT,
  ADD COLUMN IF NOT EXISTS highlights JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS attachments JSONB,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Remove unique constraint on user_id + hadith_id to allow multiple saves in different folders
ALTER TABLE saved_hadiths DROP CONSTRAINT IF EXISTS saved_hadiths_user_id_hadith_id_key;

-- Folder Collaborators Table
CREATE TABLE IF NOT EXISTS folder_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES hadith_folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'contributor', 'editor')) DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(folder_id, user_id)
);

-- Folder Comments Table
CREATE TABLE IF NOT EXISTS folder_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_hadith_id UUID NOT NULL REFERENCES saved_hadiths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  mentions TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE hadith_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hadith_folders
CREATE POLICY "Users can read own folders" ON hadith_folders
  FOR SELECT USING (auth.uid() = user_id OR privacy = 'public');

CREATE POLICY "Users can insert own folders" ON hadith_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON hadith_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON hadith_folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for folder_collaborators
CREATE POLICY "Folder owners can read collaborators" ON folder_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hadith_folders 
      WHERE hadith_folders.id = folder_collaborators.folder_id 
      AND hadith_folders.user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Folder owners can insert collaborators" ON folder_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hadith_folders 
      WHERE hadith_folders.id = folder_collaborators.folder_id 
      AND hadith_folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Folder owners can delete collaborators" ON folder_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM hadith_folders 
      WHERE hadith_folders.id = folder_collaborators.folder_id 
      AND hadith_folders.user_id = auth.uid()
    )
  );

-- RLS Policies for folder_comments
CREATE POLICY "Users can read comments on accessible folders" ON folder_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM saved_hadiths sh
      JOIN hadith_folders hf ON sh.folder_id = hf.id
      WHERE sh.id = folder_comments.saved_hadith_id
      AND (hf.user_id = auth.uid() OR hf.privacy = 'public')
    )
  );

CREATE POLICY "Users can insert comments on accessible folders" ON folder_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON folder_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON folder_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hadith_folders_user ON hadith_folders(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hadith_folders_share_token ON hadith_folders(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_hadiths_folder ON saved_hadiths(folder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folder_collaborators_folder ON folder_collaborators(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_comments_saved_hadith ON folder_comments(saved_hadith_id, created_at DESC);

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to count saved hadiths in a folder (for virtual column)
CREATE OR REPLACE FUNCTION count_saved_hadiths(folder_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM saved_hadiths WHERE folder_id = folder_uuid;
$$ LANGUAGE sql STABLE;
