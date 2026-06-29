-- Seed all 5 companions with full multi-part narratives and shareable snippets
-- Column mapping matches 021-create-sahaba-stories.sql schema exactly

-- 1. Abu Bakr as-Siddiq
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, theme_primary, theme_secondary, notable_for, total_parts, estimated_read_time_minutes, is_published, display_order)
VALUES (
  'abu-bakr',
  'Abu Bakr as-Siddiq',
  'أبو بكر الصديق',
  'The Truthful One',
  'الصديق',
  'shield',
  'emerald',
  '#1B5E43',
  '#2D7A5B',
  ARRAY['First adult male to accept Islam', 'First Caliph', 'Companion in the Cave'],
  5,
  25,
  true,
  1
);

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 1, 'Before the Light', 'قبل النور',
'Abu Bakr ibn Abi Quhafa was born in Mecca around 573 CE, roughly two years after the Prophet Muhammad (peace be upon him). Even before Islam, he was known among the Quraysh as a man of impeccable character -- honest in trade, gentle in speech, and widely respected for his knowledge of genealogy.

He was a wealthy cloth merchant, yet his wealth never corrupted his nature. He abstained from alcohol even in the days of Jahiliyyah (pre-Islamic ignorance), something rare among the Arabs of that era. When asked why, he would say he wished to preserve his reputation and intellect.

His friendship with Muhammad (peace be upon him) predated the revelation. They were close companions, and Abu Bakr knew the Prophet''s character intimately -- his truthfulness, his compassion, his aversion to the idolatry that surrounded them.

This deep personal knowledge would prove decisive when the moment of truth arrived.',
'Even before Islam, Abu Bakr was a man who refused to let wealth corrupt his character.',
'Good character precedes faith -- the seeds of righteousness are planted long before revelation.',
ARRAY['Ibn Hisham, Sirah'], 160, 4, true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 2, 'The First to Believe', 'أول من آمن',
'When the Prophet (peace be upon him) received the first revelation and began privately sharing the message of Islam, Abu Bakr was among the very first to hear it. And he did not hesitate -- not for a moment.

The Prophet (peace be upon him) later said: "I never invited anyone to Islam but that he showed some reluctance and hesitation -- except Abu Bakr. When I presented Islam to him, he did not hold back or hesitate."

This immediate acceptance earned him the title "as-Siddiq" -- the Truthful One, the one who confirms truth without doubt. His faith was not blind; it was built on decades of knowing the Prophet''s character.

Abu Bakr then became Islam''s first great missionary. He personally brought several future pillars of the faith to Islam: Uthman ibn Affan, Zubayr ibn al-Awwam, Abdur-Rahman ibn Awf, Sa''d ibn Abi Waqqas, and Talha ibn Ubaydullah. Five of the ten promised Paradise -- all through Abu Bakr''s quiet, sincere invitation.

He spent his enormous personal wealth freeing Muslim slaves who were being tortured for their faith. He purchased and freed Bilal ibn Rabah, who was being crushed under boulders in the scorching desert sun for saying "Ahad, Ahad" (One, One). When his father rebuked him for freeing weak slaves instead of strong ones who could protect him, Abu Bakr replied: "I only seek the pleasure of Allah."',
'He did not hesitate -- not for a moment.',
'True conviction needs no deliberation when it is built on a lifetime of knowing someone''s character.',
ARRAY['Sahih al-Bukhari 3661', 'Ibn Hisham, Sirah', 'Sahih al-Bukhari 3544'], 250, 5, true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, related_hadith_refs, related_quran_ayat, word_count, estimated_read_minutes, is_published)
SELECT id, 3, 'The Cave and the Migration', 'الغار والهجرة',
'When the persecution in Mecca became unbearable and Allah permitted the Muslims to emigrate to Medina, Abu Bakr had been preparing for months. He had purchased two camels and kept them fed and ready, hoping the Prophet (peace be upon him) would choose him as his travel companion.

When the Prophet came to Abu Bakr''s house at an unusual hour and told him the time had come, Abu Bakr wept -- not from fear, but from joy. Aisha later narrated: "I did not know that anyone could weep from happiness until I saw my father weep that day."

The journey was fraught with danger. The Quraysh had placed a bounty of 100 camels on the Prophet''s head. The two companions hid in the Cave of Thawr for three days while search parties combed the area.

Inside the cave, when Abu Bakr saw the feet of the pursuers at the entrance, he trembled -- not for himself, but for the Prophet. He whispered: "O Messenger of Allah, if one of them looks down at his feet, he will see us." The Prophet (peace be upon him) replied with words that would be preserved in the Quran forever: "Do not grieve; indeed Allah is with us." (Quran 9:40)

