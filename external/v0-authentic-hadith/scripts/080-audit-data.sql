SELECT 'categories' as tbl, count(*) as cnt FROM categories
UNION ALL SELECT 'tags', count(*) FROM tags
UNION ALL SELECT 'hadith_tag_weights', count(*) FROM hadith_tag_weights
UNION ALL SELECT 'sunnah_categories', count(*) FROM sunnah_categories
UNION ALL SELECT 'sunnah_practices', count(*) FROM sunnah_practices
UNION ALL SELECT 'prophets', count(*) FROM prophets
UNION ALL SELECT 'prophet_stories', count(*) FROM prophet_stories
UNION ALL SELECT 'sahaba', count(*) FROM sahaba
UNION ALL SELECT 'story_parts', count(*) FROM story_parts
UNION ALL SELECT 'achievements', count(*) FROM achievements
UNION ALL SELECT 'learning_quiz_questions', count(*) FROM learning_quiz_questions
UNION ALL SELECT 'hadiths', count(*) FROM hadiths
ORDER BY tbl;
