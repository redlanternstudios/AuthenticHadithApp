-- ============================================================
-- saved_hadiths RLS Fix
-- Run this in the Supabase dashboard SQL editor for project nqklipakrfuwebkdnhwg
-- Safe to run even if RLS is already on (fully idempotent)
-- Mirrors the policy set already present on hadith_folders (migration 996)
-- ============================================================

-- 1. Enable RLS (idempotent — no-op if already enabled)
ALTER TABLE saved_hadiths ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (safe if they don't exist)
DROP POLICY IF EXISTS "Users can view their own saved hadiths" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can insert their own saved hadiths" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can update their own saved hadiths" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can delete their own saved hadiths" ON saved_hadiths;

-- 3. Create the four DML policies (auth.uid() = user_id)
CREATE POLICY "Users can view their own saved hadiths"
  ON saved_hadiths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved hadiths"
  ON saved_hadiths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved hadiths"
  ON saved_hadiths FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved hadiths"
  ON saved_hadiths FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Verify: after running, this should show rowsecurity = true
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'saved_hadiths';