Allah sent a spider to weave a web across the cave entrance and a pair of doves to nest there. The pursuers, seeing these undisturbed signs of nature, moved on. Abu Bakr had risked everything -- his life, his family, his wealth -- and Allah had protected them both.',
'Abu Bakr wept -- not from fear, but from joy.',
'When you sacrifice everything for Allah, He provides protection from the most unlikely sources.',
ARRAY['Sahih al-Bukhari 3615', 'Sahih al-Bukhari 3653'], '{"ayat": [{"surah": "At-Tawbah", "verse": "9:40", "text": "Do not grieve; indeed Allah is with us."}]}'::jsonb, 280, 6, true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, related_hadith_refs, related_quran_ayat, word_count, estimated_read_minutes, is_published)
SELECT id, 4, 'Standing Firm When the World Shook', 'الثبات عند الزلزال',
'The death of the Prophet Muhammad (peace be upon him) was the most devastating event in the young Muslim community''s history. Strong men collapsed. Umar ibn al-Khattab, the mighty warrior, drew his sword and declared he would strike anyone who said the Prophet had died.

In this moment of complete chaos, Abu Bakr -- who had been away from Medina -- arrived, entered the Prophet''s room, kissed his forehead, and wept. Then he walked out to the people and delivered words that would echo through all of history:

"Whoever worshipped Muhammad, let him know that Muhammad has died. And whoever worshipped Allah, let him know that Allah is Ever-Living and shall never die." Then he recited: "Muhammad is not but a messenger. Other messengers have passed on before him. So if he was to die or be killed, would you turn back on your heels?" (Quran 3:144)

Umar later said: "By Allah, when I heard Abu Bakr recite that verse, I fell to the ground. My legs would not carry me, and I knew that the Prophet had indeed passed away."

In the crisis that followed, Abu Bakr was chosen as the first Caliph. His brief rule of just over two years would be defined by one essential quality: unwavering commitment to the Prophet''s path, no matter the cost.',
'Umar drew his sword. The community shattered. Then Abu Bakr spoke.',
'True leadership is clarity in crisis -- pointing people back to Allah when grief threatens to consume them.',
ARRAY['Sahih al-Bukhari 3667', 'Sahih al-Bukhari 1241'], '{"ayat": [{"surah": "Aal-Imran", "verse": "3:144", "text": "Muhammad is not but a messenger. Other messengers have passed on before him."}]}'::jsonb, 230, 5, true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO story_parts (sahabi_id, part_number, title_en, title_ar, content_en, opening_hook, key_lesson, related_hadith_refs, related_quran_ayat, word_count, estimated_read_minutes, is_published)
SELECT id, 5, 'The Legacy of the Truthful', 'إرث الصديق',
'As Caliph, Abu Bakr faced immediate and enormous challenges. Several Arab tribes broke away, refusing to pay Zakat or following false prophets. Many companions counseled caution. Abu Bakr refused to compromise.

"By Allah, if they withhold from me even a young goat that they used to give to the Messenger of Allah, I will fight them over it," he declared. This firmness in the Ridda Wars preserved the unity of the Muslim nation at its most vulnerable moment.

Yet his personal life remained one of extraordinary humility. He continued to milk the goats of his neighbors as he had done before becoming leader of the fastest-growing community in Arabia. He took only a modest salary from the treasury -- and on his deathbed, he ordered that the salary be returned.

He freed more slaves than any other companion. He gave his entire wealth in charity when the Prophet asked for contributions -- while Umar, who gave half, marveled at him.

Abu Bakr died on August 23, 634 CE, at the age of 63 -- the same age the Prophet had been when he passed away. His final instructions were to be buried beside the Prophet, and his final words were from the Quran: "Take my soul as a Muslim and join me with the righteous." (Quran 12:101)

The Prophet (peace be upon him) had said: "If I were to take a Khalil (intimate friend) other than my Lord, I would have taken Abu Bakr. But the brotherhood and love of Islam is sufficient."

His legacy is the proof that quiet, unwavering faith -- the kind that never wavers, never shows off, never hesitates -- is the most powerful force in this world.',
'If they withhold from me even a young goat, I will fight them over it.',
'Quiet, unwavering faith is the most powerful force in this world.',
ARRAY['Sahih al-Bukhari 1400', 'Sahih al-Bukhari 3904', 'Sunan Abu Dawud 4652'], '{"ayat": [{"surah": "Yusuf", "verse": "12:101", "text": "Take my soul as a Muslim and join me with the righteous."}]}'::jsonb, 290, 6, true
FROM sahaba WHERE slug = 'abu-bakr';

-- 2. Umar ibn al-Khattab
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, theme_primary, theme_secondary, notable_for, total_parts, estimated_read_time_minutes, is_published, display_order)
VALUES (
  'umar',
  'Umar ibn al-Khattab',
  'عمر بن الخطاب',
  'The Distinguisher of Truth',
  'الفاروق',
  'sword',
  'amber',
  '#8B4513',
  '#A0522D',
  ARRAY['Second Caliph', 'Conversion strengthened Islam', 'Pioneer of justice'],
  5,
  25,
  true,
  2
);

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 1, 'The Fierce Opponent',
'Before Islam, Umar ibn al-Khattab was one of the most feared men in Mecca. Tall, powerfully built, and known for his fiery temper, he was a staunch defender of the Quraysh''s traditional religion. He was among the most vocal opponents of the Prophet Muhammad (peace be upon him) and the early Muslims.

Umar was not merely opposed to Islam in theory -- he was actively violent toward Muslims. He would beat his own slave girl, Lubayna, for accepting Islam, stopping only when his arms grew tired. He saw the new faith as a threat to the social order of Mecca, to the unity of families, and to the honor of the Quraysh.

