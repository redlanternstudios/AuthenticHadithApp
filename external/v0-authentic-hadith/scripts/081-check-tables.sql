SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('hadith_tags', 'hadith_tag_weights', 'hadith_enrichment')
ORDER BY table_name;

SELECT count(*) as enrichment_count FROM hadith_enrichment WHERE status = 'published';
SELECT count(*) as tag_weight_count FROM hadith_tag_weights;
