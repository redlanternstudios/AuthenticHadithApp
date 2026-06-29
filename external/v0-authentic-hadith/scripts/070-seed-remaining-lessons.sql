-- Seed lessons for all empty modules
-- Each INSERT uses the correct column list: module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown

-- Daily Practice: Sunnahs Around Prayer (932e77d1-0cdc-4991-8f42-d38c720c1d6b)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('932e77d1-0cdc-4991-8f42-d38c720c1d6b', 'before-after-prayer', 'Before and After the Prayer', 'reading', 1, true, 8,
'## Sunnahs Before and After Prayer

The Prophet (peace be upon him) consistently performed voluntary prayers (rawatib) before and after the obligatory ones.

### The Regular Sunnah Prayers

| Prayer | Before | After |
|--------|--------|-------|
| Fajr | 2 rak''ah | - |
| Dhuhr | 4 rak''ah | 2 rak''ah |
| Asr | - (encouraged) | - |
| Maghrib | - | 2 rak''ah |
| Isha | - | 2 rak''ah |

### The Virtue of Sunnah Prayers

The Prophet (peace be upon him) said: **"Whoever prays twelve rak''ah during the day and night, a house will be built for him in Paradise."** (Reported by Muslim)

### Key Sunnahs Around the Prayer

1. **Making Wudu properly** - Being thorough and not rushing
2. **Walking to the masjid** - Each step raises your rank and removes a sin
3. **The Dua upon entering the masjid** - Seeking Allah''s mercy
4. **Praying Tahiyyat al-Masjid** - Two rak''ah greeting the mosque
5. **Sitting in remembrance after prayer** - SubhanAllah, Alhamdulillah, Allahu Akbar (33 times each)

### The Two Rak''ah Before Fajr

The Prophet (peace be upon him) said: **"The two rak''ah of Fajr are better than this world and everything in it."** (Muslim)

He was so consistent with these that Aisha (may Allah be pleased with her) said he never abandoned them, whether traveling or at home.'),

('932e77d1-0cdc-4991-8f42-d38c720c1d6b', 'mosque-etiquettes', 'Etiquettes of the Mosque', 'reading', 2, true, 6,
'## Etiquettes of the Mosque

The mosque holds a special place in Islam, and the Prophet (peace be upon him) taught specific manners for attending.

### Entering the Mosque

- Enter with your **right foot** first
- Say: **"Bismillah, wassalatu wassalamu ala Rasulillah. Allahumma iftah li abwaba rahmatik"**
- Pray two rak''ah before sitting down (Tahiyyat al-Masjid)

### While in the Mosque

- **Do not disturb others** in their prayer or recitation
- **Avoid eating strong-smelling foods** before attending
- **Fill gaps in the rows** - The Prophet said: "Straighten your rows"
- **Lower your voice** unless in a group discussion or class

### Leaving the Mosque

- Exit with your **left foot** first
- Say: **"Bismillah, wassalatu wassalamu ala Rasulillah. Allahumma inni as''aluka min fadlik"**

### Special Sunnahs

- **Friday (Jumu''ah)**: Arrive early, perform ghusl, wear clean clothes, apply perfume
- **I''tikaf**: The Prophet would seclude himself in the mosque during the last ten nights of Ramadan');

-- Daily Practice: Social Sunnahs (a80fb52f-fd06-482a-b16d-84207149f18d)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('a80fb52f-fd06-482a-b16d-84207149f18d', 'greeting-salam', 'Greeting Others (Salam)', 'reading', 1, true, 6,
'## The Sunnah of Greeting: Salam

The greeting of peace (As-salamu alaykum) is one of the most important social sunnahs in Islam.

### The Prophet''s Guidance on Salam

The Prophet (peace be upon him) said: **"You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I not tell you of something which, if you do it, you will love one another? Spread the greeting of salam among yourselves."** (Muslim)

### Rules of Salam

1. **The one arriving gives salam first** to those already present
2. **The younger greets the elder**
3. **The smaller group greets the larger group**
4. **The one riding greets the one walking**
5. **The one walking greets the one sitting**

### How to Respond

- If greeted with "As-salamu alaykum" respond with "Wa alaykumu as-salam wa rahmatullahi wa barakatuh"
- **The response should be equal to or better than the greeting**

### Additional Social Sunnahs

- **Smiling** - The Prophet said: "Your smiling in the face of your brother is charity"
- **Shaking hands** - "No two Muslims meet and shake hands except that their sins are forgiven"
- **Asking about their wellbeing** - Showing genuine care and interest'),

('a80fb52f-fd06-482a-b16d-84207149f18d', 'visiting-sick-neighbors', 'Visiting the Sick and Neighbors'' Rights', 'reading', 2, true, 7,
'## Visiting the Sick and Neighbors'' Rights

### Visiting the Sick (Iyada)

The Prophet (peace be upon him) said: **"When a Muslim visits a sick Muslim in the morning, seventy thousand angels pray for him until the evening."** (Tirmidhi)

#### Etiquettes of Visiting the Sick

1. **Make dua for their recovery**
2. **Keep the visit short** - Do not tire the patient
3. **Bring something beneficial** - Food, medicine, or kind words
4. **Encourage them** - Remind them of the reward of patience

### Rights of the Neighbor

The Prophet (peace be upon him) said: **"Jibril kept advising me about the neighbor until I thought he would make him an heir."** (Bukhari and Muslim)

#### The Neighbor''s Rights Include

- **Not harming them** in any way
- **Sharing food** with them, especially when cooking
- **Checking on them** regularly
- **Protecting their property** when they are away
- **Being patient** with any inconvenience from them');

-- Daily Practice: Evening & Night Routine (8841499e-bde2-4c9f-9e30-4c07c8a2f44c)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('8841499e-bde2-4c9f-9e30-4c07c8a2f44c', 'evening-adhkar-sleep', 'Evening Adhkar and Sleep Sunnahs', 'reading', 1, true, 8,
'## Evening Adhkar and Sleep Sunnahs

The Prophet (peace be upon him) had a beautiful routine for the evening and before sleep.

### Evening Adhkar (After Asr/Maghrib)

1. **Ayat al-Kursi** (Al-Baqarah 2:255) - Protection through the night
2. **The last two verses of Surah Al-Baqarah** - Sufficiency for the night
3. **Surah Al-Ikhlas, Al-Falaq, and An-Nas** (3 times each) - Protection from all evil
4. **SubhanAllah (33), Alhamdulillah (33), Allahu Akbar (34)** - The evening tasbih

### Before Sleep Sunnahs

1. **Perform Wudu** - The Prophet said: "When you go to bed, perform wudu as for prayer"
2. **Dust off the bed** three times with the edge of your garment
3. **Sleep on your right side**
4. **Place your right hand under your cheek**
5. **Recite the sleeping dua**: "Bismika Allahumma amutu wa ahya"
6. **Recite Surah Al-Mulk** - Protection from the punishment of the grave

### Qiyam al-Layl (Night Prayer)

The Prophet said: **"The best prayer after the obligatory prayer is the night prayer."** (Muslim)'),

('8841499e-bde2-4c9f-9e30-4c07c8a2f44c', 'witr-prayer', 'The Sunnah of Witr Prayer', 'reading', 2, true, 5,
'## The Sunnah of Witr Prayer

Witr is one of the most emphasized voluntary prayers in Islam.

### What is Witr?

Witr literally means "odd number." It is a prayer performed with an odd number of rak''ah.

### The Prophet''s Practice

- He most commonly prayed **11 rak''ah** at night including Witr
- The minimum is **1 rak''ah** - he said: "Make the last of your night prayers Witr"
- He would recite **Surah Al-A''la**, **Surah Al-Kafirun**, and **Surah Al-Ikhlas**

### The Qunut Supplication

In the last rak''ah of Witr, the Prophet would sometimes recite the Qunut:

**"Allahumma ihdini fiman hadayt, wa afini fiman afayt, wa tawallani fiman tawallayt..."**

### When to Pray Witr

- **After Isha prayer** until the Fajr adhan
- **Best time**: Last third of the night
- If you fear you won''t wake up, pray it before sleeping');

-- Hadith Sciences: Narrator Criticism (8401b15e-69cc-46de-81c4-ef1f9f585310)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('8401b15e-69cc-46de-81c4-ef1f9f585310', 'narrator-evaluation-intro', 'Introduction to Narrator Evaluation', 'reading', 1, true, 10,
'## Introduction to Narrator Evaluation (Jarh wa Ta''dil)

One of the most remarkable aspects of Islamic scholarship is the science of evaluating hadith narrators.

### What is Jarh wa Ta''dil?

- **Jarh** (criticism): Identifying weaknesses in a narrator
- **Ta''dil** (accreditation): Affirming a narrator''s trustworthiness

### Criteria for Evaluating Narrators

#### Positive Qualities (Ta''dil)
1. **Islam** - The narrator must be Muslim
2. **Maturity** - Must have reached the age of discernment
3. **Adala (Uprightness)** - Known for piety and avoiding major sins
4. **Dabt (Precision)** - Accuracy in memorization and transmission

#### Negative Qualities (Jarh)
1. **Kidhb (Lying)** - Known to fabricate narrations
2. **Fisq (Immorality)** - Known for sinful behavior
3. **Bid''a (Innovation)** - Promoting deviant beliefs
4. **Jahalah (Unknown)** - No information about them
5. **Su'' al-Hifz (Poor memory)** - Frequent mistakes

### Famous Scholars of Narrator Criticism

| Scholar | Dates | Known For |
|---------|-------|-----------|
| Yahya ibn Ma''in | d. 233 AH | Strictest critic |
| Ahmad ibn Hanbal | d. 241 AH | Balanced approach |
| Ali ibn al-Madini | d. 234 AH | Chain analysis |
| Abu Hatim al-Razi | d. 277 AH | Comprehensive evaluations |'),

('8401b15e-69cc-46de-81c4-ef1f9f585310', 'narrator-grading-levels', 'Levels of Narrator Grading', 'reading', 2, true, 8,
'## Levels of Narrator Grading

Hadith scholars developed a sophisticated ranking system for narrators.

### Ranks of Trustworthiness (Ta''dil) - Highest to Lowest

1. **Thiqah Thabt** - Thoroughly reliable, the highest grade
2. **Thiqah** - Reliable and precise
3. **Saduq** - Truthful but not at the highest precision
4. **Saduq yahim** - Truthful but makes occasional mistakes
5. **Maqbul** - Acceptable when supported by other narrations

### Ranks of Criticism (Jarh) - Mildest to Most Severe

1. **Layyin al-hadith** - Mild weakness
2. **Da''if** - Weak, not relied upon alone
3. **Da''if jiddan** - Very weak, serious problems
4. **Muttaham bil-kidhb** - Accused of lying
5. **Kadhdhab / Wadda''** - Liar / Fabricator, completely rejected

### Important Principles

- **Jarh takes precedence over Ta''dil** when the critic provides specific reasons
- **Detailed criticism outweighs general praise**
- **Scholars may differ** on the same narrator
- **The strictest opinion is not always correct**');

-- Hadith Sciences: Hidden Defects (3b7b09f1-a2d5-4bcd-a503-1b4abce05e61)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('3b7b09f1-a2d5-4bcd-a503-1b4abce05e61', 'hidden-defects-intro', 'Understanding Hidden Defects in Hadith', 'reading', 1, true, 9,
'## Understanding Hidden Defects in Hadith (Ilal)

The science of hidden defects (ilal) is considered one of the most difficult branches of hadith sciences.

### What is an Illa (Defect)?

An illa is a hidden cause that undermines the authenticity of a hadith that outwardly appears sound.

### Types of Hidden Defects

1. **A connected chain that is actually disconnected** - A narrator claims to have heard from someone they never met
2. **A raised narration that is actually stopped** - Appears to be the Prophet''s words but is a companion''s opinion
3. **A narration attributed to the wrong companion**
4. **Insertion of text from one hadith into another**
5. **An error in the chain** - Substituting one narrator for another

### How Scholars Detect Defects

- **Comparing all chains** of the same hadith
- **Deep knowledge of narrators** - Knowing who studied with whom
- **Comparing with other narrations**
- **Examining narrator habits**

### Famous Books on Ilal

| Book | Author |
|------|--------|
| Al-Ilal | Imam Ahmad ibn Hanbal |
| Al-Ilal al-Kabir | Al-Tirmidhi |
| Al-Ilal | Al-Daraqutni |
| Ilal al-Hadith | Ibn Abi Hatim |');

-- Hadith Sciences: Practical Application (a7ed7e2d-9df7-454a-8705-2380c6f129df)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('a7ed7e2d-9df7-454a-8705-2380c6f129df', 'researching-hadith-guide', 'Researching a Hadith Step by Step', 'reading', 1, true, 10,
'## Researching a Hadith: A Practical Guide

Learning to verify and research hadiths is an essential skill for every Muslim.

### Step 1: Identify the Source

- Where did you encounter this hadith?
- Does it provide a reference? Collection name, hadith number?
- If no reference is given, be cautious

### Step 2: Look It Up in Primary Sources

1. **Sahih al-Bukhari** and **Sahih Muslim** - Universally accepted
2. **The Four Sunan** - Tirmidhi, Abu Dawud, Nasa''i, Ibn Majah
3. **Musnad Ahmad** - A comprehensive early collection

### Step 3: Check the Chain (Isnad)

- Are all narrators identified?
- Is the chain connected (no gaps)?
- What do scholars say about each narrator?

### Step 4: Check Scholar Verdicts

- **Al-Albani''s** gradings in his Sahih/Da''if series
- **Al-Tirmidhi''s** gradings in his Sunan
- **Ibn Hajar''s** Fath al-Bari

### Step 5: Understand the Context

- **Asbab al-Wurud** - What prompted the Prophet to say this?
- **Related hadiths** - Similar narrations that support or clarify
- **Scholarly commentary** - What do scholars say about its meaning?

### Common Mistakes to Avoid

- Do not reject a hadith just because you dislike its content
- Do not accept a hadith just because it supports your position
- Do not share unverified hadiths on social media');

-- Comparative Hadith Study: Cross-Referencing (a1e793dc-f1a9-4339-a746-897a2b3e95cb)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('a1e793dc-f1a9-4339-a746-897a2b3e95cb', 'cross-referencing-narrations', 'The Art of Cross-Referencing Narrations', 'reading', 1, true, 8,
'## The Art of Cross-Referencing Narrations

Cross-referencing (muqaranah) is the practice of comparing the same hadith across different collections and chains.

### Why Cross-Reference?

1. **Strengthens authenticity** - Multiple independent chains confirm the hadith
2. **Reveals the complete text** - Different narrators may remember different parts
3. **Identifies errors** - Inconsistencies between chains help spot mistakes

### Practical Example

Consider the famous hadith: **"Actions are judged by intentions..."**

- **Bukhari** narrates it from Umar via multiple chains
- **Abu Dawud, Tirmidhi, Nasa''i, Ibn Majah** all include their own chains
- By comparing all versions, scholars confirmed this hadith is a famous example of a "gharib" (singular) hadith at its origin

### Tools for Cross-Referencing Today

1. This app - AuthenticHadith lets you explore across collections
2. **Mawsu''at al-Hadith** - Comprehensive hadith encyclopedias
3. **Al-Jami'' al-Kabir** by al-Suyuti'),

('a1e793dc-f1a9-4339-a746-897a2b3e95cb', 'mutawatir-vs-ahad', 'Mutawatir vs. Ahad Narrations', 'reading', 2, true, 7,
'## Mutawatir vs. Ahad Narrations

One of the most important classifications based on the number of narrators.

### Mutawatir (Mass-Transmitted)

A hadith narrated by such a large number of people at every level that it is **impossible they all agreed on a lie**.

#### Conditions for Tawatur:
1. Narrated by a large number at **every level** of the chain
2. Reporting from direct sense perception
3. Rationally impossible for them to have conspired

#### Examples of Mutawatir:
- The description of the Prophet''s Wudu
- "Whoever lies about me intentionally, let him take his seat in the Fire"

### Ahad (Singular Narrations)

Any hadith that does not meet the conditions of tawatur:

1. **Mashhur (Famous)** - 3+ chains at some point
2. **Aziz (Rare)** - Never fewer than 2 chains
3. **Gharib (Singular)** - Only one chain at some level

### Key Difference

- **Mutawatir** provides **certain knowledge** (ilm qat''i)
- **Ahad** provides **probable knowledge** (ilm dhanni) but is still acted upon');

-- Comparative Hadith Study: Wording Differences (2f384921-0b9b-4c7e-920b-ade5c37d456e)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('2f384921-0b9b-4c7e-920b-ade5c37d456e', 'narration-by-meaning', 'Narration by Meaning vs. Wording', 'reading', 1, true, 7,
'## Narration by Meaning vs. Exact Wording

Did narrators always transmit the exact words of the Prophet? This is a critical question in hadith sciences.

### Two Schools of Thought

**1. Exact Wording (Riwaya bil-Lafz)**
- The narrator transmits the exact words they heard
- Considered the ideal and most precise method
- Example: Imam Bukhari was known for extreme precision

**2. Narration by Meaning (Riwaya bil-Ma''na)**
- The narrator conveys the meaning using different words
- Allowed by the majority of scholars with conditions
- Must not change the meaning
- Must be by someone knowledgeable in Arabic

### Why Wording Differs Between Collections

When you see the same hadith in Bukhari and Muslim with slightly different wording:
- Different narrators in the chain may have used slightly different words
- This is normal and expected
- The core meaning remains the same

### How Scholars Handle Differences

- If the meaning is the same, both versions are accepted
- If there is a contradiction, scholars investigate which chain is stronger
- They also check which narrator was more precise (atqan)

### Practical Impact

This explains why you often see phrases like:
- "or words to that effect" (aw kama qal)
- "the meaning of which is..." (ma''nahu)');

-- Comparative Hadith Study: Scholarly Approaches (b2249e90-f1a7-4f46-bfac-c9027f9c28f3)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('b2249e90-f1a7-4f46-bfac-c9027f9c28f3', 'four-imams-hadith', 'How the Four Imams Used Hadith', 'reading', 1, true, 9,
'## How the Four Imams Used Hadith

The four major schools of Islamic jurisprudence (madhahib) each had their own approach to using hadith.

### Imam Abu Hanifa (d. 150 AH)

- **Approach**: Very cautious about accepting hadith; required strict conditions
- **Known for**: Using analogy (qiyas) when hadith evidence was limited
- He would reject narrations if they contradicted well-known principles
- Often mischaracterized as "not following hadith" but actually had very high standards

### Imam Malik ibn Anas (d. 179 AH)

- **Approach**: Prioritized the practice of Madinah alongside hadith
- **Known for**: Al-Muwatta, one of the earliest hadith compilations
- He believed the living practice of Madinah''s people was a form of mass-transmission
- Very selective - his Muwatta contains about 1,700 hadiths from a much larger collection

### Imam al-Shafi''i (d. 204 AH)

- **Approach**: Systematized the methodology of using hadith in law
- **Known for**: Al-Risala, the first book on principles of jurisprudence
- Established that an authentic hadith is binding evidence
- Famous quote: "If the hadith is authentic, it is my madhab"

### Imam Ahmad ibn Hanbal (d. 241 AH)

- **Approach**: Preferred any hadith (even weak) over personal opinion
- **Known for**: Al-Musnad, containing over 27,000 narrations
- Would not issue a ruling without a hadith or athar (companion''s opinion)
- Most hadith-focused of the four imams');

-- Thematic Deep Dives: Forty Nawawi (c9d8e3f2-1234-5678-9abc-def012345678)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('c9d8e3f2-1234-5678-9abc-def012345678', 'forty-nawawi-overview', 'The Forty Nawawi: An Overview', 'reading', 1, true, 8,
'## The Forty Nawawi: Foundation of Islamic Knowledge

Imam al-Nawawi''s collection of 42 hadiths is one of the most important compilations in Islamic education.

### About Imam al-Nawawi

- **Full name**: Yahya ibn Sharaf al-Nawawi
- **Born**: 631 AH in Nawa, Syria
- **Died**: 676 AH (aged only 45)
- Despite his short life, he authored some of the most influential Islamic works ever written

### Why These Hadiths?

Imam al-Nawawi selected hadiths that each represent a **fundamental principle** of Islam. He said: "Each hadith is a great foundation from the foundations of the religion."

### Key Hadiths Included

1. **"Actions are judged by intentions"** - The foundation of all deeds
2. **"Islam is built upon five"** - The pillars of Islam
3. **"The halal is clear and the haram is clear"** - Foundations of permissibility
4. **"None of you truly believes until he loves for his brother what he loves for himself"** - Brotherhood
5. **"Leave that which makes you doubt"** - Precaution in religion
6. **"Do not be angry"** - Controlling emotions
7. **"Religion is sincerity"** - The essence of faith

### How to Study Them

- Read each hadith with its explanation
- Memorize the Arabic text
- Understand the principles derived from each
- Apply them in daily life'),

('c9d8e3f2-1234-5678-9abc-def012345678', 'hadith-jibreel', 'The Hadith of Jibreel Explained', 'reading', 2, true, 10,
'## The Hadith of Jibreel: A Comprehensive Framework

This is arguably the most important single hadith in Islam, as it defines the entire framework of the religion.

### The Narration

Umar ibn al-Khattab reported: While we were sitting with the Messenger of Allah, a man appeared with intensely white clothes and dark black hair. He sat before the Prophet, placed his knees against his knees, and placed his hands on his thighs.

### The Three Levels

**1. Islam (Submission)** - The outward actions:
- Shahada (testimony of faith)
- Salah (five daily prayers)
- Zakat (obligatory charity)
- Sawm (fasting Ramadan)
- Hajj (pilgrimage, if able)

**2. Iman (Faith)** - The inner beliefs:
- Belief in Allah
- His Angels
- His Books
- His Messengers
- The Last Day
- Divine Decree (qadr)

**3. Ihsan (Excellence)** - The spiritual dimension:
- "To worship Allah as though you see Him, and if you do not see Him, know that He sees you"

### The Signs of the Hour

The hadith also mentions signs of the Last Day, indicating this hadith covers past, present, and future.

### Why This Hadith Matters

Scholars call this the "Mother of the Sunnah" because it encompasses the entirety of the religion in one narration.');

-- Thematic Deep Dives: Rights in Islam (d1e2f3a4-2345-6789-abcd-ef0123456789)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('d1e2f3a4-2345-6789-abcd-ef0123456789', 'rights-parents', 'Rights of Parents in Hadith', 'reading', 1, true, 7,
'## Rights of Parents in Hadith

Honoring parents is one of the greatest obligations in Islam, second only to worshipping Allah.

### The Quran and Hadith Together

Allah says: **"And your Lord has decreed that you worship none but Him, and that you be dutiful to your parents."** (17:23)

### Key Hadiths on Parents

**1. The Greatest Deed:**
A man asked: "Which deed is most beloved to Allah?" He said: **"Prayer at its proper time." Then? "Kindness to parents." Then? "Jihad in the way of Allah."** (Bukhari)

**2. Paradise at Her Feet:**
A man came asking permission for jihad. The Prophet asked: **"Is your mother alive?"** He said yes. The Prophet said: **"Then stay with her, for Paradise is at her feet."** (Nasa''i)

**3. The Three Times:**
A man asked: "Who is most deserving of my good companionship?" The Prophet said: **"Your mother." Then who? "Your mother." Then who? "Your mother." Then who? "Your father."** (Bukhari)

### Practical Ways to Honor Parents

- Obey them in all that is not sinful
- Speak to them gently, never say "uff" to them
- Provide for them financially if needed
- Make dua for them consistently
- Visit them regularly
- After their passing: make dua, give charity on their behalf, maintain their friendships'),

('d1e2f3a4-2345-6789-abcd-ef0123456789', 'rights-spouses-children', 'Rights of Spouses and Children', 'reading', 2, true, 7,
'## Rights of Spouses and Children in Hadith

The Prophet (peace be upon him) gave extensive guidance on family relationships.

### Rights of the Wife

The Prophet said: **"The best of you is the one who is best to his wife, and I am the best of you to my wives."** (Tirmidhi)

- **Financial provision** - Housing, food, clothing according to his means
- **Kind treatment** - The Prophet never struck a woman
- **Emotional support** - Listening, caring, being present
- **Consultation** - Including her in important decisions

### Rights of the Husband

- **Respect and cooperation** in managing the household
- **Guarding his honor and property** in his absence
- **Being supportive** in his efforts to provide

### Rights of Children

The Prophet said: **"It is enough sin for a person to neglect those who are in his care."** (Abu Dawud)

- **A good name** - Choose beautiful, meaningful names
- **Education** - Both religious and worldly
- **Equal treatment** - Do not favor one child over another
- **Play and affection** - The Prophet would kiss his grandchildren and play with them
- **Good upbringing** - "No father has given a child a gift better than good manners"');

-- Thematic Deep Dives: Prophetic Medicine (e2f3a4b5-3456-7890-bcde-f01234567890)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('e2f3a4b5-3456-7890-bcde-f01234567890', 'prophetic-health-guidance', 'Health Guidance of the Prophet', 'reading', 1, true, 8,
'## Health Guidance of the Prophet

The Prophet (peace be upon him) provided guidance on health and wellbeing that remains relevant today.

### Dietary Guidance

**1. Moderation in Eating:**
**"No human fills a vessel worse than his stomach. It is sufficient for a son of Adam to eat a few mouthfuls to keep his back straight. But if he must eat more, then one-third for food, one-third for drink, and one-third for air."** (Tirmidhi)

**2. Recommended Foods:**
- **Honey** - "Healing for people" (Quran 16:69)
- **Black seed (Nigella)** - "A cure for everything except death"
- **Dates** - The Prophet regularly ate dates, especially in odd numbers
- **Olive oil** - "Eat olive oil and anoint yourselves with it"

### Preventive Medicine

- **Quarantine**: "If you hear of a plague in a land, do not enter it; if it breaks out in a land where you are, do not leave it" (Bukhari)
- **Hygiene**: Emphasis on washing hands, cleaning teeth (siwak), and bathing regularly
- **Exercise**: The Prophet would walk quickly and race with Aisha

### Mental Wellbeing

- **Dua for anxiety**: "O Allah, I seek refuge in You from worry and grief"
- **Community**: Maintaining social bonds and helping others
- **Purpose**: Having goals and striving for the Hereafter
- **Gratitude**: "Look at those below you, not above you, so you do not belittle Allah''s blessings upon you"');

-- Great Hadith Scholars: Early Collectors (f3a4b5c6-4567-8901-cdef-012345678901)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('f3a4b5c6-4567-8901-cdef-012345678901', 'early-collectors', 'The First Hadith Collectors', 'reading', 1, true, 9,
'## The First Hadith Collectors

The preservation of hadith began during the Prophet''s lifetime and continued through the generations.

### The Companions as Collectors

- **Abu Hurairah** - Narrated the most hadiths (5,374), devoted his life to memorization
- **Aisha bint Abi Bakr** - One of the greatest scholars, narrated 2,210 hadiths
- **Abdullah ibn Umar** - Known for following the Sunnah precisely
- **Anas ibn Malik** - Served the Prophet for 10 years, narrated 2,286 hadiths
- **Abdullah ibn Abbas** - "The Scholar of the Ummah," specialized in Quranic commentary

### The First Written Collections

1. **Sahifah of Hammam ibn Munabbih** (d. 101 AH) - One of the earliest surviving written collections, from Abu Hurairah
2. **Al-Muwatta of Imam Malik** (d. 179 AH) - The first organized hadith book combining hadith with legal opinions
3. **Musannaf of Abd al-Razzaq** (d. 211 AH) - Early comprehensive collection organized by topic

### The Codification Era

The Umayyad Caliph Umar ibn Abd al-Aziz (d. 101 AH) officially ordered the compilation of hadith, fearing knowledge would be lost as scholars passed away.

He wrote to Abu Bakr ibn Hazm: **"Look for what there is of the hadith of the Prophet and write it down, for I fear the disappearance of knowledge and the passing of scholars."**'),

('f3a4b5c6-4567-8901-cdef-012345678901', 'women-hadith-scholars', 'Women Scholars of Hadith', 'reading', 2, true, 7,
'## Women Scholars of Hadith

Women have played a crucial and often underappreciated role in hadith preservation.

### The First Scholar: Aisha (may Allah be pleased with her)

- The foremost female scholar in Islamic history
- Companions would come to her to verify hadiths
- She corrected misunderstandings of even senior companions
- Known for her sharp intellect and legal reasoning

### Notable Women Hadith Scholars

**1. Fatimah bint Qays** - Narrator of important hadiths on marriage and divorce

**2. Karima al-Marwaziyya** (d. 463 AH) - Considered the highest authority for Sahih al-Bukhari in her time. Scholars traveled from across the Muslim world to study under her.

**3. Shuhda al-Katiba** (d. 574 AH) - Known as "the Pride of Women," she was a renowned hadith scholar in Baghdad with hundreds of students.

**4. Aisha bint Muhammad ibn Abd al-Hadi** (d. 816 AH) - One of the greatest hadith scholars of her era, male or female.

### Why This Matters

- **No scholar ever rejected a hadith** simply because a woman narrated it
- **Women issued ijazah** (certificates of authorization) to male and female students alike
- **The science of hadith was gender-equal** in ways ahead of its time
- This tradition continued unbroken for over a thousand years');

-- Great Hadith Scholars: The Six Imams (a4b5c6d7-5678-9012-def0-123456789012)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('a4b5c6d7-5678-9012-def0-123456789012', 'bukhari-muslim', 'Imam al-Bukhari and Imam Muslim', 'reading', 1, true, 10,
'## Imam al-Bukhari and Imam Muslim

The two most authoritative hadith collections in Islam, known collectively as "the Two Sahihs."

### Imam al-Bukhari (194-256 AH)

**Full name**: Muhammad ibn Ismail al-Bukhari

- Born in Bukhara (modern Uzbekistan)
- Began memorizing hadith at age 10
- Traveled across the Muslim world for 16 years collecting hadiths
- Memorized over **600,000 narrations** with their chains
- His Sahih contains **7,275 hadiths** (2,602 without repetition)
- Spent **16 years** compiling his Sahih
- He would perform two rak''ah of prayer before including any hadith

**His Method**: Required an unbroken chain where each narrator met the next and was of the highest reliability.

### Imam Muslim (206-261 AH)

**Full name**: Muslim ibn al-Hajjaj al-Naysaburi

- Born in Nishapur (modern Iran)
- A student of Imam al-Bukhari
- His Sahih contains about **7,563 hadiths** (3,033 without repetition)
- Superior organization - grouped all chains for each hadith together

**His Method**: Required an unbroken chain with reliable narrators, but accepted contemporaries who *could have* met (not necessarily confirmed meeting).

### The Two Sahihs Together

When both Bukhari and Muslim agree on a hadith (muttafaq alayh), it is considered the highest level of authenticity.'),

('a4b5c6d7-5678-9012-def0-123456789012', 'four-sunan-authors', 'The Four Sunan Authors', 'reading', 2, true, 9,
'## The Authors of the Four Sunan

Along with Bukhari and Muslim, four more scholars completed what is known as "The Six Books" (al-Kutub al-Sitta).

### Imam al-Tirmidhi (209-279 AH)

- **Collection**: Jami'' al-Tirmidhi (also called Sunan al-Tirmidhi)
- **Unique feature**: Includes grading for each hadith (sahih, hasan, da''if)
- **Innovation**: He coined the term "hasan" for hadiths between sahih and da''if
- He was blind in his later years but continued teaching from memory

### Imam Abu Dawud (202-275 AH)

- **Collection**: Sunan Abu Dawud
- **Focus**: Hadiths related to Islamic law (fiqh)
- Collected 500,000 hadiths but selected only 4,800 for his Sunan
- He said: "I only included what is authentic or close to authentic"

### Imam al-Nasa''i (215-303 AH)

- **Collection**: Sunan al-Nasa''i (al-Mujtaba)
- **Known for**: The strictest conditions after Bukhari and Muslim
- Originally compiled a larger collection (al-Sunan al-Kubra) then condensed it
- Died as a martyr in Damascus

### Imam Ibn Majah (209-273 AH)

- **Collection**: Sunan Ibn Majah
- **Debated inclusion**: Some scholars prefer the Muwatta of Malik as the sixth book instead
- Contains some hadiths not found in the other five collections
- About 600 hadiths in his collection are considered weak

### Why "The Six Books" Matter

These six collections form the core reference for hadith in Sunni Islam. A hadith found in any of them carries significant weight.');

-- Great Hadith Scholars: Later Masters (b5c6d7e8-6789-0123-ef01-234567890123)
INSERT INTO learning_lessons (module_id, slug, title, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('b5c6d7e8-6789-0123-ef01-234567890123', 'ibn-hajar-nawawi', 'Ibn Hajar and Imam al-Nawawi', 'reading', 1, true, 9,
'## Ibn Hajar al-Asqalani and Imam al-Nawawi

Two of the greatest hadith scholars who came centuries after the original collectors.

### Imam al-Nawawi (631-676 AH)

Despite living only 45 years, al-Nawawi produced an extraordinary body of work:

- **Riyad al-Salihin** - A collection of hadiths organized by moral and spiritual themes, perhaps the most widely read hadith book after the Sahihayn
- **Sharh Sahih Muslim** - The most famous commentary on Sahih Muslim
- **Al-Arba''in al-Nawawiyyah** (Forty Hadith) - 42 foundational hadiths that every Muslim should know
- **Al-Adhkar** - A comprehensive collection of prophetic supplications

He was known for his extreme piety, asceticism, and dedication to scholarship. He never married, devoting his entire life to knowledge.

### Ibn Hajar al-Asqalani (773-852 AH)

Known as "Amir al-Mu''minin fil-Hadith" (Commander of the Faithful in Hadith):

- **Fath al-Bari** - The most comprehensive commentary on Sahih al-Bukhari. He spent 25 years writing it. Scholars say: "There is no hijra (migration) after the Fath (conquest/opening)" - a play on words meaning nothing can surpass this work
- **Tahdhib al-Tahdhib** - Biographies of hadith narrators
- **Taqrib al-Tahdhib** - A condensed version grading every narrator
- **Bulugh al-Maram** - Hadiths used as evidence in Islamic law
- **Al-Isabah** - Biographies of over 12,000 companions

He served as the chief judge of Egypt and was respected across the Muslim world.'),

('b5c6d7e8-6789-0123-ef01-234567890123', 'modern-hadith-scholarship', 'Modern Hadith Scholarship', 'reading', 2, true, 7,
'## Modern Hadith Scholarship

The tradition of hadith scholarship continues today, building on centuries of meticulous work.

### Shaykh al-Albani (1914-1999)

- **Perhaps the most influential modern hadith scholar**
- Spent decades in the Zahiriyya Library in Damascus studying manuscripts
- Produced a massive body of work grading thousands of hadiths
- **Sahih al-Jami''** and **Da''if al-Jami''** - Comprehensive grading references
- **Silsilat al-Ahadith al-Sahiha** and **al-Da''ifa** - Multi-volume series
- Made hadith authentication accessible to a wider audience
- Some of his gradings are debated, but his contribution is immense

### Shaykh Shu''ayb al-Arna''ut (1928-2016)

- **Specialized in** verifying and editing classical hadith works
- Edited major works including Musnad Ahmad, Sunan Abu Dawud, and Sahih Ibn Hibban
- Known for his meticulous and balanced approach
- His team-based editorial approach set new standards for hadith verification

### The Digital Age

Modern technology has transformed hadith scholarship:

- **Digital databases** allow instant cross-referencing across all collections
- **Apps like AuthenticHadith** make authentic hadiths accessible to everyone
- **Academic research** continues to deepen our understanding
- **AI tools** are being developed to assist in chain analysis

### The Ongoing Mission

The preservation and study of hadith is an ongoing responsibility. Every generation must:
- Maintain the standards of verification
- Make authentic knowledge accessible
- Combat the spread of fabricated narrations
- Train new scholars in the traditional sciences');