The Prophet (peace be upon him) made a du''a (supplication) that would change the course of history: "O Allah, strengthen Islam with whichever of the two Umars is more beloved to You" -- referring to Umar ibn al-Khattab and Amr ibn Hisham (Abu Jahl). Both were powerful men of Quraysh, and the Prophet knew that the conversion of either would transform the Muslim community.

Allah chose Umar.',
'One of the most feared men in Mecca was about to become Islam''s greatest champion.',
'Allah can redirect the fiercest opposition into the strongest faith.',
ARRAY['Jami at-Tirmidhi 3681', 'Ibn Hisham, Sirah'], 200, 4, true
FROM sahaba WHERE slug = 'umar';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, related_quran_ayat, word_count, estimated_read_minutes, is_published)
SELECT id, 2, 'The Sword that Surrendered',
'The story of Umar''s conversion is one of the most dramatic in Islamic history. One night, he set out with his sword, determined to kill the Prophet Muhammad (peace be upon him) and end the "discord" in Mecca once and for all.

On his way, a man stopped him and said: "Why don''t you set your own house in order first? Your sister Fatima and her husband have accepted Islam." Enraged, Umar stormed to his sister''s house.

When he arrived, he heard the recitation of the Quran from inside. He burst through the door. His sister Fatima, trying to hide the parchment, was struck by Umar so hard that she bled. But she stood firm and declared: "O Umar, do what you will. We will not abandon our faith."

Seeing her blood, something shifted inside him. He asked to see what they had been reading. His sister told him to wash himself first. When he finally read the verses from Surah Ta-Ha -- "Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance" (Quran 20:14) -- tears streamed down his face.

He went straight to the Prophet, but not with his sword raised in violence. He went to declare his faith. When the Muslims heard Umar''s voice outside, they were terrified -- until Hamza said, "Let him in."

Umar entered and said: "I bear witness that there is no god but Allah, and Muhammad is His Messenger." The Prophet cried "Allahu Akbar!" so loud that every Muslim in Mecca heard it.

Abdullah ibn Mas''ud later said: "We could not pray openly at the Ka''bah until Umar embraced Islam. His Islam was a conquest."',
'He set out with his sword to kill the Prophet -- and came back a Muslim.',
'The Quran has the power to penetrate even the hardest heart when it is read with sincerity.',
ARRAY['Sahih al-Bukhari 3863', 'Ibn Hisham, Sirah'], '{"ayat": [{"surah": "Ta-Ha", "verse": "20:14", "text": "Indeed, I am Allah. There is no deity except Me, so worship Me."}]}'::jsonb, 320, 6, true
FROM sahaba WHERE slug = 'umar';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 3, 'The Rock of Medina',
'In Medina, Umar became the Prophet''s closest advisor alongside Abu Bakr. His directness and insight were legendary. Remarkably, the Quran confirmed Umar''s opinions on several occasions -- leading the Prophet (peace be upon him) to say: "If there were to be a prophet after me, it would be Umar."

When the question arose about whether to pray behind the Station of Ibrahim, it was Umar who suggested it -- and then the verse was revealed confirming his suggestion. When he expressed his view about the wives of the Prophet observing hijab, the verse of hijab was revealed.

But Umar was not merely a warrior or strategist. He was deeply emotional in his worship. He would weep so heavily during prayer that the people behind him could hear his sobbing. He was known to faint when hearing certain verses of the Quran recited.

He had a mark on his face from his tears. This was the same man who had once beaten his slave girl for her faith. Islam did not suppress Umar''s intensity -- it redirected it entirely toward Allah.',
'The Quran confirmed Umar''s opinions again and again.',
'Islam does not suppress intensity -- it redirects it toward the divine.',
ARRAY['Jami at-Tirmidhi 3686', 'Sahih al-Bukhari 402', 'Sahih al-Bukhari 3294'], 200, 4, true
FROM sahaba WHERE slug = 'umar';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 4, 'The Just Ruler',
'When Umar became the second Caliph after Abu Bakr''s death, the Muslim world was expanding rapidly. Under his ten-year rule (634-644 CE), the Islamic state grew to encompass all of Persia, most of the Byzantine territories, Egypt, and vast stretches of North Africa.

But what made Umar extraordinary was not military conquest -- it was justice. He established principles of governance that were centuries ahead of their time.

He created the first formal treasury (Bayt al-Mal), established stipends for all citizens -- including non-Muslims under Islamic protection. He created a census, organized the military, established the Islamic calendar, and built the first system of public works.

He would walk the streets of Medina at night, personally checking on the welfare of his people. One famous night, he found a woman boiling stones in a pot to soothe her crying, hungry children. Umar personally carried a sack of flour on his own back from the treasury to her home and cooked for her family. When his servant offered to carry the sack, Umar replied: "Will you carry my burden on the Day of Judgment?"

