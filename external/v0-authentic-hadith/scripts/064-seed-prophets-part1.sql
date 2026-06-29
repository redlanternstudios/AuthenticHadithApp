-- Phase 2D: Seed Prophets of the Quran (Part 1: Adam through Shu'ayb)
-- All 25 Prophets mentioned in the Quran, with multi-part story narratives

-- 1. Adam (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('adam', 'Adam', 'آدم', 'Father of Humanity', 'أبو البشرية', 'The Beginning', 25, 4, 20, 'emerald', '#059669', '#D1FAE5', 'Sprout', 1, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'adam'), 1, 'The Creation of the First Man',
'When Allah announced to the angels that He would place a khalifah (vicegerent) upon the earth, they questioned this decision — not out of disobedience, but out of concern. "Will You place therein one who will cause corruption and shed blood, while we glorify You with praise and declare Your perfection?" they asked. But Allah responded with words that silenced all doubt: "Indeed, I know that which you do not know."

Allah created Adam from clay — from black mud altered, from sounding clay like pottery. He fashioned him with His own Hands, breathing into him from His spirit. The angels were commanded to prostrate before this new creation, and they all complied — all except Iblis, who refused out of arrogance, saying, "I am better than him. You created me from fire and created him from clay."

This was the first act of arrogance in creation, and it set in motion the eternal struggle between guidance and misguidance that defines the human experience.

Allah then taught Adam the names of all things — a knowledge that even the angels did not possess. When He presented these things to the angels and asked them to name them, they could not. But Adam named them all, demonstrating the unique capacity for knowledge that Allah had placed within the human being.',
'[{"surah": "Al-Baqarah", "ayah": "2:30-33", "text": "Indeed, I will make upon the earth a vicegerent."}, {"surah": "Al-Hijr", "ayah": "15:26-29", "text": "And We did certainly create man out of clay from an altered black mud."}, {"surah": "Sad", "ayah": "38:71-76", "text": "When I have proportioned him and breathed into him of My spirit, then fall down to him in prostration."}]',
'[{"collection": "Sahih Muslim", "number": "2611", "text": "Allah created Adam in His image, sixty cubits tall."}]',
'Every human being carries within them the capacity for knowledge that even angels do not possess — the ability to learn, name, and understand creation.',
'Before there was a single human footprint on earth, a conversation took place in the heavens that would determine the course of all history.',
'The creation of Adam represents the beginning of human history in Islamic theology. Unlike evolutionary narratives, the Quran presents humanity as a deliberate and honored creation.',
450, 5, true),

((SELECT id FROM prophets WHERE slug = 'adam'), 2, 'Paradise and the Fall',
'Adam was placed in Paradise (Jannah) — a garden of unimaginable beauty and abundance. There he could eat freely from whatever he wished, with one exception. Allah warned him: "Do not approach this tree, or you will be among the wrongdoers."

To complete his joy, Allah created Hawwa (Eve) from Adam, so that he would find tranquility in her companionship. Together they lived in bliss, wanting for nothing.

But Iblis, who had been cast out for his refusal to prostrate, had sworn to mislead Adam and his descendants. He whispered to them both, swearing by Allah that he was a sincere advisor. "Your Lord only forbade you this tree lest you become angels or become of the immortal," he said.

Through persistent whispering and false oaths, Iblis caused them both to slip. They ate from the forbidden tree, and immediately their covering was removed from them. They began to cover themselves with leaves of Paradise, experiencing shame for the first time.

Then came the voice of their Lord: "Did I not forbid you from that tree and tell you that Satan is to you a clear enemy?" There was no excuse, no shifting of blame. Adam and Hawwa turned to Allah with the most beautiful words of repentance: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers."

Allah accepted their repentance — and in this lies the foundational lesson of human existence. The human being is not defined by the mistake, but by the return to Allah after the mistake.',
'[{"surah": "Al-Baqarah", "ayah": "2:35-37", "text": "And We said, O Adam, dwell you and your wife in Paradise and eat therefrom."}, {"surah": "Al-A''raf", "ayah": "7:19-23", "text": "Our Lord, we have wronged ourselves."}, {"surah": "Taha", "ayah": "20:115-122", "text": "And Adam forgot, and We found not in him determination."}]',
'[{"collection": "Sahih Bukhari", "number": "3326", "text": "Were it not for Hawwa, no woman would ever betray her husband."}]',
'Repentance (tawbah) is not a sign of weakness but the very essence of the human relationship with Allah. The door of return is always open.',
'In a garden where every desire was fulfilled and every beauty was available, a single prohibition became the testing ground for all of human nature.',
'The concept of the Fall in Islam differs significantly from the Christian doctrine of Original Sin. In Islam, Adam repented and was forgiven — no inherited guilt passes to his descendants.',
500, 5, true),

((SELECT id FROM prophets WHERE slug = 'adam'), 3, 'The Descent to Earth',
'The descent of Adam and Hawwa to earth was not merely a punishment — it was the fulfillment of the original divine plan. Allah had declared from the beginning that He would place a vicegerent on earth. The time in Paradise was a preparation, a lesson in obedience, temptation, sin, and repentance that would equip humanity for its earthly mission.

Adam descended to earth carrying three gifts that would sustain his descendants forever: the knowledge of the names of all things, the words of repentance that Allah had taught him, and the promise that guidance would come from Allah to show the straight path.

"Descend from it, all of you," Allah commanded. "And when guidance comes to you from Me, whoever follows My guidance — there will be no fear concerning them, nor will they grieve."

On earth, Adam became the first prophet, the first teacher, and the first worshipper. He taught his children the oneness of Allah, the importance of gratitude, and the way of submission to the Creator. He established prayer and taught the principles that every prophet after him would reaffirm.

Adam lived for approximately one thousand years, watching his descendants multiply and spread across the earth. He witnessed both the best and worst of human nature — devotion and rebellion, brotherhood and the first murder when Qabil killed Habil.',
'[{"surah": "Al-Baqarah", "ayah": "2:38-39", "text": "We said: Get down all of you from here; and if there comes to you guidance from Me, whoever follows My guidance shall have no fear."}, {"surah": "Al-Ma''idah", "ayah": "5:27-31", "text": "And recite to them the story of Adam''s two sons in truth."}]',
'[{"collection": "Sunan at-Tirmidhi", "number": "3076", "text": "Adam was sixty cubits tall when he was created, and people have been decreasing in stature since then."}]',
'Earth is not a place of exile but a place of purpose. Every human being is here to fulfill the mission of being Allah''s vicegerent — to worship, to build, and to uphold justice.',
'When Adam''s feet first touched the soil of earth, he carried with him the memory of Paradise and the promise of an eventual return.',
'Islamic tradition holds that Adam descended to earth in the region of modern-day Sri Lanka or India, while Hawwa descended elsewhere, and they were eventually reunited near Arafah.',
420, 5, true),

((SELECT id FROM prophets WHERE slug = 'adam'), 4, 'Legacy of the First Prophet',
'Adam''s legacy extends far beyond being the first human — he was the first prophet, establishing the pattern of tawhid (monotheism) that every subsequent prophet would follow. The Prophet Muhammad (peace be upon him) described meeting Adam during the Night Journey (Isra and Mi''raj), finding him in the first heaven, welcoming the souls of his descendants.

The annual gathering at Arafah during Hajj commemorates the reunion of Adam and Hawwa on earth, and the covenant that Allah took from all of Adam''s descendants — the primordial covenant (mithaq) in which every soul testified to Allah''s lordship before being sent to earth.

Adam taught humanity its first and most important lesson: that the relationship between the Creator and creation is one of love, mercy, and the constant possibility of return. No matter how far one strays, the path back is always through the words he was given: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers."

When Adam finally passed away, the angels washed his body and buried him — establishing the funeral rites that Muslims follow to this day. His life was the template upon which all of human civilization would be built: knowledge, worship, family, repentance, and the eternal striving toward the divine.',
'[{"surah": "Al-A''raf", "ayah": "7:172", "text": "Am I not your Lord? They said: Yes, we testify."}, {"surah": "Al-Isra", "ayah": "17:70", "text": "And We have certainly honored the children of Adam."}]',
'[{"collection": "Sahih Muslim", "number": "162", "text": "I came to Adam and greeted him, and he said: Welcome, O righteous son and righteous prophet."}]',
'The honor of humanity is not earned but bestowed by Allah. Every person, as a child of Adam, carries inherent dignity that must be respected.',
'On the Night Journey, when the Prophet Muhammad ascended through the heavens, the very first soul he encountered was the father of all humanity.',
'The Hajj pilgrimage, performed by millions annually, contains echoes of Adam''s story — from the reunion at Arafah to the stoning of Iblis at Jamarat.',
380, 4, true);

-- 2. Idris (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('idris', 'Idris', 'إدريس', 'The Elevated One', 'الصادق', 'Early Humanity', 2, 2, 8, 'indigo', '#4F46E5', '#E0E7FF', 'BookOpen', 2, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'idris'), 1, 'The Scholar Among the Ancients',
'Idris (peace be upon him) holds a unique place among the prophets — he is described in the Quran with two remarkable attributes: truthfulness (siddiq) and prophethood (nabi). Allah raised him to a "high station," a phrase that scholars have interpreted as both spiritual elevation and a literal ascension.

Idris is believed to have been among the earliest generations after Adam, possibly the great-grandfather of Nuh (Noah). He was the first to write with a pen, the first to sew garments, and the first to study the movements of the stars and calculate mathematical principles. In him, worship and knowledge were unified — he demonstrated that the pursuit of understanding creation is itself an act of devotion to the Creator.

He called his people to the worship of Allah alone, warning them against the corruption that was beginning to spread among Adam''s descendants. While many listened, others turned away, beginning the pattern of rejection that would characterize the human relationship with prophetic guidance throughout history.',
'[{"surah": "Maryam", "ayah": "19:56-57", "text": "And mention in the Book, Idris. Indeed, he was a man of truth and a prophet. And We raised him to a high station."}, {"surah": "Al-Anbiya", "ayah": "21:85", "text": "And Isma''il and Idris and Dhul-Kifl, all were of the patient."}]',
'[{"collection": "Sahih Bukhari", "number": "3342", "text": "The Prophet met Idris in the fourth heaven during the Night Journey."}]',
'Knowledge and worship are not separate pursuits — the scholar who seeks understanding of creation is engaged in one of the highest forms of devotion.',
'He was the first to trace letters with a pen, the first to map the stars, and the first to transform animal skins into clothing — yet his greatest achievement was something far simpler.',
'Idris is often identified with the biblical Enoch. His placement in the fourth heaven during the Mi''raj suggests a station of particular honor.',
380, 4, true),

((SELECT id FROM prophets WHERE slug = 'idris'), 2, 'Raised to a High Station',
'The most remarkable aspect of Idris''s story is the divine statement: "And We raised him to a high station." This elevation was both spiritual and, according to many scholars, physical. Idris was taken up by Allah while still alive, a distinction shared with very few individuals in prophetic history.

His ascension was a reward for a life lived in complete devotion. Despite the growing wickedness around him, Idris never wavered in his call to truth. He fasted during the day and spent his nights in prayer and contemplation. Every breath was an act of remembrance of Allah.

The Prophet Muhammad (peace be upon him) encountered Idris in the fourth heaven during the Night Journey. Idris greeted him warmly, recognizing in Muhammad the final link in the chain of prophethood that had begun with his ancestor Adam.

Idris''s legacy is a reminder that in every age, there are those who choose the path of knowledge, patience, and devotion — and that such a path is never unrewarded, even when the world around them chooses differently.',
'[{"surah": "Maryam", "ayah": "19:57", "text": "And We raised him to a high station."}]',
'[{"collection": "Sahih Muslim", "number": "162", "text": "During the Mi''raj, the Prophet passed by Idris in the fourth heaven."}]',
'Consistency in devotion, even when unseen by others, is recognized and rewarded by Allah in ways beyond human imagination.',
'While the world around him descended into corruption, one man was literally ascending — not running from the world, but being elevated above it.',
'The concept of bodily ascension (raf'') in Islam is significant, as it appears in the stories of both Idris and Isa (Jesus).',
300, 4, true);

-- 3. Nuh (Noah) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('nuh', 'Nuh (Noah)', 'نوح', 'The Grateful Servant', 'عبد شكور', 'The Great Flood', 43, 4, 20, 'blue', '#2563EB', '#DBEAFE', 'Anchor', 3, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'nuh'), 1, 'Nine Hundred and Fifty Years of Patience',
'No prophet endured a longer mission than Nuh (peace be upon him). For nine hundred and fifty years, he called his people to the worship of Allah alone, yet only a handful believed. His story is one of the most detailed in the Quran, occupying an entire surah named after him, and referenced extensively across many others.

Nuh''s people had fallen into idol worship, venerating five idols — Wadd, Suwa, Yaghuth, Ya''uq, and Nasr — that were originally memorials to righteous people from earlier generations. Over time, veneration turned to worship, and the worship of these idols became so entrenched that the people could not imagine life without them.

Nuh called to them day and night, publicly and privately. He appealed to their reason: "Do you not see how Allah has created seven heavens in layers, and made the moon therein a light and made the sun a burning lamp?" He appealed to their self-interest: "Ask forgiveness of your Lord. Indeed, He is ever a Perpetual Forgiver. He will send rain to you in abundance and give you increase in wealth and children." But they covered their ears, wrapped themselves in their garments, and persisted in arrogant refusal.

The wealthy mocked the poor believers who followed Nuh, demanding that he drive them away before they would listen. Nuh refused: "I am not going to drive away those who have believed. Indeed, they will meet their Lord, but I see that you are a people behaving ignorantly."',
'[{"surah": "Nuh", "ayah": "71:1-28", "text": "Indeed, We sent Nuh to his people: Warn your people before there comes to them a painful punishment."}, {"surah": "Al-Ankabut", "ayah": "29:14", "text": "And We certainly sent Nuh to his people, and he remained among them a thousand years minus fifty."}, {"surah": "Hud", "ayah": "11:27-31", "text": "The eminent among those who disbelieved from his people said: We do not see you but as a man like ourselves."}]',
'[{"collection": "Sahih Bukhari", "number": "3340", "text": "Nuh will be the first messenger to intercede on the Day of Judgment."}]',
'True success is measured not by the number of followers but by faithfulness to the message. Nine centuries of apparent failure were in reality nine centuries of unwavering obedience.',
'Imagine calling people to truth for longer than most civilizations last — and being rejected every single day.',
'The five idols mentioned in Surah Nuh were originally names of righteous individuals from the time of Adam, whose memory was gradually transformed into idol worship.',
480, 5, true);

