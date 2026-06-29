-- Check what categories exist
SELECT slug, name_en, display_order FROM categories ORDER BY display_order;

-- Check what tags exist per category  
SELECT c.slug as category_slug, t.slug as tag_slug, t.name_en as tag_name
FROM tags t
JOIN categories c ON t.category_id = c.id
ORDER BY c.display_order, t.name_en
LIMIT 200;

-- Check current hadith_tag_weights count
SELECT COUNT(*) as total_weights FROM hadith_tag_weights;

-- Check hadiths count
SELECT COUNT(*) as total_hadiths FROM hadiths WHERE english_translation IS NOT NULL AND english_translation != '';

-- Check which tags currently have weights
SELECT t.slug, t.name_en, COUNT(htw.id) as weight_count
FROM tags t
LEFT JOIN hadith_tag_weights htw ON t.id = htw.tag_id
GROUP BY t.slug, t.name_en
HAVING COUNT(htw.id) > 0
ORDER BY weight_count DESC;