When he conquered Jerusalem, he entered the city not on a horse or in royal garments, but walking on foot beside his servant who rode the camel. He refused to pray inside the Church of the Holy Sepulchre, saying: "If I pray here, the Muslims after me will claim this as a mosque." He prayed outside instead, protecting the church for future generations.',
'Will you carry my burden on the Day of Judgment?',
'True leadership means carrying burdens yourself, not delegating them.',
ARRAY['Al-Tabari, Tarikh', 'Ibn al-Jawzi, Manaqib Umar'], 300, 6, true
FROM sahaba WHERE slug = 'umar';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 5, 'The Martyr''s End',
'In November 644 CE, while leading the Fajr prayer, Umar was stabbed six times by Abu Lu''lu''a, a Persian slave with a personal grievance. Even as he lay bleeding, Umar''s first concern was for his community.

He asked: "Was it a Muslim who struck me?" When told it was not, he said: "Alhamdulillah -- praise be to Allah -- that it was not by the hand of a Muslim."

As he lay dying, he appointed a council of six companions to choose his successor, refusing to impose his own preference. He asked his son Abdullah to calculate his debts and repay them from his personal property, not from the state treasury. He asked Aisha for permission to be buried beside the Prophet and Abu Bakr -- she granted it, saying: "I had wanted that place for myself, but I will give it to Umar."

His final words included a profound instruction: "When you bury me, take me to the door of Aisha. If she permits, bury me beside my two companions. If she refuses, take me to the public cemetery." Even in death, he would not presume upon his rank.

He transformed from a man who beat his slave girl for believing in Allah to a ruler who walked through the night carrying flour to hungry children. That is the power of Islam -- not to replace a person, but to perfect them.',
'Even as he lay bleeding, his first concern was for his community.',
'Islam does not replace a person -- it perfects them.',
ARRAY['Sahih al-Bukhari 3700', 'Sahih al-Bukhari 3689', 'Ibn Sa''d, Tabaqat'], 270, 5, true
FROM sahaba WHERE slug = 'umar';

-- 3. Khadijah bint Khuwaylid
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, theme_primary, theme_secondary, notable_for, total_parts, estimated_read_time_minutes, is_published, display_order)
VALUES (
  'khadijah',
  'Khadijah bint Khuwaylid',
  'خديجة بنت خويلد',
  'Mother of the Believers',
  'أم المؤمنين',
  'heart',
  'rose',
  '#8B2252',
  '#A0325F',
  ARRAY['First person to accept Islam', 'Prophet''s beloved wife', 'Received greetings from Allah'],
  4,
  20,
  true,
  3
);

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 1, 'The Queen of Mecca',
'Long before the revelation of Islam, Khadijah bint Khuwaylid was already extraordinary. She was one of the wealthiest merchants in all of Arabia, running vast trade caravans that traveled between Mecca, Syria, and Yemen. In a society that often marginalized women, she commanded respect through intelligence, integrity, and remarkable business acumen.

She had been married twice before, both husbands having passed away, and she had turned down proposals from the most powerful men of Quraysh. She was known as "at-Tahira" -- the Pure One -- and "Ameerat Quraysh" -- the Princess of Quraysh.

When she hired the young Muhammad (peace be upon him) to lead one of her trade caravans to Syria, she sent her servant Maysarah to observe him. Maysarah returned with astonishing reports: Muhammad''s honesty surpassed anything he had ever seen, the caravan earned double the usual profit, and strange signs of blessing accompanied him throughout the journey.

Khadijah, who was approximately 40 years old, proposed marriage to Muhammad, who was 25. She recognized in him what no one else yet fully understood -- a man of singular character, chosen by destiny for something far greater than trade.

Their marriage would become one of the greatest love stories in human history.',
'She turned down the most powerful men of Quraysh -- then proposed to a young merchant.',
'True vision is recognizing greatness in a person before the world does.',
ARRAY['Ibn Hisham, Sirah', 'Ibn Sa''d, Tabaqat'], 230, 5, true
FROM sahaba WHERE slug = 'khadijah';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 2, 'The First Believer',
'When the Prophet Muhammad (peace be upon him) descended from the Cave of Hira, trembling after his first encounter with the Angel Jibreel, it was to Khadijah that he ran. "Cover me, cover me!" he cried, shaking with awe and fear.

And Khadijah -- in what may be the single most important act of support in the history of Islam -- did not doubt, did not hesitate, and did not panic. Instead, she wrapped him in a cloak and spoke words that would sustain the Prophet through years of persecution:

"Never! By Allah, Allah will never disgrace you. You keep good relations with your family, you bear the burden of the weak, you help the poor, you serve your guests generously, and you assist those who are afflicted with calamities."

She then took him to her cousin Waraqah ibn Nawfal, a learned Christian scholar, who confirmed that what Muhammad had experienced was the same revelation that had come to Moses.

Khadijah became the first human being to accept Islam. Before Abu Bakr, before Ali, before anyone else -- a woman stood at the foundation of the faith. Her belief was not tentative or conditional. She pledged everything -- her wealth, her status, her safety -- to support the mission of her husband.

