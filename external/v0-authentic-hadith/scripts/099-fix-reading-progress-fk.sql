-- Add created_at column to reading_progress if it doesn't exist
ALTER TABLE reading_progress
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add foreign key from reading_progress.collection_id to collections.id
-- (needed for Supabase PostgREST join syntax)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reading_progress_collection_id_fkey'
      AND table_name = 'reading_progress'
  ) THEN
    ALTER TABLE reading_progress
      ADD CONSTRAINT reading_progress_collection_id_fkey
      FOREIGN KEY (collection_id) REFERENCES collections(id);
  END IF;
END $$;
