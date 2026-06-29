-- Seed new achievements for content expansion features
-- Schema: slug, name_en, description_en, icon, category (enum: mastery/consistency/learning/social/milestone), tier, xp_reward, criteria (jsonb), is_active, display_order

INSERT INTO achievements (slug, name_en, description_en, icon, category, tier, xp_reward, criteria, is_active, display_order)
SELECT * FROM (VALUES
  ('path-scholar', 'Path Scholar', 'Complete any learning path', 'graduation-cap', 'learning'::achievement_category, 2, 200, '{"type": "learning_path_complete", "threshold": 1}'::jsonb, true, 50),
  ('quiz-master', 'Quiz Master', 'Pass 10 quizzes with a perfect score', 'trophy', 'mastery'::achievement_category, 3, 300, '{"type": "quiz_perfect_score", "threshold": 10}'::jsonb, true, 51),
  ('daily-devotee', 'Daily Devotee', 'Practice sunnah for 30 consecutive days', 'sun', 'consistency'::achievement_category, 2, 250, '{"type": "sunnah_streak", "threshold": 30}'::jsonb, true, 52),
  ('prophet-stories', 'Stories of the Prophets', 'Read all 25 prophet stories', 'book-open', 'learning'::achievement_category, 3, 400, '{"type": "all_prophet_stories_complete"}'::jsonb, true, 53),
  ('companion-connoisseur', 'Companion Connoisseur', 'Read all companion stories', 'users', 'learning'::achievement_category, 3, 350, '{"type": "all_stories_complete"}'::jsonb, true, 54),
  ('sunnah-seeker', 'Sunnah Seeker', 'Maintain a 7-day sunnah practice streak', 'heart', 'consistency'::achievement_category, 1, 150, '{"type": "sunnah_streak", "threshold": 7}'::jsonb, true, 55)
) AS v(slug, name_en, description_en, icon, category, tier, xp_reward, criteria, is_active, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements a WHERE a.slug = v.slug
);
