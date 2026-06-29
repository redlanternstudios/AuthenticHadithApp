-- Phase 2B: Seed Learning Paths with Modules and Lessons
-- 6 structured paths from beginner to advanced
-- Uses correct column names: title, description, level, icon_name, sort_order

BEGIN;

-- ============================================
-- Path 1: Foundations of Hadith (Beginner)
-- ============================================
INSERT INTO learning_paths (slug, title, title_ar, subtitle, description, description_ar, level, icon_name, color, estimated_hours, sort_order, total_modules, total_lessons, is_premium) VALUES
('foundations', 'Foundations of Hadith', 'أسس الحديث', 'Your journey begins here',
 'Start your journey into the world of prophetic narrations. Learn what hadith are, why they matter, and how to read them.',
 'ابدأ رحلتك في عالم الأحاديث النبوية. تعلم ما هي الأحاديث ولماذا هي مهمة وكيف تقرأها.',
 'beginner', 'book-open', '#1b5e43', 8, 1, 4, 8, false)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO learning_modules (path_id, slug, title, description, sort_order) VALUES
((SELECT id FROM learning_paths WHERE slug = 'foundations'), 'what-is-hadith', 'What is Hadith?', 'Introduction to hadith and their significance in Islam', 1),
((SELECT id FROM learning_paths WHERE slug = 'foundations'), 'hadith-structure', 'Structure of a Hadith', 'Understanding isnad (chain) and matn (text)', 2),
((SELECT id FROM learning_paths WHERE slug = 'foundations'), 'major-collections', 'The Six Major Collections', 'Sahih Bukhari, Muslim, and the four Sunan', 3),
((SELECT id FROM learning_paths WHERE slug = 'foundations'), 'reading-hadith', 'How to Read a Hadith', 'Practical skills for understanding and reflecting on hadith', 4)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Lessons for "What is Hadith?"
INSERT INTO learning_lessons (module_id, slug, title, content_markdown, content_type, sort_order, has_quiz, estimated_minutes) VALUES
((SELECT id FROM learning_modules WHERE slug = 'what-is-hadith'), 'definition', 'Defining Hadith & Sunnah',
'# What is Hadith?

A **hadith** (حديث) literally means "speech" or "narrative." In Islamic terminology, it refers to a record of the words, actions, approvals, or descriptions of the Prophet Muhammad (peace be upon him).

## Hadith vs. Sunnah

While often used interchangeably, there is a subtle distinction:

- **Hadith**: The actual narration or report
- **Sunnah**: The practice or way of the Prophet (PBUH) — what he consistently did

For example, the *sunnah* is to pray two rakaat before Fajr. The *hadith* is the narration that tells us: "The two rakaat of Fajr are better than the world and all it contains." (Sahih Muslim)

## Why Hadith Matter

The Quran commands Muslims to follow the Prophet (PBUH):

> "Whatever the Messenger gives you, take it; and whatever he forbids you, abstain from it." (Quran 59:7)

Hadith serve as:
1. **Explanation** of the Quran
2. **Legislation** on matters not explicitly in the Quran
3. **Practical guidance** for daily life
4. **Spiritual inspiration** and moral lessons',
'reading', 1, false, 10),

((SELECT id FROM learning_modules WHERE slug = 'what-is-hadith'), 'preservation', 'How Hadith Were Preserved',
'# Preservation of Hadith

## The Oral Tradition

In the early generations, hadith were primarily transmitted orally. The companions (Sahaba) had incredible memories, trained in the Arab oral tradition.

- **Memorization**: Companions memorized the Prophet''s words with precision
- **Written records**: Some companions like Abu Hurairah and Abdullah ibn Amr wrote hadith
- **Teaching circles**: Regular gatherings where hadith were transmitted

## The Compilation Period

By the end of the first century AH, scholars began systematically collecting hadith:

| Scholar | Collection | Period |
|---------|-----------|--------|
| Imam Malik | Al-Muwatta | ~150 AH |
| Imam Bukhari | Sahih al-Bukhari | ~256 AH |
| Imam Muslim | Sahih Muslim | ~261 AH |

## The Science of Verification

Islamic scholars developed **rigorous methods** to verify hadith:

1. Examining every narrator in the chain
2. Checking for consistency across multiple reports
3. Ensuring the text does not contradict the Quran
4. Verifying biographical details of narrators

This produced one of the most sophisticated verification systems in human history.',
'reading', 2, false, 12),