-- 4. Hud (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('hud', 'Hud', 'هود', 'Prophet to the People of ''Ad', 'نبي قوم عاد', 'Ancient Arabia', 7, 2, 10, 'amber', '#D97706', '#FEF3C7', 'Wind', 4, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'hud'), 1, 'The People of Pillars',
'After the flood of Nuh, humanity began anew. Among the earliest civilizations to rise were the people of ''Ad — described in the Quran as unmatched in power and grandeur. They built towering structures on every high place, "the likes of which had never been created in the land." Their strength was legendary, their architecture magnificent, and their arrogance boundless.

To this mighty people, Allah sent Hud (peace be upon him), one of their own. His message was simple and eternal: "O my people, worship Allah; you have no deity other than Him." But the ''Ad were intoxicated by their power. They said, "Who is greater than us in strength?" forgetting that Allah, who created them, was far greater.

Hud warned them that their blessings — their strength, their children, their gardens and springs — were all from Allah and could be taken away as easily as they were given. But they laughed at him, calling him foolish and accusing him of being possessed by their gods.',
'[{"surah": "Al-Fajr", "ayah": "89:6-8", "text": "Have you not considered how your Lord dealt with ''Ad — Iram of the Pillars, the likes of which were never created in the land?"}, {"surah": "Al-A''raf", "ayah": "7:65-72", "text": "And to ''Ad We sent their brother Hud."}, {"surah": "Fussilat", "ayah": "41:15-16", "text": "They said: Who is greater than us in strength?"}]',
'[]',
'No civilization is too powerful to fall. When blessings are met with arrogance instead of gratitude, destruction follows.',
'They built towers that scraped the sky and fortresses that defied time — but they could not build a shelter against the wind that Allah sent.',
'The people of ''Ad are believed to have inhabited the southern Arabian Peninsula, possibly in modern-day Oman or Yemen. Archaeological evidence suggests ancient civilizations in these regions.',
350, 5, true);

