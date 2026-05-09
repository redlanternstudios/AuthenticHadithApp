-- ============================================================================
-- 100-v1-schema-alignment.sql
-- V1 Schema Alignment Sprint (FIX-035)
--
-- Adds three forward-looking V1 tables that don't exist in production yet:
--   1. quiz_questions       — authored quiz content (forward-compatible)
--   2. study_notes          — entity-flexible user notes (lessons/stories/hadiths/sunnah)
--   3. user_progress_events — unified Supabase mirror for completion events
--
-- This migration is FULLY IDEMPOTENT:
--   - Every CREATE TABLE uses IF NOT EXISTS
--   - Every CREATE INDEX uses IF NOT EXISTS
--   - Every CREATE POLICY is wrapped in DO $$ BEGIN ... EXCEPTION duplicate_object
--   - No ALTER on existing tables, no DROP statements, no destructive ops
--
-- Safe to run repeatedly. Safe to run on production.
--
-- See V1_SCHEMA_ALIGNMENT_AUDIT.md for the full route-to-schema audit
-- that justified each of these tables.
-- ============================================================================

-- pgcrypto provides gen_random_uuid(). Existing migrations (996, 999) already
-- rely on this function so the extension is presumed installed. Including the
-- guard makes this migration safe to run on a fresh project too.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. quiz_questions
--
-- Stores authored quiz questions. The current quiz screen generates questions
-- dynamically from random hadith metadata; this table is forward infrastructure
-- so authored content can be layered later without a migration close to launch.
--
-- A question may optionally link to a lesson (so a path can have a quiz at the
-- end) or to a specific hadith (so a hadith page can offer a comprehension
-- check). Both FKs are SET NULL on delete — we never want a deleted lesson or
-- hadith to cascade-delete a question that may still have value standalone.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quiz_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question        TEXT NOT NULL,
  -- options is an ordered JSON array of strings, e.g. ["Bukhari","Muslim","..."].
  -- Using jsonb (not text[]) so we can carry richer option shapes later
  -- (e.g. {label, image_url}) without a schema change.
  options         JSONB NOT NULL,
  correct_answer  TEXT NOT NULL,
  explanation     TEXT,
  difficulty      TEXT NOT NULL DEFAULT 'easy'
                  CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category        TEXT,
  lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
  hadith_id       UUID REFERENCES hadiths(id) ON DELETE SET NULL,
  published       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson
  ON quiz_questions (lesson_id) WHERE lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_hadith
  ON quiz_questions (hadith_id) WHERE hadith_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_category_published
  ON quiz_questions (category, published);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty_published
  ON quiz_questions (difficulty, published);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read published quiz questions"
    ON quiz_questions FOR SELECT
    TO authenticated, anon
    USING (published = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 2. study_notes
--
-- Polymorphic user notes. entity_type identifies what the note is attached to:
-- 'hadith', 'lesson', 'story', 'sunnah_practice', 'collection', etc.
-- entity_id is a TEXT to accommodate slugs (stories use slugs, sunnah practices
-- may use string keys) as well as UUIDs (hadiths, lessons).
--
-- This is intentionally separate from saved_hadiths.notes — that column stays
-- the source for hadith reflections to avoid any data migration. study_notes
-- supports the future "Add Note" surfaces on lessons, stories, and sunnah
-- practices without forcing a refactor of the reflections screen.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS study_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL
                CHECK (entity_type IN (
                  'hadith',
                  'lesson',
                  'story',
                  'sunnah_practice',
                  'collection',
                  'book',
                  'chapter',
                  'topic'
                )),
  entity_id     TEXT NOT NULL,
  title         TEXT,
  content       TEXT NOT NULL,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_notes_user
  ON study_notes (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_notes_entity
  ON study_notes (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_study_notes_user_entity
  ON study_notes (user_id, entity_type, entity_id);

ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read their own study notes"
    ON study_notes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own study notes"
    ON study_notes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own study notes"
    ON study_notes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own study notes"
    ON study_notes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 3. user_progress_events
--
-- Unified Supabase mirror for completion events. The local-first progress
-- service (lib/progress/progressService.ts, AsyncStorage) remains the source of
-- truth per Rule 027. This table enables future cross-device sync, badge
-- eligibility computation server-side, and timeline UI without re-architecting
-- the per-type mirror tables (prophet_reading_progress, sahaba_reading_progress,
-- user_lesson_progress) that already exist.
--
-- The (user_id, entity_type, entity_id, action) UNIQUE constraint enforces
-- idempotency — re-marking complete is a no-op upsert, not a duplicate row.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_progress_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL
                CHECK (entity_type IN (
                  'story',
                  'lesson',
                  'sunnah_practice',
                  'course',
                  'daily_hadith'
                )),
  entity_id     TEXT NOT NULL,
  action        TEXT NOT NULL DEFAULT 'completed'
                CHECK (action IN ('completed', 'started', 'abandoned')),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id, action)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_events_user
  ON user_progress_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_progress_events_entity
  ON user_progress_events (entity_type, entity_id);

ALTER TABLE user_progress_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read their own progress events"
    ON user_progress_events FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own progress events"
    ON user_progress_events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own progress events"
    ON user_progress_events FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- updated_at triggers (idempotent)
--
-- Reuses the standard moddatetime pattern. Only attaches if the function exists
-- in the project; otherwise we skip the trigger silently (DO block).
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
  ) THEN
    -- Project-defined helper exists — wire it.
    BEGIN
      CREATE TRIGGER set_quiz_questions_updated_at
        BEFORE UPDATE ON quiz_questions
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE TRIGGER set_study_notes_updated_at
        BEFORE UPDATE ON study_notes
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- End of 100-v1-schema-alignment.sql
-- ============================================================================