((SELECT id FROM learning_modules WHERE slug = 'what-is-hadith'), 'role-in-islam', 'The Role of Hadith in Islam',
'# The Role of Hadith in Islam

## Second Source of Legislation

After the Quran, hadith are the second most important source of Islamic law and guidance. The Quran often gives general commands, and hadith provide the specific details.

**Example**: The Quran commands: "Establish prayer" (Quran 2:43). But *how* do we pray? The details come from hadith.

## Five Functions of Hadith

1. **Explaining the Quran**: Hadith clarify ambiguous verses
2. **Specifying the general**: Adding detail to broad Quranic commands
3. **Restricting the unrestricted**: Narrowing general rulings
4. **Independent legislation**: Rulings not found in the Quran
5. **Confirming Quranic rulings**: Reinforcing what the Quran states

## A Living Example

The Prophet (PBUH) said: "I have been given the Quran and something similar to it along with it." (Abu Dawud)

Aisha (RA) described him: "His character was the Quran." (Sahih Muslim)',
'reading', 3, true, 10)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

-- Lessons for "Structure of a Hadith"
INSERT INTO learning_lessons (module_id, slug, title, content_markdown, content_type, sort_order, has_quiz, estimated_minutes) VALUES
((SELECT id FROM learning_modules WHERE slug = 'hadith-structure'), 'isnad-chain', 'The Isnad (Chain of Narration)',
'# The Isnad: Chain of Narration

## What is an Isnad?

The **isnad** (إسناد) is the chain of narrators who transmitted the hadith from one person to the next, going back to the Prophet (PBUH).

A typical isnad looks like:

> "A told me that B told him that C heard from D who heard the Prophet (PBUH) say..."

Each person in this chain is called a **rawi** (narrator).

## Why the Chain Matters

Abdullah ibn al-Mubarak said: "The isnad is part of the religion. Were it not for the isnad, anyone could say whatever they wished."

Scholars examined each narrator for:
- **Integrity** (''adalah): Were they honest and upright?
- **Precision** (dabt): Did they have a strong memory?
- **Continuity**: Did each narrator actually meet the one before them?

## Types of Chains

| Type | Description |
|------|-------------|
| **Connected (Muttasil)** | Every narrator met the next |
| **Elevated (''Ali)** | Fewer narrators between you and the Prophet |
| **Mursal** | A Tabi''i quotes the Prophet directly (missing a companion) |
| **Mu''allaq** | Beginning of chain is missing |',
'reading', 1, false, 12),

((SELECT id FROM learning_modules WHERE slug = 'hadith-structure'), 'matn-text', 'The Matn (Text)',
'# The Matn: Text of the Hadith

The **matn** (متن) is the actual content of the hadith — the words, actions, or description being reported.

## Types of Matn

1. **Verbal hadith (Qawli)**: Words spoken by the Prophet (PBUH)
2. **Action hadith (Fi''li)**: Something he did
3. **Approval hadith (Taqriri)**: Something he silently approved
4. **Descriptive hadith (Wasfi)**: Physical or character descriptions

## Evaluating the Text

Even with a strong chain, scholars also checked the text for:
- Contradiction with the Quran
- Contradiction with other authentic hadith
- Contradiction with reason or established facts
- Grammatical irregularities unusual for prophetic speech',
'reading', 2, true, 10)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

