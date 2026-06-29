-- Check empty fields
SELECT 
  collection,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE english_translation IS NULL OR english_translation = '') as empty_english,
  COUNT(*) FILTER (WHERE arabic_text IS NULL OR arabic_text = '') as empty_arabic,
  COUNT(*) FILTER (WHERE grade IS NULL OR grade = '') as empty_grade
FROM hadiths
GROUP BY collection
ORDER BY collection;