-- 5. Salih (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('salih', 'Salih', 'صالح', 'Prophet to the People of Thamud', 'نبي قوم ثمود', 'Ancient Arabia', 9, 2, 10, 'stone', '#78716C', '#F5F5F4', 'Mountain', 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'salih'), 1, 'The She-Camel of Allah',
'The people of Thamud succeeded ''Ad in power and civilization. They carved magnificent homes out of the mountains — dwellings that still stand in the region of Al-Hijr (Mada''in Salih) in modern Saudi Arabia. Their skill in stone-carving was unparalleled, and they lived in comfort and abundance.

Allah sent Salih (peace be upon him) from among them, calling them to worship Allah alone. They demanded a miracle as proof of his prophethood: they wanted a she-camel to emerge from the solid rock of the mountain. Salih prayed to Allah, and miraculously, a magnificent she-camel emerged from the stone.

This was no ordinary camel — it was a living sign from Allah. Salih established a covenant: the she-camel would drink from the well on one day, and the people would drink on the next. She was not to be harmed in any way.

For a time, the arrangement held. But the disbelievers grew resentful. The she-camel''s presence was a constant reminder of a truth they wished to deny. Finally, the most wretched among them rose up and hamstrung the she-camel, killing her in defiance of Allah''s sign.

Salih gave them three days. "Enjoy yourselves in your homes for three days," he said. "That is a promise not to be denied." On the third day, a mighty blast from the sky destroyed them all — their carved palaces became their tombs.',
'[{"surah": "Al-A''raf", "ayah": "7:73-79", "text": "And to Thamud We sent their brother Salih."}, {"surah": "Ash-Shams", "ayah": "91:11-15", "text": "Thamud denied the truth by reason of their transgression — when the most wretched of them was sent forth."}, {"surah": "Al-Hijr", "ayah": "15:80-84", "text": "And certainly did the companions of al-Hijr deny the messengers."}]',
'[{"collection": "Sahih Bukhari", "number": "3379", "text": "When the Prophet passed by al-Hijr, he told the companions to weep or not enter unless weeping, lest what befell them befall you."}]',
'A single act of defiance against a divine sign can bring down an entire civilization. The courage to do wrong does not make wrong right.',
'Their homes are still standing — carved into the rose-red mountains of Arabia — but the people who built them vanished in a single morning.',
'Mada''in Salih (Al-Hijr) in northwestern Saudi Arabia contains well-preserved Nabataean tombs often associated with the Thamud. The Prophet Muhammad instructed his companions not to enter these ruins except in a state of humility.',
450, 5, true);

