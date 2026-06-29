SELECT lm.id, lm.slug, lm.title
FROM learning_modules lm
WHERE NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = lm.id)
ORDER BY lm.title;
