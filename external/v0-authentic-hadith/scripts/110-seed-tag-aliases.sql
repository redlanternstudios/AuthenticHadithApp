-- Seed tag_aliases to resolve legacy/common slugs to canonical expanded-taxonomy tags
-- This ensures old scripts, searches, and future queries can find tags by common names

-- Helper: Insert alias only if the canonical tag exists
-- Format: (alias_slug, canonical_tag_slug, source)

INSERT INTO tag_aliases (alias_slug, tag_id, source)
SELECT alias.alias_slug, t.id, 'legacy_seed'
FROM (VALUES
  -- Worship / Prayer aliases
  ('prayer', 'five-daily-prayers'),
  ('salah', 'five-daily-prayers'),
  ('namaz', 'five-daily-prayers'),
  ('friday-prayer-alias', 'friday-prayer'),
  ('jummah', 'friday-prayer'),
  ('night-prayer-alias', 'night-prayers'),
  ('tahajjud', 'night-prayers'),
  ('qiyam', 'night-prayers'),
  ('eid-prayer-alias', 'eid-prayers'),
  
  -- Fasting aliases
  ('fasting', 'ramadan-fasting'),
  ('sawm', 'ramadan-fasting'),
  ('siyam', 'ramadan-fasting'),
  ('ramadan', 'ramadan-fasting'),
  ('voluntary-fasting', 'voluntary-fasts'),
  ('iftar', 'ramadan-fasting'),
  ('suhoor', 'ramadan-fasting'),
  
  -- Charity / Zakat aliases
  ('charity', 'obligatory-zakat'),
  ('zakat', 'obligatory-zakat'),
  ('sadaqah', 'voluntary-charity'),
  ('alms', 'obligatory-zakat'),
  ('zakat-al-fitr', 'zakat-al-fitr'),
  
  -- Hajj aliases
  ('hajj', 'hajj-rituals'),
  ('pilgrimage', 'hajj-rituals'),
  ('umrah', 'umrah-practices'),
  ('makkah', 'hajj-rituals'),
  ('mecca', 'hajj-rituals'),
  
  -- Character aliases
  ('manners', 'good-manners'),
  ('akhlaq', 'good-manners'),
  ('patience', 'patience-and-gratitude'),
  ('sabr', 'patience-and-gratitude'),
  ('gratitude', 'patience-and-gratitude'),
  ('shukr', 'patience-and-gratitude'),
  ('honesty', 'honesty-and-truthfulness'),
  ('truthfulness', 'honesty-and-truthfulness'),
  ('humility', 'humility-and-modesty'),
  ('modesty', 'humility-and-modesty'),
  
  -- Faith / Aqeedah aliases
  ('faith', 'tawheed'),
  ('iman', 'tawheed'),
  ('aqeedah', 'tawheed'),
  ('belief', 'tawheed'),
  ('qadar', 'divine-decree'),
  ('destiny', 'divine-decree'),
  ('angels', 'belief-in-angels'),
  ('prophets', 'belief-in-prophets'),
  
  -- Dhikr aliases
  ('dhikr', 'daily-adhkar'),
  ('dua', 'supplications'),
  ('supplication', 'supplications'),
  ('remembrance', 'daily-adhkar'),
  ('repentance', 'repentance-and-forgiveness'),
  ('tawbah', 'repentance-and-forgiveness'),
  ('istighfar', 'repentance-and-forgiveness'),
  
  -- Quran aliases
  ('quran', 'quran-recitation'),
  ('recitation', 'quran-recitation'),
  ('tafsir', 'tafsir-and-interpretation'),
  ('memorization', 'quran-memorization'),
  ('hifz', 'quran-memorization'),
  
  -- Purification aliases
  ('wudu', 'wudu-ablution'),
  ('ablution', 'wudu-ablution'),
  ('ghusl', 'ghusl-ritual-bath'),
  ('tayammum', 'tayammum'),
  ('purification', 'wudu-ablution'),
  
  -- Family aliases
  ('marriage', 'marriage-and-nikah'),
  ('nikah', 'marriage-and-nikah'),
  ('parenting', 'parenting-and-children'),
  ('children', 'parenting-and-children'),
  ('family', 'marriage-and-nikah'),
  ('kinship', 'kinship-and-relatives'),
  ('parents', 'rights-of-parents'),
  
  -- Daily life aliases
  ('food', 'food-and-drink'),
  ('drink', 'food-and-drink'),
  ('halal', 'food-and-drink'),
  ('haram', 'food-and-drink'),
  ('greeting', 'greetings-and-salam'),
  ('salam', 'greetings-and-salam'),
  ('travel', 'travel-etiquette'),
  ('sleep', 'sleep-and-rest'),
  ('dress', 'dress-and-appearance'),
  ('clothing', 'dress-and-appearance'),
  
  -- Business aliases
  ('trade', 'halal-trade'),
  ('business', 'halal-trade'),
  ('riba', 'prohibition-of-riba'),
  ('interest', 'prohibition-of-riba'),
  ('usury', 'prohibition-of-riba'),
  
  -- Knowledge aliases
  ('knowledge', 'seeking-knowledge'),
  ('ilm', 'seeking-knowledge'),
  ('teaching', 'teaching-and-scholarship'),
  ('scholar', 'teaching-and-scholarship'),
  
  -- Dawah aliases
  ('dawah', 'inviting-to-islam'),
  ('enjoining-good', 'enjoining-good'),
  ('forbidding-evil', 'forbidding-evil'),
  
  -- Community / Justice aliases
  ('justice', 'justice-and-fairness'),
  ('rights', 'justice-and-fairness'),
  ('neighbor', 'rights-of-neighbors'),
  ('neighbors', 'rights-of-neighbors'),
  ('orphan', 'caring-for-orphans'),
  ('orphans', 'caring-for-orphans'),
  ('poor', 'caring-for-the-poor'),
  ('poverty', 'caring-for-the-poor'),
  
  -- Warfare aliases
  ('jihad', 'striving-in-allahs-cause'),
  ('warfare', 'rules-of-warfare'),
  ('martyrdom', 'martyrdom'),
  ('shaheed', 'martyrdom'),
  
  -- History aliases
  ('seerah', 'prophetic-biography'),
  ('migration', 'hijrah-migration'),
  ('hijrah', 'hijrah-migration'),
  ('companions', 'companions-stories'),
  ('sahaba', 'companions-stories'),
  
  -- Afterlife aliases
  ('death', 'death-and-dying'),
  ('grave', 'life-in-the-grave'),
  ('resurrection', 'day-of-resurrection'),
  ('paradise', 'paradise-descriptions'),
  ('jannah', 'paradise-descriptions'),
  ('hell', 'hellfire-warnings'),
  ('jahannam', 'hellfire-warnings'),
  
  -- Fitna / Trials aliases
  ('fitna', 'trials-and-tribulations'),
  ('trials', 'trials-and-tribulations'),
  ('dajjal', 'signs-of-the-hour'),
  ('end-times', 'signs-of-the-hour'),
  ('mahdi', 'signs-of-the-hour')
) AS alias(alias_slug, canonical_slug)
JOIN tags t ON t.slug = alias.canonical_slug
ON CONFLICT (alias_slug) DO NOTHING;

-- Report what was inserted
SELECT COUNT(*) as aliases_created FROM tag_aliases;