-- 6. Ibrahim (Abraham) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('ibrahim', 'Ibrahim (Abraham)', 'إبراهيم', 'Khalilullah (Friend of Allah)', 'خليل الله', 'The Patriarch', 69, 5, 25, 'gold', '#CA8A04', '#FEF9C3', 'Star', 6, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'ibrahim'), 1, 'The Young Seeker of Truth',
'Ibrahim (peace be upon him) is perhaps the most important prophet after Muhammad (peace be upon him) in Islamic theology. Called Khalilullah — the intimate friend of Allah — his story spans continents, tests the limits of human devotion, and establishes the foundations of the three great Abrahamic faiths.

Born into a family and society of idol worshippers, Ibrahim''s journey to truth began with the power of observation and reason. As a young man, he looked at the heavens and saw a star. "This is my lord," he said — testing, questioning, seeking. When the star set, he declared, "I do not like those that set." Then he saw the moon rising in splendor. "This is my lord," he said. But when it too set, he said, "Unless my Lord guides me, I will surely be among the people gone astray." Finally, when he saw the sun, the greatest of celestial bodies, he said, "This is my lord; this is greater." But when it set, he arrived at the ultimate conclusion: "O my people, indeed I am free from what you associate with Allah. Indeed, I have turned my face toward He who created the heavens and the earth, inclining toward truth, and I am not of those who associate others with Allah."

