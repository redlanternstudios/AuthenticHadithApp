-- Check current state of all collections
SELECT 
  c.slug,
  c.name_en,
  c.total_hadiths as stored_total,
  COUNT(DISTINCT ch.hadith_id) as actual_hadiths,
  COUNT(DISTINCT b.id) as actual_books
FROM collections c
LEFT JOIN collection_hadiths ch ON ch.collection_id = c.id
LEFT JOIN books b ON b.collection_id = c.id
GROUP BY c.id, c.slug, c.name_en, c.total_hadiths
ORDER BY c.slug;

-- Check total hadiths in hadiths table grouped by collection slug
SELECT collection, COUNT(*) as hadith_count
FROM hadiths
GROUP BY collection
ORDER BY collection;