-- Lessons for "Major Collections"
INSERT INTO learning_lessons (module_id, slug, title, content_markdown, content_type, sort_order, has_quiz, estimated_minutes) VALUES
((SELECT id FROM learning_modules WHERE slug = 'major-collections'), 'bukhari-muslim', 'Sahih Bukhari & Sahih Muslim',
'# The Two Sahihs

## Sahih al-Bukhari

**Imam al-Bukhari** (194-256 AH) compiled the most authentic collection:
- Collected over 600,000 hadith, selected ~7,275 (with repetitions)
- ~2,602 unique hadith
- Spent 16 years compiling
- Applied the strictest criteria: every narrator must have **met** the one above them

## Sahih Muslim

**Imam Muslim** (204-261 AH) compiled the second most authentic collection:
- Selected ~7,563 hadith from 300,000
- ~3,033 unique hadith
- Better organized thematically
- Narrators needed to be **contemporaries** (not necessarily proven to have met)

## "Agreed Upon" (Muttafaq Alayh)

When a hadith appears in **both** Bukhari and Muslim, it is called "agreed upon" and is among the most reliable hadith in existence.',
'reading', 1, false, 15),

((SELECT id FROM learning_modules WHERE slug = 'major-collections'), 'four-sunan', 'The Four Sunan Collections',
'# The Four Sunan

## 1. Sunan Abu Dawud (d. 275 AH)
- Focus: **Legal rulings** (fiqh-oriented), ~5,274 hadith

## 2. Jami'' al-Tirmidhi (d. 279 AH)
- Focus: **Juristic opinions** alongside hadith, ~3,956 hadith, grades each hadith

## 3. Sunan al-Nasa''i (d. 303 AH)
- Focus: **Precision and criticism**, ~5,761 hadith, most critical analysis after Bukhari

## 4. Sunan Ibn Majah (d. 273 AH)
- Focus: **Comprehensive legal topics**, ~4,341 hadith

## Grading System

| Grade | Arabic | Meaning |
|-------|--------|---------|
| Sahih | صحيح | Authentic |
| Hasan | حسن | Good/Fair |
| Da''if | ضعيف | Weak |
| Mawdu'' | موضوع | Fabricated |',
'reading', 2, true, 12)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

-- Lesson for "Reading Hadith"
INSERT INTO learning_lessons (module_id, slug, title, content_markdown, content_type, sort_order, has_quiz, estimated_minutes) VALUES
((SELECT id FROM learning_modules WHERE slug = 'reading-hadith'), 'practical-reading', 'Reading a Hadith Step by Step',
'# How to Read a Hadith

## Step-by-Step Approach

### 1. Check the Source
- Which collection? What grading?

### 2. Read the Chain
- Who narrated it? Famous companions narrated thousands.

### 3. Understand the Text
- Read carefully, note conditions or context.

### 4. Consider the Context
- When was this said? Who was the audience? General or specific?

### 5. Reflect and Apply
- What lesson can I take? How does it connect to my life?

## Common Pitfalls

1. **Taking hadith out of context**
2. **Ignoring the grading**
3. **Cherry-picking**
4. **Ignoring scholarly commentary**',
'reading', 1, true, 12)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

-- ============================================
-- Path 2: Daily Practice (Beginner)
-- ============================================
INSERT INTO learning_paths (slug, title, title_ar, subtitle, description, description_ar, level, icon_name, color, estimated_hours, sort_order, total_modules, total_lessons, is_premium) VALUES
('daily-practice', 'Daily Practice', 'الممارسة اليومية', 'Build prophetic habits',
 'Learn the essential daily sunnahs and build them into your routine.',
 'تعلم السنن اليومية الأساسية واجعلها جزءاً من روتينك.',
 'beginner', 'sun', '#C5A059', 6, 2, 4, 4, false)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO learning_modules (path_id, slug, title, description, sort_order) VALUES
