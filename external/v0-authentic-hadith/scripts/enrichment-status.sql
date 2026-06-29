SELECT
  (SELECT count(*) FROM hadiths) as total_hadiths,
  (SELECT count(*) FROM hadith_enrichment) as total_enrichments,
  (SELECT count(*) FROM hadith_enrichment WHERE status = 'published') as published,
  (SELECT count(*) FROM hadith_enrichment WHERE key_teaching_en IS NOT NULL AND key_teaching_en != '') as with_key_teaching,
  (SELECT count(*) FROM hadith_enrichment WHERE summary_line IS NOT NULL AND summary_line != '') as with_summary;
