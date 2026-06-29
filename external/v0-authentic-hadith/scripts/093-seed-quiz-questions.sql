-- Seed quiz questions for learning lessons
-- Schema: id (uuid), lesson_id (uuid), question_text, question_type, options (jsonb), correct_index (int), hint_text, hadith_id, sort_order

-- Clear any previous attempts
DELETE FROM learning_quiz_questions;

-- ==============================================
-- Lesson: "Defining Hadith & Sunnah" (52e4e8e1-022a-423b-9973-216fceb481b7)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '52e4e8e1-022a-423b-9973-216fceb481b7',
 'What does the word "Hadith" literally mean?',
 'multiple_choice',
 '["A legal ruling", "A saying or narration", "A chapter of the Quran", "A type of prayer"]'::jsonb,
 1, 'Think about the Arabic root word and its connection to speech.', 1),

(gen_random_uuid(), '52e4e8e1-022a-423b-9973-216fceb481b7',
 'What is the difference between Hadith and Sunnah?',
 'multiple_choice',
 '["They are exactly the same thing", "Hadith is the narration while Sunnah is the practice", "Sunnah is written and Hadith is oral", "Hadith is only about prayer"]'::jsonb,
 1, 'One refers to reported speech, the other to established practice.', 2),

(gen_random_uuid(), '52e4e8e1-022a-423b-9973-216fceb481b7',
 'Which of the following is a component of a hadith?',
 'multiple_choice',
 '["Surah and Ayah", "Isnad and Matn", "Fiqh and Usul", "Tafsir and Tajweed"]'::jsonb,
 1, 'Every hadith has a chain and a body text.', 3);

-- ==============================================
-- Lesson: "The Role of Hadith in Islam" (4a1f727a-1ceb-40c2-9f49-07af3f9dc7c7)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '4a1f727a-1ceb-40c2-9f49-07af3f9dc7c7',
 'Why are hadiths essential in Islamic jurisprudence?',
 'multiple_choice',
 '["They replace the Quran", "They provide detailed guidance that complements the Quran", "They are optional supplements", "They only apply to scholars"]'::jsonb,
 1, 'The Quran provides general principles; hadiths provide specific details.', 1),

(gen_random_uuid(), '4a1f727a-1ceb-40c2-9f49-07af3f9dc7c7',
 'What role do hadiths play regarding the five daily prayers?',
 'multiple_choice',
 '["The Quran alone describes all prayer details", "Hadiths explain the method, timings, and conditions of prayer", "Hadiths only cover voluntary prayers", "Prayer details come from scholarly consensus alone"]'::jsonb,
 1, 'The Quran commands prayer but does not detail every step.', 2),

(gen_random_uuid(), '4a1f727a-1ceb-40c2-9f49-07af3f9dc7c7',
 'Which of the following is considered the second source of Islamic legislation after the Quran?',
 'multiple_choice',
 '["Ijma (Consensus)", "Qiyas (Analogy)", "The Sunnah / Hadith", "Local custom"]'::jsonb,
 2, 'It is the Prophetic tradition that ranks immediately after the Quran.', 3);

-- ==============================================
-- Lesson: "How Hadith Were Preserved" (5a583192-1627-49dd-8e93-0554f2b44269)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '5a583192-1627-49dd-8e93-0554f2b44269',
 'How were hadiths primarily preserved during the Prophet''s lifetime?',
 'multiple_choice',
 '["Written in official books", "Through oral memorization and transmission", "Carved on stone tablets", "Stored in a central library"]'::jsonb,
 1, 'The Arab tradition placed great emphasis on memory.', 1),

(gen_random_uuid(), '5a583192-1627-49dd-8e93-0554f2b44269',
 'Who was one of the most prolific narrators of hadith?',
 'multiple_choice',
 '["Abu Bakr al-Siddiq", "Abu Hurayrah", "Uthman ibn Affan", "Khalid ibn al-Walid"]'::jsonb,
 1, 'This companion is known for narrating over 5,000 hadiths.', 2),

(gen_random_uuid(), '5a583192-1627-49dd-8e93-0554f2b44269',
 'During which century did the major hadith compilations take place?',
 'multiple_choice',
 '["1st century AH", "3rd century AH (9th century CE)", "5th century AH", "7th century AH"]'::jsonb,
 1, 'Imam Bukhari and Imam Muslim lived during this period.', 3);

