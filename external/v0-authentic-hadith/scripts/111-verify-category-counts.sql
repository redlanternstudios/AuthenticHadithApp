-- Verify category hadith counts
SELECT slug, name_en, hadith_count
FROM categories
WHERE is_active = true
ORDER BY display_order;
