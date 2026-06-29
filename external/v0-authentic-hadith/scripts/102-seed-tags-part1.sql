-- Part 1: Salah, Fasting, Zakat, Hajj, Character
-- CATEGORY: Salah & Prayer
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('prayer', 'salah', 'friday-prayer', 'night-prayer', 'voluntary-prayer')
AND (
  h.english_translation ILIKE '%prayer%'
  OR h.english_translation ILIKE '%salah%'
  OR h.english_translation ILIKE '%prostrat%'
  OR h.english_translation ILIKE '%ruku%'
  OR h.english_translation ILIKE '%sujud%'
  OR h.english_translation ILIKE '%mosque%'
  OR h.english_translation ILIKE '%masjid%'
  OR h.english_translation ILIKE '%imam %'
  OR h.english_translation ILIKE '%congregat%'
  OR h.english_translation ILIKE '%adhan%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Fasting & Ramadan
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('fasting', 'ramadan', 'voluntary-fasting', 'itikaf')
AND (
  h.english_translation ILIKE '%fasting%'
  OR h.english_translation ILIKE '%fast %'
  OR h.english_translation ILIKE '%ramadan%'
  OR h.english_translation ILIKE '%suhoor%'
  OR h.english_translation ILIKE '%iftar%'
  OR h.english_translation ILIKE '%siyam%'
  OR h.english_translation ILIKE '%itikaf%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Zakat & Charity
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('charity', 'zakat', 'sadaqah', 'generosity')
AND (
  h.english_translation ILIKE '%charity%'
  OR h.english_translation ILIKE '%zakat%'
  OR h.english_translation ILIKE '%sadaqah%'
  OR h.english_translation ILIKE '%alms%'
  OR h.english_translation ILIKE '%generous%'
  OR h.english_translation ILIKE '%needy%'
  OR h.english_translation ILIKE '%donation%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Hajj & Umrah
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('hajj', 'umrah', 'pilgrimage')
AND (
  h.english_translation ILIKE '%hajj%'
  OR h.english_translation ILIKE '%pilgrimage%'
  OR h.english_translation ILIKE '%umrah%'
  OR h.english_translation ILIKE '%kaaba%'
  OR h.english_translation ILIKE '%tawaf%'
  OR h.english_translation ILIKE '%arafat%'
  OR h.english_translation ILIKE '%ihram%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- CATEGORY: Character & Manners
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('patience', 'gratitude', 'kindness', 'honesty', 'humility', 'manners', 'good-character', 'modesty')
AND (
  h.english_translation ILIKE '%patience%'
  OR h.english_translation ILIKE '%patient%'
  OR h.english_translation ILIKE '%grateful%'
  OR h.english_translation ILIKE '%kindness%'
  OR h.english_translation ILIKE '%honest%'
  OR h.english_translation ILIKE '%truthful%'
  OR h.english_translation ILIKE '%humble%'
  OR h.english_translation ILIKE '%manner%'
  OR h.english_translation ILIKE '%character%'
  OR h.english_translation ILIKE '%merciful%'
  OR h.english_translation ILIKE '%mercy%'
  OR h.english_translation ILIKE '%gentle%'
  OR h.english_translation ILIKE '%modesty%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);