The Prophet (peace be upon him) would never forget this. Years after her death, he would say: "She believed in me when no one else did. She accepted Islam when people rejected me. She supported me with her wealth when people deprived me."',
'It was to Khadijah that he ran -- and she did not doubt for a moment.',
'Support in the moment of greatest vulnerability is the truest form of faith.',
ARRAY['Sahih al-Bukhari 3', 'Sahih al-Bukhari 3818', 'Musnad Ahmad'], 270, 5, true
FROM sahaba WHERE slug = 'khadijah';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 3, 'Sacrifice in the Valley',
'As Islam grew in Mecca, so did the persecution. The Quraysh imposed a complete boycott on the Prophet''s clan -- no one was allowed to trade with them, marry them, or even sell them food. For three agonizing years, the Muslims and the clan of Banu Hashim were confined to a narrow valley on the outskirts of Mecca.

Khadijah, who had once been the wealthiest woman in Arabia, spent every last coin of her fortune during this siege. She bought food at inflated black-market prices to feed the community. She nursed the sick. She comforted the children who cried from hunger.

Her wealth -- the vast trading empire she had built over decades -- was entirely consumed in service of Islam. She went from being a queen of commerce to having nothing, and she never uttered a single word of complaint.

The boycott broke her health. Years of deprivation in the valley, combined with her age and the emotional toll of watching the community suffer, left her physically weakened. But her spirit never dimmed.

Jibreel himself came to the Prophet and said: "O Muhammad, Khadijah is coming to you with a vessel of food. When she reaches you, convey to her greetings of peace from her Lord and from me, and give her the glad tidings of a palace in Paradise made of hollowed pearls, in which there will be no noise or fatigue."

Allah sent personal greetings to Khadijah through an angel. No other companion -- male or female -- received such an honor.',
'She went from the wealthiest woman in Arabia to having nothing -- without a word of complaint.',
'True sacrifice is not what you give up, but the silence with which you endure it.',
ARRAY['Sahih al-Bukhari 3820', 'Sahih Muslim 2432'], 270, 5, true
FROM sahaba WHERE slug = 'khadijah';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 4, 'The Year of Sorrow',
'Khadijah died in Ramadan of the year 619 CE, just three years before the migration to Medina. The Prophet (peace be upon him) was devastated. That same year, his uncle and protector Abu Talib also passed away. The Prophet called it "Aam al-Huzn" -- the Year of Sorrow.

His grief for Khadijah was lifelong and profound. He would send gifts to her friends for the rest of his life. He would praise her virtues in gatherings. When Aisha, his later wife, once expressed jealousy, the Prophet responded with uncharacteristic sharpness: "Allah has not given me better than her. She believed in me when people disbelieved, she supported me with her wealth when people deprived me, and Allah granted me children through her."

Aisha later said: "I was never jealous of any of the Prophet''s wives except Khadijah, although I never met her. But the Prophet used to mention her so frequently and praise her so highly that I felt jealous."

The Prophet would sometimes slaughter a sheep and send portions to Khadijah''s friends. Once, when Hala bint Khuwaylid (Khadijah''s sister) came to visit and called out from behind the door, the Prophet''s face changed and he said: "O Allah, Hala bint Khuwaylid!" -- because her voice reminded him of Khadijah.

Khadijah left behind a legacy that extends far beyond her financial sacrifice. She demonstrated that a woman''s faith, intelligence, and courage can be the foundation upon which an entire civilization is built. She was the first Muslim, the first supporter, the first to sacrifice everything -- and Allah honored her above all others with direct greetings of peace from Himself.',
'His grief for Khadijah was lifelong -- years later, a voice that sounded like hers could still move him to tears.',
'Love that is rooted in faith does not diminish with time -- it becomes eternal.',
ARRAY['Sahih al-Bukhari 3818', 'Sahih Muslim 2435', 'Sahih al-Bukhari 3815', 'Sahih al-Bukhari 3432'], 300, 5, true
FROM sahaba WHERE slug = 'khadijah';

-- 4. Bilal ibn Rabah
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, theme_primary, theme_secondary, notable_for, total_parts, estimated_read_time_minutes, is_published, display_order)
VALUES (
  'bilal',
  'Bilal ibn Rabah',
  'بلال بن رباح',
  'The Voice of Islam',
  'مؤذن الإسلام',
  'star',
  'purple',
  '#4A3080',
  '#5B3F99',
  ARRAY['First muezzin of Islam', 'Endured torture for faith', 'Called Adhan atop the Ka''bah'],
  4,
  20,
  true,
  4
);

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 1, 'Chains in the Desert',
'Bilal ibn Rabah was an Abyssinian slave in Mecca, owned by Umayyah ibn Khalaf, one of the most vicious opponents of Islam. His mother, Hamamah, was also enslaved. In the rigid caste system of pre-Islamic Arabia, Bilal occupied the lowest rung of society -- a Black African slave with no rights, no voice, and no future.

But when the message of Islam reached him -- that there is no god but Allah, that all human beings are equal before their Creator, that the measure of a person is not their lineage or skin color but their piety -- Bilal recognized the truth instantly.

His conversion enraged his master. Umayyah ibn Khalaf subjected Bilal to some of the worst torture recorded in the early history of Islam. He would drag Bilal out into the open desert at the hottest hour of the day, force him to lie on the burning sand, and place a massive boulder on his chest.

"Renounce Muhammad and worship our gods," Umayyah would demand.

