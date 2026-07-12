-- Create tag_aliases table for resolving legacy/common slugs to canonical tags
-- This ensures both old slugs (prayer, fasting) and new canonical slugs work

CREATE TABLE IF NOT EXISTS tag_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_slug text UNIQUE NOT NULL,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source text DEFAULT 'legacy',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE tag_aliases ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid errors on re-run
DROP POLICY IF EXISTS "tag_aliases_select_all" ON tag_aliases;
CREATE POLICY "tag_aliases_select_all" ON tag_aliases
  FOR SELECT USING (true);

-- Index for fast alias lookups
CREATE INDEX IF NOT EXISTS idx_tag_aliases_slug ON tag_aliases(alias_slug);
CREATE INDEX IF NOT EXISTS idx_tag_aliases_tag_id ON tag_aliases(tag_id);
