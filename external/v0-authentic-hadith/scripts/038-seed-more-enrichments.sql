-- ============================================
-- PHASE 1b: Broader search for famous hadith enrichments
-- Uses shorter, more common phrases to find matches
-- ============================================

-- Find what's NOT yet enriched and try broader terms
-- First let's see what we have:
-- SELECT COUNT(*) FROM hadith_enrichment WHERE status = 'published';

-- Try broader searches for remaining categories
DO $$
DECLARE
  found_hadith_id uuid;
  found_cat_id uuid;
  enrichment_id uuid;
  found_tag_id uuid;
  inserted_count int := 0;
BEGIN

  -- WORSHIP: Search for prayer-related hadiths
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%prayer is the pillar%'
        OR LOWER(h.english_translation) LIKE '%establish the prayer%'
        OR LOWER(h.english_translation) LIKE '%five daily prayers%'
        OR LOWER(h.english_translation) LIKE '%fasting in ramadan%'
        OR LOWER(h.english_translation) LIKE '%whoever fasts ramadan%'
        OR LOWER(h.english_translation) LIKE '%hajj mabrur%'
        OR LOWER(h.english_translation) LIKE '%pilgrimage to the house%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'worship';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'Virtue of worship and devotion', found_cat_id, 'published', 0.90, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  -- FAMILY: parents, marriage, children
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%your mother%'
        OR LOWER(h.english_translation) LIKE '%kind to parents%'
        OR LOWER(h.english_translation) LIKE '%good to his wife%'
        OR LOWER(h.english_translation) LIKE '%treat women%'
        OR LOWER(h.english_translation) LIKE '%ties of kinship%'
        OR LOWER(h.english_translation) LIKE '%rights of the neighbor%'
        OR LOWER(h.english_translation) LIKE '%dutiful to his parents%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'family';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'Family bonds and responsibilities', found_cat_id, 'published', 0.90, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  -- KNOWLEDGE: seeking knowledge, quran
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%seek knowledge%'
        OR LOWER(h.english_translation) LIKE '%learned and a student%'
        OR LOWER(h.english_translation) LIKE '%recite the quran%'
        OR LOWER(h.english_translation) LIKE '%scholar%'
        OR LOWER(h.english_translation) LIKE '%who learns%'
        OR LOWER(h.english_translation) LIKE '%people of knowledge%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'knowledge';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'Pursuit of knowledge and faith', found_cat_id, 'published', 0.90, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  -- CHARACTER: patience, honesty, kindness
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%patience%'
        OR LOWER(h.english_translation) LIKE '%truthful%'
        OR LOWER(h.english_translation) LIKE '%forgiving%'
        OR LOWER(h.english_translation) LIKE '%gentle%'
        OR LOWER(h.english_translation) LIKE '%soft-hearted%'
        OR LOWER(h.english_translation) LIKE '%modest%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'character';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'Noble character and moral conduct', found_cat_id, 'published', 0.88, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  -- DAILY LIFE: eating, greeting, cleanliness
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%salam%'
        OR LOWER(h.english_translation) LIKE '%bismillah%'
        OR LOWER(h.english_translation) LIKE '%right hand%eat%'
        OR LOWER(h.english_translation) LIKE '%miswak%'
        OR LOWER(h.english_translation) LIKE '%ablution%'
        OR LOWER(h.english_translation) LIKE '%cleanliness%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'daily-life';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'Daily conduct and proper etiquette', found_cat_id, 'published', 0.88, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  -- COMMUNITY: justice, brotherhood
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%justice%'
        OR LOWER(h.english_translation) LIKE '%oppressor%'
        OR LOWER(h.english_translation) LIKE '%rights%'
        OR LOWER(h.english_translation) LIKE '%leader%'
        OR LOWER(h.english_translation) LIKE '%ruler%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'community';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'Community responsibility and justice', found_cat_id, 'published', 0.88, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  -- AFTERLIFE: death, paradise, hellfire
  FOR found_hadith_id IN
    SELECT h.id FROM hadiths h
    LEFT JOIN hadith_enrichment he ON h.id = he.hadith_id
    WHERE he.id IS NULL
      AND h.english_translation IS NOT NULL
      AND h.english_translation != ''
      AND (
        LOWER(h.english_translation) LIKE '%day of judgment%'
        OR LOWER(h.english_translation) LIKE '%paradise%'
        OR LOWER(h.english_translation) LIKE '%hellfire%'
        OR LOWER(h.english_translation) LIKE '%resurrection%'
        OR LOWER(h.english_translation) LIKE '%grave%'
        OR LOWER(h.english_translation) LIKE '%hereafter%'
      )
    LIMIT 5
  LOOP
    SELECT id INTO found_cat_id FROM categories WHERE slug = 'afterlife';
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, 'The afterlife and spiritual reality', found_cat_id, 'published', 0.88, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  RAISE NOTICE 'Additional enrichments attempted: %', inserted_count;
END $$;

-- Show final results
SELECT
  c.name_en as category,
  c.icon,
  COUNT(he.id) as published_count
FROM categories c
LEFT JOIN hadith_enrichment he ON c.id = he.category_id AND he.status = 'published'
GROUP BY c.name_en, c.icon, c.display_order
ORDER BY c.display_order;