And Bilal, barely able to breathe under the crushing weight, with the sun searing his skin and the sand scorching his back, would repeat one word: "Ahad... Ahad..." -- One... One...

He would not break. His body could be crushed, but his faith was beyond the reach of any torturer.',
'Under a boulder in the scorching desert, barely able to breathe, he whispered one word: Ahad.',
'Faith that survives the worst torture is faith that cannot be defeated.',
ARRAY['Ibn Hisham, Sirah', 'Sahih al-Bukhari 3544'], 240, 5, true
FROM sahaba WHERE slug = 'bilal';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 2, 'Freedom and the Call',
'Abu Bakr as-Siddiq, upon hearing of Bilal''s suffering, went to Umayyah and purchased Bilal''s freedom. When Abu Bakr''s father criticized him for buying a "weak" slave instead of a strong one, Abu Bakr replied: "I only seek the pleasure of Allah."

Bilal was now free. And the Prophet Muhammad (peace be upon him) recognized something extraordinary in this former slave -- a voice of remarkable beauty and power, and a spirit that had been tested beyond what most humans could endure.

When the Muslim community settled in Medina and needed a way to call the faithful to prayer, the Prophet chose Bilal as the first muezzin of Islam. This was revolutionary. In a society built on tribal hierarchy and racial distinction, the Prophet placed a Black former slave in one of the most public and honored roles in the community.

Every day, five times a day, Bilal''s voice rose over the rooftops of Medina: "Allahu Akbar, Allahu Akbar!" The same voice that had whispered "Ahad" under the boulder now thundered the call to prayer for the entire city.

The Prophet said to Bilal: "O Bilal, I entered Paradise and heard the sound of your footsteps before me." Bilal replied: "I do not know, except that whenever I perform ablution at any time of night or day, I pray with that ablution whatever Allah wills for me to pray."

His devotion was constant -- not dramatic, not showy, but unceasing.',
'The same voice that whispered under a boulder now thundered over an entire city.',
'Allah elevates those whom the world discards.',
ARRAY['Sahih al-Bukhari 3544', 'Sahih al-Bukhari 1149', 'Sahih Muslim 2458'], 260, 5, true
FROM sahaba WHERE slug = 'bilal';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 3, 'The Day of Conquest',
'The most symbolically powerful moment of Bilal''s life came on the day of the Conquest of Mecca in 630 CE. The Muslims entered the city that had persecuted them, the city where Bilal had been tortured and enslaved.

The Prophet Muhammad (peace be upon him) ordered the idols in the Ka''bah destroyed. And then he commanded Bilal to climb to the top of the Ka''bah -- the most sacred structure in Arabia -- and give the Adhan.

A Black former slave, standing on top of the Ka''bah, calling the entirety of Mecca to the worship of the One God.

Some of the Quraysh nobles, still processing their defeat, muttered in disgust. But this was precisely the point. Islam had come to shatter every hierarchy built on lineage, wealth, or color. The Prophet (peace be upon him) said in his Farewell Sermon: "An Arab has no superiority over a non-Arab, nor does a non-Arab have any superiority over an Arab. A white has no superiority over a black, nor does a black have any superiority over a white -- except by piety and good action."

Bilal''s voice from atop the Ka''bah was the living embodiment of that principle. The moment Bilal called "Allahu Akbar" from the roof of the Ka''bah, the old world of Jahiliyyah -- with its racism, its tribalism, its cruelty -- was declared finished forever.',
'A Black former slave stood atop the Ka''bah and called Mecca to God.',
'Islam shattered every hierarchy built on lineage, wealth, or color.',
ARRAY['Sahih al-Bukhari 4286', 'Musnad Ahmad 23536'], 250, 5, true
FROM sahaba WHERE slug = 'bilal';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 4, 'The Voice Falls Silent',
'After the Prophet (peace be upon him) passed away, Bilal could not bear to call the Adhan in Medina. Every time he tried, he would reach the words "Ashhadu anna Muhammadan Rasulullah" and break down weeping, unable to continue.

He asked Abu Bakr for permission to leave Medina and go to Syria for jihad. He spent the rest of his life serving Islam on the frontier, rarely returning.

But once, years later, he returned to visit the Prophet''s tomb. The people of Medina begged him to call the Adhan one last time. Bilal climbed to his old place and began.

When his voice rang out over Medina again -- "Allahu Akbar, Allahu Akbar!" -- the entire city wept. Men, women, and children poured out of their homes in tears. It was as if the Prophet''s era had returned for a brief, beautiful moment.

Bilal died in Damascus around 640 CE. His final words were: "Tomorrow we shall meet the beloved ones -- Muhammad and his companions."

His wife wept and said: "What sorrow!" Bilal opened his eyes one last time and corrected her: "What joy!"

From the burning sands of Mecca to the top of the Ka''bah, from slavery to the one whose footsteps were heard in Paradise -- Bilal''s life is the ultimate proof that in Islam, a person''s worth is measured by nothing except the sincerity of their heart.',
'His wife wept: "What sorrow!" He corrected her: "What joy!"',
'A person''s worth is measured by nothing except the sincerity of their heart.',
ARRAY['Ibn Sa''d, Tabaqat', 'Ibn Kathir, al-Bidayah', 'Siyar A''lam an-Nubala'], 260, 5, true
FROM sahaba WHERE slug = 'bilal';

