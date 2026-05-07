-- Seed Learning Paths and Initial Lessons
-- Creates 4 learning paths with sample lesson structure

-- Insert Learning Paths
INSERT INTO learning_paths (name, description, difficulty, estimated_days, is_premium, order_index)
VALUES
  (
    'Foundations of Faith',
    'Start your journey with essential teachings about belief, prayer, and daily Islamic practices',
    'beginner',
    21,
    false,
    1
  ),
  (
    'Daily Practice',
    'Deepen your understanding of daily worship including detailed guidance on prayer, fasting, and charity',
    'intermediate',
    30,
    false,
    2
  ),
  (
    'Character & Ethics',
    'Learn about Islamic character development, ethics, and building strong relationships',
    'advanced',
    45,
    true,
    3
  ),
  (
    'Scholar Deep Dive',
    'Advanced study of hadith sciences, chain of narration, and scholarly interpretations',
    'scholar',
    60,
    true,
    4
  )
ON CONFLICT DO NOTHING;

-- Sample Lessons for Foundations of Faith path
-- Note: Actual lesson content should be added separately with real hadith references

DO $$
DECLARE
  v_path_id UUID;
  v_lesson_id UUID;
BEGIN
  -- Get the Foundations path ID
  SELECT id INTO v_path_id FROM learning_paths WHERE name = 'Foundations of Faith';

  -- Lesson 1: Introduction to Iman
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'What is Iman (Faith)?',
    'Understanding the fundamentals of Islamic belief and the six pillars of faith',
    1,
    20
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 1);

  -- Lesson 2: The Five Pillars
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'The Five Pillars of Islam',
    'Learn about Shahada, Salah, Zakat, Sawm, and Hajj through authentic hadiths',
    2,
    25
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 2);

  -- Lesson 3: Importance of Prayer
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'The Importance of Salah',
    'Understanding why prayer is the pillar of Islam and its spiritual significance',
    3,
    20
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 3);

  -- Lesson 4: Purification
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'Wudu and Purification',
    'Learning the proper way to perform ablution and maintain ritual purity',
    4,
    15
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 4);

  -- Get Daily Practice path ID
  SELECT id INTO v_path_id FROM learning_paths WHERE name = 'Daily Practice';

  -- Lesson 1: Morning and Evening Duas
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'Morning and Evening Remembrance',
    'Daily supplications and their meanings from authentic hadiths',
    1,
    20
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 1);

  -- Lesson 2: The Etiquette of Eating
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'Islamic Etiquette of Eating',
    'Learn the sunnah way of eating and drinking',
    2,
    15
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 2);

  -- Get Character & Ethics path ID
  SELECT id INTO v_path_id FROM learning_paths WHERE name = 'Character & Ethics';

  -- Lesson 1: Patience and Perseverance
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'The Virtue of Patience (Sabr)',
    'Understanding patience through the teachings of Prophet Muhammad ﷺ',
    1,
    25
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 1);

  -- Lesson 2: Honesty and Truthfulness
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'The Importance of Truthfulness',
    'Learning about honesty and avoiding falsehood in Islam',
    2,
    20
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 2);

  -- Get Scholar Deep Dive path ID
  SELECT id INTO v_path_id FROM learning_paths WHERE name = 'Scholar Deep Dive';

  -- Lesson 1: Introduction to Hadith Sciences
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'Introduction to Hadith Sciences',
    'Understanding the classification and authentication of hadith',
    1,
    30
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 1);

  -- Lesson 2: The Major Hadith Collections
  INSERT INTO lessons (title, description, order_index, estimated_minutes)
  VALUES (
    'The Six Authentic Books',
    'Study of Sahih Bukhari, Sahih Muslim, and the four Sunan collections',
    2,
    35
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO path_lessons (learning_path_id, lesson_id, order_index)
  VALUES (v_path_id, v_lesson_id, 2);
END $$;

-- Create some sample promo codes for testing
INSERT INTO promo_codes (code, type, premium_days, max_uses, is_active)
VALUES
  ('WELCOME2024', 'campaign', 7, 100, true),
  ('RAMADAN30', 'campaign', 30, 50, true),
  ('TESTCODE', 'campaign', 14, null, true)
ON CONFLICT DO NOTHING;
