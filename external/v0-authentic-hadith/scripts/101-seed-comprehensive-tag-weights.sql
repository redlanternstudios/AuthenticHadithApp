-- Comprehensive hadith tag weights seeding
-- Maps hadiths to tags/categories using keyword matching on english_translation
-- Covers ALL 20 categories with multiple keyword patterns

-- First, get a count of what we're working with
-- SELECT count(*) FROM hadiths;
-- SELECT count(*) FROM tags;
-- SELECT count(*) FROM hadith_tag_weights;

-- ==========================================
-- CATEGORY: Salah & Prayer (slug: worship)
-- ==========================================
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
  OR h.english_translation ILIKE '%call to prayer%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Fasting & Ramadan (slug: fasting)
-- ==========================================
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
  OR h.english_translation ILIKE '%laylat%qadr%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Zakat & Charity (slug: zakat)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('charity', 'zakat', 'sadaqah', 'generosity')
AND (
  h.english_translation ILIKE '%charity%'
  OR h.english_translation ILIKE '%zakat%'
  OR h.english_translation ILIKE '%sadaqah%'
  OR h.english_translation ILIKE '%alms%'
  OR h.english_translation ILIKE '%give %' AND h.english_translation ILIKE '%poor%'
  OR h.english_translation ILIKE '%generous%'
  OR h.english_translation ILIKE '%needy%'
  OR h.english_translation ILIKE '%donation%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Hajj & Umrah (slug: hajj)
-- ==========================================
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
  OR h.english_translation ILIKE '%mina%'
  OR h.english_translation ILIKE '%ihram%'
  OR h.english_translation ILIKE '%sacrifice%' AND h.english_translation ILIKE '%animal%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Character & Manners (slug: character)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('patience', 'gratitude', 'kindness', 'honesty', 'humility', 'manners', 'good-character', 'modesty')
AND (
  h.english_translation ILIKE '%patience%'
  OR h.english_translation ILIKE '%patient%'
  OR h.english_translation ILIKE '%grateful%'
  OR h.english_translation ILIKE '%thankful%'
  OR h.english_translation ILIKE '%kindness%'
  OR h.english_translation ILIKE '%kind %'
  OR h.english_translation ILIKE '%honest%'
  OR h.english_translation ILIKE '%truthful%'
  OR h.english_translation ILIKE '%humble%'
  OR h.english_translation ILIKE '%humility%'
  OR h.english_translation ILIKE '%manner%'
  OR h.english_translation ILIKE '%character%'
  OR h.english_translation ILIKE '%noble%'
  OR h.english_translation ILIKE '%merciful%'
  OR h.english_translation ILIKE '%mercy%'
  OR h.english_translation ILIKE '%gentle%'
  OR h.english_translation ILIKE '%modesty%'
  OR h.english_translation ILIKE '%modest%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Iman & Aqeedah (slug: faith)
-- ==========================================
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
  OR h.english_translation ILIKE '%predestination%'
  OR h.english_translation ILIKE '%testimony%'
  OR h.english_translation ILIKE '%shahad%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Dhikr & Du'a (slug: dhikr)
-- ==========================================
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
  OR h.english_translation ILIKE '%allahu akbar%'
  OR h.english_translation ILIKE '%invoke%'
  OR h.english_translation ILIKE '%glorif%'
  OR h.english_translation ILIKE '%praise allah%'
  OR h.english_translation ILIKE '%seek forgiveness%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Quran & Revelation (slug: quran)
-- ==========================================
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
  OR h.english_translation ILIKE '%memoriz%'
  OR h.english_translation ILIKE '%fatiha%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Purification & Cleanliness (slug: purification)
-- ==========================================
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
  OR h.english_translation ILIKE '%najis%'
  OR h.english_translation ILIKE '%wash%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Prophetic Sunnah (slug: sunnah-acts)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('sunnah', 'prophetic-habits', 'seerah-practice')
AND (
  h.english_translation ILIKE '%sunnah%'
  OR h.english_translation ILIKE '%prophet used to%'
  OR h.english_translation ILIKE '%messenger of allah used to%'
  OR h.english_translation ILIKE '%prophet would%'
  OR h.english_translation ILIKE '%his practice%'
  OR h.english_translation ILIKE '%follow%prophet%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Family & Marriage (slug: family)
-- ==========================================
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
  OR h.english_translation ILIKE '%child %'
  OR h.english_translation ILIKE '%daughter%'
  OR h.english_translation ILIKE '%son %'
  OR h.english_translation ILIKE '%kinship%'
  OR h.english_translation ILIKE '%women%'
  OR h.english_translation ILIKE '%woman%'
  OR h.english_translation ILIKE '%breastfeed%'
  OR h.english_translation ILIKE '%orphan%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Daily Conduct & Etiquette (slug: daily-life)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('food', 'greetings', 'travel', 'sleep', 'dress', 'etiquette', 'manners')
AND (
  h.english_translation ILIKE '%food%'
  OR h.english_translation ILIKE '%eat%'
  OR h.english_translation ILIKE '%drink%'
  OR h.english_translation ILIKE '%meal%'
  OR h.english_translation ILIKE '%greet%'
  OR h.english_translation ILIKE '%salam%'
  OR h.english_translation ILIKE '%travel%'
  OR h.english_translation ILIKE '%journey%'
  OR h.english_translation ILIKE '%sleep%'
  OR h.english_translation ILIKE '%dress%'
  OR h.english_translation ILIKE '%garment%'
  OR h.english_translation ILIKE '%cloth%'
  OR h.english_translation ILIKE '%sneez%'
  OR h.english_translation ILIKE '%yawn%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Business & Trade (slug: business)
-- ==========================================
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
  OR h.english_translation ILIKE '%interest%'
  OR h.english_translation ILIKE '%contract%'
  OR h.english_translation ILIKE '%debt%'
  OR h.english_translation ILIKE '%wealth%'
  OR h.english_translation ILIKE '%earning%'
  OR h.english_translation ILIKE '%money%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Knowledge & Learning (slug: knowledge)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.9, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('knowledge', 'teaching', 'scholarship', 'learning')
AND (
  h.english_translation ILIKE '%knowledge%'
  OR h.english_translation ILIKE '%learn%'
  OR h.english_translation ILIKE '%scholar%'
  OR h.english_translation ILIKE '%teach%'
  OR h.english_translation ILIKE '%student%'
  OR h.english_translation ILIKE '%wisdom%'
  OR h.english_translation ILIKE '%understand%'
  OR h.english_translation ILIKE '%ignorance%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Da'wah & Guidance (slug: dawah)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('dawah', 'enjoining-good', 'forbidding-evil', 'guidance', 'advice')
AND (
  h.english_translation ILIKE '%invite%'
  OR h.english_translation ILIKE '%dawah%'
  OR h.english_translation ILIKE '%enjoin%good%'
  OR h.english_translation ILIKE '%forbid%evil%'
  OR h.english_translation ILIKE '%guid%'
  OR h.english_translation ILIKE '%advise%'
  OR h.english_translation ILIKE '%counsel%'
  OR h.english_translation ILIKE '%preach%'
  OR h.english_translation ILIKE '%convey%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Social Justice & Rights (slug: community)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('justice', 'rights', 'governance', 'neighbor', 'neighbors', 'oppression')
AND (
  h.english_translation ILIKE '%justice%'
  OR h.english_translation ILIKE '%just %'
  OR h.english_translation ILIKE '%oppress%'
  OR h.english_translation ILIKE '%tyrann%'
  OR h.english_translation ILIKE '%rights%'
  OR h.english_translation ILIKE '%neighbor%'
  OR h.english_translation ILIKE '%neighbour%'
  OR h.english_translation ILIKE '%ruler%'
  OR h.english_translation ILIKE '%govern%'
  OR h.english_translation ILIKE '%leader%'
  OR h.english_translation ILIKE '%slave%'
  OR h.english_translation ILIKE '%freed%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Jihad & Defense (slug: warfare)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('jihad', 'martyrdom', 'defense', 'warfare')
AND (
  h.english_translation ILIKE '%jihad%'
  OR h.english_translation ILIKE '%martyr%'
  OR h.english_translation ILIKE '%battle%'
  OR h.english_translation ILIKE '%fought%'
  OR h.english_translation ILIKE '%warrior%'
  OR h.english_translation ILIKE '%expedition%'
  OR h.english_translation ILIKE '%army%'
  OR h.english_translation ILIKE '%sword%'
  OR h.english_translation ILIKE '%enemy%'
  OR h.english_translation ILIKE '%fighting%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Prophetic History & Seerah (slug: history)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('seerah', 'companions', 'history', 'battles')
AND (
  h.english_translation ILIKE '%companion%'
  OR h.english_translation ILIKE '%abu bakr%'
  OR h.english_translation ILIKE '%umar%'
  OR h.english_translation ILIKE '%uthman%'
  OR h.english_translation ILIKE '%ali %'
  OR h.english_translation ILIKE '%badr%'
  OR h.english_translation ILIKE '%uhud%'
  OR h.english_translation ILIKE '%hijrah%'
  OR h.english_translation ILIKE '%migration%'
  OR h.english_translation ILIKE '%medina%'
  OR h.english_translation ILIKE '%mecca%'
  OR h.english_translation ILIKE '%conquest%'
  OR h.english_translation ILIKE '%ansar%'
  OR h.english_translation ILIKE '%muhajir%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Death & Afterlife (slug: afterlife)
-- ==========================================
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight, source)
SELECT h.id, t.id, 0.85, 'enrichment'
FROM hadiths h, tags t
WHERE t.slug IN ('death', 'paradise', 'hellfire', 'grave', 'resurrection', 'judgment-day')
AND (
  h.english_translation ILIKE '%death%'
  OR h.english_translation ILIKE '%die %'
  OR h.english_translation ILIKE '%died%'
  OR h.english_translation ILIKE '%grave%'
  OR h.english_translation ILIKE '%funeral%'
  OR h.english_translation ILIKE '%janazah%'
  OR h.english_translation ILIKE '%paradise%'
  OR h.english_translation ILIKE '%jannah%'
  OR h.english_translation ILIKE '%heaven%'
  OR h.english_translation ILIKE '%hellfire%'
  OR h.english_translation ILIKE '%hell %'
  OR h.english_translation ILIKE '%jahannam%'
  OR h.english_translation ILIKE '%resurrection%'
  OR h.english_translation ILIKE '%hereafter%'
  OR h.english_translation ILIKE '%day of judgment%'
  OR h.english_translation ILIKE '%punishment%'
  OR h.english_translation ILIKE '%reward%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- CATEGORY: Trials & End Times (slug: fitna)
-- ==========================================
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
  OR h.english_translation ILIKE '%hour%'
  OR h.english_translation ILIKE '%sign%' AND h.english_translation ILIKE '%day%'
  OR h.english_translation ILIKE '%end times%'
  OR h.english_translation ILIKE '%last day%'
)
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id);

-- ==========================================
-- Also update the categories.hadith_count for display
-- ==========================================
UPDATE categories c SET hadith_count = (
  SELECT COUNT(DISTINCT htw.hadith_id) 
  FROM hadith_tag_weights htw 
  JOIN tags t ON t.id = htw.tag_id 
  WHERE t.category_id = c.id
);

-- Update tags.usage_count
UPDATE tags t SET usage_count = (
  SELECT COUNT(*) FROM hadith_tag_weights htw WHERE htw.tag_id = t.id
);
