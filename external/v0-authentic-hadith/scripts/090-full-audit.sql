-- Data counts
SELECT 'categories' as tbl, count(*) as cnt FROM categories;
SELECT 'tags' as tbl, count(*) as cnt FROM tags;
SELECT 'hadith_tag_weights' as tbl, count(*) as cnt FROM hadith_tag_weights;
SELECT 'learning_paths' as tbl, count(*) as cnt FROM learning_paths;
SELECT 'learning_modules' as tbl, count(*) as cnt FROM learning_modules;
SELECT 'learning_lessons' as tbl, count(*) as cnt FROM learning_lessons;
SELECT 'learning_quiz_questions' as tbl, count(*) as cnt FROM learning_quiz_questions;
SELECT 'learning_progress' as tbl, count(*) as cnt FROM learning_progress;
SELECT 'sunnah_practices' as tbl, count(*) as cnt FROM sunnah_practices;
SELECT 'prophets' as tbl, count(*) as cnt FROM prophets;
SELECT 'prophet_stories' as tbl, count(*) as cnt FROM prophet_stories;
SELECT 'sahaba' as tbl, count(*) as cnt FROM sahaba;
SELECT 'achievements' as tbl, count(*) as cnt FROM achievements;
SELECT 'hadiths' as tbl, count(*) as cnt FROM hadiths;
SELECT 'hadith_enrichment' as tbl, count(*) as cnt FROM hadith_enrichment;
SELECT 'hadith_tags' as tbl, count(*) as cnt FROM hadith_tags;

-- Check sunnah has day_of_year
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'sunnah_practices' AND column_name = 'day_of_year';

-- Achievement slugs
SELECT slug FROM achievements ORDER BY slug;

-- Learning path slugs
SELECT slug FROM learning_paths ORDER BY sort_order;

-- Prophet names
SELECT name_en FROM prophets ORDER BY name_en LIMIT 30;

-- Sahaba names
SELECT name_en FROM sahaba ORDER BY name_en LIMIT 15;
