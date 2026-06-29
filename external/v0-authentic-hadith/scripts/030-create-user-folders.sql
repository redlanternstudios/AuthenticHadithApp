-- 030: Create user_folders table (must exist before user_bookmarks)

CREATE TABLE IF NOT EXISTS public.user_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#6b7280',
  is_public boolean DEFAULT false,
  item_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT folder_name_length CHECK (char_length(name) BETWEEN 1 AND 50)
);

CREATE INDEX IF NOT EXISTS user_folders_user_id_idx ON user_folders(user_id);
CREATE INDEX IF NOT EXISTS user_folders_is_public_idx ON user_folders(is_public) WHERE is_public = true;

ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_folders_select_own' AND tablename = 'user_folders') THEN
    CREATE POLICY "user_folders_select_own" ON user_folders FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_folders_insert_own' AND tablename = 'user_folders') THEN
    CREATE POLICY "user_folders_insert_own" ON user_folders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_folders_update_own' AND tablename = 'user_folders') THEN
    CREATE POLICY "user_folders_update_own" ON user_folders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_folders_delete_own' AND tablename = 'user_folders') THEN
    CREATE POLICY "user_folders_delete_own" ON user_folders FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;
