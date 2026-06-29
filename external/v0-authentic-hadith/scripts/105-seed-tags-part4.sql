-- Part 4: Justice, Jihad, Seerah, Death, Trials + Update counts
-- CATEGORY: Social Justice & Rights
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('justice', 'rights', 'governance', 'neighbor', 'neighbors', 'oppression')
AND (
  h.english_translation ILIKE '%justice%'
  OR h.english_translation ILIKE '%oppress%'
  OR h.english_translation ILIKE '%rights%'
  OR h.english_translation ILIKE '%neighbor%'
  OR h.english_translation ILIKE '%neighbour%'
  OR h.english_translation ILIKE '%ruler%'
  OR h.english_translation ILIKE '%govern%'
  OR h.english_translation ILIKE '%leader%'
  OR h.english_translation ILIKE '%slave%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Jihad & Defense
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('jihad', 'martyrdom', 'defense', 'warfare')
AND (
  h.english_translation ILIKE '%jihad%'
  OR h.english_translation ILIKE '%martyr%'
  OR h.english_translation ILIKE '%battle%'
  OR h.english_translation ILIKE '%warrior%'
  OR h.english_translation ILIKE '%expedition%'
  OR h.english_translation ILIKE '%army%'
  OR h.english_translation ILIKE '%sword%'
  OR h.english_translation ILIKE '%enemy%'
  OR h.english_translation ILIKE '%fighting%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Prophetic History & Seerah
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('seerah', 'companions', 'history', 'battles')
AND (
  h.english_translation ILIKE '%companion%'
  OR h.english_translation ILIKE '%abu bakr%'
  OR h.english_translation ILIKE '%umar%'
  OR h.english_translation ILIKE '%uthman%'
  OR h.english_translation ILIKE '%badr%'
  OR h.english_translation ILIKE '%uhud%'
  OR h.english_translation ILIKE '%hijrah%'
  OR h.english_translation ILIKE '%migration%'
  OR h.english_translation ILIKE '%medina%'
  OR h.english_translation ILIKE '%mecca%'
  OR h.english_translation ILIKE '%conquest%'
  OR h.english_translation ILIKE '%ansar%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Death & Afterlife
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('death', 'paradise', 'hellfire', 'grave', 'resurrection', 'judgment-day')
AND (
  h.english_translation ILIKE '%death%'
  OR h.english_translation ILIKE '%grave%'
  OR h.english_translation ILIKE '%funeral%'
  OR h.english_translation ILIKE '%janazah%'
  OR h.english_translation ILIKE '%paradise%'
  OR h.english_translation ILIKE '%jannah%'
  OR h.english_translation ILIKE '%heaven%'
  OR h.english_translation ILIKE '%hellfire%'
  OR h.english_translation ILIKE '%jahannam%'
  OR h.english_translation ILIKE '%resurrection%'
  OR h.english_translation ILIKE '%hereafter%'
  OR h.english_translation ILIKE '%day of judgment%'
  OR h.english_translation ILIKE '%punishment%'
  OR h.english_translation ILIKE '%reward%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Trials & End Times
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('fitna', 'end-times', 'dajjal', 'signs-of-hour', 'trials')
AND (
  h.english_translation ILIKE '%fitna%'
  OR h.english_translation ILIKE '%tribulation%'
  OR h.english_translation ILIKE '%trial%'
  OR h.english_translation ILIKE '%dajjal%'
  OR h.english_translation ILIKE '%antichrist%'
  OR h.english_translation ILIKE '%end times%'
  OR h.english_translation ILIKE '%last day%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);