-- 5. Salman al-Farsi
INSERT INTO sahaba (slug, name_en, name_ar, title_en, title_ar, icon, color_theme, theme_primary, theme_secondary, notable_for, total_parts, estimated_read_time_minutes, is_published, display_order)
VALUES (
  'salman',
  'Salman al-Farsi',
  'سلمان الفارسي',
  'The Seeker of Truth',
  'الباحث عن الحق',
  'users',
  'blue',
  '#2563EB',
  '#3B82F6',
  ARRAY['Persian who crossed the world seeking truth', 'Proposed the Trench strategy', 'Declared Ahl al-Bayt by the Prophet'],
  4,
  20,
  true,
  5
);

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 1, 'The Fire Worshipper''s Son',
'Salman was born Rouzbeh in the village of Jayyan in Isfahan, Persia. His father was the dihqan (chief) of the village, a man of wealth and influence who was devoted to the Zoroastrian faith. As was the custom, young Salman was appointed to tend the sacred fire in the fire temple -- a prestigious duty.

But as Salman tended the flames, a restlessness grew within him. He watched the fire and asked questions that his community could not answer: Who created this fire? Who created the one who created it? Is there something greater than what we worship?

One day, while running an errand for his father, Salman passed by a Christian church and heard the sound of prayer. He entered, and something stirred in his soul. The monotheism of the Christians resonated with the questions burning inside him.

He told his father about the Christians, and his father was horrified. He chained Salman in the house to prevent him from leaving the Zoroastrian faith. But Salman managed to send a message to the Christians, asking them: "Where is the origin of your faith?" They answered: "In Syria."

When a Christian trade caravan came through, Salman escaped and fled with them. He left behind his family, his inheritance, his position, and his homeland -- all in pursuit of a truth he had not yet found.',
'He tended the sacred fire and asked: Is there something greater than what we worship?',
'The search for truth begins with the courage to question what everyone around you accepts.',
ARRAY['Musnad Ahmad 23737', 'Ibn Hisham, Sirah'], 240, 5, true
FROM sahaba WHERE slug = 'salman';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 2, 'Through the Monasteries',
'For years -- possibly decades -- Salman traveled from one Christian monastery to another across the Middle East. In Syria, he served a bishop who turned out to be corrupt, hoarding charity meant for the poor. When that bishop died, Salman served his successor, who was genuinely righteous.

When this second teacher was dying, Salman asked: "Who do you recommend I go to?" The monk directed him to another scholar in Mosul. Salman traveled to Mosul and served there until that teacher too was on his deathbed, who sent him to a scholar in Nusaybin, who sent him to another in Ammuriyyah.

Each teacher taught Salman what they knew of monotheism, of scripture, of the approaching end times. And each one, on their deathbed, told Salman the same thing: the era of true Christian monasticism was ending, and a prophet was about to appear.

The last teacher in Ammuriyyah gave Salman the most specific guidance: "The time of a prophet is at hand. He will be sent with the religion of Abraham. He will appear in the land of the Arabs, in a town between two lava fields with date palms. He will accept gifts but will not eat charity. And between his shoulders is the seal of prophethood."

Salman committed these signs to memory. He had been searching for truth across the entire known world, and now he had a map to the final destination.',
'Each dying teacher pointed him to the next -- until the last one pointed him to a prophet.',
'Truth is passed from sincere hearts to sincere hearts across generations.',
ARRAY['Musnad Ahmad 23737'], 260, 5, true
FROM sahaba WHERE slug = 'salman';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 3, 'Slavery and Discovery',
'Salman persuaded a group of Arab traders to take him to Arabia, but they betrayed him and sold him into slavery. He was purchased by a Jewish man in Medina and put to work tending date palms.

Even in slavery, Salman''s search continued. When he heard that a man claiming prophethood had arrived in Medina from Mecca, his heart leapt. He immediately began testing the signs.

First sign: a land between two lava fields with date palms. Medina was exactly that.

Salman brought the Prophet a plate of food and said it was charity. The Prophet gave it to his companions but did not eat it himself. First sign confirmed.

Then Salman brought another plate and said it was a gift. The Prophet ate from it and shared it. Second sign confirmed.

Finally, Salman maneuvered to see the Prophet''s back. When the Prophet adjusted his garment, Salman saw the seal of prophethood between his shoulder blades. Third sign confirmed.

Salman collapsed in tears, kissing the Prophet''s hands and feet. He told his entire story -- the fire temple, the churches, the monasteries, the journey across the world, the slavery. The Prophet was so moved that he asked Salman to repeat his story for the other companions.

The search that began with a boy questioning the sacred fire had ended with a man finding the final Prophet of God.',
'Three signs. Three tests. A lifetime of seeking -- answered in a single moment.',
'When you are sincere in seeking truth, Allah will guide you to it no matter how far you must travel.',
ARRAY['Musnad Ahmad 23737', 'Sahih Muslim'], 260, 5, true
FROM sahaba WHERE slug = 'salman';

