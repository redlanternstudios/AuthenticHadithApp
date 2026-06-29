-- 6 new achievements for learning paths, sunnah, prophets, and topics features
INSERT INTO achievements (slug, name_en, description_en, icon, category, tier, criteria, xp_reward, is_active, display_order)
VALUES
  -- Learning: Complete 3 learning paths
  ('path-master', 'Path Master', 'Complete 3 learning paths and prove your dedication to structured hadith study.', 'graduation-cap', 'learning', 3, '{"type": "learning_path_complete", "threshold": 3}', 350, true, 28),
  -- Learning: Complete first lesson
  ('first-lesson', 'First Lesson', 'Complete your first lesson in a learning path. Every journey begins with a single step.', 'book-open', 'learning', 1, '{"type": "lesson_complete", "threshold": 1}', 50, true, 29),
  -- Mastery: Explore 10 different tags
  ('topic-explorer', 'Topic Explorer', 'Explore 10 different hadith topics and tags. Breadth of knowledge is a virtue.', 'tags', 'mastery', 2, '{"type": "tags_explored", "threshold": 10}', 150, true, 30),
  -- Consistency: View sunnah practices 30 days
  ('sunnah-devoted', 'Sunnah Devoted', 'Engage with sunnah practices for 30 days. Following the Sunnah is the best of guidance.', 'heart', 'consistency', 3, '{"type": "sunnah_streak", "threshold": 30}', 300, true, 31),
  -- Learning: Read 5 prophet stories
  ('prophet-seeker', 'Prophet Seeker', 'Read 5 prophet stories. Learn from those who came before us.', 'star', 'learning', 2, '{"type": "prophet_stories_read", "threshold": 5}', 200, true, 32),
  -- Mastery: Pass 5 quizzes
  ('quiz-champion', 'Quiz Champion', 'Pass 5 quizzes on learning path content. Knowledge tested is knowledge strengthened.', 'award', 'mastery', 2, '{"type": "quizzes_passed", "threshold": 5}', 200, true, 33)
ON CONFLICT (slug) DO NOTHING;
