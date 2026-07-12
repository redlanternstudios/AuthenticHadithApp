-- 032: Create user_notes table

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type bookmark_type NOT NULL,
  item_id text NOT NULL,
  note_text text NOT NULL,
  is_private boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT note_text_length CHECK (char_length(note_text) BETWEEN 1 AND 5000)
);

CREATE INDEX IF NOT EXISTS user_notes_user_id_idx ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS user_notes_item_idx ON user_notes(item_type, item_id);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_select_own' AND tablename = 'user_notes') THEN
    CREATE POLICY "user_notes_select_own" ON user_notes FOR SELECT TO authenticated USING (user_id = auth.uid() OR NOT is_private);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_insert_own' AND tablename = 'user_notes') THEN
    CREATE POLICY "user_notes_insert_own" ON user_notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_update_own' AND tablename = 'user_notes') THEN
    CREATE POLICY "user_notes_update_own" ON user_notes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_delete_own' AND tablename = 'user_notes') THEN
    CREATE POLICY "user_notes_delete_own" ON user_notes FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_user_notes_updated_at ON user_notes;
CREATE TRIGGER set_user_notes_updated_at BEFORE UPDATE ON user_notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
