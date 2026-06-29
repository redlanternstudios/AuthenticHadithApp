-- Seed hadith_tag_weights by matching hadiths to tags based on keyword presence in english_translation
-- This links hadiths to relevant tags with weight scores

-- Helper: Tag hadiths about prayer/salah
INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.9
FROM hadiths h, tags t
WHERE t.slug = 'prayer'
AND h.english_translation ILIKE '%prayer%'
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'fasting'
AND (h.english_translation ILIKE '%fasting%' OR h.english_translation ILIKE '%fast %' OR h.english_translation ILIKE '%ramadan%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'charity'
AND (h.english_translation ILIKE '%charity%' OR h.english_translation ILIKE '%sadaqah%' OR h.english_translation ILIKE '%zakat%' OR h.english_translation ILIKE '%alms%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'hajj'
AND (h.english_translation ILIKE '%hajj%' OR h.english_translation ILIKE '%pilgrimage%' OR h.english_translation ILIKE '%kaaba%' OR h.english_translation ILIKE '%mecca%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.8
FROM hadiths h, tags t
WHERE t.slug = 'patience'
AND (h.english_translation ILIKE '%patience%' OR h.english_translation ILIKE '%patient%' OR h.english_translation ILIKE '%sabr%' OR h.english_translation ILIKE '%endurance%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.8
FROM hadiths h, tags t
WHERE t.slug = 'gratitude'
AND (h.english_translation ILIKE '%grateful%' OR h.english_translation ILIKE '%thankful%' OR h.english_translation ILIKE '%gratitude%' OR h.english_translation ILIKE '%shukr%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'kindness'
AND (h.english_translation ILIKE '%kindness%' OR h.english_translation ILIKE '%kind %' OR h.english_translation ILIKE '%gentle%' OR h.english_translation ILIKE '%merciful%' OR h.english_translation ILIKE '%mercy%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'honesty'
AND (h.english_translation ILIKE '%honest%' OR h.english_translation ILIKE '%truthful%' OR h.english_translation ILIKE '%truth %' OR h.english_translation ILIKE '%liar%' OR h.english_translation ILIKE '%lying%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.9
FROM hadiths h, tags t
WHERE t.slug = 'knowledge'
AND (h.english_translation ILIKE '%knowledge%' OR h.english_translation ILIKE '%learn%' OR h.english_translation ILIKE '%scholar%' OR h.english_translation ILIKE '%teach%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'marriage'
AND (h.english_translation ILIKE '%marriage%' OR h.english_translation ILIKE '%wife%' OR h.english_translation ILIKE '%husband%' OR h.english_translation ILIKE '%wedding%' OR h.english_translation ILIKE '%nikah%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'family'
AND (h.english_translation ILIKE '%family%' OR h.english_translation ILIKE '%parent%' OR h.english_translation ILIKE '%mother%' OR h.english_translation ILIKE '%father%' OR h.english_translation ILIKE '%children%' OR h.english_translation ILIKE '%child %')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.8
FROM hadiths h, tags t
WHERE t.slug = 'death'
AND (h.english_translation ILIKE '%death%' OR h.english_translation ILIKE '%die %' OR h.english_translation ILIKE '%died%' OR h.english_translation ILIKE '%grave%' OR h.english_translation ILIKE '%funeral%' OR h.english_translation ILIKE '%janazah%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'paradise'
AND (h.english_translation ILIKE '%paradise%' OR h.english_translation ILIKE '%jannah%' OR h.english_translation ILIKE '%heaven%' OR h.english_translation ILIKE '%garden%of%bliss%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'hellfire'
AND (h.english_translation ILIKE '%hellfire%' OR h.english_translation ILIKE '%hell %' OR h.english_translation ILIKE '%jahannam%' OR h.english_translation ILIKE '%fire %' AND h.english_translation ILIKE '%punish%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.9
FROM hadiths h, tags t
WHERE t.slug = 'jihad'
AND (h.english_translation ILIKE '%jihad%' OR h.english_translation ILIKE '%struggle%' OR h.english_translation ILIKE '%strive%in the%way%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'repentance'
AND (h.english_translation ILIKE '%repent%' OR h.english_translation ILIKE '%tawbah%' OR h.english_translation ILIKE '%forgive%' OR h.english_translation ILIKE '%sin%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'dua'
AND (h.english_translation ILIKE '%supplication%' OR h.english_translation ILIKE '%dua%' OR h.english_translation ILIKE '%invoke%' OR h.english_translation ILIKE '%pray to%allah%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'food'
AND (h.english_translation ILIKE '%food%' OR h.english_translation ILIKE '%eat%' OR h.english_translation ILIKE '%drink%' OR h.english_translation ILIKE '%meal%' OR h.english_translation ILIKE '%dates%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'trade'
AND (h.english_translation ILIKE '%trade%' OR h.english_translation ILIKE '%business%' OR h.english_translation ILIKE '%sell%' OR h.english_translation ILIKE '%buy%' OR h.english_translation ILIKE '%merchant%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'women'
AND (h.english_translation ILIKE '%women%' OR h.english_translation ILIKE '%woman%' OR h.english_translation ILIKE '%wife%' OR h.english_translation ILIKE '%daughter%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'animals'
AND (h.english_translation ILIKE '%animal%' OR h.english_translation ILIKE '%dog%' OR h.english_translation ILIKE '%cat %' OR h.english_translation ILIKE '%camel%' OR h.english_translation ILIKE '%horse%' OR h.english_translation ILIKE '%bird%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.8
FROM hadiths h, tags t
WHERE t.slug = 'neighbors'
AND (h.english_translation ILIKE '%neighbor%' OR h.english_translation ILIKE '%neighbour%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'justice'
AND (h.english_translation ILIKE '%justice%' OR h.english_translation ILIKE '%just %' OR h.english_translation ILIKE '%fair%' OR h.english_translation ILIKE '%oppress%' OR h.english_translation ILIKE '%tyrann%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'purification'
AND (h.english_translation ILIKE '%wudu%' OR h.english_translation ILIKE '%ablution%' OR h.english_translation ILIKE '%purif%' OR h.english_translation ILIKE '%ghusl%' OR h.english_translation ILIKE '%tayammum%' OR h.english_translation ILIKE '%clean%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 500;

INSERT INTO hadith_tag_weights (hadith_id, tag_id, weight)
SELECT h.id, t.id, 0.85
FROM hadiths h, tags t
WHERE t.slug = 'manners'
AND (h.english_translation ILIKE '%manner%' OR h.english_translation ILIKE '%etiquette%' OR h.english_translation ILIKE '%adab%' OR h.english_translation ILIKE '%conduct%' OR h.english_translation ILIKE '%behav%')
AND NOT EXISTS (SELECT 1 FROM hadith_tag_weights htw WHERE htw.hadith_id = h.id AND htw.tag_id = t.id)
LIMIT 400;
