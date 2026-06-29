SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'learning_quiz_questions'
ORDER BY ordinal_position;

-- Also check the lessons table for lesson IDs we can reference
SELECT id, title, module_id FROM learning_lessons ORDER BY module_id, id LIMIT 40;