This was not the wandering of a confused mind but the methodical reasoning of a brilliant intellect guided by divine light. Ibrahim demonstrated that the truth of monotheism is accessible through sincere reflection on creation.',
'[{"surah": "Al-An''am", "ayah": "6:74-79", "text": "And thus did We show Ibrahim the realm of the heavens and the earth that he would be among the certain in faith."}, {"surah": "Al-Anbiya", "ayah": "21:51-56", "text": "And We had certainly given Ibrahim his sound judgment before."}]',
'[{"collection": "Sahih Bukhari", "number": "3350", "text": "Ibrahim was the first to offer hospitality to guests."}]',
'Truth can be found through sincere reflection. Ibrahim''s logical journey from stars to the Creator shows that faith and reason are allies, not enemies.',
'In a city of ten thousand idols, a young man looked up at the night sky and began asking the question that would change the world.',
'Ibrahim is believed to have lived in ancient Mesopotamia (modern-day Iraq), in or near the city of Ur during a period of sophisticated polytheistic civilization.',
420, 5, true);

-- 7. Lut (Lot) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('lut', 'Lut (Lot)', 'لوط', 'The Steadfast Warner', 'المنذر الصابر', 'The Cities of the Plain', 27, 2, 10, 'slate', '#475569', '#F1F5F9', 'Shield', 7, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'lut'), 1, 'Standing Alone Against a City',
'Lut (peace be upon him) was the nephew of Ibrahim and one of the first to believe in his message. When Ibrahim migrated from Mesopotamia, Lut accompanied him, eventually settling in the region of Sodom — a prosperous area near the Dead Sea whose inhabitants had fallen into unprecedented moral corruption.

Lut''s mission was among the most difficult of any prophet. He was sent to a people who openly practiced immorality and rejected every standard of decency. When he called them to righteousness, they mocked him. When he warned them of divine punishment, they threatened to expel him.

The loneliness of Lut''s mission is palpable in the Quran. His own wife betrayed him, siding with the disbelievers. He had no powerful tribe to support him, no allies to stand beside him. At his most vulnerable moment, he cried out, "If only I had against you some power or could take refuge in a strong support."

But his support was Allah. Angels came in the form of handsome young men — a test for the corrupt people who rushed to Lut''s door with evil intentions. Lut was distressed beyond measure, calling it "a difficult day." The angels revealed their true identity: "O Lut, indeed we are messengers of your Lord; they will never reach you."',
'[{"surah": "Hud", "ayah": "11:77-83", "text": "And when Our messengers came to Lut, he was distressed for them."}, {"surah": "Al-Ankabut", "ayah": "29:28-35", "text": "And Lut, when he said to his people: You commit such immorality as no one in the worlds has preceded you in."}, {"surah": "Ash-Shu''ara", "ayah": "26:160-175", "text": "The people of Lut denied the messengers."}]',
'[]',
'Standing for truth when you are alone and outnumbered is the mark of prophetic courage. Allah''s support comes to those who refuse to compromise on principles.',
'He was the only righteous man in a city of thousands — and even his own wife stood against him.',
'The cities of Sodom and Gomorrah are believed to have been located near the southeastern shore of the Dead Sea. Archaeological evidence suggests a catastrophic destruction of settlements in this area around 1700 BCE.',
400, 5, true);