INSERT INTO story_parts (sahabi_id, part_number, title_en, content_en, opening_hook, key_lesson, related_hadith_refs, word_count, estimated_read_minutes, is_published)
SELECT id, 4, 'The Trench and Brotherhood',
'The Prophet (peace be upon him) helped Salman purchase his freedom by having the companions donate date palms and by personally planting some with his own hands. Every palm the Prophet planted grew successfully; none failed.

Salman''s most famous contribution came during the Battle of the Trench (627 CE). When the enormous combined army of Quraysh and their allies marched on Medina, the Muslims were vastly outnumbered. Salman proposed an idea no Arab had ever seen before: dig a massive trench around the vulnerable sides of the city.

This Persian military tactic was unknown in Arabia, and it saved Medina. The enemy cavalry could not cross the trench, and after weeks of siege, they retreated. The Prophet declared: "Salman is from us, the People of the House (Ahl al-Bayt)."

During the digging of the trench, both the Ansar and the Muhajirun claimed Salman as their own. The Ansar said: "Salman is one of us!" The Muhajirun said: "No, Salman is one of us!" The Prophet settled the matter: "Salman is one of us, the People of the House."

Salman lived a long life, reportedly reaching over 80 years of age. He served as the governor of Ctesiphon, where he lived in extreme simplicity despite ruling one of the richest cities in the world. He would weave baskets and sell them for his food, giving his entire governor''s salary to charity.

When he died, they found that he owned nothing except a bowl, a water vessel, and a reed mat.

His journey -- from Zoroastrian fire temple to Christian monastery to Arabian slavery to the inner circle of the Prophet -- stands as the ultimate testament that truth belongs to no race, no culture, and no nation. It belongs to whoever is sincere enough to seek it.',
'Both camps claimed him. The Prophet said: Salman is from us, the People of the House.',
'Truth belongs to no race, no culture, and no nation -- it belongs to whoever is sincere enough to seek it.',
ARRAY['Sahih al-Bukhari 3793', 'Musnad Ahmad 23737', 'Ibn Sa''d, Tabaqat'], 320, 6, true
FROM sahaba WHERE slug = 'salman';

-- Seed shareable snippets (matching actual schema)
INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_featured, is_published)
SELECT id, 'quote', 'I never invited anyone to Islam but that he showed some reluctance -- except Abu Bakr. When I presented Islam to him, he did not hold back or hesitate.', 'Prophet Muhammad (peace be upon him)', 'Sahih al-Bukhari 3661', '#1B5E43', '#C5A059', true, true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_featured, is_published)
SELECT id, 'quote', 'Do not grieve; indeed Allah is with us.', 'Quran 9:40', 'Quran 9:40', '#1a3a2a', '#C5A059', true, true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_published)
SELECT id, 'moment', 'Whoever worshipped Muhammad, let him know that Muhammad has died. And whoever worshipped Allah, let him know that Allah is Ever-Living and shall never die.', 'Abu Bakr as-Siddiq', 'Sahih al-Bukhari 3667', '#1B5E43', '#E8C77D', true
FROM sahaba WHERE slug = 'abu-bakr';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_featured, is_published)
SELECT id, 'moment', 'We could not pray openly at the Ka''bah until Umar embraced Islam. His Islam was a conquest.', 'Abdullah ibn Mas''ud', 'Ibn Hisham, Sirah', '#8B4513', '#E8C77D', true, true
FROM sahaba WHERE slug = 'umar';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_published)
SELECT id, 'lesson', 'Will you carry my burden on the Day of Judgment?', 'Umar ibn al-Khattab', 'Al-Tabari, Tarikh', '#8B4513', '#C5A059', true
FROM sahaba WHERE slug = 'umar';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_featured, is_published)
SELECT id, 'quote', 'Never! By Allah, Allah will never disgrace you. You keep good relations with your family, you bear the burden of the weak, you help the poor, and you assist those afflicted with calamities.', 'Khadijah bint Khuwaylid', 'Sahih al-Bukhari 3', '#8B2252', '#E8C77D', true, true
FROM sahaba WHERE slug = 'khadijah';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_featured, is_published)
SELECT id, 'moment', 'Ahad... Ahad... -- One... One...', 'Bilal ibn Rabah', 'Ibn Hisham, Sirah', '#4A3080', '#C5A059', true, true
FROM sahaba WHERE slug = 'bilal';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_published)
SELECT id, 'moment', 'His wife wept: "What sorrow!" Bilal opened his eyes and corrected her: "What joy!"', 'Bilal ibn Rabah', 'Ibn Sa''d, Tabaqat', '#4A3080', '#E8C77D', true
FROM sahaba WHERE slug = 'bilal';

INSERT INTO shareable_snippets (sahabi_id, snippet_type, text_en, attribution_en, source_reference, background_color, accent_color, is_featured, is_published)
SELECT id, 'lesson', 'Truth belongs to no race, no culture, and no nation. It belongs to whoever is sincere enough to seek it.', 'From the story of Salman al-Farsi', 'Musnad Ahmad 23737', '#2563EB', '#C5A059', true, true
FROM sahaba WHERE slug = 'salman';
