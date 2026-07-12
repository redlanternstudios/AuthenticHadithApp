-- Seed lessons for the 5 remaining empty modules using exact UUIDs

-- 1. Sunnahs Around Prayer (932e77d1-0cdc-4991-8f42-d38c720c1d6b)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('932e77d1-0cdc-4991-8f42-d38c720c1d6b', 'before-after-prayer', 'Before and After the Prayer', 'Learn the Prophetic practices surrounding the five daily prayers', 'reading', 1, true, 8,
'## Sunnahs Before and After Prayer

The Prophet (peace be upon him) observed specific practices before and after each obligatory prayer that bring immense reward.

### Before the Prayer

**Wudu with Excellence**
The Prophet said: *"When a Muslim performs wudu and washes his face, every sin he looked at with his eyes is washed away. When he washes his hands, every sin his hands committed is washed away. When he washes his feet, every sin his feet walked toward is washed away, until he emerges purified of sin."* (Sahih Muslim)

**Walking to the Mosque**
*"Whoever purifies himself in his house, then walks to one of the houses of Allah to perform one of the obligatory acts of Allah, then one of his steps wipes out a sin and the other raises him one degree."* (Sahih Muslim)

### Sunnah Prayers (Rawatib)

The Prophet consistently prayed specific sunnah prayers:

| Prayer | Before | After |
|--------|--------|-------|
| Fajr | 2 rakah | - |
| Dhuhr | 4 rakah | 2 rakah |
| Asr | - | - |
| Maghrib | - | 2 rakah |
| Isha | - | 2 rakah |

**The Reward:** *"Whoever prays twelve rakah in a day and night, a house will be built for him in Paradise."* (Sahih Muslim)

### After the Prayer

**Adhkar after Salah:** The Prophet would say:
- Astaghfirullah (3 times)
- Allahumma anta al-salam wa minka al-salam, tabarakta ya dhal-jalali wal-ikram
- SubhanAllah (33 times), Alhamdulillah (33 times), Allahu Akbar (33 times)

### Key Takeaways

1. Excellence in wudu is itself an act of worship
2. The rawatib prayers are a shield and a source of immense reward
3. Post-prayer adhkar seal the prayer with remembrance of Allah'),

('932e77d1-0cdc-4991-8f42-d38c720c1d6b', 'friday-sunnahs', 'Friday Prayer Sunnahs', 'Special practices for the best day of the week', 'reading', 2, true, 7,
'## Friday Prayer Sunnahs

Friday (Jumu''ah) holds a special place in Islam. The Prophet (peace be upon him) called it *"the best day on which the sun rises."* (Sahih Muslim)

### Preparation

**Ghusl (Full Bath)**
*"Taking a bath on Friday is obligatory on every mature Muslim."* (Sahih al-Bukhari)

**Best Clothing and Fragrance**
The Prophet would wear his best garments and apply perfume before going to Jumu''ah.

**Going Early**
*"Whoever goes early for Jumu''ah, it is as if he offered a camel (in charity). Whoever goes in the second hour, it is as if he offered a cow..."* (Sahih al-Bukhari)

### During and After

**Listening Attentively**
*"If you say to your companion ''Be quiet'' while the imam is delivering the khutbah, you have engaged in idle talk."* (Sahih al-Bukhari)

**Surah Al-Kahf**
*"Whoever reads Surah Al-Kahf on Friday, a light will be made for him between the two Fridays."* (Al-Hakim, authenticated by Al-Albani)

**Sending Salawat on the Prophet**
*"Among the best of your days is Friday, so increase in sending salawat upon me on that day."* (Abu Dawud)

**The Hour of Acceptance**
There is an hour on Friday during which no Muslim asks Allah for something except that He grants it. The Prophet indicated it is the last hour before Maghrib.

### Key Takeaways

1. Friday is a weekly celebration for Muslims with unique rewards
2. Physical and spiritual preparation are both emphasized
3. Surah Al-Kahf and abundant salawat are specific Friday practices');

-- 2. Hidden Defects / Ilal (3b7b09f1-a2d5-4bcd-a503-1b4abce05e61)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('3b7b09f1-a2d5-4bcd-a503-1b4abce05e61', 'what-are-ilal', 'What Are Hidden Defects?', 'Understanding subtle flaws in hadith that only experts detect', 'reading', 1, true, 10,
'## Hidden Defects (Ilal) in Hadith

The science of Ilal (hidden defects) is considered the most difficult and prestigious branch of hadith sciences. It deals with subtle flaws in hadiths that appear sound on the surface.

### Definition

An **illah** (plural: ilal) is a hidden defect in a hadith that damages its authenticity. Unlike obvious weaknesses (like a known liar in the chain), these defects are not apparent and require deep expertise to detect.

**Ibn al-Madini** said: *"If I told people how we check for hidden defects, they would be amazed at the precision involved."*

### Types of Hidden Defects

**1. Mursal Disguised as Musnad**
A narrator claims to have heard directly from a companion, but actually received it through an intermediary who may be weak.

**2. Mawquf Raised to Marfu**
A statement of a companion is mistakenly attributed to the Prophet (peace be upon him).

**3. Confused Chains (Idraj)**
Content from one hadith gets mixed into another, or a narrator''s commentary becomes blended with the Prophet''s words.

**4. Chain Switching**
The chain of one hadith gets attached to the text of a different hadith.

### How Scholars Detect Ilal

Scholars use several methods:

- **Comparing all chains** of the same hadith to find discrepancies
- **Deep knowledge of narrators** and their students, travel patterns, and habits
- **Cross-referencing** with other known authentic hadiths
- **Understanding context** of when and where a narrator learned

### Famous Works on Ilal

| Scholar | Work |
|---------|------|
| Ali ibn al-Madini | Al-Ilal |
| Ahmad ibn Hanbal | Al-Ilal wa Ma''rifat al-Rijal |
| Al-Daraqutni | Al-Ilal al-Waridah |
| Ibn Abi Hatim | Ilal al-Hadith |

### Key Takeaways

1. Hidden defects are the most sophisticated area of hadith criticism
2. Detection requires encyclopedic knowledge of narrators and their habits
3. This science protects the prophetic tradition from subtle errors');

-- 3. Practical Application (a7ed7e2d-9df7-454a-8705-2380c6f129df)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('a7ed7e2d-9df7-454a-8705-2380c6f129df', 'grading-hadiths', 'Grading Hadiths in Practice', 'Apply hadith science principles to evaluate real narrations', 'reading', 1, true, 10,
'## Grading Hadiths: A Practical Guide

Now that you understand the theoretical foundations of hadith sciences, let us apply these principles practically.

### The Grading Process

Hadith scholars follow a systematic process when evaluating a narration:

**Step 1: Examine the Chain (Isnad)**
- Is the chain connected from beginning to end?
- Is each narrator known and identified?
- Are there any breaks or gaps?

**Step 2: Evaluate Each Narrator**
For every person in the chain, scholars check:
- **Integrity (Adalah):** Was the narrator truthful, pious, and reliable?
- **Precision (Dabt):** Did the narrator accurately preserve and transmit what they heard?
- **Biographical data:** When did they live? Who were their teachers? Who were their students?

**Step 3: Check for Hidden Defects**
- Compare with other chains carrying the same hadith
- Look for contradictions with stronger narrations
- Check for mistakes in attribution

**Step 4: Examine the Text (Matn)**
- Does it contradict the Quran?
- Does it contradict other mutawatir (mass-transmitted) hadiths?
- Does it contain language that seems implausible for the Prophet?

### Grading Categories

| Grade | Meaning | Usability |
|-------|---------|-----------|
| Sahih | Authentic | Full legal weight |
| Hasan | Good | Acceptable for rulings |
| Da''if | Weak | Not for legal rulings |
| Mawdu'' | Fabricated | Completely rejected |

### Worked Example

Consider a hadith with this chain: A → B → C → Prophet (pbuh)

1. **A** is well-known, trustworthy, precise - PASS
2. **B** is known but makes occasional errors - NOTED
3. **C** is a companion - PASS (all companions are considered trustworthy)
4. Chain is connected - PASS
5. No hidden defects found
6. Text does not contradict Quran or stronger hadiths

**Verdict:** Hasan (Good) - because narrator B, while generally reliable, has some imprecision.

### Key Takeaways

1. Grading is a systematic, evidence-based process
2. Both chain AND text are examined thoroughly
3. A single weak link can affect the entire hadith''s grade
4. Scholars may disagree on grades due to different assessments of narrators'),

('a7ed7e2d-9df7-454a-8705-2380c6f129df', 'contemporary-debates', 'Contemporary Hadith Debates', 'How modern scholars approach hadith authentication', 'reading', 2, true, 8,
'## Contemporary Hadith Scholarship

The science of hadith continues to evolve. Modern scholars build upon centuries of tradition while addressing new challenges.

### Modern Approaches

**1. Manuscript Verification**
With the discovery of new manuscripts, scholars can now:
- Cross-reference printed editions with original manuscripts
- Recover lost works through fragments and quotations
- Verify attributions using codicological evidence

**2. Digital Databases**
Projects like:
- **Jawami'' al-Kalim** - comprehensive hadith database
- **Maktaba Shamela** - digital Islamic library
- **HadithSoft** - specialized search tools

These allow scholars to cross-reference narrations faster than ever before.

**3. Statistical Analysis**
Some contemporary scholars use statistical methods to:
- Map narrator networks and identify patterns
- Calculate transmission probabilities
- Detect anomalies in chain structures

### Key Debates

**Hadith Rejection Movement**
Some modern thinkers advocate rejecting hadith entirely, relying only on the Quran. Traditional scholars respond that:
- The Quran itself commands following the Prophet
- Many Islamic practices cannot be derived from Quran alone
- The hadith sciences are rigorous and well-established

**Re-evaluation of Narrators**
Some scholars call for re-examining the biographical dictionaries with fresh eyes, potentially upgrading or downgrading certain narrators based on new evidence.

**Contextual Interpretation**
How should cultural and historical context affect our understanding of prophetic guidance? This is an active area of scholarly discussion.

### Key Takeaways

1. Hadith scholarship is a living tradition that continues to develop
2. Technology provides powerful new tools while the core methodology remains sound
3. Engaging critically with hadith sciences requires deep knowledge of the tradition');

-- 4. The Six Imams (efcba078-1067-451c-a248-3e8ae52c294b)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('efcba078-1067-451c-a248-3e8ae52c294b', 'bukhari-and-muslim', 'Al-Bukhari and Muslim', 'The two greatest hadith compilers in Islamic history', 'reading', 1, true, 10,
'## Imam Al-Bukhari and Imam Muslim

These two scholars compiled the most authentic hadith collections in existence, known collectively as the **Sahihayn** (the Two Sahihs).

### Imam Al-Bukhari (810 - 870 CE)

**Full Name:** Abu Abdullah Muhammad ibn Ismail al-Bukhari

**Early Life:**
- Born in Bukhara (modern Uzbekistan)
- Lost his father at a young age
- Showed prodigious memory from childhood
- By age 10, he had memorized thousands of hadiths

**His Masterwork: Sahih al-Bukhari**
- Full title: *Al-Jami'' al-Musnad al-Sahih al-Mukhtasar*
- Contains **7,275 hadiths** (including repetitions) or about **2,602 unique hadiths**
- Took **16 years** to compile
- He reportedly prayed two rak''ah before including each hadith
- Applied the strictest criteria of any hadith compiler

**His Methodology:**
- Required that each narrator must have **met** their source (not just lived in the same era)
- Every narrator must be of the highest integrity and precision
- He organized hadiths by legal topic (fiqh) to show their practical applications

### Imam Muslim (815 - 875 CE)

**Full Name:** Abu al-Husayn Muslim ibn al-Hajjaj al-Naysaburi

**His Masterwork: Sahih Muslim**
- Contains approximately **7,500 hadiths** (about **3,033 unique**)
- Known for superior organization compared to Bukhari
- Groups all chains of a single hadith together
- Includes a valuable introduction on hadith methodology

**His Methodology:**
- Accepted narrators who were contemporaries even without proof of direct meeting
- Slightly less strict than Bukhari on chain requirements
- More systematic in arrangement

### Bukhari vs Muslim: Key Differences

| Aspect | Bukhari | Muslim |
|--------|---------|--------|
| Stricter criteria | Yes | Slightly less |
| Better organized | No | Yes |
| Repetition of hadiths | More | Less |
| Chain requirements | Must have met | Contemporary sufficient |
| Scholarly consensus | Ranked #1 | Ranked #2 |

### Key Takeaways

1. Both collections represent the gold standard of hadith authentication
2. Bukhari is stricter in narrator requirements; Muslim is better organized
3. Together they form the foundation of the hadith canon'),

('efcba078-1067-451c-a248-3e8ae52c294b', 'four-sunan-compilers', 'The Four Sunan Compilers', 'Abu Dawud, al-Tirmidhi, al-Nasai, and Ibn Majah', 'reading', 2, true, 9,
'## The Four Sunan Compilers

After Bukhari and Muslim, four more scholars compiled major hadith collections focused on legal rulings. Together with the Sahihayn, they form the **Kutub al-Sittah** (Six Books).

### Abu Dawud (817 - 889 CE)

**Sunan Abi Dawud** - *The Premier Legal Hadith Collection*

- Collected 500,000 hadiths and selected **4,800** for his book
- Focused specifically on hadiths relevant to Islamic law (fiqh)
- Included some weak hadiths but clearly marked them
- Said: *"I have not included any hadith upon which scholars have agreed to abandon."*

### Al-Tirmidhi (824 - 892 CE)

**Jami'' al-Tirmidhi** - *The Scholar''s Companion*

- Unique for including **grading of each hadith** (sahih, hasan, da''if)
- Mentions scholarly opinions and disagreements on each topic
- Coined the term **"hasan"** as a formal hadith grade
- Invaluable for understanding how scholars derived rulings

### Al-Nasai (829 - 915 CE)

**Sunan al-Nasai** - *The Most Rigorous of the Four*

- Considered the **strictest** of the four Sunan compilers
- Some scholars rank his collection just below Bukhari and Muslim
- Known for detailed analysis of narrator chains
- Originally compiled a larger work (al-Sunan al-Kubra) then condensed it

### Ibn Majah (824 - 887 CE)

**Sunan Ibn Majah** - *The Sixth Book*

- Last to be accepted into the canonical six
- Contains some unique hadiths not found in the other five
- Includes more weak hadiths than the others
- Some scholars preferred the Muwatta of Imam Malik instead

### Comparison

| Scholar | Strictness | Unique Feature | Hadith Count |
|---------|-----------|----------------|--------------|
| Abu Dawud | Moderate | Legal focus | ~4,800 |
| Tirmidhi | Moderate | Grades + opinions | ~3,956 |
| Nasai | High | Rigorous chains | ~5,761 |
| Ibn Majah | Lower | Unique narrations | ~4,341 |

### Key Takeaways

1. Each compiler had a unique methodology and purpose
2. Tirmidhi''s grading system was revolutionary for hadith science
3. These four collections complement Bukhari and Muslim to cover Islamic law comprehensively');

-- 5. Later Hadith Masters (8d1c5de5-1dab-4c9f-b536-d5a62fad75cd)
INSERT INTO learning_lessons (module_id, slug, title, description, content_type, sort_order, has_quiz, estimated_minutes, content_markdown)
VALUES
('8d1c5de5-1dab-4c9f-b536-d5a62fad75cd', 'ibn-hajar-nawawi', 'Ibn Hajar and Al-Nawawi', 'The two most influential later hadith scholars', 'reading', 1, true, 9,
'## Ibn Hajar al-Asqalani and Imam al-Nawawi

These two scholars shaped how Muslims read and understand hadith for centuries after them.

### Imam al-Nawawi (1233 - 1277 CE)

**Full Name:** Abu Zakariya Yahya ibn Sharaf al-Nawawi

Despite living only **44 years**, al-Nawawi produced works that remain essential references today.

**Major Works:**
- **Riyad al-Salihin** (Gardens of the Righteous) - A beloved collection of hadiths organized by moral themes, used worldwide for daily reading
- **Al-Arba''in** (The Forty Hadiths) - 42 foundational hadiths that summarize Islam''s core teachings. Memorized by students globally
- **Sharh Sahih Muslim** - The most authoritative commentary on Sahih Muslim
- **Al-Adhkar** - Comprehensive collection of prophetic supplications

**His Character:**
- Lived an extremely ascetic life
- Never married, devoting all his time to scholarship
- Refused government positions and gifts
- Known for speaking truth to power

### Ibn Hajar al-Asqalani (1372 - 1449 CE)

**Full Name:** Ahmad ibn Ali ibn Hajar al-Asqalani

The greatest hadith scholar of the later period, known as **Amir al-Mu''minin fil-Hadith** (Commander of the Faithful in Hadith).

**Major Works:**
- **Fath al-Bari** - The most comprehensive commentary on Sahih al-Bukhari. Took **25 years** to complete. Scholars say: *"There is no migration (hijrah) after the Fath"* (a play on words meaning nothing can surpass it)
- **Tahdhib al-Tahdhib** - Biographical encyclopedia of hadith narrators
- **Bulugh al-Maram** - Hadiths used as evidence in Islamic law
- **Taqrib al-Tahdhib** - Concise narrator evaluations
- **Al-Isabah** - Encyclopedia of the Prophet''s companions

**His Legacy:**
- Served as Chief Judge of Egypt
- His works are still required reading in every Islamic seminary
- Fath al-Bari remains the single most important hadith commentary

### Their Lasting Impact

| Aspect | Al-Nawawi | Ibn Hajar |
|--------|-----------|-----------|
| Era | 13th century | 15th century |
| Focus | Practical guidance | Deep analysis |
| Most famous work | Forty Hadiths / Riyad al-Salihin | Fath al-Bari |
| Style | Accessible, concise | Encyclopedic, thorough |
| Legacy | Made hadith accessible to all | Made hadith scholarship rigorous |

### Key Takeaways

1. Al-Nawawi made hadith practical and accessible for everyday Muslims
2. Ibn Hajar produced the most authoritative hadith commentary ever written
3. Both scholars'' works remain essential references over 500 years later'),

('8d1c5de5-1dab-4c9f-b536-d5a62fad75cd', 'modern-hadith-scholars', 'Modern Hadith Scholars', 'Scholars who preserved and advanced hadith sciences in the modern era', 'reading', 2, true, 8,
'## Modern Hadith Scholars

The tradition of hadith scholarship has continued into the modern era, with scholars who preserved, authenticated, and made hadith accessible to new generations.

### Al-Albani (1914 - 1999)

**Muhammad Nasir al-Din al-Albani** is perhaps the most influential hadith scholar of the 20th century.

**Contributions:**
- Systematically re-graded thousands of hadiths in major collections
- Published **Silsilat al-Ahadith al-Sahihah** (Series of Authentic Hadiths)
- Published **Silsilat al-Ahadith al-Da''ifah** (Series of Weak Hadiths)
- Authenticated and graded hadiths in Abu Dawud, Tirmidhi, Nasai, and Ibn Majah
- Made hadith grading accessible to non-specialists

**His Approach:**
- Self-taught, spending decades in the Zahiriyya Library in Damascus
- Applied strict, evidence-based methodology
- Some of his gradings were controversial and debated by other scholars

### Shu''ayb al-Arna''ut (1928 - 2016)

**Contributions:**
- Led the most comprehensive hadith verification project in history
- His team re-edited and graded hadiths in Musnad Ahmad (27,000+ hadiths)
- Also edited and graded Sunan Abu Dawud, Sahih Ibn Hibban, and many other works
- Known for meticulous, team-based scholarly methodology

### Ahmad Shakir (1892 - 1958)

**Contributions:**
- Pioneered modern hadith editing in the Arab world
- Produced acclaimed editions of Musnad Ahmad and Sunan al-Tirmidhi
- Combined traditional methodology with modern editorial standards

### Key Developments in Modern Hadith Studies

**1. Printed Editions**
The printing press allowed hadith collections to be widely distributed for the first time, moving beyond hand-copied manuscripts.

**2. Digital Revolution**
Searchable databases now allow researchers to cross-reference hadiths instantly, a task that previously took years.

**3. Academic Study**
Western universities now have hadith studies programs, bringing new perspectives and methodologies to the field.

**4. Translation Projects**
Major collections have been translated into English, French, Turkish, Urdu, and many other languages, making hadith accessible globally.

### Key Takeaways

1. Modern scholars continued the rigorous tradition of hadith authentication
2. Technology has revolutionized how hadith collections are studied and accessed
3. The science of hadith remains vibrant and actively practiced today');
