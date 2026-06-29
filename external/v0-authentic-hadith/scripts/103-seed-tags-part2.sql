-- Part 2: Iman, Dhikr, Quran, Purification, Sunnah
-- CATEGORY: Iman & Aqeedah
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('faith', 'tawhid', 'belief', 'angels', 'qadr', 'iman')
AND (
  h.english_translation ILIKE '%faith%'
  OR h.english_translation ILIKE '%iman%'
  OR h.english_translation ILIKE '%believ%'
  OR h.english_translation ILIKE '%tawhid%'
  OR h.english_translation ILIKE '%oneness%'
  OR h.english_translation ILIKE '%angel%'
  OR h.english_translation ILIKE '%qadr%'
  OR h.english_translation ILIKE '%decree%'
  OR h.english_translation ILIKE '%testimony%'
  OR h.english_translation ILIKE '%shahad%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Dhikr & Du'a
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('dua', 'dhikr', 'remembrance', 'istighfar', 'supplication')
AND (
  h.english_translation ILIKE '%supplication%'
  OR h.english_translation ILIKE '%dua%'
  OR h.english_translation ILIKE '%dhikr%'
  OR h.english_translation ILIKE '%remembrance%'
  OR h.english_translation ILIKE '%istighfar%'
  OR h.english_translation ILIKE '%subhan%'
  OR h.english_translation ILIKE '%alhamdulillah%'
  OR h.english_translation ILIKE '%invoke%'
  OR h.english_translation ILIKE '%glorif%'
  OR h.english_translation ILIKE '%seek forgiveness%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Quran & Revelation
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('quran', 'recitation', 'revelation', 'tafsir')
AND (
  h.english_translation ILIKE '%quran%'
  OR h.english_translation ILIKE '%recit%'
  OR h.english_translation ILIKE '%surah%'
  OR h.english_translation ILIKE '%verse%'
  OR h.english_translation ILIKE '%ayah%'
  OR h.english_translation ILIKE '%revelation%'
  OR h.english_translation ILIKE '%book of allah%'
  OR h.english_translation ILIKE '%fatiha%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Purification & Cleanliness
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('purification', 'wudu', 'ghusl', 'cleanliness')
AND (
  h.english_translation ILIKE '%wudu%'
  OR h.english_translation ILIKE '%ablution%'
  OR h.english_translation ILIKE '%purif%'
  OR h.english_translation ILIKE '%ghusl%'
  OR h.english_translation ILIKE '%tayammum%'
  OR h.english_translation ILIKE '%clean%'
  OR h.english_translation ILIKE '%impurity%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Prophetic Sunnah
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('sunnah', 'prophetic-habits', 'seerah-practice')
AND (
  h.english_translation ILIKE '%sunnah%'
  OR h.english_translation ILIKE '%prophet used to%'
  OR h.english_translation ILIKE '%messenger of allah used to%'
  OR h.english_translation ILIKE '%prophet would%'
  OR h.english_translation ILIKE '%follow%prophet%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);
