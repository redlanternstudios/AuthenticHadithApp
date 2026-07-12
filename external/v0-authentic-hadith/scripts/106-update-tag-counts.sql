-- Update category hadith counts based on tag weights
UPDATE categories c SET hadith_count = (
  SELECT COUNT(DISTINCT htw.hadith_id) 
  FROM hadith_tag_weights htw 
  JOIN tags t ON t.id = htw.tag_id 
  WHERE t.category_id = c.id
);

-- Update tag usage counts
UPDATE tags t SET usage_count = (
  SELECT COUNT(*) FROM hadith_tag_weights htw WHERE htw.tag_id = t.id
);
