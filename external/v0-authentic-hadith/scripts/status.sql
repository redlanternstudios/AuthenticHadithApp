SELECT 
  (SELECT count(*) FROM hadiths) as total_hadiths,
  (SELECT count(*) FROM hadith_enrichment) as total_enriched,
  (SELECT count(*) FROM hadith_enrichment WHERE key_teaching_en IS NOT NULL) as with_teaching;
