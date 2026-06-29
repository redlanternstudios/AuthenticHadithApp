SELECT lp.title as path, lm.title as module,
  (SELECT count(*) FROM learning_lessons ll WHERE ll.module_id = lm.id) as lessons
FROM learning_modules lm
JOIN learning_paths lp ON lm.path_id = lp.id
ORDER BY lp.sort_order, lm.sort_order;