-- 8. Isma'il (Ishmael) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('ismail', 'Isma''il (Ishmael)', 'إسماعيل', 'The Sacrifice', 'الذبيح', 'Makkah', 12, 2, 10, 'desert', '#B45309', '#FDE68A', 'Heart', 8, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'ismail'), 1, 'The Great Sacrifice',
'Isma''il (peace be upon him) is the son of Ibrahim and Hajar, and the forefather of the Prophet Muhammad (peace be upon him). His story is inseparable from the greatest test of faith ever recorded — the command to Ibrahim to sacrifice his own son.

Allah tested Ibrahim through a dream in which he saw himself slaughtering his son. Ibrahim, the friend of Allah, did not hesitate, but he consulted his son: "O my son, indeed I have seen in a dream that I must sacrifice you, so see what you think." Isma''il''s response reveals a soul of extraordinary submission: "O my father, do as you are commanded. You will find me, if Allah wills, of the steadfast."

Father and son walked together toward the place of sacrifice. When they had both submitted to Allah''s will and Ibrahim had laid his son on his forehead, the divine call came: "O Ibrahim, you have fulfilled the vision." A great ram was provided as a ransom, and this moment became the foundation of the annual Eid al-Adha celebration observed by billions.

But Isma''il''s story begins even earlier — with his mother Hajar, left alone in the barren valley of Makkah with her infant son. When their water ran out, Hajar ran frantically between the hills of Safa and Marwah, searching for water or help. Allah caused the spring of Zamzam to burst forth beneath the feet of baby Isma''il — a spring that flows to this day, over four thousand years later.',
'[{"surah": "As-Saffat", "ayah": "37:100-111", "text": "And We ransomed him with a great sacrifice."}, {"surah": "Al-Baqarah", "ayah": "2:127-129", "text": "And when Ibrahim was raising the foundations of the House with Isma''il."}, {"surah": "Maryam", "ayah": "19:54-55", "text": "And mention in the Book, Isma''il. Indeed, he was true to his promise, and he was a messenger and a prophet."}]',
'[{"collection": "Sahih Bukhari", "number": "3364", "text": "The Prophet said: The first person to be clothed on the Day of Resurrection will be Ibrahim."}]',
'True submission to Allah means willingness to sacrifice what is most dear. Both Ibrahim and Isma''il demonstrated that complete trust in Allah transcends even the strongest human bonds.',
'A father raises the knife over his beloved son — and in that moment of ultimate surrender, the entire meaning of submission to Allah is written.',
'The Ka''bah in Makkah, rebuilt by Ibrahim and Isma''il, stands as the oldest and most sacred house of worship in Islam. The rituals of Hajj directly commemorate the experiences of Ibrahim, Hajar, and Isma''il.',
430, 5, true);

-- 9. Ishaq (Isaac) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('ishaq', 'Ishaq (Isaac)', 'إسحاق', 'The Gift of Joy', 'البشارة', 'Canaan', 17, 1, 5, 'teal', '#0D9488', '#CCFBF1', 'Gift', 9, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'ishaq'), 1, 'The Promised Son',
'Ishaq (peace be upon him) was the second son of Ibrahim, born to Sarah in their old age as a divine gift and glad tiding. When the angels came to Ibrahim with the news, Sarah laughed in astonishment — she was elderly and had long given up hope of bearing a child. Yet Allah''s plan is never limited by human expectation.

Ishaq grew to become a prophet and a righteous man, continuing his father Ibrahim''s mission of monotheism in the land of Canaan. Through Ishaq came the lineage of Ya''qub (Jacob) and the twelve tribes of Israel, from whom many of the prophets mentioned in the Quran would descend.

The Quran describes Ishaq as one who was given good tidings, blessed, and among the righteous. He carried forward the covenant of Ibrahim, maintaining the worship of the One God in a land that would become the setting for many of the most important prophetic stories in history.

While the Quran does not detail Ishaq''s life as extensively as some other prophets, his significance lies in the continuation of the prophetic chain. He represents Allah''s faithfulness to His promises — that Ibrahim''s sacrifice and devotion would be rewarded with righteous descendants who would carry the light of guidance to future generations.',
'[{"surah": "Hud", "ayah": "11:69-73", "text": "And We gave him good tidings of Ishaq, and after Ishaq, Ya''qub."}, {"surah": "Al-Anbiya", "ayah": "21:72", "text": "And We gave him Ishaq and Ya''qub as an additional gift, and all of them We made righteous."}, {"surah": "As-Saffat", "ayah": "37:112-113", "text": "And We gave him good tidings of Ishaq, a prophet from among the righteous."}]',
'[]',
'Allah''s promises are always fulfilled, even when circumstances seem impossible. The birth of Ishaq to elderly parents is a reminder that no blessing is beyond Allah''s power to bestow.',
'An elderly woman laughed when she heard the news — and in that laughter was hidden the future of nations.',
'Ishaq settled in the land of Canaan (modern-day Palestine/Israel), where he continued the Abrahamic tradition of monotheism.',
320, 5, true);

