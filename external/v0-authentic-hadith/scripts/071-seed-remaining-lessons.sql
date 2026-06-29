-- Seed lessons for all modules that currently have zero lessons
-- Uses module slugs for lookups instead of hardcoded UUIDs

-- First, let's see what modules need lessons by checking which have 0
-- We insert using subqueries on module slug

-- ============================================================
-- PATH: Daily Practice Sunnahs
-- ============================================================

-- Module: Sunnahs Around Prayer (slug: sunnahs-around-prayer)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'sunnah-before-after-prayer', 'Sunnah Prayers Before and After', 'Learn about the rawatib prayers that accompany the five daily prayers.', 'reading', 1, true, 8,
'## Sunnah Prayers (Rawatib)

The Prophet (peace be upon him) regularly prayed additional voluntary prayers before and after the obligatory prayers. These are known as the **Rawatib** (regular Sunnah prayers).

### The Twelve Rak''ahs

The Prophet (peace be upon him) said:

> "Whoever prays twelve rak''ahs during the day and night, a house will be built for him in Paradise."
> — Narrated by Umm Habibah (Sahih Muslim)

The breakdown is:
- **2 before Fajr** — The most emphasized of all Sunnah prayers
- **4 before Dhuhr** and **2 after Dhuhr**
- **2 after Maghrib**
- **2 after Isha**

### The Special Status of Fajr Sunnah

The Prophet (peace be upon him) said:

> "The two rak''ahs of Fajr are better than the world and everything in it."
> — Sahih Muslim

He never abandoned these two rak''ahs, even while traveling.

### Key Teachings

1. Consistency matters more than quantity
2. These prayers serve as a spiritual shield
3. They compensate for deficiencies in obligatory prayers
4. They build a habit of constant connection with Allah'
FROM learning_modules m WHERE m.slug = 'sunnahs-around-prayer'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'sunnah-before-after-prayer');

INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'sunnah-dhikr-after-prayer', 'Adhkar After Prayer', 'The remembrance of Allah that the Prophet practiced after each salah.', 'reading', 2, true, 7,
'## Post-Prayer Adhkar

After completing the obligatory prayer, the Prophet (peace be upon him) would engage in specific forms of dhikr (remembrance of Allah).

### The Core Adhkar

**1. Istighfar (3 times)**
> "Astaghfirullah" — I seek Allah''s forgiveness

**2. The Comprehensive Supplication**
> "Allahumma Antas-Salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram"
> "O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of Majesty and Honor."

**3. SubhanAllah, Alhamdulillah, Allahu Akbar**
> Each said **33 times**, completing 99, then:
> "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ''ala kulli shay''in qadir"

### Ayat al-Kursi

The Prophet (peace be upon him) said:

> "Whoever recites Ayat al-Kursi after every obligatory prayer, nothing prevents him from entering Paradise except death."
> — An-Nasa''i

### Benefits of Post-Prayer Dhikr

- Seals the prayer with remembrance
- Protects from Shaytan until the next prayer
- Earns immense reward with minimal effort
- Creates a habit of mindfulness throughout the day'
FROM learning_modules m WHERE m.slug = 'sunnahs-around-prayer'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'sunnah-dhikr-after-prayer');

-- Module: Social Sunnahs (slug: social-sunnahs)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'sunnah-greeting-visiting', 'The Sunnah of Greeting and Visiting', 'How the Prophet greeted others and the etiquettes of visiting.', 'reading', 1, true, 8,
'## The Sunnah of Greeting (Salam)

### Spreading the Salam

The Prophet (peace be upon him) said:

> "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I not tell you of something that if you do it, you will love one another? Spread the salam amongst yourselves."
> — Sahih Muslim

### Etiquettes of Greeting

1. **The younger greets the elder**
2. **The walker greets the one sitting**
3. **The smaller group greets the larger**
4. **The rider greets the walker**

### Visiting the Sick

The Prophet (peace be upon him) said:

> "When a Muslim visits his sick brother, he is walking among the harvest of Paradise until he sits down, and when he sits down, he is showered with mercy."
> — At-Tirmidhi

### The Rights of a Muslim

The Prophet (peace be upon him) enumerated six rights:
1. Return their greeting
2. Visit them when sick
3. Follow their funeral
4. Accept their invitation
5. Say "Yarhamukallah" when they sneeze
6. Wish them well in their absence

### Key Takeaways

- Salam is not just a greeting but an act of worship
- It builds love and brotherhood in the community
- These social sunnahs strengthen the bonds of faith'
FROM learning_modules m WHERE m.slug = 'social-sunnahs'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'sunnah-greeting-visiting');

INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'sunnah-eating-drinking', 'Sunnahs of Eating and Drinking', 'The Prophet''s etiquettes around food and drink.', 'reading', 2, true, 7,
'## Prophetic Etiquettes of Food and Drink

### Before Eating

> "Say Bismillah, eat with your right hand, and eat from what is nearest to you."
> — Al-Bukhari and Muslim

### Moderation in Eating

The Prophet (peace be upon him) said:

> "No human ever filled a vessel worse than the stomach. Sufficient for any son of Adam are a few morsels to keep his back straight. But if it must be more, then one-third for food, one-third for drink, and one-third for air."
> — At-Tirmidhi

### Drinking Etiquettes

1. **Drink in three sips** — not in one gulp
2. **Do not breathe into the vessel**
3. **Sit while drinking** when possible
4. **Say Bismillah before** and **Alhamdulillah after**

### Eating Together

> "Eat together and do not eat separately, for the blessing is in being together."
> — Ibn Majah

### After Eating

The Prophet would say:
> "Alhamdulillahil-ladhi at''amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah"
> "Praise be to Allah Who fed me this and provided it for me without any power or strength on my part."

### Key Takeaways

- Every meal is an opportunity for worship
- Moderation protects health and spirit
- Communal eating strengthens bonds'
FROM learning_modules m WHERE m.slug = 'social-sunnahs'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'sunnah-eating-drinking');

-- Module: Evening Routine Sunnahs (slug: evening-routine)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'sunnah-sleep-adhkar', 'Sleep Adhkar and Bedtime Routine', 'The Prophet''s complete bedtime routine and recommended supplications.', 'reading', 1, true, 8,
'## The Prophetic Bedtime Routine

### Preparation for Sleep

1. **Perform wudu** before sleeping
2. **Dust off the bed** three times
3. **Sleep on the right side**

The Prophet (peace be upon him) said:
> "When you go to bed, perform wudu as you would for prayer, then lie down on your right side."
> — Al-Bukhari and Muslim

### The Three Quls

The Prophet would cup his hands, blow into them, recite **Surah Al-Ikhlas, Al-Falaq, and An-Nas**, then wipe his hands over his body, starting with the head and face. He did this **three times**.

### Ayat al-Kursi Before Sleep

> "If you recite it, a guardian from Allah will be appointed over you, and no devil will come near you until morning."
> — Al-Bukhari

### The Last Two Verses of Al-Baqarah

> "Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him."
> — Al-Bukhari and Muslim

### The Bedtime Supplication

> "Bismika Allahumma amutu wa ahya"
> "In Your name, O Allah, I die and I live."

And upon waking:
> "Alhamdulillahil-ladhi ahyana ba''da ma amatana wa ilayhin-nushur"

### Key Takeaways

- Sleep is a minor death — prepare for it spiritually
- Protection through remembrance is a nightly shield
- Consistent practice transforms sleep into worship'
FROM learning_modules m WHERE m.slug = 'evening-routine'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'sunnah-sleep-adhkar');

-- ============================================================
-- PATH: Hadith Sciences (Mustalah al-Hadith)
-- ============================================================

-- Module: Narrator Criticism (slug: narrator-criticism)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'ilm-al-jarh-wa-tadil', 'Introduction to Al-Jarh wa At-Ta''dil', 'The science of narrator criticism and authentication.', 'reading', 1, true, 10,
'## Al-Jarh wa At-Ta''dil (Criticism and Praise)

This is one of the most important sciences in hadith studies. It deals with evaluating the **reliability and trustworthiness** of hadith narrators.

### What is Al-Jarh?

**Al-Jarh** (criticism) refers to mentioning qualities of a narrator that would cause their narrations to be rejected or weakened, such as:
- Poor memory
- Known dishonesty
- Innovation in religion (bid''ah)
- Lack of precision in transmission

### What is At-Ta''dil?

**At-Ta''dil** (praise/authentication) refers to affirming a narrator''s reliability:
- Trustworthiness (thiqah)
- Precision of memory (dabt)
- Uprightness of character (''adalah)
- Continuity of chain (ittisal)

### Levels of Praise (from strongest to weakest)

| Level | Arabic Term | Meaning |
|-------|-----------|---------|
| 1 | Athbat an-nas | Most reliable of people |
| 2 | Thiqah thiqah | Reliable, reliable (emphatic) |
| 3 | Thiqah | Reliable |
| 4 | Saduq | Truthful |
| 5 | La ba''sa bihi | No harm in him |
| 6 | Maqbul | Acceptable |