((SELECT id FROM learning_paths WHERE slug = 'daily-practice'), 'morning-routine', 'Morning Sunnah Routine', 'Start your day the prophetic way', 1),
((SELECT id FROM learning_paths WHERE slug = 'daily-practice'), 'prayer-sunnahs', 'Sunnahs Around Prayer', 'Before, during, and after salah', 2),
((SELECT id FROM learning_paths WHERE slug = 'daily-practice'), 'social-sunnahs', 'Social Sunnahs', 'Interacting with others the prophetic way', 3),
((SELECT id FROM learning_paths WHERE slug = 'daily-practice'), 'evening-routine', 'Evening & Night Routine', 'End your day with remembrance and gratitude', 4)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO learning_lessons (module_id, slug, title, content_markdown, content_type, sort_order, has_quiz, estimated_minutes) VALUES
((SELECT id FROM learning_modules WHERE slug = 'morning-routine'), 'waking-up', 'Waking Up the Prophetic Way',
'# Waking Up the Prophetic Way

Upon waking, say:

> **"Alhamdu lillahil-ladhi ahyana ba''da ma amatana wa ilayhin-nushur"**
> "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection." (Bukhari)

## The Sunnah Steps

1. **Wipe your face** with your hands
2. **Use a miswak** or brush your teeth
3. **Wash your hands** three times
4. **Perform wudu** properly
5. **Pray two light rakaat** (Sunnah of Fajr)

## Morning Adhkar

After Fajr prayer, stay seated and recite:
- Ayat al-Kursi
- The three Quls (three times each)
- SubhanAllah (33x), Alhamdulillah (33x), Allahu Akbar (34x)',
'reading', 1, false, 10)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

