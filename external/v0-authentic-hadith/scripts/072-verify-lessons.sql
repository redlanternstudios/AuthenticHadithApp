SELECT lp.title as path_title, lm.title as module_title,
  (SELECT count(*) FROM learning_lessons ll WHERE ll.module_id = lm.id) as lesson_count
FROM learning_modules lm
JOIN learning_paths lp ON lm.path_id = lp.id
ORDER BY lp.sort_order, lm.sort_order;