-- 10. Ya'qub (Jacob) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('yaqub', 'Ya''qub (Jacob)', 'يعقوب', 'Israel - The Servant of Allah', 'إسرائيل', 'Canaan', 16, 2, 10, 'violet', '#7C3AED', '#EDE9FE', 'Users', 10, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'yaqub'), 1, 'A Father''s Beautiful Patience',
'Ya''qub (peace be upon him), also known as Israel, was the son of Ishaq and the father of twelve sons who would become the founders of the twelve tribes of Israel. His story in the Quran is told primarily through the lens of his relationship with his beloved son Yusuf, and it is a masterclass in what the Quran calls "sabr jamil" — beautiful patience.

When Ya''qub''s sons came to him with Yusuf''s shirt stained with false blood, claiming a wolf had devoured their brother, Ya''qub saw through their deception immediately. But he did not rage or accuse — he said simply, "Rather, your souls have enticed you to something, so patience is most fitting. And Allah is the one sought for help against that which you describe."

For years — perhaps decades — Ya''qub lived with the grief of losing his most beloved son. He wept so much that his eyes whitened from sorrow, yet he never despaired of Allah''s mercy. When people urged him to stop grieving, he replied, "I only complain of my suffering and my grief to Allah, and I know from Allah that which you do not know."

This is the essence of beautiful patience: not the absence of grief, but the refusal to complain to anyone other than Allah, and the unwavering certainty that relief will come.',
'[{"surah": "Yusuf", "ayah": "12:18", "text": "Rather, your souls have enticed you to something, so patience is most fitting."}, {"surah": "Yusuf", "ayah": "12:84-86", "text": "And his eyes became white from grief, and he was a suppressor of grief."}, {"surah": "Yusuf", "ayah": "12:87", "text": "Indeed, no one despairs of relief from Allah except the disbelieving people."}]',
'[{"collection": "Sahih Muslim", "number": "2378", "text": "The noble son of the noble son of the noble: Yusuf ibn Ya''qub ibn Ishaq ibn Ibrahim."}]',
'Beautiful patience (sabr jamil) means bearing hardship without complaint to creation while maintaining absolute hope in the Creator.',
'He cried until his eyes turned white — but he never once turned his face away from Allah.',
'Ya''qub (Israel) is the patriarch of the Israelites. His twelve sons became the founders of the twelve tribes, making him one of the most significant figures in the shared heritage of Judaism, Christianity, and Islam.',
380, 5, true);

-- 11. Yusuf (Joseph) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('yusuf', 'Yusuf (Joseph)', 'يوسف', 'The Best of Stories', 'أحسن القصص', 'Egypt', 27, 4, 20, 'rose', '#E11D48', '#FFE4E6', 'Crown', 11, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'yusuf'), 1, 'The Dream and the Well',
'Allah calls the story of Yusuf "the best of stories" — ahsan al-qasas — and it is the only prophetic narrative presented in the Quran as a complete, continuous account within a single surah. It is a story of jealousy and betrayal, temptation and integrity, imprisonment and power, and ultimately, divine justice and reconciliation.

It begins with a dream. Young Yusuf saw eleven stars, the sun, and the moon prostrating before him. When he told his father Ya''qub, the wise prophet recognized its significance immediately: "O my son, do not relate your vision to your brothers or they will contrive against you a plan." But the seeds of jealousy had already been planted in the hearts of Yusuf''s brothers, who resented the special love Ya''qub showed toward Yusuf and his younger brother Binyamin.

The brothers plotted. They convinced Ya''qub to let them take Yusuf out to play, then threw him into a deep well. They returned with his shirt, stained with false blood, and the performance of grief. A passing caravan discovered Yusuf in the well and sold him as a slave in Egypt, where he was purchased by a powerful official known in the Quran as al-Aziz.

In the darkness of that well, a young boy learned the first lesson of a remarkable life: that when all human support is stripped away, Allah remains.',
'[{"surah": "Yusuf", "ayah": "12:1-20", "text": "We relate to you the best of stories in what We have revealed to you of this Quran."}, {"surah": "Yusuf", "ayah": "12:4-6", "text": "When Yusuf said to his father: O my father, indeed I have seen eleven stars and the sun and the moon; I saw them prostrating to me."}]',
'[{"collection": "Sahih Muslim", "number": "2378", "text": "The Prophet said about Yusuf: The noble, son of the noble, son of the noble, son of the noble."}]',
'Divine plans often begin in the darkest places. The well was not an ending for Yusuf but the beginning of a journey that would lead him to the throne of Egypt.',
'Eleven stars, the sun, and the moon bowed before a boy — and from that single dream, a saga of betrayal, temptation, and triumph would unfold across decades.',
'The story of Yusuf is believed to have taken place during the Hyksos period of Egyptian history (circa 1650-1550 BCE), when Semitic peoples held significant power in Egypt.',
420, 5, true);

