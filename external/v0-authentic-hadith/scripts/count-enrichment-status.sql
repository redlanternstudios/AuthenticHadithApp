-- Count total hadiths vs enriched hadiths
SELECT
  (SELECT count(*) FROM hadiths) AS total_hadiths,
  (SELECT count(*) FROM hadith_enrichment) AS total_enrichments,
  (SELECT count(*) FROM hadith_enrichment WHERE key_teaching_en IS NOT NULL AND key_teaching_en != '') AS has_key_teaching,
  (SELECT count(*) FROM hadith_enrichment WHERE status = 'published') AS published_enrichments,
  (SELECT count(*) FROM hadith_enrichment WHERE status = 'suggested') AS suggested_enrichments;
