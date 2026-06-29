DROP FUNCTION IF EXISTS get_unenriched_hadiths(int);
CREATE FUNCTION get_unenriched_hadiths(lim int DEFAULT 5)
RETURNS TABLE(id uuid, english_translation text, narrator text, grade text)
LANGUAGE sql STABLE AS $$
  SELECT h.id, h.english_translation, h.narrator, h.grade
  FROM hadiths h
  LEFT JOIN hadith_enrichment he ON he.hadith_id = h.id
  WHERE he.id IS NULL
    AND h.english_translation IS NOT NULL
    AND length(h.english_translation) > 10
  ORDER BY h.hadith_number ASC
  LIMIT lim;
$$;