### Famous Scholars of This Science

- **Yahya ibn Ma''in** (d. 233 AH) — Pioneer of narrator criticism
- **Ahmad ibn Hanbal** (d. 241 AH) — Known for balanced judgments
- **Al-Bukhari** (d. 256 AH) — Strictest criteria
- **An-Nasa''i** (d. 303 AH) — Known for detailed analysis

### Key Principles

1. Specific criticism takes precedence over general praise
2. A scholar''s criticism of a narrator requires evidence
3. The number of critics matters in evaluation
4. Context and era must be considered'
FROM learning_modules m WHERE m.slug = 'narrator-criticism'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'ilm-al-jarh-wa-tadil');

-- Module: Hidden Defects (slug: hidden-defects)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'ilal-al-hadith', '''Ilal al-Hadith: Hidden Defects', 'Understanding hidden defects that weaken seemingly authentic narrations.', 'reading', 1, true, 10,
'## ''Ilal al-Hadith (Hidden Defects in Hadith)

This is considered one of the **most difficult** and **most noble** sciences of hadith. Only the greatest scholars mastered it.

### What is an ''Illah (Defect)?

An **''illah** is a hidden, subtle cause that weakens a hadith that outwardly appears authentic. The chain may look connected and the narrators reliable, yet a hidden defect exists.

### Types of Hidden Defects

**1. Mursal Hidden as Musnad**
A narrator attributes the hadith directly to the Prophet, but actually heard it from a Tabi''i, not a Sahabi.

**2. Mawquf Hidden as Marfu''**
A statement of a Companion is mistakenly attributed to the Prophet.

**3. Mix-up in Chains (Idraj)**
Part of the narrator''s own words gets mixed into the hadith text.

**4. Chain Confusion (Qalb)**
A narrator swaps names or reverses part of the chain.

### How Scholars Detect Defects

1. **Comparing all chains** of the same hadith
2. **Cross-referencing** with other narrations of the same narrator
3. **Knowledge of each narrator''s students** and teachers
4. **Deep familiarity** with hadith texts and their variants

### Famous Books on ''Ilal

- **''Ilal al-Hadith** by Ibn Abi Hatim
- **Al-''Ilal** by Ad-Daraqutni
- **Al-''Ilal al-Kabir** by At-Tirmidhi

### Why This Science Matters

Imam al-Madini said:
> "Knowing the defects of hadith is more beloved to me than memorizing hadiths that I have not memorized."

This science separates truly authentic hadiths from those with subtle problems that only experts can detect.'
FROM learning_modules m WHERE m.slug = 'hidden-defects'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'ilal-al-hadith');

-- Module: Practical Application (slug: practical-application)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'grading-hadith-practice', 'Grading a Hadith: Step by Step', 'Walk through the practical process of evaluating a hadith''s authenticity.', 'reading', 1, true, 12,
'## How to Grade a Hadith: A Practical Guide

### Step 1: Examine the Chain (Isnad)

Check each link in the chain:
- Is it **connected** (muttasil)? No missing narrators?
- Is each narrator **reliable** (thiqah)?
- Is each narrator **precise** (dabit)?

### Step 2: Check for Hidden Defects

- Compare with other chains of the same hadith
- Look for narrator confusion or text mixing
- Check if any narrator is known for specific errors

### Step 3: Evaluate the Text (Matn)

- Does it contradict the Quran?
- Does it contradict stronger hadiths?
- Does it contradict established consensus?
- Is the language consistent with Prophetic speech?

### Step 4: Assign a Grade

| Grade | Criteria |
|-------|----------|
| **Sahih** | Connected chain, all reliable and precise narrators, no defects, no contradiction |
| **Hasan** | Same as Sahih but narrator(s) slightly less precise |
| **Da''if** | Broken chain, unreliable narrator, or contains a defect |
| **Mawdu''** | Fabricated — contains a known liar in the chain |

### Step 5: Check Supporting Narrations

A weak hadith can be strengthened by:
- **Mutabi''at** — supporting narrations from different chains
- **Shawahid** — similar narrations with different wording

### Worked Example

Consider a hadith narrated through: A → B → C → Prophet

1. Check A: Is A reliable? Who was A''s teacher?
2. Check B: Did B actually meet A? Is B trustworthy?
3. Check C: Is C a known Companion?
4. Check the connections: Did each person actually hear from the next?

### Key Takeaways

- Grading requires both chain AND text analysis
- Context and supporting evidence matter
- This is why scholars dedicated their lives to this science'
FROM learning_modules m WHERE m.slug = 'practical-application'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'grading-hadith-practice');

-- ============================================================
-- PATH: Comparative Hadith Study
-- ============================================================

-- Module: Cross-Referencing (slug: cross-referencing)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'cross-referencing-intro', 'Introduction to Cross-Referencing', 'How scholars compare hadiths across different collections.', 'reading', 1, true, 9,
'## Cross-Referencing Hadiths Across Collections

### Why Cross-Reference?

No single collection contains all authentic hadiths. Scholars cross-reference to:
- **Verify authenticity** through multiple chains
- **Understand context** from different narrations
- **Identify the strongest wording** of a hadith
- **Discover additional details** in variant narrations

### The Muttafaq ''Alayh Concept

When both **Al-Bukhari and Muslim** narrate the same hadith, it is called **Muttafaq ''Alayh** (agreed upon). This represents the highest level of authentication.

### How Scholars Cross-Reference

**1. By Narrator**
Search for all hadiths narrated by Abu Hurairah across all collections.

**2. By Topic**
Gather all hadiths about a specific topic (e.g., fasting) from every source.

**3. By Wording (Lafz)**
Find all versions of a specific hadith to compare exact wordings.

### Example: The Hadith of Intentions

This famous hadith is narrated in:
- Sahih Al-Bukhari (7 times in different chapters)
- Sahih Muslim
- Sunan Abu Dawud
- Sunan An-Nasa''i
- Sunan Ibn Majah

Each placement reveals how scholars understood its application.

### Modern Tools

Today, digital databases make cross-referencing faster, but the methodology remains the same as classical scholars used.

### Key Takeaways

- Cross-referencing strengthens or weakens authenticity
- Different collections often provide complementary details
- Understanding variants deepens comprehension of Prophetic teachings'
FROM learning_modules m WHERE m.slug = 'cross-referencing'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'cross-referencing-intro');

-- Module: Wording Differences (slug: wording-differences)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'riwayah-bil-lafz-wal-mana', 'Narration by Wording vs Meaning', 'Understanding why the same hadith appears with different wordings.', 'reading', 1, true, 9,
'## Narration by Wording vs Meaning

### The Core Question

Why does the same hadith sometimes appear with different words in different collections?

### Two Types of Narration

**1. Riwayah bil-Lafz (Narration by exact wording)**
The narrator transmits the exact words of the Prophet. This is the ideal.

**2. Riwayah bil-Ma''na (Narration by meaning)**
The narrator conveys the meaning but may use different words. The majority of scholars permitted this under strict conditions:
- The narrator must be an expert in Arabic
- The meaning must be preserved exactly
- Core legal rulings must not change

### Why Differences Exist

1. The Prophet may have said the same thing on multiple occasions with slight variations
2. Different Companions heard and remembered different parts
3. Narrators with permission transmitted meaning rather than exact words
4. Arabic allows multiple expressions for the same concept

### Scholars'' Positions

**Strict view**: Only exact wording is acceptable (minority view)
**Majority view**: Meaning-based narration is permitted with conditions
**Practical reality**: Most hadiths involve some degree of meaning-based transmission

### How This Affects Understanding

When you see two versions of the same hadith:
1. Check if both chains are authentic
2. See if the differences are in non-essential words
3. The version with more detail usually adds to understanding
4. Contradictions require deeper scholarly analysis

### Key Takeaways

- Wording differences are normal and expected
- They often enrich rather than contradict
- Scholars developed rigorous methods to handle variants'
FROM learning_modules m WHERE m.slug = 'wording-differences'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'riwayah-bil-lafz-wal-mana');

-- Module: Scholarly Approaches (slug: scholarly-approaches)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'manhaj-al-muhaddithin', 'Methodologies of the Major Scholars', 'How Al-Bukhari, Muslim, and others differed in their approach.', 'reading', 1, true, 10,
'## Methodologies of the Major Hadith Scholars

Each great compiler had a unique methodology that shaped their collection.

### Al-Bukhari''s Methodology

**Criteria**: The strictest of all compilers
- Required **proven meeting** between narrator and teacher (not just contemporaneity)
- Selected from over 600,000 narrations, including only ~7,275 (with repetitions)
- Organized by **fiqh chapters** to show legal implications

### Muslim''s Methodology

**Criteria**: Slightly less strict than Al-Bukhari
- Accepted **contemporaneity** as sufficient for connected chain
- Gathered all chains of each hadith in one place
- Better organized for hadith study (vs. Al-Bukhari''s fiqh focus)

### Abu Dawud''s Methodology

- Focused on hadiths relevant to **Islamic law** (fiqh)
- Included weak hadiths if no stronger alternative existed on the topic
- Would note when a hadith was weak

### At-Tirmidhi''s Methodology

- Uniquely included **grading** for each hadith
- Mentioned which scholars used each hadith
- Noted differences among scholars of fiqh

### An-Nasa''i''s Methodology

- Known for the **most strict criticism** of narrators after Al-Bukhari
- His conditions are considered stricter than Muslim''s
- Focused on subtle defects in chains

### Ibn Majah''s Methodology

- Included unique hadiths not found in other five collections
- Contains some weak and fabricated narrations (noted by scholars)
- Valued for its comprehensive coverage of fiqh topics

### Key Takeaways

- No single methodology is "best" — each serves a purpose
- Understanding methodology helps evaluate each collection''s reliability
- The six major collections complement each other'
FROM learning_modules m WHERE m.slug = 'scholarly-approaches'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'manhaj-al-muhaddithin');

-- ============================================================
-- PATH: Thematic Deep Dives
-- ============================================================

-- Module: Forty Nawawi (slug: forty-nawawi)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'nawawi-introduction', 'Introduction to the Forty Nawawi', 'The most famous collection of foundational hadiths in Islam.', 'reading', 1, true, 10,
'## The Forty Hadith of Imam An-Nawawi

### About Imam An-Nawawi

**Imam Yahya ibn Sharaf An-Nawawi** (631-676 AH / 1233-1277 CE) was one of the greatest scholars of Islam. Despite living only 45 years, he produced works that remain foundational to Islamic education.

### Why Forty Hadiths?

The Prophet (peace be upon him) said:
> "Whoever memorizes forty hadiths for my Ummah relating to their religion, Allah will resurrect him on the Day of Judgment among the scholars and jurists."

Though the chain of this narration is weak, scholars considered the practice praiseworthy.

### The First Hadith: Actions by Intentions

> "Indeed, actions are judged by intentions, and every person shall have what they intended."

This hadith is considered **one-third of all Islamic knowledge** because all actions fall into three categories: those of the heart, tongue, and limbs — and this hadith governs them all.

### The Second Hadith: Islam, Iman, and Ihsan (Hadith of Jibril)

> Angel Jibril came in the form of a man and asked about Islam, Iman, and Ihsan...

This single hadith contains the **entire framework of the religion**.

### Structure of the Collection

An-Nawawi selected hadiths covering:
- **Creed** (Aqeedah) — Hadiths 1-8
- **Worship** (Ibadah) — Hadiths 9-17
- **Social conduct** (Mu''amalat) — Hadiths 18-28
- **Character** (Akhlaq) — Hadiths 29-42

### Key Takeaways

- These 42 hadiths form a comprehensive summary of Islam
- Every Muslim should strive to learn and understand them
- They are the starting point for serious hadith study'
FROM learning_modules m WHERE m.slug = 'forty-nawawi'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'nawawi-introduction');

INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'nawawi-key-hadiths', 'Key Hadiths from the Forty', 'Deep dive into the most impactful hadiths from An-Nawawi''s collection.', 'reading', 2, true, 12,
'## Key Hadiths from the Forty Nawawi

### Hadith 3: The Five Pillars

> "Islam is built upon five: testifying that there is no god but Allah and Muhammad is His Messenger, establishing prayer, paying zakah, performing Hajj, and fasting Ramadan."

This hadith gives the **structural foundation** of Islamic practice.

### Hadith 6: The Halal and Haram

> "The halal is clear and the haram is clear, and between them are doubtful matters..."

This teaches the principle of **caution in doubtful matters** — a cornerstone of Islamic ethics.

### Hadith 13: Love for Your Brother

> "None of you truly believes until he loves for his brother what he loves for himself."

A hadith about **empathy** that transforms community relations.

### Hadith 18: Taqwa (God-Consciousness)

> "Fear Allah wherever you are, follow a bad deed with a good one and it will erase it, and deal with people with good character."

Three comprehensive principles in one short hadith.

### Hadith 25: Charity of the Joints

> "Every joint of a person must perform a charity every day the sun rises: mediating between two people is charity, helping someone onto their mount is charity, a good word is charity, every step to prayer is charity, and removing harm from the road is charity."

This expands the concept of **charity** far beyond money.

### Hadith 34: Changing Wrong

> "Whoever sees something wrong, let him change it with his hand; if he cannot, then with his tongue; if he cannot, then with his heart — and that is the weakest of faith."

The three levels of **commanding good and forbidding evil**.

### Key Takeaways

- Each hadith is a complete lesson in itself
- Together they cover all aspects of Muslim life
- Scholars have written entire books explaining individual hadiths from this collection'
FROM learning_modules m WHERE m.slug = 'forty-nawawi'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'nawawi-key-hadiths');

-- Module: Rights in Islam (slug: rights-in-islam)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'rights-of-parents-family', 'Rights of Parents and Family', 'Hadiths on the obligations and beautiful treatment of family members.', 'reading', 1, true, 9,
'## Rights of Parents and Family in Hadith

### The Supreme Status of Parents

> "A man came to the Prophet and asked: ''O Messenger of Allah, who is most deserving of my good companionship?'' He said: ''Your mother.'' The man asked: ''Then who?'' He said: ''Your mother.'' The man asked: ''Then who?'' He said: ''Your mother.'' The man asked: ''Then who?'' He said: ''Your father.''"
> — Al-Bukhari and Muslim

### Paradise at the Feet of Mothers

> "Paradise lies at the feet of mothers."
> — An-Nasa''i

This hadith emphasizes that **serving one''s mother** is among the greatest paths to Paradise.

### The Father as a Gate to Paradise

> "The father is the middle gate of Paradise, so lose it or protect it."
> — At-Tirmidhi

### Rights of Children

The Prophet also established children''s rights:
> "It is enough sin for a person to neglect those whom he is responsible for."
> — Abu Dawud

### Maintaining Family Ties (Silat ar-Rahim)

> "Whoever wishes to have his provision expanded and his life extended, let him maintain family ties."
> — Al-Bukhari

### The Severity of Cutting Ties

> "The one who severs family ties will not enter Paradise."
> — Al-Bukhari and Muslim

### Key Takeaways

- Family rights are among the most emphasized in Islam
- The mother holds a uniquely elevated status
- Maintaining family bonds brings barakah in provision and life
- Neglecting family obligations is a serious sin'
FROM learning_modules m WHERE m.slug = 'rights-in-islam'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'rights-of-parents-family');

-- Module: Prophetic Medicine (slug: prophetic-medicine)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'tibb-an-nabawi-intro', 'Introduction to Prophetic Medicine', 'The Prophet''s guidance on health, healing, and well-being.', 'reading', 1, true, 9,
'## Prophetic Medicine (At-Tibb An-Nabawi)

### What is Prophetic Medicine?

Prophetic medicine refers to the **health-related guidance** found in the hadiths of the Prophet (peace be upon him), covering diet, remedies, hygiene, and wellness.

### Honey as Medicine

> "Healing is in three things: a drink of honey, cupping (hijamah), and cauterization. But I forbid my Ummah from cauterization."
> — Al-Bukhari

Modern science has confirmed honey''s antibacterial and healing properties.

### The Black Seed (Habbatus Sauda)

> "Use the black seed, for indeed it is a cure for every disease except death."
> — Al-Bukhari and Muslim

Research has shown that Nigella sativa contains thymoquinone, which has anti-inflammatory and immune-boosting properties.

### Cupping (Hijamah)

> "Indeed, the best of your remedies is cupping."
> — Al-Bukhari

### Prophetic Diet Principles

1. **Moderation**: The one-third rule for stomach capacity
2. **Dates**: The Prophet broke his fast with dates
3. **Olive oil**: "Eat olive oil and anoint yourselves with it"
4. **Zamzam water**: "It is blessed, and it is food that satisfies"

### Hygiene Practices

- **Miswak** (tooth-stick): "If it were not too difficult for my Ummah, I would have ordered them to use the miswak before every prayer."
- **Washing hands** before and after meals
- **Trimming nails** regularly
- **Cleanliness** as half of faith

### Key Takeaways

- Prophetic medicine combines spiritual and physical healing
- Many recommendations align with modern scientific findings
- Prevention through lifestyle is emphasized alongside treatment
- Always consult medical professionals for serious health issues'
FROM learning_modules m WHERE m.slug = 'prophetic-medicine'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'tibb-an-nabawi-intro');

-- ============================================================
-- PATH: Great Hadith Scholars
-- ============================================================

-- Module: Early Collectors (slug: early-collectors)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'malik-muwatta', 'Imam Malik and Al-Muwatta', 'The earliest major hadith collection and its author.', 'reading', 1, true, 10,
'## Imam Malik ibn Anas (93-179 AH)

### The Scholar of Madinah

Imam Malik was born and spent his entire life in **Madinah**, the city of the Prophet. This gave him unique access to the living tradition of the Companions'' students.

### His Character

- He would **perfume himself and wear his best clothes** before narrating hadith
- He never narrated hadith while standing or in a hurry
- He considered narrating hadith a sacred responsibility

Imam Shafi''i said:
> "When scholars are mentioned, Malik is the star among them."

### Al-Muwatta: The First Major Compilation

**Al-Muwatta** ("The Well-Trodden Path") is the earliest surviving collection of hadith arranged by legal topics. It took Imam Malik **40 years** to compile.

### Contents of Al-Muwatta

- Approximately **1,720 narrations**
- Includes hadiths of the Prophet, sayings of Companions, and practices of the people of Madinah
- Organized by **fiqh topics**: prayer, fasting, marriage, business, etc.

### Unique Features

1. **Amal of Madinah**: Malik included the **practice of the people of Madinah** as evidence, considering it a form of mass transmission from the Prophet
2. **Mursal hadiths**: He accepted some narrations where the chain skips a generation
3. **Legal reasoning**: He combined hadith with practical jurisprudence

### His Legacy

- Founded the **Maliki school of thought**
- His students include **Imam Shafi''i** and **Muhammad ibn al-Hasan**
- Al-Muwatta was the most widely circulated hadith book before Al-Bukhari

### Key Takeaways

- Imam Malik''s proximity to Madinah gave him unique scholarly authority
- Al-Muwatta combined hadith with living tradition
- His methodology influenced all later hadith scholars'
FROM learning_modules m WHERE m.slug = 'early-collectors'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'malik-muwatta');

-- Module: The Six Imams (slug: the-six-imams)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'bukhari-muslim', 'Al-Bukhari and Muslim: The Two Sahihs', 'The lives and works of the two greatest hadith collectors.', 'reading', 1, true, 12,
'## The Two Sahihs: Al-Bukhari and Muslim

### Imam Al-Bukhari (194-256 AH)

**Muhammad ibn Ismail Al-Bukhari** was born in Bukhara (modern Uzbekistan).

**Remarkable memory**: By age 10, he had memorized thousands of hadiths. He said:
> "I memorize 100,000 authentic hadiths and 200,000 that are not authentic."

**His masterwork**: **Sahih Al-Bukhari** (Al-Jami'' As-Sahih)
- Selected ~7,275 hadiths (with repetitions) from 600,000
- Took **16 years** to compile
- He would pray two rak''ahs before including each hadith
- Considered the **most authentic book after the Quran**

**His strict criteria**:
- Every narrator must be trustworthy with precise memory
- **Direct meeting** between each narrator and their teacher must be proven
- No hidden defects in the chain or text

### Imam Muslim (206-261 AH)

**Muslim ibn al-Hajjaj An-Naysaburi** was Al-Bukhari''s student and contemporary.

**His masterwork**: **Sahih Muslim**
- Contains approximately **7,563 hadiths** (with repetitions)
- ~3,033 without repetitions
- Known for superior **organization** — all chains of one hadith gathered together

**His criteria**:
- **Contemporaneity** sufficient (slightly less strict than Al-Bukhari)
- Focused on collecting **every authentic chain** of each hadith
- His introduction contains valuable principles of hadith science

### Comparing the Two

| Aspect | Al-Bukhari | Muslim |
|--------|-----------|--------|
| Chain strictness | Stricter | Slightly less strict |
| Organization | By fiqh topic (repeated) | By hadith (all chains together) |
| Preferred by scholars | Majority prefer | Some prefer for organization |
| Unique hadiths | ~431 unique | ~660 unique |

### Why Both Matter

Al-Bukhari is stronger in individual chain authentication, while Muslim excels in comprehensive chain collection. Together, they form the gold standard of hadith authentication.

### Key Takeaways

- These two collections represent the pinnacle of hadith scholarship
- "Muttafaq ''Alayh" (agreed upon by both) is the highest authentication level
- Their different approaches complement each other perfectly'
FROM learning_modules m WHERE m.slug = 'the-six-imams'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'bukhari-muslim');

INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'four-sunan-compilers', 'The Four Sunan Compilers', 'Abu Dawud, At-Tirmidhi, An-Nasa''i, and Ibn Majah.', 'reading', 2, true, 10,
'## The Four Sunan Collections

### Abu Dawud (202-275 AH)

**Sulayman ibn al-Ash''ath As-Sijistani**

- Compiled **Sunan Abu Dawud**: ~5,274 hadiths
- Focus: Hadiths relevant to **Islamic law and rulings**
- Methodology: Included weak hadiths when no stronger alternative existed on a topic, always noting the weakness
- Famous quote: "I mentioned the authentic and what resembles it. What has severe weakness, I clarified."

### At-Tirmidhi (209-279 AH)

**Muhammad ibn Isa At-Tirmidhi**

- Compiled **Jami'' At-Tirmidhi**: ~3,956 hadiths
- **Unique contribution**: First to systematically grade hadiths (Sahih, Hasan, Da''if)
- Included **scholarly opinions** on how each hadith was used in fiqh
- Created the term **"Hasan"** as a grade between Sahih and Da''if

### An-Nasa''i (215-303 AH)

**Ahmad ibn Shu''ayb An-Nasa''i**

- Compiled **As-Sunan As-Sughra**: ~5,761 hadiths
- Known for the **strictest narrator criticism** among the six compilers
- His conditions are considered stricter than Muslim''s by many scholars
- Originally compiled a larger work (As-Sunan Al-Kubra) and then refined it

### Ibn Majah (209-273 AH)

**Muhammad ibn Yazid Ibn Majah Al-Qazwini**

- Compiled **Sunan Ibn Majah**: ~4,341 hadiths
- Contains **~600 unique hadiths** not found in the other five books
- Some scholars debated whether his collection should be the sixth canonical book
- Alternative candidates for the sixth: Al-Muwatta of Malik or Sunan Ad-Darimi

### The Kutub as-Sittah (Six Canonical Books)

Together with Sahih Al-Bukhari and Sahih Muslim, these four Sunan form the **six canonical collections** that are the primary reference for hadith scholars.

### Key Takeaways

- Each compiler served a unique purpose
- At-Tirmidhi''s grading system was revolutionary
- An-Nasa''i''s strict criteria complement Al-Bukhari''s approach
- Together, the six books cover nearly all authenticated Prophetic traditions'
FROM learning_modules m WHERE m.slug = 'the-six-imams'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'four-sunan-compilers');

-- Module: Later Masters (slug: later-masters)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
SELECT m.id, 'ibn-hajar-nawawi', 'Ibn Hajar and An-Nawawi: The Commentators', 'The scholars who made hadith accessible to all generations.', 'reading', 1, true, 10,
'## The Great Commentators

### Imam An-Nawawi (631-676 AH)

**Yahya ibn Sharaf An-Nawawi** — despite living only 45 years, his works became indispensable.

**Major Works:**
- **Sharh Sahih Muslim** — The definitive commentary on Sahih Muslim
- **Al-Arba''in An-Nawawiyyah** — The Forty Hadith collection (actually 42)
- **Riyad As-Salihin** — "Gardens of the Righteous," the most popular hadith compilation for general readers
- **Al-Adhkar** — Collection of daily supplications from hadith

**His Approach:**
- Made complex hadith scholarship **accessible**
- Combined hadith with practical spiritual guidance
- Emphasized implementation over mere memorization

### Ibn Hajar Al-Asqalani (773-852 AH)

**Ahmad ibn Ali ibn Hajar** — considered the greatest hadith scholar of the later period.

**Major Works:**
- **Fath Al-Bari** — The most comprehensive commentary on Sahih Al-Bukhari (13 volumes). Scholars say: "There is no hijrah after the Fath (conquest), and there is no Fath after Fath Al-Bari."
- **Tahdhib At-Tahdhib** — Encyclopedia of hadith narrators
- **Bulugh Al-Maram** — Hadiths used as evidence in Islamic law
- **Nukhbat Al-Fikar** — Concise text on hadith terminology

**His Methodology:**
- Combined every previous scholar''s analysis
- Resolved apparent contradictions between hadiths
- Connected hadith with Quranic commentary
- Addressed practical legal implications

### Their Combined Legacy

| An-Nawawi | Ibn Hajar |
|-----------|-----------|
| Made hadith accessible to all | Provided the deepest scholarly analysis |
| Focus on practical application | Focus on comprehensive understanding |
| Sahih Muslim commentary | Sahih Al-Bukhari commentary |
| 45 years of life | 79 years of life |

### Key Takeaways

- These scholars bridged the gap between technical hadith science and practical application
- Their commentaries remain the primary references for understanding hadith
- An-Nawawi made hadith accessible; Ibn Hajar made it comprehensive
- Their works demonstrate that hadith scholarship continued to develop for centuries'
FROM learning_modules m WHERE m.slug = 'later-masters'
AND NOT EXISTS (SELECT 1 FROM learning_lessons ll WHERE ll.module_id = m.id AND ll.slug = 'ibn-hajar-nawawi');