-- ============================================
-- Path 3: Hadith Sciences (Intermediate)
-- ============================================
INSERT INTO learning_paths (slug, title, title_ar, subtitle, description, description_ar, level, icon_name, color, estimated_hours, sort_order, total_modules, total_lessons, is_premium) VALUES
('hadith-sciences', 'Hadith Sciences', 'مصطلح الحديث', 'Mustalah al-Hadith',
 'Dive into the methodology scholars use to classify and authenticate hadith.',
 'تعمق في منهجية تصنيف الأحاديث والتحقق من صحتها.',
 'intermediate', 'flask-conical', '#0D47A1', 12, 3, 4, 4, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO learning_modules (path_id, slug, title, description, sort_order) VALUES
((SELECT id FROM learning_paths WHERE slug = 'hadith-sciences'), 'classification', 'Classification of Hadith', 'How hadith are categorized and graded', 1),
((SELECT id FROM learning_paths WHERE slug = 'hadith-sciences'), 'narrator-criticism', 'Narrator Criticism (Jarh wa Ta''dil)', 'How scholars evaluate narrators', 2),
((SELECT id FROM learning_paths WHERE slug = 'hadith-sciences'), 'defects', 'Hidden Defects (Ilal)', 'Identifying subtle issues in hadith', 3),
((SELECT id FROM learning_paths WHERE slug = 'hadith-sciences'), 'application', 'Practical Application', 'Applying hadith sciences to real narrations', 4)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO learning_lessons (module_id, slug, title, content_markdown, content_type, sort_order, has_quiz, estimated_minutes) VALUES
((SELECT id FROM learning_modules WHERE slug = 'classification'), 'by-authenticity', 'Classification by Authenticity',
'# Classification by Authenticity

## The Four Main Grades

### 1. Sahih (Authentic)
Requires: continuous chain, trustworthy narrators, precise memory, no hidden defects, no irregularity.

### 2. Hasan (Good)
Same as Sahih but narrators have slightly lesser precision. Still acceptable for rulings.

### 3. Da''if (Weak)
Missing one or more Sahih conditions. Scholars differ on using weak hadith for encouragement.

### 4. Mawdu'' (Fabricated)
Invented narrations. Completely rejected.

## Sub-categories
- **Sahih li-dhatihi**: Authentic on its own merit
- **Sahih li-ghayrihi**: Raised to Sahih through supporting narrations',
'reading', 1, true, 15)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content_markdown = EXCLUDED.content_markdown;

-- ============================================
-- Path 4: Comparative Study (Intermediate)
-- ============================================
INSERT INTO learning_paths (slug, title, title_ar, subtitle, description, description_ar, level, icon_name, color, estimated_hours, sort_order, total_modules, total_lessons, is_premium) VALUES
('comparative', 'Comparative Hadith Study', 'دراسة الحديث المقارنة', 'Cross-collection analysis',
 'Compare narrations across collections. Understand varying chains and wordings.',
 'قارن الروايات عبر المجموعات المختلفة.',
 'intermediate', 'git-compare', '#880E4F', 10, 4, 3, 3, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO learning_modules (path_id, slug, title, description, sort_order) VALUES
((SELECT id FROM learning_paths WHERE slug = 'comparative'), 'cross-referencing', 'Cross-Referencing Narrations', 'Finding the same hadith across collections', 1),
((SELECT id FROM learning_paths WHERE slug = 'comparative'), 'wording-differences', 'Understanding Wording Differences', 'Why the same hadith has different words', 2),
((SELECT id FROM learning_paths WHERE slug = 'comparative'), 'scholarly-approaches', 'Scholarly Approaches', 'How different scholars approached hadith collection', 3)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- ============================================
-- Path 5: Thematic Deep Dives (Advanced)
-- ============================================
INSERT INTO learning_paths (slug, title, title_ar, subtitle, description, description_ar, level, icon_name, color, estimated_hours, sort_order, total_modules, total_lessons, is_premium) VALUES
('thematic', 'Thematic Deep Dives', 'الدراسات الموضوعية', 'Master specific topics',
 'Master specific topics through comprehensive hadith analysis.',
 'أتقن مواضيع محددة من خلال تحليل شامل للأحاديث.',
 'advanced', 'layers', '#3E2723', 15, 5, 3, 3, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO learning_modules (path_id, slug, title, description, sort_order) VALUES
((SELECT id FROM learning_paths WHERE slug = 'thematic'), 'forty-nawawi', 'The Forty Nawawi', 'In-depth study of Imam Nawawi''s famous forty hadith', 1),
((SELECT id FROM learning_paths WHERE slug = 'thematic'), 'rights-in-islam', 'Rights in Islam', 'Rights of Allah, self, family, neighbors, animals', 2),
((SELECT id FROM learning_paths WHERE slug = 'thematic'), 'prophetic-medicine', 'Prophetic Medicine (Tibb Nabawi)', 'Health guidance from the Sunnah', 3)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- ============================================
-- Path 6: Great Hadith Scholars (Advanced)
-- ============================================
INSERT INTO learning_paths (slug, title, title_ar, subtitle, description, description_ar, level, icon_name, color, estimated_hours, sort_order, total_modules, total_lessons, is_premium) VALUES
('scholars', 'Great Hadith Scholars', 'أعلام المحدثين', 'Lives and methodologies',
 'Study the lives and methodologies of the greatest hadith scholars.',
 'ادرس حياة ومناهج أعظم علماء الحديث.',
 'advanced', 'graduation-cap', '#263238', 10, 6, 3, 3, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO learning_modules (path_id, slug, title, description, sort_order) VALUES
((SELECT id FROM learning_paths WHERE slug = 'scholars'), 'early-collectors', 'Early Collectors', 'Imam Malik, Imam Ahmad, and the early compilation', 1),
((SELECT id FROM learning_paths WHERE slug = 'scholars'), 'six-imams', 'The Six Imams', 'Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa''i, Ibn Majah', 2),
((SELECT id FROM learning_paths WHERE slug = 'scholars'), 'later-scholars', 'Later Hadith Masters', 'Ibn Hajar, Nawawi, Dhahabi, and their contributions', 3)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

COMMIT;
