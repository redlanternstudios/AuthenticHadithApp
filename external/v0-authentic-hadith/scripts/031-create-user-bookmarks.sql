-- 031: Create user_bookmarks table with polymorphic references

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bookmark_type') THEN
    CREATE TYPE bookmark_type AS ENUM ('hadith', 'story_part', 'sahabi', 'collection');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type bookmark_type NOT NULL,
  item_id text NOT NULL,
  bookmarked_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  access_count int DEFAULT 0,
  folder_id uuid REFERENCES public.user_folders(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  CONSTRAINT unique_user_bookmark UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS user_bookmarks_user_id_idx ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_item_type_idx ON user_bookmarks(item_type);
CREATE INDEX IF NOT EXISTS user_bookmarks_folder_id_idx ON user_bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS user_bookmarks_bookmarked_at_idx ON user_bookmarks(bookmarked_at DESC);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bookmarks_select_own' AND tablename = 'user_bookmarks') THEN
    CREATE POLICY "user_bookmarks_select_own" ON user_bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bookmarks_insert_own' AND tablename = 'user_bookmarks') THEN
    CREATE POLICY "user_bookmarks_insert_own" ON user_bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bookmarks_update_own' AND tablename = 'user_bookmarks') THEN
    CREATE POLICY "user_bookmarks_update_own" ON user_bookmarks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_bookmarks_delete_own' AND tablename = 'user_bookmarks') THEN
    CREATE POLICY "user_bookmarks_delete_own" ON user_bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Trigger: Update folder item_count
CREATE OR REPLACE FUNCTION update_folder_item_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.folder_id IS NOT NULL THEN
    UPDATE user_folders SET item_count = item_count + 1 WHERE id = NEW.folder_id;
  ELSIF TG_OP = 'DELETE' AND OLD.folder_id IS NOT NULL THEN
    UPDATE user_folders SET item_count = item_count - 1 WHERE id = OLD.folder_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.folder_id IS DISTINCT FROM OLD.folder_id THEN
    IF OLD.folder_id IS NOT NULL THEN
      UPDATE user_folders SET item_count = item_count - 1 WHERE id = OLD.folder_id;
    END IF;
    IF NEW.folder_id IS NOT NULL THEN
      UPDATE user_folders SET item_count = item_count + 1 WHERE id = NEW.folder_id;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_bookmarks_folder_count_trigger ON user_bookmarks;
CREATE TRIGGER user_bookmarks_folder_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_bookmarks
FOR EACH ROW EXECUTE FUNCTION update_folder_item_count();