-- 12. Ayyub (Job) (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('ayyub', 'Ayyub (Job)', 'أيوب', 'The Patient Servant', 'الصابر', 'The Land of Uz', 4, 2, 10, 'bronze', '#92400E', '#FDE68A', 'HeartHandshake', 12, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'ayyub'), 1, 'The Test of the Grateful',
'Ayyub (peace be upon him) is the Quran''s supreme example of patience in the face of suffering. He was a man blessed with everything — wealth, health, a large loving family, and land. He used all of these blessings in the service of Allah and in generosity toward others. He was the embodiment of shukr (gratitude).

Then the test came. Ayyub lost his wealth. He lost his children. He lost his health, afflicted with a severe illness that consumed his body over many years. His friends abandoned him. His community shunned him. Only his faithful wife remained by his side.

Through all of this, Ayyub did not complain. He did not question Allah''s wisdom. He did not curse his fate. He continued to worship, to remember Allah, and to maintain his faith with a steadfastness that would become legendary.

After years of suffering, when his body was ravaged and his isolation complete, Ayyub finally turned to his Lord — not with complaint but with a humble acknowledgment: "Indeed, adversity has touched me, and You are the Most Merciful of the merciful." This was not a demand or a protest — it was a beautiful expression of need, acknowledging both his weakness and Allah''s infinite mercy.

Allah responded immediately: "Strike the ground with your foot." A spring gushed forth, and when Ayyub washed in it and drank from it, his health was completely restored. Allah returned to him his family and his wealth, doubled as a reward for his patience.',
'[{"surah": "Al-Anbiya", "ayah": "21:83-84", "text": "And Ayyub, when he called to his Lord: Indeed, adversity has touched me, and you are the Most Merciful of the merciful."}, {"surah": "Sad", "ayah": "38:41-44", "text": "And remember Our servant Ayyub — an excellent servant. Indeed, he was one repeatedly turning back to Allah."}]',
'[{"collection": "Sahih Bukhari", "number": "5652", "text": "The Prophet said: The most severely tested among people are the prophets, then the next best, then the next best."}]',
'Patience is not passive endurance but active trust. Ayyub''s patience was not silence — it was a continuous turning toward Allah, even in the darkest hours.',
'He had everything a person could want — and when it was all taken away, he discovered something more valuable than any of it.',
'Ayyub is identified with the biblical Job. His story resonates across religious traditions as the ultimate example of patience through suffering.',
420, 5, true);

-- 13. Shu'ayb (AS)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('shuayb', 'Shu''ayb', 'شعيب', 'Preacher of the Prophets', 'خطيب الأنبياء', 'Midian', 11, 2, 10, 'orange', '#EA580C', '#FFEDD5', 'Scale', 13, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'shuayb'), 1, 'The Prophet of Fair Dealing',
'Shu''ayb (peace be upon him) was sent to the people of Midian, a prosperous trading community near the Gulf of Aqaba. His people were known for two things: their commercial success and their systematic dishonesty in business. They would give short measure when selling and demand full measure when buying. They cheated on weights and scales, manipulated markets, and exploited travelers.

Shu''ayb''s message was unique among the prophets — while he called to the worship of Allah alone, he also specifically addressed economic justice and commercial ethics. "O my people, give full measure and weight in justice and do not deprive the people of their due," he commanded. "And do not do evil in the land, causing corruption."

This dual emphasis — spiritual monotheism and economic justice — reveals a profound truth in Islamic ethics: worship of Allah and fair dealing with people are inseparable. A person who cheats in business while claiming to believe in God has understood neither business nor belief.

The people of Midian rejected Shu''ayb. They mocked him, saying, "Does your prayer command you that we should leave what our fathers worship or not do with our wealth what we please?" In their minds, religion should not interfere with commerce — a separation that Shu''ayb firmly rejected.

When they persisted in their corruption, Allah sent upon them the punishment of the Day of the Overshadowing Cloud — a day of intense heat followed by a devastating punishment that left them prostrate in their homes.',
'[{"surah": "Al-A''raf", "ayah": "7:85-93", "text": "And to Midian We sent their brother Shu''ayb."}, {"surah": "Hud", "ayah": "11:84-95", "text": "He said: O my people, give full measure and weight in justice."}, {"surah": "Ash-Shu''ara", "ayah": "26:176-191", "text": "The companions of the thicket denied the messengers."}]',
'[]',
'Faith cannot be separated from ethics. How you conduct business, treat employees, and handle money is as much a part of your religion as prayer and fasting.',
'They were the most successful merchants of their age — and the most dishonest. The prophet sent to them spoke not only of God, but of grams and ounces.',
'Midian is believed to have been located in the northwestern Arabian Peninsula, near the Gulf of Aqaba. It was a prosperous trading center on the incense routes.',
400, 5, true);
