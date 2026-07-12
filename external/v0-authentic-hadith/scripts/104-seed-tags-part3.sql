-- Part 3: Family, Daily Conduct, Business, Knowledge, Dawah
-- CATEGORY: Family & Marriage
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('marriage', 'family', 'parenting', 'kinship', 'children', 'women', 'parents')
AND (
  h.english_translation ILIKE '%marriage%'
  OR h.english_translation ILIKE '%wife%'
  OR h.english_translation ILIKE '%husband%'
  OR h.english_translation ILIKE '%nikah%'
  OR h.english_translation ILIKE '%family%'
  OR h.english_translation ILIKE '%parent%'
  OR h.english_translation ILIKE '%mother%'
  OR h.english_translation ILIKE '%father%'
  OR h.english_translation ILIKE '%children%'
  OR h.english_translation ILIKE '%daughter%'
  OR h.english_translation ILIKE '%kinship%'
  OR h.english_translation ILIKE '%women%'
  OR h.english_translation ILIKE '%orphan%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Daily Conduct & Etiquette
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('food', 'greetings', 'travel', 'sleep', 'dress', 'etiquette', 'manners')
AND (
  h.english_translation ILIKE '%food%'
  OR h.english_translation ILIKE '%eat%'
  OR h.english_translation ILIKE '%drink%'
  OR h.english_translation ILIKE '%greet%'
  OR h.english_translation ILIKE '%salam%'
  OR h.english_translation ILIKE '%travel%'
  OR h.english_translation ILIKE '%journey%'
  OR h.english_translation ILIKE '%sleep%'
  OR h.english_translation ILIKE '%dress%'
  OR h.english_translation ILIKE '%garment%'
  OR h.english_translation ILIKE '%sneez%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Business & Trade
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('trade', 'business', 'halal-earnings', 'riba', 'contracts')
AND (
  h.english_translation ILIKE '%trade%'
  OR h.english_translation ILIKE '%business%'
  OR h.english_translation ILIKE '%sell%'
  OR h.english_translation ILIKE '%buy%'
  OR h.english_translation ILIKE '%merchant%'
  OR h.english_translation ILIKE '%riba%'
  OR h.english_translation ILIKE '%usury%'
  OR h.english_translation ILIKE '%debt%'
  OR h.english_translation ILIKE '%wealth%'
  OR h.english_translation ILIKE '%money%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Knowledge & Learning
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('knowledge', 'teaching', 'scholarship', 'learning')
AND (
  h.english_translation ILIKE '%knowledge%'
  OR h.english_translation ILIKE '%learn%'
  OR h.english_translation ILIKE '%scholar%'
  OR h.english_translation ILIKE '%teach%'
  OR h.english_translation ILIKE '%wisdom%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Da'wah & Guidance
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('dawah', 'enjoining-good', 'forbidding-evil', 'guidance', 'advice')
AND (
  h.english_translation ILIKE '%invite%'
  OR h.english_translation ILIKE '%dawah%'
  OR h.english_translation ILIKE '%guid%'
  OR h.english_translation ILIKE '%advise%'
  OR h.english_translation ILIKE '%counsel%'
  OR h.english_translation ILIKE '%preach%'
  OR h.english_translation ILIKE '%convey%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);
