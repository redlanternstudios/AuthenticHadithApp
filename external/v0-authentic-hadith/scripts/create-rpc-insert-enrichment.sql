CREATE OR REPLACE FUNCTION insert_enrichment(
  p_hadith_id uuid,
  p_summary_line text,
  p_summary_ar text,
  p_key_teaching_en text,
  p_key_teaching_ar text,
  p_category_slug text,
  p_tag_slugs text[],
  p_confidence float
) RETURNS void AS $$
DECLARE
  v_cat_id uuid;
  v_tag_id uuid;
  v_slug text;
BEGIN
  SELECT id INTO v_cat_id FROM categories WHERE slug = p_category_slug;
  IF v_cat_id IS NULL THEN
    SELECT id INTO v_cat_id FROM categories WHERE slug = 'daily-life';
  END IF;

  INSERT INTO hadith_enrichment (
    hadith_id, summary_line, summary_ar,
    key_teaching_en, key_teaching_ar,
    category_id, status, confidence,
    suggested_by, methodology_version
  ) VALUES (
    p_hadith_id, p_summary_line, p_summary_ar,
    p_key_teaching_en, p_key_teaching_ar,
    v_cat_id, 'published', p_confidence,
    'deepinfra-llama-3.3-70b', 'v1.1'
  );

  FOREACH v_slug IN ARRAY p_tag_slugs LOOP
    SELECT id INTO v_tag_id FROM tags WHERE slug = v_slug;
    IF v_tag_id IS NOT NULL THEN
      INSERT INTO hadith_tags (hadith_id, tag_id, status)
      VALUES (p_hadith_id, v_tag_id, 'published')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