-- ==============================================
-- Lesson: "Reading a Hadith Step by Step" (5517b2ee-65a2-45eb-8a7d-a0d322597da3)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '5517b2ee-65a2-45eb-8a7d-a0d322597da3',
 'What is the "isnad" of a hadith?',
 'multiple_choice',
 '["The main text or body", "The chain of narrators", "The grade of authenticity", "The topic category"]'::jsonb,
 1, 'This word means "support" or "chain" in Arabic.', 1),

(gen_random_uuid(), '5517b2ee-65a2-45eb-8a7d-a0d322597da3',
 'What is the "matn" of a hadith?',
 'multiple_choice',
 '["The chain of transmitters", "The actual content/text of the narration", "The name of the compiler", "The collection it belongs to"]'::jsonb,
 1, 'This is the actual words being reported.', 2),

(gen_random_uuid(), '5517b2ee-65a2-45eb-8a7d-a0d322597da3',
 'When reading a hadith, what should you check first?',
 'multiple_choice',
 '["The length of the text", "The authenticity grade and source collection", "Whether it has an Arabic version", "The number of narrators"]'::jsonb,
 1, 'Knowing the grade tells you the reliability of the hadith.', 3);

-- ==============================================
-- Lesson: "Sahih Bukhari & Sahih Muslim" (db5641e0-bb42-49eb-a6b6-8a7707933efc)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), 'db5641e0-bb42-49eb-a6b6-8a7707933efc',
 'How many hadiths did Imam Bukhari reportedly select for his Sahih from?',
 'multiple_choice',
 '["About 10,000", "About 100,000", "About 600,000", "About 1,000,000"]'::jsonb,
 2, 'He was extremely selective, choosing from a very large pool.', 1),

(gen_random_uuid(), 'db5641e0-bb42-49eb-a6b6-8a7707933efc',
 'What makes Sahih al-Bukhari and Sahih Muslim unique among hadith collections?',
 'multiple_choice',
 '["They are the oldest collections", "They only contain hadiths graded as Sahih (authentic)", "They were compiled by the same person", "They only contain hadiths about prayer"]'::jsonb,
 1, 'The word "Sahih" in their title is the key.', 2),

(gen_random_uuid(), 'db5641e0-bb42-49eb-a6b6-8a7707933efc',
 'What is a hadith that appears in both Sahih Bukhari and Sahih Muslim called?',
 'multiple_choice',
 '["Hasan", "Muttafaq Alayh (Agreed Upon)", "Gharib", "Mursal"]'::jsonb,
 1, 'This Arabic term means "agreed upon" by both compilers.', 3);

-- ==============================================
-- Lesson: "The Four Sunan Collections" (f908a291-57c4-4225-b5b6-cfc5902e3390)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), 'f908a291-57c4-4225-b5b6-cfc5902e3390',
 'Which of the following is NOT one of the four Sunan collections?',
 'multiple_choice',
 '["Sunan Abu Dawud", "Sunan an-Nasai", "Muwatta Malik", "Sunan Ibn Majah"]'::jsonb,
 2, 'Muwatta Malik is considered a separate early collection, not one of the four Sunan.', 1),

(gen_random_uuid(), 'f908a291-57c4-4225-b5b6-cfc5902e3390',
 'What distinguishes the Sunan collections from the Sahih collections?',
 'multiple_choice',
 '["Sunan books are older", "Sunan books include Hasan and Da''if hadiths alongside Sahih ones", "Sunan books only cover worship", "Sunan books are shorter"]'::jsonb,
 1, 'The Sahih collections only include the highest grade, while Sunan are broader.', 2),

(gen_random_uuid(), 'f908a291-57c4-4225-b5b6-cfc5902e3390',
 'Together, how many collections make up the "Kutub al-Sittah" (Six Books)?',
 'multiple_choice',
 '["Four", "Five", "Six", "Eight"]'::jsonb,
 2, 'The name itself gives the answer.', 3);

-- ==============================================
-- Lesson: "Sunnahs of Eating and Drinking" (6a080f1d-d957-46a1-b16a-fccfe3593729)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '6a080f1d-d957-46a1-b16a-fccfe3593729',
 'According to the Sunnah, with which hand should one eat?',
 'multiple_choice',
 '["Either hand", "The right hand", "The left hand", "It does not matter"]'::jsonb,
 1, 'There is a well-known hadith about eating and drinking with the right hand.', 1),

(gen_random_uuid(), '6a080f1d-d957-46a1-b16a-fccfe3593729',
 'What dua (supplication) is recommended before eating?',
 'multiple_choice',
 '["SubhanAllah", "Bismillah (In the name of Allah)", "Allahu Akbar", "Astaghfirullah"]'::jsonb,
 1, 'This is the same phrase used before many daily actions.', 2);

