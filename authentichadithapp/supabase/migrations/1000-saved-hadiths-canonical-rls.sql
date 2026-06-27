-- ============================================================================
-- 1000-saved-hadiths-canonical-rls.sql
-- CANONICAL source of truth for saved_hadiths RLS + uniqueness.
-- Supersedes the loose doc docs/RLS_SAVED_HADITHS_FIX.sql (kept for history only).
--
-- WHY THIS EXISTS (FIX-138, 2026-06-26):
--   Production project nqklipakrfuwebkdnhwg had the (user_id, hadith_id) UNIQUE
--   constraint (FIX-119 saw live 23505) but was MISSING the saved_hadiths UPDATE
--   RLS policy. The original schema (003-create-hadiths-tables.sql) shipped only
--   SELECT/INSERT/DELETE. Result: saveHadithToFolder() upserts with
--   onConflict:'user_id,hadith_id'; for an ALREADY-bookmarked hadith the upsert
--   resolves to an UPDATE of folder_id, which a missing UPDATE policy silently
--   blocks -> the row keeps folder_id = NULL -> the hadith never appears in the
--   folder. That is the "hadith won't save to the folder" bug.
--
-- DATA MODEL (KP decision 2026-06-26): ONE folder per hadith for V1. A saved
--   hadith is one row keyed unique on (user_id, hadith_id); folder_id is a single
--   column (NULL = quick-bookmark). Saving to a new folder MOVES it. This matches
--   the live constraint and the app code. Multi-folder is post-V1.
--
-- SAFETY: fully idempotent. Safe to re-run. Run against nqklipakrfuwebkdnhwg.
-- ============================================================================

-- 1. Enable RLS (no-op if already enabled)
ALTER TABLE saved_hadiths ENABLE ROW LEVEL SECURITY;

-- 2. De-duplicate before asserting uniqueness. If migration 996 (which DROPs the
--    unique constraint) ever landed on nq, multi-row (user_id, hadith_id) pairs
--    could exist and would block the ADD CONSTRAINT below. Keep the newest row
--    per pair (prefer one with a folder_id, then latest created_at).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, hadith_id
      ORDER BY (folder_id IS NOT NULL) DESC, created_at DESC, id DESC
    ) AS rn
  FROM saved_hadiths
)
DELETE FROM saved_hadiths
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3. Re-assert the one-folder UNIQUE constraint ONLY if absent.
--    Postgres has no "ADD CONSTRAINT IF NOT EXISTS" — guard via pg_constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_hadiths_user_id_hadith_id_key'
      AND conrelid = 'saved_hadiths'::regclass
  ) THEN
    ALTER TABLE saved_hadiths
      ADD CONSTRAINT saved_hadiths_user_id_hadith_id_key
      UNIQUE (user_id, hadith_id);
  END IF;
END $$;

-- 4. Drop existing DML policies (safe if absent) then recreate the full set.
--    Drop BOTH the legacy names (003-create-hadiths-tables.sql) and the
--    docs/RLS_SAVED_HADITHS_FIX.sql names so we converge on one canonical set.
DROP POLICY IF EXISTS "Users can read own saved" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can insert own saved" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can update own saved" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can delete own saved" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can view their own saved hadiths" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can insert their own saved hadiths" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can update their own saved hadiths" ON saved_hadiths;
DROP POLICY IF EXISTS "Users can delete their own saved hadiths" ON saved_hadiths;

-- 5. Canonical four-verb DML policy set (auth.uid() = user_id).
CREATE POLICY "Users can view their own saved hadiths"
  ON saved_hadiths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved hadiths"
  ON saved_hadiths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- THE FIX: the UPDATE policy that was missing in production. Without this, the
-- conflict->UPDATE path of an upsert (saving an already-bookmarked hadith into a
-- folder, editing notes) is silently denied by RLS.
CREATE POLICY "Users can update their own saved hadiths"
  ON saved_hadiths FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved hadiths"
  ON saved_hadiths FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION (run these after; paste the output back as the receipt)
-- ============================================================================

-- 6a. RLS enabled? expect rowsecurity = true
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'saved_hadiths';

-- 6b. Unique constraint present? expect one row naming (user_id, hadith_id)
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'saved_hadiths'::regclass
  AND contype = 'u';

-- 6c. All four DML policies present? expect SELECT, INSERT, UPDATE, DELETE
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'saved_hadiths'
ORDER BY cmd;
