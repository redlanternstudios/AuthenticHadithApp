-- ============================================
-- PHASE 1: Seed 21 famous hadith enrichments
-- Across all 7 categories (3 per category)
-- Uses service role to bypass RLS
-- ============================================

-- First, find hadiths by their well-known text snippets and assign enrichments.
-- We search by english_translation ILIKE to find the right hadith row.

-- Helper: Create a temp table for our manual enrichments
CREATE TEMP TABLE manual_enrichments (
  search_text text,
  summary_line text,
  category_slug text,
  tag_slugs text[],
  confidence numeric
);

INSERT INTO manual_enrichments VALUES
-- WORSHIP (3)
('actions are judged by intentions', 'Actions are judged by their intentions', 'knowledge', ARRAY['intention', 'faith'], 0.99),
('five pillars', 'Islam is built upon five pillars', 'worship', ARRAY['prayer', 'fasting', 'charity', 'pilgrimage'], 0.99),
('pray as you have seen me pray', 'Pray as you have seen me praying', 'worship', ARRAY['prayer'], 0.95),

-- CHARACTER (3)
('none of you truly believes until he loves for his brother', 'Love for your brother what you love for yourself', 'character', ARRAY['brotherhood', 'kindness'], 0.99),
('best of you are those who have the best character', 'The best people have the best character', 'character', ARRAY['kindness', 'humility'], 0.98),
('whoever believes in allah and the last day should speak good', 'Speak good or remain silent', 'character', ARRAY['speech', 'faith'], 0.97),

-- FAMILY (3)
('paradise lies at the feet of mothers', 'Paradise lies at the feet of your mother', 'family', ARRAY['parents'], 0.99),
('best of you are the best to their wives', 'The best of you are best to their families', 'family', ARRAY['marriage'], 0.98),
('whoever severs the bond of kinship', 'Maintain family ties to enter Paradise', 'family', ARRAY['relatives'], 0.95),

-- DAILY LIFE (3)
('cleanliness is half of faith', 'Cleanliness is half of faith', 'daily-life', ARRAY['cleanliness', 'faith'], 0.99),
('spread the greeting of peace', 'Spread peace and feed others', 'daily-life', ARRAY['greetings', 'food'], 0.96),
('part of someone''s being a good muslim is leaving alone', 'Leave what does not concern you', 'daily-life', ARRAY['speech'], 0.95),

-- KNOWLEDGE (3)
('seeking knowledge is an obligation', 'Seeking knowledge is obligatory for every Muslim', 'knowledge', ARRAY['seeking-knowledge'], 0.99),
('whoever follows a path to seek knowledge', 'Allah eases the path to Paradise for seekers of knowledge', 'knowledge', ARRAY['seeking-knowledge', 'paradise'], 0.98),
('convey from me, even if it is one verse', 'Share knowledge even if a single verse', 'knowledge', ARRAY['seeking-knowledge'], 0.96),

-- COMMUNITY (3)
('help your brother whether he is an oppressor or oppressed', 'Help your brother in justice', 'community', ARRAY['justice', 'brotherhood'], 0.97),
('muslims are like one body', 'The Muslim community is like one body', 'community', ARRAY['brotherhood', 'rights'], 0.98),
('whoever cheats is not one of us', 'Do not cheat or deceive others', 'community', ARRAY['justice', 'rights'], 0.95),

-- AFTERLIFE (3)
('remember often the destroyer of pleasures', 'Remember death frequently', 'afterlife', ARRAY['death'], 0.98),
('the grave is the first stage of the hereafter', 'The grave is the first stage of the afterlife', 'afterlife', ARRAY['death', 'judgment'], 0.96),
('paradise is surrounded by hardships', 'Paradise is surrounded by difficulties', 'afterlife', ARRAY['paradise'], 0.97);

-- Now insert enrichments for matching hadiths
DO $$
DECLARE
  rec RECORD;
  found_hadith_id uuid;
  found_cat_id uuid;
  enrichment_id uuid;
  tag_slug text;
  found_tag_id uuid;
  inserted_count int := 0;
BEGIN
  FOR rec IN SELECT * FROM manual_enrichments LOOP
    -- Find a hadith matching the search text
    SELECT id INTO found_hadith_id
    FROM hadiths
    WHERE LOWER(english_translation) LIKE '%' || rec.search_text || '%'
    LIMIT 1;

    IF found_hadith_id IS NULL THEN
      RAISE NOTICE 'No hadith found for: %', rec.search_text;
      CONTINUE;
    END IF;

    -- Find the category
    SELECT id INTO found_cat_id
    FROM categories
    WHERE slug = rec.category_slug;

    IF found_cat_id IS NULL THEN
      RAISE NOTICE 'No category found for: %', rec.category_slug;
      CONTINUE;
    END IF;

    -- Insert enrichment (skip if already exists)
    INSERT INTO hadith_enrichment (hadith_id, summary_line, category_id, status, confidence, suggested_by, published_at)
    VALUES (found_hadith_id, rec.summary_line, found_cat_id, 'published', rec.confidence, 'manual_seed', now())
    ON CONFLICT (hadith_id) DO NOTHING
    RETURNING id INTO enrichment_id;

    IF enrichment_id IS NULL THEN
      RAISE NOTICE 'Enrichment already exists for: %', rec.summary_line;
      CONTINUE;
    END IF;

    -- Insert tags
    FOREACH tag_slug IN ARRAY rec.tag_slugs LOOP
      SELECT id INTO found_tag_id FROM tags WHERE slug = tag_slug;
      IF found_tag_id IS NOT NULL THEN
        INSERT INTO hadith_tags (hadith_id, tag_id, enrichment_id, status)
        VALUES (found_hadith_id, found_tag_id, enrichment_id, 'published')
        ON CONFLICT (hadith_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;

    inserted_count := inserted_count + 1;
    RAISE NOTICE 'Enriched: %', rec.summary_line;
  END LOOP;

  RAISE NOTICE 'Total enrichments inserted: %', inserted_count;
END $$;

-- Show results
SELECT
  c.name_en as category,
  COUNT(he.id) as published_count
FROM categories c
LEFT JOIN hadith_enrichment he ON c.id = he.category_id AND he.status = 'published'
GROUP BY c.name_en, c.display_order
ORDER BY c.display_order;

DROP TABLE manual_enrichments;
