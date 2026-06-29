-- Find which collections/chapters have enriched hadiths
SELECT h.collection, he.summary_line, he.key_teaching_en,
       he.status, h.hadith_number
FROM hadith_enrichment he
JOIN hadiths h ON h.id = he.hadith_id
WHERE he.key_teaching_en IS NOT NULL
LIMIT 5;
