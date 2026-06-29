-- Phase 2C: Seed the remaining 8 of the Ashara Mubashara (10 Promised Paradise)
-- Abu Bakr and Umar already exist. Khadijah, Bilal, Salman stay as bonus companions.

BEGIN;

-- Uthman ibn Affan
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('uthman-ibn-affan', 'Uthman ibn Affan', 'عثمان بن عفان', 'Dhun-Nurayn (Possessor of Two Lights)', 'ذو النورين', 'BookOpen', 'emerald', -47, 35, ARRAY['Compiled the Quran', 'Legendary generosity', 'Third Caliph', 'Married two daughters of the Prophet'], 4, 17, '#059669', '#34d399', true, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The Shy Believer', 'المؤمن الحيي',
'In the bustling markets of Makkah, Uthman ibn Affan was already known as a man of impeccable character and immense wealth. Unlike many of Quraysh''s elite, he was soft-spoken and modest — so much so that the Prophet (PBUH) later said, "Should I not feel shy before a man whom even the angels feel shy before?"

When Abu Bakr invited him to Islam, Uthman did not hesitate. He had recently returned from a trading journey to Syria where a monk had told him, "A prophet is about to emerge in the land of the sanctuary." The message of Tawhid resonated deeply with his pure nature.

His conversion came at great personal cost. His uncle, al-Hakam ibn Abi al-As, tied him up and swore not to release him until he renounced the new faith. But Uthman''s resolve was unshakeable: "By Allah, I will never leave it."

He married Ruqayyah, the daughter of the Prophet (PBUH), cementing a bond that would define his life. When persecution in Makkah became unbearable, they were among the first to emigrate to Abyssinia, sacrificing comfort and homeland for their faith.',
'In a city of loud merchants and proud warriors, there walked a man so modest that even the angels were said to feel shy in his presence.',
'True modesty is not weakness but a quiet strength that transforms hearts.',
'Uthman converted to Islam very early, becoming one of the first believers.',
850, 4, true
FROM sahaba s WHERE s.slug = 'uthman-ibn-affan';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 2, 'The Man Who Gave Everything', 'الرجل الذي أعطى كل شيء',
'Uthman''s generosity became the stuff of legend in Madinah. When the Muslims first arrived and found the water supply controlled by a merchant who charged high prices, Uthman purchased the entire well of Rumah and made it free for all people.

When the Prophet (PBUH) called for provisions for the army of Tabuk, Uthman stepped forward with a contribution that staggered everyone: 940 camels, 60 horses, and 10,000 dinars. The Prophet (PBUH) kept turning the coins over in his hands and said, "Nothing Uthman does after today will harm him."

When the Prophet''s mosque became too small, it was Uthman who purchased the adjacent land and funded the expansion. After the Prophet''s death, Uthman continued to serve. When Umar was stabbed and a council was formed to choose the next Caliph, Uthman was chosen for his piety, his connection to the Prophet, and his ability to unite people.',
'When the entire Muslim army needed supplies for a march into the scorching desert, one man alone equipped nearly a thousand camels.',
'Generosity is not about what you give, but the sincerity with which you give it.',
'The expedition to Tabuk (630 CE) was the last major military campaign during the Prophet''s lifetime.',
800, 4, true
FROM sahaba s WHERE s.slug = 'uthman-ibn-affan';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 3, 'The Preservation of the Quran', 'حفظ القرآن',
'As the third Caliph, Uthman faced a challenge that would shape Islamic history forever. The Muslim empire had expanded rapidly, and people from different regions were reciting the Quran in different dialects, leading to disputes.

Hudhayfah ibn al-Yaman warned urgently: "O Commander of the Faithful, save this Ummah before they differ about the Book." Uthman acted decisively. He assembled a committee headed by Zayd ibn Thabit. Using the master copy kept by Hafsah bint Umar, they produced standardized copies.

These copies — known as the Uthmani Mushaf — were sent to every major city: Makkah, Madinah, Basra, Kufa, and Damascus. Every Mushaf in the world today traces back to Uthman''s standardization — a legacy that no amount of gold could equal.',
'When the words of God were being recited differently across a vast empire, one man made the decision that would preserve them unchanged for over a millennium.',
'Leadership sometimes requires making difficult decisions for the greater good.',
'The standardization of the Quran occurred around 650 CE.',
850, 4, true
FROM sahaba s WHERE s.slug = 'uthman-ibn-affan';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 4, 'The Siege and the Martyr', 'الحصار والشهيد',
'The final chapter of Uthman''s life is one of the most poignant in Islamic history. Rebels converged on Madinah, surrounding his house. Despite having the means to fight, Uthman refused to shed Muslim blood. "I will not be the first successor of the Messenger of Allah to spill the blood of his Ummah," he declared.

For forty days, the siege continued. His water supply was cut off. Ali ibn Abi Talib sent his sons Hasan and Husayn to guard Uthman''s door.

On the 18th of Dhul Hijjah, 35 AH, the rebels breached the walls. They found Uthman sitting with his Quran open. He was struck while reading, and his blood fell upon the verse: "Allah will suffice you against them" (2:137).

He died as he had lived — with the Quran on his lips, refusing to compromise the unity of the Ummah even at the cost of his own life.',
'As the mob broke through the walls, the aging Caliph sat calmly with his Quran open, his blood staining the very pages he had preserved for all humanity.',
'True courage is not in fighting back but in standing firm for your principles.',
'Uthman was martyred in 656 CE. His death triggered the First Fitna.',
800, 4, true
FROM sahaba s WHERE s.slug = 'uthman-ibn-affan';

-- Ali ibn Abi Talib
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('ali-ibn-abi-talib', 'Ali ibn Abi Talib', 'علي بن أبي طالب', 'Asadullah (Lion of Allah)', 'أسد الله', 'Sword', 'red', -23, 40, ARRAY['Gate of Knowledge', 'Lion of Khaybar', 'Fourth Caliph', 'First youth to accept Islam'], 4, 18, '#dc2626', '#f87171', true, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The Boy in the Prophet''s House', 'الفتى في بيت النبي',
'When famine struck Makkah, Abu Talib struggled to feed his large family. The Prophet (PBUH) and Abbas decided to ease the burden by each taking one of Abu Talib''s sons. The Prophet chose Ali, then about five years old.

Growing up in the household of the future Prophet, Ali witnessed Muhammad''s character firsthand. When revelation came, Ali — barely ten — became the first youth to declare his faith. His father said, "Go with your cousin. He will never lead you to anything but good."

The night of the Hijrah, when assassins surrounded the Prophet''s house, it was young Ali who volunteered to sleep in the Prophet''s bed, covering himself with the Prophet''s green cloak. He knew the swords were coming — and lay down anyway. This act was immortalized in the Quran: "And among people is he who sells his soul seeking the pleasure of Allah" (2:207).',
'A boy of ten stood before the most powerful man in Makkah and declared a faith that could cost him everything.',
'True faith often begins with a simple, courageous choice made when no one else is watching.',
'Ali was raised in the Prophet''s household from around age 5.',
900, 5, true
FROM sahaba s WHERE s.slug = 'ali-ibn-abi-talib';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 2, 'The Lion of Khaybar', 'أسد خيبر',
'Ali''s bravery on the battlefield was legendary. At Badr, he was among the most fierce fighters. At Uhud, when many fled, Ali stood firm, shielding the Prophet with his own body.

But it was at Khaybar that his legend reached its peak. The Muslim army had been unable to breach the fortress for days. Then the Prophet announced: "Tomorrow I will give the banner to a man who loves Allah and His Messenger, and Allah and His Messenger love him."

Every companion hoped to be chosen. The next morning, the Prophet called for Ali — suffering from a severe eye infection. The Prophet applied his blessed saliva to Ali''s eyes, and they were healed instantly. Ali took the banner, marched to the fortress, struck down the champion in single combat, then lifted the massive iron gate of the fortress and used it as a shield.

When asked later about the gate, Ali said, "I didn''t feel it was heavier than my own shield."',
'When the greatest warriors had tried and failed to breach the fortress, the Prophet smiled and said: "Tomorrow, the banner goes to a man whom Allah and His Messenger love."',
'Strength comes not from physical power alone but from the love and trust placed in you by those who matter most.',
'The Battle of Khaybar (628 CE) was fought against fortified opposition north of Madinah.',
850, 4, true
FROM sahaba s WHERE s.slug = 'ali-ibn-abi-talib';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 3, 'The Gate of Knowledge', 'باب مدينة العلم',
'If Ali''s sword was legendary, his mind was even more so. The Prophet (PBUH) said, "I am the city of knowledge, and Ali is its gate."

Ali''s understanding of the Quran was unparalleled. Umar reportedly said, "If it were not for Ali, Umar would have perished." His sermons and letters, compiled in Nahj al-Balagha, remain some of the most eloquent Arabic prose ever written.

As Caliph, Ali demonstrated justice even toward his opponents. When his own shield was found with a non-Muslim citizen and brought to court, the judge ruled against Ali because he could not provide sufficient witnesses. Ali accepted the ruling without complaint, showing that the ruler is not above the law.

He established revolutionary principles of governance: the rights of citizens regardless of faith, the accountability of rulers, the importance of consultation, and the obligation to protect the weak.',
'The man who could split a fortress gate could also weep all night in prayer, his words flowing with a wisdom scholars would study for fourteen centuries.',
'True knowledge is about understanding justice, showing mercy, and serving truth even when it costs you personally.',
'Ali served as Caliph from 656-661 CE during a turbulent period.',
800, 4, true
FROM sahaba s WHERE s.slug = 'ali-ibn-abi-talib';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 4, 'The Legacy of the Lion', 'إرث الأسد',
'Ali''s final years were marked by his unwavering commitment to justice despite fitna. Even as he fought battles against fellow Muslims, he insisted on treating prisoners with dignity and always seeking reconciliation.

His asceticism was remarkable for a head of state. He wore patched clothes, ate simple food, and distributed the treasury to the people. Once, when brought a beautiful dish, he pushed it away: "I do not eat something that the poorest citizen of my state cannot afford."

On the 19th of Ramadan, 40 AH, while leading Fajr prayer, Ali was struck by a poisoned sword. Even dying, his concern was for others: "Do not kill anyone in retaliation other than my killer. Strike him one strike as he struck me — but do not mutilate him."

He passed away two days later. The man who had slept in the Prophet''s bed as a boy, who had lifted the gate of Khaybar, who had been the gate of knowledge — died with justice on his lips and mercy in his heart.',
'As the poisoned blade struck him at dawn, the Lion of Allah''s last concern was not vengeance but justice — even for his own killer.',
'The measure of a life is not in how it ends but in the principles it upholds until the very last breath.',
'Ali was assassinated in 661 CE in Kufa. His death ended the era of the Rightly Guided Caliphs.',
850, 4, true
FROM sahaba s WHERE s.slug = 'ali-ibn-abi-talib';

-- Talha ibn Ubaydullah
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('talha-ibn-ubaydullah', 'Talha ibn Ubaydullah', 'طلحة بن عبيد الله', 'The Living Martyr', 'الشهيد الحي', 'Shield', 'amber', -29, 36, ARRAY['Human shield at Uhud', 'Among first eight Muslims', 'Walking martyr', 'Extraordinary generosity'], 1, 5, '#d97706', '#fbbf24', true, 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The Shield of Uhud', 'درع أحد',
'The Battle of Uhud was turning into a disaster. The archers had abandoned their positions, the Quraysh cavalry swept around from behind. In the chaos, the Prophet (PBUH) was struck in the face and a false cry rang out: "Muhammad is dead!"

Most of the army scattered. But Talha ibn Ubaydullah did not move. He rushed toward the Prophet and placed his own body between the Messenger of Allah and the oncoming swords.

Arrow after arrow struck him. Sword after sword slashed his flesh. He raised his hand to block a strike aimed at the Prophet''s face — and his fingers were severed, never to move again. He wrapped his arms around the Prophet, absorbing blow after blow, until his body bore over seventy wounds.

Abu Bakr, arriving at the scene, found Talha standing — barely — drenched in blood, still positioned between the Prophet and the enemy. The Prophet later said: "It was Talha''s day. All of it."

He survived Uhud, carrying those scars for life. His paralyzed hand became a badge of honor. The Prophet named him "the Living Martyr" — a man who had already paid the price of martyrdom yet walked among the living.',
'Seventy wounds. Severed fingers. A body turned into a human shield. And still, he did not step aside.',
'The greatest acts of courage are those done when no one expects you to stay.',
'The Battle of Uhud (625 CE) was a significant setback due to archers leaving their posts.',
900, 5, true
FROM sahaba s WHERE s.slug = 'talha-ibn-ubaydullah';

-- Al-Zubayr ibn al-Awwam
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('zubayr-ibn-al-awwam', 'Al-Zubayr ibn al-Awwam', 'الزبير بن العوام', 'Disciple of the Messenger', 'حواري رسول الله', 'Swords', 'sky', -29, 36, ARRAY['First to draw sword for Islam', 'Prophet''s cousin', 'Hawari of the Messenger', 'Fought in every battle'], 1, 4, '#0284c7', '#38bdf8', true, 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The First Sword of Islam', 'أول سيف في الإسلام',
'He was only fifteen when he accepted Islam, but Al-Zubayr had the heart of a lion. As the Prophet''s own cousin, he recognized the truth immediately.

His uncle tried to break him — rolling the young Zubayr in a straw mat and lighting fire beneath it. "Renounce Muhammad!" he would demand. Through the smoke and burning, Zubayr''s voice rang clear: "I will never disbelieve."

One day, a rumor spread that the Prophet had been killed. Zubayr, still a teenager, drew his sword and rushed through the streets of Makkah, ready to fight the entire city if necessary. He became the first person in Islamic history to draw a sword in defense of the faith.

He met the Prophet safe and unharmed, who smiled at the young man''s fierce loyalty and prayed for both him and his sword. The Prophet honored him with the title "Hawari" — Disciple — saying, "Every prophet had a disciple, and my disciple is Zubayr."',
'A fifteen-year-old boy drew his sword and charged alone through the streets of Makkah because he heard the Prophet might be in danger.',
'Loyalty is proven not by words but by action in the moment of crisis.',
'Al-Zubayr accepted Islam around 611 CE at approximately age 15.',
800, 4, true
FROM sahaba s WHERE s.slug = 'zubayr-ibn-al-awwam';

-- Sa'd ibn Abi Waqqas
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('sad-ibn-abi-waqqas', 'Sa''d ibn Abi Waqqas', 'سعد بن أبي وقاص', 'The Answered Prayer', 'مستجاب الدعوة', 'Target', 'violet', -28, 55, ARRAY['Prayers never rejected', 'First to shoot arrow for Islam', 'Conqueror of Persia', 'Strategic military genius'], 1, 4, '#7c3aed', '#a78bfa', true, 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The Prayer That Never Returned Empty', 'الدعاء الذي لا يُرد',
'Sa''d ibn Abi Waqqas was seventeen when he saw a dream that changed his life. In it, he was drowning in darkness when a brilliant moon appeared. When he woke, he learned that Muhammad (PBUH) had begun preaching. He became one of the first seven people to accept Islam.

His mother launched the most dramatic protest imaginable: a hunger strike. "I will neither eat nor drink until you abandon Muhammad''s religion. I will die, and you will be called the killer of his own mother."

For days, Sa''d watched his mother waste away. Finally, he came to her with tears: "O my mother, even if you had a hundred souls, and they departed one by one, I would not abandon this religion."

Allah revealed a verse about this: "But if they strive to make you associate with Me that of which you have no knowledge, do not obey them. But accompany them in this world with kindness" (31:15).

The Prophet made a special du''a for Sa''d: "O Allah, direct his aim, and answer his supplication." This prayer followed Sa''d for life — everyone in Madinah knew that Sa''d''s du''a was guaranteed to be answered.',
'His mother swore she would starve herself to death unless he abandoned Islam. He wept, looked at her, and made the hardest choice of his young life.',
'Sometimes loving someone means standing firm in truth even when they cannot understand your path.',
'Sa''d was among the first seven converts to Islam.',
850, 4, true
FROM sahaba s WHERE s.slug = 'sad-ibn-abi-waqqas';

-- Sa'id ibn Zayd
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('said-ibn-zayd', 'Sa''id ibn Zayd', 'سعيد بن زيد', 'The Seeker of Truth', 'الباحث عن الحق', 'Search', 'teal', -30, 51, ARRAY['Son of a pre-Islamic monotheist', 'Instrumental in Umar''s conversion', 'Fought in every battle except Badr', 'Known for absolute integrity'], 1, 5, '#0d9488', '#2dd4bf', true, 9)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The Recitation That Changed History', 'التلاوة التي غيرت التاريخ',
'The story of Sa''id ibn Zayd is inseparable from one of the most dramatic conversion stories in Islam — the conversion of Umar ibn al-Khattab.

Sa''id had married Fatimah bint al-Khattab, Umar''s own sister. Together, they accepted Islam in secret. They would meet with Khabbab ibn al-Aratt, who would teach them the Quran behind closed doors.

One fateful evening, Umar stormed toward their house, sword in hand. Inside, Khabbab was reading Surah TaHa. Hearing footsteps, Khabbab hid, and Fatimah concealed the parchment. Umar burst in and demanded to know what they were reading. When they denied it, he struck Sa''id, and when Fatimah stepped between them, Umar struck her too, drawing blood.

Something shifted when he saw his sister bleeding. Guilt overcame anger. "Show me what you were reading." Fatimah refused until he washed himself. When he read the opening of TaHa — "We have not sent down the Quran to cause you distress" — the words pierced his heart.

"How beautiful and noble these words are," Umar whispered. He went straight to the Prophet and declared his Islam. Sa''id and Fatimah''s quiet faith had triggered the conversion of the man who would become Islam''s greatest Caliph.',
'Behind a closed door, a husband and wife read forbidden words. Outside, an enraged warrior approached with a drawn sword. What happened next changed history.',
'The quiet, steady practice of faith in private can have consequences beyond anything we imagine.',
'Umar''s conversion (c. 616 CE) was a turning point for the early Muslim community.',
900, 5, true
FROM sahaba s WHERE s.slug = 'said-ibn-zayd';

-- Abdur-Rahman ibn Awf
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('abdur-rahman-ibn-awf', 'Abdur-Rahman ibn Awf', 'عبد الرحمن بن عوف', 'The Blessed Merchant', 'التاجر المبارك', 'Coins', 'yellow', -43, 32, ARRAY['Self-made merchant', 'Legendary charity', 'Refused handouts', 'Chaired the Shura council'], 1, 5, '#ca8a04', '#facc15', true, 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'Just Show Me the Market', 'دُلّوني على السوق',
'When Abdur-Rahman arrived in Madinah as a penniless emigrant, the Prophet paired him with Sa''d ibn al-Rabi, a wealthy Ansari. Sa''d offered Abdur-Rahman half of everything he owned — his wealth, his properties, even proposing to divorce one of his wives so that Abdur-Rahman could marry her.

It was an offer most destitute refugees would have accepted. But Abdur-Rahman''s response became one of the most famous phrases in Islamic history: "May Allah bless you. Just show me the way to the marketplace."

With nothing but his wits and integrity, he went to the market and began trading cheese and butter. Within days, he had profit. Within weeks, he was known. Within months, he was wealthy again.

When he appeared before the Prophet with traces of saffron on his clothes (indicating marriage), the Prophet asked the dowry. "The weight of a date-stone in gold." The Prophet smiled: "Give a wedding feast, even with just one sheep."

His charity was staggering: 40,000 dinars at once, then 40,000 dirhams, then 500 horses, then 500 camels. Once, an entire caravan of 700 camels loaded with goods arrived — and he donated every single one. Aisha (RA) said: "May Allah give him water from the Salsabil spring in Paradise."',
'He arrived as a refugee with nothing. When offered half of a rich man''s fortune, he said five words that would echo through fourteen centuries.',
'Dignity lies not in what you receive but in what you earn. Self-reliance, paired with faith, transforms empty hands into overflowing ones.',
'The pairing of Muhajirin with Ansar was one of the first social programs in Madinah.',
900, 5, true
FROM sahaba s WHERE s.slug = 'abdur-rahman-ibn-awf';

-- Abu Ubayda ibn al-Jarrah
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, birth_year_hijri, death_year_hijri, notable_for, total_parts, estimated_read_time_minutes, theme_primary, theme_secondary, is_published, display_order)
VALUES ('abu-ubayda-ibn-al-jarrah', 'Abu Ubayda ibn al-Jarrah', 'أبو عبيدة بن الجراح', 'Trustee of the Ummah', 'أمين الأمة', 'ShieldCheck', 'indigo', -40, 18, ARRAY['Trustee of the Ummah', 'Conquered the Levant', 'Removed helmet rings from Prophet''s face', 'Chose to die with his soldiers'], 1, 5, '#4f46e5', '#818cf8', true, 11)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, historical_context, word_count, estimated_read_minutes, is_published)
SELECT s.id, 1, 'The Trustee of the Nation', 'أمين الأمة',
'Abu Ubayda was not the wealthiest companion, nor the most eloquent, nor the fiercest warrior. But he possessed something rarer: absolute, unshakeable trustworthiness.

When a delegation from Najran asked the Prophet to send someone trustworthy, the Prophet said: "I will send you a man who is truly trustworthy." Every companion hoped to be chosen. Then: "Rise, O Abu Ubayda." From that day, he was known as "Amin al-Ummah."

At Uhud, after the Prophet was struck and two helmet rings pierced his cheek, Abu Ubayda removed them using his own teeth, losing two front teeth in the process. The companions said he was the most handsome man ever to be missing his front teeth.

His greatest test came at Badr. Across the battlefield stood his own father, fighting against Islam. Abu Ubayda tried to avoid him, but his father kept seeking him out. When there was no choice left, Abu Ubayda faced his father in combat — a moment that tore his heart but not his commitment to truth.

Years later, commanding armies in Syria, a plague struck. Umar wrote: "Come to me immediately." Abu Ubayda, knowing Umar was trying to save him, wrote back: "I am in the army of Muslims and I have no desire to save myself from what afflicts them." He died of plague in the Jordan Valley, surrounded by the soldiers he refused to abandon.',
'He was asked to name the most trustworthy man alive. The Prophet did not hesitate for even a heartbeat.',
'Trustworthiness is the foundation of all virtues. Without it, bravery becomes recklessness and generosity becomes vanity.',
'Abu Ubayda commanded Muslim forces during the conquest of Syria (634-638 CE) and died in the Plague of Amwas in 639 CE.',
900, 5, true
FROM sahaba s WHERE s.slug = 'abu-ubayda-ibn-al-jarrah';

COMMIT;