-- ==============================================
-- Lesson: "Before and After the Prayer" (9d833c2d-30f6-4ce2-90e1-07d3903ac48d)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '9d833c2d-30f6-4ce2-90e1-07d3903ac48d',
 'What is the Sunnah prayer before Fajr commonly described as?',
 'multiple_choice',
 '["Optional and unimportant", "Better than the world and all it contains", "Equal to one obligatory prayer", "Only for advanced worshippers"]'::jsonb,
 1, 'The Prophet (peace be upon him) emphasized its great reward.', 1),

(gen_random_uuid(), '9d833c2d-30f6-4ce2-90e1-07d3903ac48d',
 'How many rak''ahs of Sunnah prayer are there before Dhuhr?',
 'multiple_choice',
 '["Two", "Four", "Six", "None"]'::jsonb,
 1, 'The regular Sunnah before Dhuhr is four rak''ahs.', 2);

-- ==============================================
-- Lesson: "Introduction to Al-Jarh wa At-Ta''dil" (088fbd0d-5754-4e94-b5a9-62819380ea0e)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '088fbd0d-5754-4e94-b5a9-62819380ea0e',
 'What does "Al-Jarh wa At-Ta''dil" mean?',
 'multiple_choice',
 '["Compilation and classification", "Criticism and endorsement (of narrators)", "Translation and interpretation", "Memorization and recitation"]'::jsonb,
 1, 'This science evaluates the trustworthiness of hadith transmitters.', 1),

(gen_random_uuid(), '088fbd0d-5754-4e94-b5a9-62819380ea0e',
 'Why is narrator criticism important in hadith science?',
 'multiple_choice',
 '["To rank hadiths by topic", "To determine if narrators are trustworthy and their reports reliable", "To translate hadiths into other languages", "To organize hadiths by date"]'::jsonb,
 1, 'The authenticity of a hadith depends on the reliability of each person in the chain.', 2);

-- ==============================================
-- Lesson: "Grading Hadiths in Practice" (3cfd8e10-ea6f-4ea9-9794-261a79b89b0c)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '3cfd8e10-ea6f-4ea9-9794-261a79b89b0c',
 'What are the three main grades of hadith authenticity?',
 'multiple_choice',
 '["Strong, Medium, Weak", "Sahih, Hasan, Da''if", "Mutawatir, Ahad, Mursal", "Marfu, Mawquf, Maqtu"]'::jsonb,
 1, 'These three Arabic terms describe authentic, good, and weak.', 1),

(gen_random_uuid(), '3cfd8e10-ea6f-4ea9-9794-261a79b89b0c',
 'What makes a hadith classified as "Sahih" (authentic)?',
 'multiple_choice',
 '["It is very old", "It has a continuous chain of trustworthy narrators with no hidden defects", "It is found in Sahih Bukhari only", "It is about worship"]'::jsonb,
 1, 'Five conditions must be met for the highest grade.', 2),

(gen_random_uuid(), '3cfd8e10-ea6f-4ea9-9794-261a79b89b0c',
 'Can a Da''if (weak) hadith be used for deriving legal rulings?',
 'multiple_choice',
 '["Yes, always", "No, scholars generally do not use weak hadiths for legal rulings", "Only in Hanafi fiqh", "Only if it has a long chain"]'::jsonb,
 1, 'The majority of scholars are cautious about using weak narrations for rulings.', 3);

-- ==============================================
-- Lesson: "Ibn Hajar and Al-Nawawi" (078f991a-4ff7-44c5-8b78-47363e9b307f)
-- ==============================================
INSERT INTO learning_quiz_questions (id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order) VALUES
(gen_random_uuid(), '078f991a-4ff7-44c5-8b78-47363e9b307f',
 'What is Ibn Hajar al-Asqalani best known for?',
 'multiple_choice',
 '["Compiling Sahih Muslim", "Writing Fath al-Bari, the commentary on Sahih Bukhari", "Founding a school of fiqh", "Translating hadiths into Persian"]'::jsonb,
 1, 'His masterwork is considered the greatest commentary on Sahih Bukhari.', 1),

(gen_random_uuid(), '078f991a-4ff7-44c5-8b78-47363e9b307f',
 'What famous collection did Imam al-Nawawi compile?',
 'multiple_choice',
 '["The Muwatta", "Riyad al-Salihin (Gardens of the Righteous)", "Musnad Ahmad", "Sunan al-Kubra"]'::jsonb,
 1, 'This widely-read book organizes hadiths by ethical and spiritual themes.', 2);

-- Verify
SELECT count(*) as total_quiz_questions FROM learning_quiz_questions;
