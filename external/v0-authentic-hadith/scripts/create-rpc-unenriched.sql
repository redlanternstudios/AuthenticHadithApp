CREATE OR REPLACE FUNCTION get_unenriched_hadiths(lim int DEFAULT 5)
RETURNS TABLE(id uuid, english_translation text, narrator text, grade text) AS $$
  SELECT h.id, h.english_translation, h.narrator, h.grade
  FROM hadiths h
  LEFT JOIN hadith_enrichment e ON e.hadith_id = h.id
  WHERE e.id IS NULL
  ORDER BY h.hadith_number ASC
  LIMIT lim;
$$ LANGUAGE sql SECURITY DEFINER;
