-- Update category hadith counts from actual hadith_tag_weights data
-- This aggregates DISTINCT hadith_ids per category through tags

-- First, update each category's hadith_count based on actual tag weights
UPDATE categories c SET hadith_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT t.category_id, COUNT(DISTINCT htw.hadith_id) as cnt
  FROM hadith_tag_weights htw
  JOIN tags t ON t.id = htw.tag_id
  GROUP BY t.category_id
) sub
WHERE c.id = sub.category_id;

-- Also set categories with no weights to 0
UPDATE categories SET hadith_count = 0
WHERE id NOT IN (
  SELECT DISTINCT t.category_id FROM tags t
  JOIN hadith_tag_weights htw ON htw.tag_id = t.id
  WHERE t.category_id IS NOT NULL
);

-- Create an RPC function for efficient tag counts (avoid fetching all rows client-side)
CREATE OR REPLACE FUNCTION get_tag_hadith_counts()
RETURNS TABLE(tag_id uuid, hadith_count bigint) 
LANGUAGE sql STABLE
AS $$
  SELECT tag_id, COUNT(DISTINCT hadith_id) as hadith_count
  FROM hadith_tag_weights
  GROUP BY tag_id;
$$;

-- Create an RPC function for category hadith counts
CREATE OR REPLACE FUNCTION get_category_hadith_counts()
RETURNS TABLE(category_id uuid, hadith_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT t.category_id, COUNT(DISTINCT htw.hadith_id) as hadith_count
  FROM hadith_tag_weights htw
  JOIN tags t ON t.id = htw.tag_id
  WHERE t.category_id IS NOT NULL
  GROUP BY t.category_id;
$$;

-- Verify results
SELECT c.slug, c.name_en, c.hadith_count 
FROM categories c 
ORDER BY c.hadith_count DESC;
