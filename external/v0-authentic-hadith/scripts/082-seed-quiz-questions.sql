-- Seed learning_quiz_questions for lesson quizzes
-- Schema: lesson_id, question_text, question_type, options (jsonb array), correct_index (int), hint_text, sort_order

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'What is the primary purpose of studying the science of Hadith (Mustalah al-Hadith)?',
  'multiple_choice',
  '["To memorize as many hadiths as possible", "To verify the authenticity and reliability of prophetic narrations", "To learn Arabic grammar", "To study Islamic history"]'::jsonb,
  1,
  'The science of Hadith was developed specifically to establish rigorous methods for authenticating prophetic traditions.',
  1
FROM learning_lessons ll WHERE ll.slug = 'what-is-hadith' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'What are the two main components of every hadith?',
  'multiple_choice',
  '["Sanad and Matn", "Quran and Sunnah", "Narrator and Collection", "Arabic and Translation"]'::jsonb,
  0,
  'Every hadith consists of the chain of narrators and the actual text of the narration.',
  2
FROM learning_lessons ll WHERE ll.slug = 'what-is-hadith' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'Which of the following is NOT one of the six major hadith collections (Kutub al-Sittah)?',
  'multiple_choice',
  '["Sahih Bukhari", "Sahih Muslim", "Muwatta Malik", "Sunan Abu Dawud"]'::jsonb,
  2,
  'While highly respected, this early collection predates the standardized six.',
  1
FROM learning_lessons ll WHERE ll.slug = 'major-collections' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'Sahih Bukhari contains approximately how many unique hadiths (without repetition)?',
  'multiple_choice',
  '["About 600", "About 2,602", "About 7,275", "About 10,000"]'::jsonb,
  1,
  'Imam Bukhari selected these from over 600,000 narrations he studied.',
  2
FROM learning_lessons ll WHERE ll.slug = 'major-collections' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'What does the term "Sahih" mean when classifying a hadith?',
  'multiple_choice',
  '["Popular among scholars", "Authentic/Sound", "Widely narrated", "Ancient"]'::jsonb,
  1,
  'Think about what makes a hadith trustworthy and reliable.',
  1
FROM learning_lessons ll WHERE ll.slug = 'hadith-grades' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'A hadith classified as "Hasan" is considered:',
  'multiple_choice',
  '["Fabricated and rejected", "Good/acceptable for practice", "Only valid for Tafsir", "Equal in strength to Sahih"]'::jsonb,
  1,
  'This grade sits between Sahih and Da''if in terms of reliability.',
  2
FROM learning_lessons ll WHERE ll.slug = 'hadith-grades' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'What is the "Isnad" (chain of narration) in hadith science?',
  'multiple_choice',
  '["The text of the hadith", "The chain of narrators linking back to the Prophet", "The book the hadith is found in", "The grade given by scholars"]'::jsonb,
  1,
  'This is considered the backbone of hadith authentication.',
  1
FROM learning_lessons ll WHERE ll.slug = 'chains-of-narration' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'Abu Hurairah (RA) is known for narrating approximately how many hadiths?',
  'multiple_choice',
  '["500", "1,500", "5,374", "10,000"]'::jsonb,
  2,
  'He spent about 3 years constantly in the company of the Prophet (peace be upon him).',
  1
FROM learning_lessons ll WHERE ll.slug = 'famous-narrators' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'Aisha (RA) was particularly known for her expertise in which areas?',
  'multiple_choice',
  '["Military strategy", "Fiqh, medicine, and poetry", "Trade and commerce", "Agriculture"]'::jsonb,
  1,
  'Many senior companions would consult her on complex legal matters.',
  2
FROM learning_lessons ll WHERE ll.slug = 'famous-narrators' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'What does "Ilm al-Jarh wa al-Ta''dil" study?',
  'multiple_choice',
  '["The text of hadiths", "Criticism and validation of narrators", "The history of hadith compilation", "The Arabic grammar of hadiths"]'::jsonb,
  1,
  'This science evaluates the reliability, memory, and character of hadith narrators.',
  1
FROM learning_lessons ll WHERE ll.slug = 'narrator-criticism' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'What is a "Mutawatir" hadith?',
  'multiple_choice',
  '["A hadith narrated by only one person", "A hadith transmitted by so many narrators fabrication is inconceivable", "A hadith found only in Sahih Bukhari", "A hadith about the end times"]'::jsonb,
  1,
  'Think about the number of narrators at every level of the chain.',
  1
FROM learning_lessons ll WHERE ll.slug = 'cross-referencing-hadiths' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'The Hadith of Jibreel teaches about which three dimensions of the religion?',
  'multiple_choice',
  '["Salah, Zakat, and Hajj", "Islam, Iman, and Ihsan", "Quran, Sunnah, and Ijma", "Tawhid, Risalah, and Akhirah"]'::jsonb,
  1,
  'These three dimensions progress from outer practice to inner spiritual excellence.',
  1
FROM learning_lessons ll WHERE ll.slug = 'forty-nawawi-deep-dive' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'Who is known as one of the earliest systematic compilers of hadith?',
  'multiple_choice',
  '["Imam Bukhari", "Imam Malik", "Ibn Shihab al-Zuhri", "Imam Ahmad"]'::jsonb,
  2,
  'This scholar compiled hadiths on the order of Caliph Umar ibn Abd al-Aziz.',
  1
FROM learning_lessons ll WHERE ll.slug = 'early-collectors' LIMIT 1;

INSERT INTO learning_quiz_questions (lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order)
SELECT ll.id,
  'According to hadith, which rights does a Muslim have over another Muslim?',
  'multiple_choice',
  '["Financial support only", "Returning greetings, visiting the sick, following funerals, accepting invitations", "Only greeting with Salam", "Lending money and providing shelter"]'::jsonb,
  1,
  'These specific rights strengthen the bonds of Muslim brotherhood and community.',
  1
FROM learning_lessons ll WHERE ll.slug = 'rights-in-islam' LIMIT 1;
