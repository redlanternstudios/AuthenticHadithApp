-- Phase 2D: Seed Prophets of the Quran (Part 2: Musa through Muhammad PBUH)
-- Prophets 14-25 -- using correct column names matching part 1

-- 14. Musa (Moses) - The Kalimullah
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('musa', 'Musa (Moses)', 'موسى', 'The One Who Spoke to Allah', 'كليم الله', 'Ancient Egypt / Sinai', 136, 5, 30, 'blue', '#2563EB', '#DBEAFE', 'Flame', 14, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'musa'), 1, 'Birth and Rescue from the Nile',
'Musa was born at a time when Pharaoh had ordered the killing of all newborn Israelite boys, acting on a prophecy that a boy from the Israelites would overthrow his kingdom. His mother, inspired by Allah, placed him in a basket and set it upon the River Nile.

The basket was found by Pharaoh''s wife Asiya, who convinced Pharaoh to adopt him. Allah reunited Musa with his mother as his wet nurse, fulfilling the divine promise: "We will return him to you and make him one of the messengers" (Quran 28:7).

Growing up in the palace, Musa witnessed the oppression of his people firsthand. One day, he intervened in a fight and accidentally killed an Egyptian, forcing him to flee to Madyan where he would spend years as a shepherd before receiving his prophetic mission.',
'[{"surah": "Al-Qasas", "ayah": "28:7-13", "text": "We inspired the mother of Musa: Nurse him, and when you fear for him, cast him into the river."}, {"surah": "Ta-Ha", "ayah": "20:38-40", "text": "We had already conferred favor upon you another time."}]',
'[{"collection": "Sahih Bukhari", "number": "3394", "text": "On the Night Journey, I met Musa, and he was a tall, brown, curly-haired man."}]',
'Allah''s plans unfold in ways we cannot foresee — the very palace that sought to destroy the Israelites became the place that raised their liberator.',
'In the darkest hour for the Children of Israel, a mother placed her infant son into the waters of the Nile, trusting in Allah''s promise more than her own fear.',
'Pharaoh''s persecution of the Israelites represents one of the great tyrannies of ancient history. The Quran devotes more attention to Musa''s story than any other prophet.',
500, 6, true),

((SELECT id FROM prophets WHERE slug = 'musa'), 2, 'The Burning Bush and Divine Mission',
'While tending his flock near Mount Tur, Musa saw a fire in the distance. When he approached, he heard the voice of Allah calling to him: "Indeed, I am Allah, Lord of the worlds" (Quran 28:30). Allah commanded him to throw down his staff, which transformed into a serpent, and to put his hand inside his garment, from which it emerged shining white without disease.

With these two miraculous signs, Allah sent Musa back to Egypt to confront Pharaoh. Musa asked for his brother Harun to be his helper, saying "My brother Harun is more eloquent than me in speech" (Quran 28:34). Allah granted this request, making Harun a prophet alongside his brother.

Together they stood before the most powerful ruler on earth and delivered the message: "We are messengers of the Lord of the worlds. Send with us the Children of Israel" (Quran 26:16-17).',
'[{"surah": "An-Naml", "ayah": "27:7-12", "text": "Indeed, I have perceived a fire; perhaps I can bring you information from it."}, {"surah": "Al-Qasas", "ayah": "28:29-35", "text": "O Musa, indeed I am Allah, Lord of the worlds."}]',
'[{"collection": "Sahih Muslim", "number": "166", "text": "The Prophet (PBUH) said: Do not give me superiority over Musa."}]',
'When Allah calls you to a mission, He also provides the tools and support you need to accomplish it.',
'A simple shepherd, tending his flock in the wilderness, was about to become the liberator of an entire nation.',
'The confrontation between Musa and Pharaoh is the most detailed narrative in the Quran, illustrating the eternal struggle between truth and tyranny.',
450, 5, true),

((SELECT id FROM prophets WHERE slug = 'musa'), 3, 'The Plagues and the Exodus',
'Pharaoh rejected Musa''s message and challenged him to a public contest with his magicians. When the magicians saw Musa''s staff devour their tricks, they fell into prostration, declaring faith in the Lord of Musa and Harun — even as Pharaoh threatened them with crucifixion.

Despite nine miraculous signs — floods, locusts, lice, frogs, blood, and more — Pharaoh''s heart remained hardened. Each time a plague struck, he would promise to let the Israelites go, only to break his word when the affliction was lifted.

Finally, Allah commanded Musa to lead his people out of Egypt by night. When they reached the sea with Pharaoh''s army behind them, Musa struck the water with his staff and it parted into two great walls, creating a dry path. The Israelites crossed safely, but when Pharaoh''s army followed, the waters closed upon them.',
'[{"surah": "Al-Araf", "ayah": "7:130-136", "text": "So We sent upon them the flood, locusts, lice, frogs, and blood as distinct signs."}, {"surah": "Ash-Shuara", "ayah": "26:61-67", "text": "Strike the sea with your staff. And it parted, each portion like a great mountain."}]',
'[{"collection": "Sahih Bukhari", "number": "2004", "text": "The Prophet (PBUH) fasted on the Day of Ashura and recommended fasting on it, saying Musa fasted it in gratitude for the Exodus."}]',
'No matter how powerful the oppressor, Allah''s plan will prevail — patience and trust in His timing are essential.',
'An army of chariots thundering behind them, an impassable sea before them, and a prophet who said with absolute certainty: "Indeed, my Lord is with me; He will guide me."',
'The Exodus from Egypt is commemorated in the Islamic tradition through the fasting of Ashura (10th Muharram).',
480, 5, true),

((SELECT id FROM prophets WHERE slug = 'musa'), 4, 'Mount Sinai and the Torah',
'After the miraculous crossing, Allah summoned Musa to Mount Sinai for forty nights. There, Allah spoke to him directly — a distinction unique among prophets, earning him the title Kalimullah. He received the Torah (Tawrat), containing guidance and light for the Children of Israel.

But while Musa was away, a man named As-Samiri led the people astray, fashioning a golden calf from their jewelry. When Musa returned and saw his people worshipping it, he was seized with grief and anger. He seized his brother Harun by the head, but Harun explained he had tried to stop them.

The incident of the golden calf became one of the greatest lessons in the Quran about the fickleness of human nature and the constant need for prophetic guidance.',
'[{"surah": "Al-Araf", "ayah": "7:142-145", "text": "We appointed for Musa thirty nights and perfected them with ten more."}, {"surah": "Ta-Ha", "ayah": "20:83-98", "text": "What made you hasten from your people, O Musa?"}]',
'[{"collection": "Sahih Bukhari", "number": "3408", "text": "Musa used to bathe alone, and the people accused him of having a skin defect, but Allah cleared him."}]',
'Brief absence from spiritual guidance can lead to deviation — the importance of continuous connection with divine guidance.',
'For forty nights, Musa stood in the presence of Allah on a mountain shrouded in light, receiving words that would shape the faith of millions.',
'The Torah given to Musa is considered one of the four major divine scriptures in Islam.',
420, 5, true),

((SELECT id FROM prophets WHERE slug = 'musa'), 5, 'Wandering, Wisdom, and Legacy',
'Despite being freed from Pharaoh, the Children of Israel proved to be a difficult people to guide. When commanded to enter the Holy Land, they refused out of cowardice, saying "Go, you and your Lord, and fight" (Quran 5:24). As a consequence, they were made to wander in the desert for forty years.

During this time, Musa encountered Al-Khidr, a servant of Allah endowed with special knowledge. Through three mysterious incidents — damaging a boat, killing a boy, and repairing a wall — Musa learned that divine wisdom operates beyond human comprehension. This profound encounter teaches us that our limited perspective cannot always grasp Allah''s plans.

Musa passed away before entering the Holy Land. The Prophet Muhammad (PBUH) said that at the time of death, Musa asked Allah to let him die as close to the Holy Land as a stone''s throw. His legacy as the most frequently mentioned prophet in the Quran speaks to his enduring importance.',
'[{"surah": "Al-Kahf", "ayah": "18:60-82", "text": "Musa said to his boy-servant: I will not cease until I reach the junction of the two seas."}, {"surah": "Al-Maidah", "ayah": "5:24-26", "text": "They said: O Musa, we will never enter it as long as they are within it."}]',
'[{"collection": "Sahih Bukhari", "number": "1339", "text": "The Prophet said: Were I there, I would show you the grave of Musa by the red sand hill."}]',
'True wisdom is recognizing the limits of our own understanding and trusting in Allah''s greater plan.',
'Even the greatest prophet to ever lead a nation discovered that there was knowledge beyond his own — and that humility before Allah''s wisdom is the highest station.',
'The encounter with Al-Khidr is one of the most philosophically rich passages in the Quran, explored extensively in Islamic scholarship.',
460, 5, true);

-- 15. Harun (Aaron)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('harun', 'Harun (Aaron)', 'هارون', 'The Minister and Helper', 'وزير موسى', 'Ancient Egypt', 20, 2, 10, 'teal', '#0D9488', '#CCFBF1', 'Users', 15, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'harun'), 1, 'The Eloquent Brother',
'Harun was the elder brother of Musa, known for his eloquence and gentle disposition. When Musa was called to prophethood, he asked Allah to make Harun his partner in the mission: "And appoint for me a minister from my family — Harun, my brother. Increase through him my strength and let him share my task" (Quran 20:29-32).

Allah granted this request, making Harun a prophet and Musa''s closest ally. Together they confronted Pharaoh, with Harun supporting his brother throughout the difficult mission in Egypt. The Prophet Muhammad (PBUH) drew a parallel to this relationship when he told Ali ibn Abi Talib: "You are to me as Harun was to Musa, except there is no prophet after me."',
'[{"surah": "Ta-Ha", "ayah": "20:29-36", "text": "And appoint for me a minister from my family - Harun, my brother."}, {"surah": "Maryam", "ayah": "19:53", "text": "And We gave him out of Our mercy his brother Harun as a prophet."}]',
'[{"collection": "Sahih Bukhari", "number": "3706", "text": "The Prophet said to Ali: You are to me as Harun was to Musa, except there is no prophet after me."}]',
'Supporting those who carry heavy responsibilities is itself a form of prophethood and service to Allah.',
'When Musa stood before the burning bush, his first thought was of his brother — a bond so strong that it became a model for all partnerships in faith.',
'Harun served as the spiritual leader of the Israelites during Musa''s absence on Mount Sinai.',
350, 4, true),

((SELECT id FROM prophets WHERE slug = 'harun'), 2, 'Guardian of the People',
'During Musa''s forty-night absence on Mount Sinai, Harun was left in charge. When As-Samiri led the people astray with the golden calf, Harun tried his best to stop them but was overwhelmed. He told Musa upon his return: "O son of my mother, indeed the people oppressed me and were about to kill me" (Quran 7:150).

This incident shows Harun''s difficult position — a gentle leader facing a rebellious mob. He chose preservation over confrontation, not wanting to cause a civil war among the Israelites. Musa initially reacted with anger toward his brother, but came to understand the impossible situation Harun had faced.

Harun passed away before Musa, and the Israelites mourned him greatly. His legacy teaches us about the vital role of compassion and support in leadership.',
'[{"surah": "Al-Araf", "ayah": "7:150-151", "text": "O son of my mother, do not seize me by my beard or my head."}, {"surah": "Ta-Ha", "ayah": "20:90-94", "text": "Harun had already told them: O my people, you are only being tested by it."}]',
'[{"collection": "Sahih Muslim", "number": "2404", "text": "Harun was beloved to the Israelites for his kindness."}]',
'Gentleness in leadership is not weakness — sometimes the compassionate path requires greater courage than the forceful one.',
'Alone before a mob that had turned from monotheism to idolatry in mere days, one man stood firm in his faith while trying to hold a nation together.',
'Harun''s gentle leadership style contrasted with Musa''s more forceful approach, showing that different styles of leadership serve different purposes.',
380, 4, true);

-- 16. Dhul-Kifl
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('dhul-kifl', 'Dhul-Kifl', 'ذو الكفل', 'The One of Double Portion', 'ذو الكفل', 'After Musa', 2, 1, 5, 'slate', '#475569', '#F1F5F9', 'Shield', 16, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'dhul-kifl'), 1, 'The Patient and Righteous',
'Dhul-Kifl is mentioned twice in the Quran alongside other great prophets: "And remember Isma''il and Idris and Dhul-Kifl; all were of the patient" (Quran 21:85). His name means "the one of the double portion" or "the one who guaranteed."

While specific details of his story are limited in the Quran, scholars believe he may be the biblical prophet Ezekiel, who prophesied among the exiled Israelites in Babylon. What the Quran emphasizes is his patience and righteousness — qualities that earned him mention alongside some of the greatest prophets.

His inclusion in the Quran teaches us that not every prophet''s story needs to be dramatic to be meaningful. Sometimes, steady patience and unwavering faith are the greatest miracles of all.',
'[{"surah": "Al-Anbiya", "ayah": "21:85-86", "text": "And Isma''il and Idris and Dhul-Kifl; all were of the patient."}, {"surah": "Sad", "ayah": "38:48", "text": "And remember Isma''il and Al-Yasa''a and Dhul-Kifl, and all are among the outstanding."}]',
'[{"collection": "Scholarly consensus", "number": "", "text": "Scholars differ on whether Dhul-Kifl was a prophet or a righteous man, but the majority opinion is that he was a prophet."}]',
'Quiet, persistent faithfulness is as praiseworthy as dramatic acts of devotion.',
'Among the prophets of patience and endurance, one name stands out for its mystery — Dhul-Kifl, whose very obscurity teaches us something profound.',
'Dhul-Kifl is one of the least detailed prophets in the Quran, reminding us that much of prophetic history remains known only to Allah.',
300, 5, true);

-- 17. Dawud (David)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('dawud', 'Dawud (David)', 'داود', 'The King-Prophet Who Received the Psalms', 'خليفة الله في الأرض', 'Kingdom of Israel', 16, 2, 12, 'amber', '#D97706', '#FEF3C7', 'Crown', 17, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'dawud'), 1, 'The Slayer of Jalut',
'Dawud first appears in the Quran as a young soldier in the army of Talut (Saul), the first king of Israel. When the giant warrior Jalut (Goliath) challenged the Israelites, it was young Dawud who stepped forward with nothing but a sling and unshakeable faith.

"So they defeated them by permission of Allah, and Dawud killed Jalut" (Quran 2:251). This victory was not through superior military might but through divine support and courage born of faith.

After this, Allah granted Dawud the kingdom, wisdom, and the Zabur (Psalms) — a scripture of beautiful praise and supplication. He was given a voice so beautiful that the mountains and birds would join him in glorifying Allah: "Indeed, We subjected the mountains to glorify with him in the evening and sunrise, and the birds, assembled; all were turning to him in praise" (Quran 38:18-19).',
'[{"surah": "Al-Baqarah", "ayah": "2:251", "text": "So they defeated them by permission of Allah, and Dawud killed Jalut."}, {"surah": "Sad", "ayah": "38:17-20", "text": "Be patient over what they say and remember Our servant Dawud, the possessor of strength."}]',
'[{"collection": "Sahih Bukhari", "number": "1131", "text": "The most beloved prayer to Allah was the prayer of Dawud: he used to sleep half the night, pray a third, and sleep a sixth."}]',
'True strength comes not from physical might but from faith in Allah — a shepherd boy defeated a giant because his trust was in the Almighty.',
'A boy with a sling stood before a giant in armor, and the heavens held their breath.',
'Dawud combined the roles of prophet and king, establishing a just kingdom that became the model of righteous governance.',
400, 5, true),

((SELECT id FROM prophets WHERE slug = 'dawud'), 2, 'The Just King and the Psalms',
'Dawud was not only a prophet but a just king and skilled craftsman. Allah taught him to make coats of armor from iron: "We made iron soft for him, saying: Make full coats of mail and measure the links well" (Quran 34:10-11).

He was known for his exceptional justice. The Quran relates how two disputants climbed over his chamber wall to test his judgment. One claimed the other had wronged him regarding his sheep. Dawud initially judged quickly but then realized he was being tested and "fell down bowing and turned in repentance" (Quran 38:24).

The Prophet Muhammad (PBUH) said Dawud''s fasting was the most beloved to Allah — he would fast every other day. His Psalms (Zabur) were recited with such beauty that creation itself responded. His son Sulayman would inherit his kingdom and be granted even greater miracles.',
'[{"surah": "Saba", "ayah": "34:10-11", "text": "We certainly gave Dawud from Us bounty. O mountains, repeat with him, and the birds."}, {"surah": "Sad", "ayah": "38:21-26", "text": "Has the news of the disputants come to you when they climbed over the wall of his prayer chamber?"}]',
'[{"collection": "Sahih Bukhari", "number": "1975", "text": "The most beloved fasting to Allah is the fasting of Dawud — he used to fast one day and break his fast the next."}]',
'Even prophets must remain vigilant against hasty judgment — true justice requires patience, reflection, and humility before Allah.',
'Mountains sang with him. Iron bent to his will. Birds gathered in chorus. Yet this mighty king still fell to his knees in repentance.',
'The Zabur (Psalms) given to Dawud is the third of the four major divine scriptures in Islam.',
380, 5, true);

-- 18. Sulayman (Solomon)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('sulayman', 'Sulayman (Solomon)', 'سليمان', 'King of Jinn and Men', 'ملك الجن والإنس', 'Kingdom of Israel', 17, 2, 12, 'violet', '#7C3AED', '#EDE9FE', 'Gem', 18, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'sulayman'), 1, 'A Kingdom Like No Other',
'Sulayman inherited the kingdom and prophethood of his father Dawud. But Allah granted him powers beyond any other ruler: he could command the wind, understand the language of animals, and had authority over the jinn.

When Sulayman heard an ant warning its colony: "O ants, enter your dwellings that you not be crushed by Sulayman and his soldiers while they perceive not" (Quran 27:18), he smiled and laughed, then prayed to Allah in gratitude. This small incident reveals enormous wisdom — a king powerful enough to command winds and jinn, yet humble enough to pause for an ant.

His kingdom was magnificent, with a palace whose floor was made of crystal so transparent that the Queen of Sheba mistook it for water. Yet Sulayman never attributed any of it to himself. He said: "This is from the favor of my Lord to test me whether I will be grateful or ungrateful" (Quran 27:40).',
'[{"surah": "An-Naml", "ayah": "27:16-19", "text": "Sulayman inherited Dawud. He said: O people, we have been taught the language of birds."}, {"surah": "An-Naml", "ayah": "27:40", "text": "This is from the favor of my Lord to test me whether I will be grateful or ungrateful."}]',
'[{"collection": "Sahih Bukhari", "number": "3424", "text": "Sulayman said: Tonight I will go around to seventy wives, and each will give birth to a knight who will fight in Allah''s cause."}]',
'The greatest test of power is gratitude — recognizing that every blessing is from Allah and could be taken away at any moment.',
'He spoke to birds, commanded the wind, and ruled over jinn and men — yet the most remarkable thing about Sulayman was his humility.',
'Sulayman''s kingdom represents the peak of Israelite civilization and is presented in the Quran as an example of power used righteously.',
420, 5, true),

((SELECT id FROM prophets WHERE slug = 'sulayman'), 2, 'The Queen of Sheba and Final Days',
'The most famous episode in Sulayman''s story involves the Queen of Sheba (Bilqis). When his hoopoe bird reported that the people of Sheba worshipped the sun, Sulayman sent a letter inviting the queen to submit to Allah.

Bilqis initially tried to send gifts, but Sulayman rejected them. She then came to visit, and Sulayman had her throne transported to him miraculously before her arrival. When she saw her own throne, altered slightly, she was tested. When she entered the crystal palace and lifted her skirts thinking the floor was water, she finally declared: "My Lord, indeed I have wronged myself, and I submit with Sulayman to Allah, Lord of the worlds" (Quran 27:44).

Sulayman''s death was itself a lesson. He died while leaning on his staff, and the jinn continued working, not realizing he had passed until a termite ate through the staff and his body fell. This showed that the jinn had no knowledge of the unseen.',
'[{"surah": "An-Naml", "ayah": "27:22-44", "text": "She was told: Enter the palace. But when she saw it, she thought it was a body of water."}, {"surah": "Saba", "ayah": "34:14", "text": "When We decreed his death, nothing indicated it to them except a creature of the earth eating his staff."}]',
'[{"collection": "Tafsir Ibn Kathir", "number": "", "text": "The story of Bilqis illustrates the power of dawah through wisdom rather than force."}]',
'True power lies in bringing others to truth through wisdom, not coercion — and even the most powerful beings have no knowledge of the unseen.',
'A queen who ruled a mighty kingdom traveled across the desert to meet a king unlike any the world had seen — and found something greater than power.',
'The Queen of Sheba''s conversion is one of the most celebrated examples of dawah through demonstration in the Quran.',
400, 5, true);

-- 19. Ilyas (Elijah)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('ilyas', 'Ilyas (Elijah)', 'إلياس', 'The Reformer', 'المصلح', 'Northern Kingdom of Israel', 3, 1, 5, 'rose', '#E11D48', '#FFE4E6', 'Zap', 19, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'ilyas'), 1, 'Standing Against Baal Worship',
'Ilyas was sent to the people of Baalbek (in modern-day Lebanon), who had fallen into worshipping the idol Baal. He called out to his people: "Will you not fear Allah? Do you call upon Baal and leave the best of creators — Allah, your Lord and the Lord of your first forefathers?" (Quran 37:124-126).

His people rejected his message, and only a small group believed. The Quran praises him among the righteous: "And indeed, Ilyas was from among the messengers. Peace be upon Ilyas. Indeed, We thus reward the doers of good. Indeed, he was of Our believing servants" (Quran 37:123-132).

Though his story in the Quran is brief, Ilyas represents every prophet who stood alone against a majority in idol worship — a reminder that truth does not require popular support.',
'[{"surah": "As-Saffat", "ayah": "37:123-132", "text": "And indeed, Ilyas was from among the messengers."}, {"surah": "Al-Anam", "ayah": "6:85", "text": "And Zakariyya and Yahya and Isa and Ilyas — all were of the righteous."}]',
'[{"collection": "Scholarly tradition", "number": "", "text": "Ilyas is identified with the biblical Elijah who confronted the prophets of Baal."}]',
'Standing for truth when everyone around you has abandoned it is the highest form of courage.',
'In a land where an entire nation bowed to a stone idol called Baal, one voice rose above the silence to speak the name of Allah.',
'Ilyas ministered during a period of severe idolatry in the northern kingdom of Israel.',
300, 5, true);

-- 20. Al-Yasa (Elisha)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('al-yasa', 'Al-Yasa'' (Elisha)', 'اليسع', 'The Successor', 'خليفة إلياس', 'Northern Kingdom of Israel', 2, 1, 5, 'cyan', '#0891B2', '#CFFAFE', 'ArrowUpRight', 20, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'al-yasa'), 1, 'The Chosen Successor',
'Al-Yasa'' is mentioned in the Quran as a prophet chosen among the best: "And Isma''il and Al-Yasa'' and Yunus and Lut — and all We preferred over the worlds" (Quran 6:86). He is also mentioned alongside Dhul-Kifl as being "among the outstanding" (Quran 38:48).

He continued the mission of Ilyas, calling the people of Israel back to the worship of Allah alone. While the Quran does not detail his specific story, his inclusion among the preferred prophets indicates his high station with Allah.

Al-Yasa'' teaches us that continuing the work of those who came before us — carrying forward their mission with dedication — is itself a great honor and responsibility.',
'[{"surah": "Al-Anam", "ayah": "6:86", "text": "And Isma''il and Al-Yasa'' and Yunus and Lut — and all of them We preferred over the worlds."}, {"surah": "Sad", "ayah": "38:48", "text": "And remember Isma''il and Al-Yasa'' and Dhul-Kifl, and all are among the outstanding."}]',
'[{"collection": "Scholarly tradition", "number": "", "text": "Al-Yasa'' is identified with the biblical Elisha, who succeeded Elijah."}]',
'Continuing and building upon the work of others is as noble as starting something new.',
'Sometimes the greatest heroes are not those who begin the mission, but those who carry it forward when the founder is gone.',
'Al-Yasa'' succeeded Ilyas in the prophetic mission to the northern Israelite tribes.',
250, 4, true);

-- 21. Yunus (Jonah)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('yunus', 'Yunus (Jonah)', 'يونس', 'The One of the Whale', 'صاحب الحوت', 'Nineveh (Assyria)', 4, 2, 10, 'sky', '#0284C7', '#E0F2FE', 'Fish', 21, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'yunus'), 1, 'Departure and the Belly of the Whale',
'Yunus was sent to the people of Nineveh, a city of over a hundred thousand people steeped in sin. When they rejected his message, Yunus left in anger before Allah had given him permission to depart. He boarded a ship, and when a terrible storm threatened to sink it, lots were cast to lighten the load. Yunus drew the short lot and was cast into the sea.

A great whale swallowed him whole. In the darkness of the whale''s belly — in the darkness of the sea, in the darkness of the night — Yunus cried out the prayer that would become one of the most powerful supplications in Islam: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers" (Quran 21:87).

This dua, known as the Dua of Yunus, is taught by the Prophet Muhammad (PBUH) as a prayer that will never go unanswered.',
'[{"surah": "Al-Anbiya", "ayah": "21:87-88", "text": "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers."}, {"surah": "As-Saffat", "ayah": "37:139-144", "text": "And indeed, Yunus was among the messengers. When he ran away to the laden ship."}]',
'[{"collection": "Jami at-Tirmidhi", "number": "3505", "text": "The Prophet (PBUH) said: The supplication of Dhun-Nun (Yunus) when he was in the belly of the whale... no Muslim ever prays with it for anything but Allah will answer him."}]',
'No darkness is so deep that sincere repentance cannot pierce through it — Allah''s mercy is always within reach.',
'In the deepest darkness imaginable — inside a whale, at the bottom of the sea, in the dead of night — a voice whispered a prayer that shook the heavens.',
'Nineveh was the capital of the Assyrian Empire, located in modern-day Iraq near Mosul.',
400, 5, true),

((SELECT id FROM prophets WHERE slug = 'yunus'), 2, 'Repentance and the Unique Nation',
'Allah heard Yunus''s prayer and commanded the whale to cast him onto the shore. He was ill and exhausted, so Allah caused a gourd plant to grow over him for shade and nourishment as he recovered.

But the most remarkable part of Yunus''s story is what happened to his people. After Yunus left, the people of Nineveh saw the signs of impending punishment and, unlike almost every other nation in the Quran, they actually repented. "Then why has there not been a city that believed so its faith benefited it except the people of Yunus? When they believed, We removed from them the torment of disgrace in worldly life" (Quran 10:98).

Yunus returned to find his entire city had embraced faith — over a hundred thousand people. They are the only nation in the Quran explicitly described as collectively repenting and being saved from punishment. The Prophet Muhammad (PBUH) advised against comparing himself to Yunus, showing the high status this prophet held.',
'[{"surah": "Yunus", "ayah": "10:98", "text": "Then why has there not been a city that believed so its faith benefited it except the people of Yunus?"}, {"surah": "As-Saffat", "ayah": "37:145-148", "text": "And We sent him to a hundred thousand or more. And they believed, so We gave them enjoyment for a time."}]',
'[{"collection": "Sahih Bukhari", "number": "3413", "text": "The Prophet (PBUH) said: It is not fitting for a slave of Allah to say I am better than Yunus ibn Matta."}]',
'It is never too late for a community to turn back to Allah — sincere collective repentance can avert even decreed punishment.',
'They are the only city in the entire Quran that believed as one — a hundred thousand souls turning to Allah in a single moment of collective awakening.',
'The people of Yunus represent the only community in the Quran that repented collectively and were saved.',
380, 5, true);

-- 22. Zakariyya (Zechariah)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('zakariyya', 'Zakariyya (Zechariah)', 'زكريا', 'The Devoted Servant', 'العابد الخاشع', 'Jerusalem', 7, 1, 8, 'indigo', '#4F46E5', '#E0E7FF', 'Heart', 22, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'zakariyya'), 1, 'The Prayer of an Aging Prophet',
'Zakariyya was an elderly prophet who served in the temple in Jerusalem. He was the guardian of Maryam (Mary), and every time he entered her chamber, he found provision already there. When he asked where it came from, she replied: "It is from Allah. Indeed, Allah provides for whom He wills without account" (Quran 3:37).

Inspired by this miracle, Zakariyya raised his hands in a prayer that the Quran records with tender beauty: "My Lord, indeed my bones have weakened, and my head has filled with white hair, and never have I been in my supplication to You, my Lord, unhappy" (Quran 19:4). He asked for an heir who would carry on the prophetic legacy.

Despite his advanced age and his wife''s barrenness, Allah answered: "O Zakariyya, indeed We give you good tidings of a boy whose name will be Yahya. We have not assigned to any before him that name" (Quran 19:7). As a sign, Zakariyya was unable to speak for three days except through gestures. His son Yahya would become one of the most righteous prophets.',
'[{"surah": "Maryam", "ayah": "19:2-11", "text": "O Zakariyya, indeed We give you good tidings of a boy whose name will be Yahya."}, {"surah": "Al-Imran", "ayah": "3:37-41", "text": "Every time Zakariyya entered upon her in the prayer chamber, he found with her provision."}]',
'[{"collection": "Sahih Bukhari", "number": "3428", "text": "The Prophet (PBUH) mentioned Zakariyya as one of the prophets."}]',
'No prayer is too late, no request too impossible when directed to the One who created possibility itself.',
'An old man with white hair and weakened bones stood in his prayer chamber and asked Allah for the impossible — and Allah said yes.',
'Zakariyya served during the period of the Second Temple in Jerusalem, shortly before the time of Isa.',
400, 5, true);

-- 23. Yahya (John the Baptist)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('yahya', 'Yahya (John)', 'يحيى', 'The First of His Name', 'الحصور', 'Jerusalem', 5, 1, 6, 'lime', '#65A30D', '#ECFCCB', 'Leaf', 23, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'yahya'), 1, 'Wisdom Given as a Child',
'Yahya was unique among prophets in many ways. His very name was unprecedented — "We have not assigned to any before him that name" (Quran 19:7). He was given prophethood as a child: "O Yahya, take the Scripture with determination. And We gave him judgment while yet a boy" (Quran 19:12).

The Quran describes him with beautiful attributes: compassionate toward his parents, not arrogant or disobedient, and blessed with peace on the day of his birth, the day of his death, and the day he will be raised alive.

Yahya confirmed the coming of Isa (Jesus) and called his people to righteousness. He was known for his asceticism, devotion, and purity. The Prophet Muhammad (PBUH) met him during the Night Journey in the second heaven alongside his cousin Isa. His martyrdom — tradition holds he was killed by a tyrant ruler — made him one of the most honored prophets in Islamic tradition.',
'[{"surah": "Maryam", "ayah": "19:12-15", "text": "O Yahya, take the Scripture with determination. And We gave him judgment while yet a boy."}, {"surah": "Al-Imran", "ayah": "3:39", "text": "Allah gives you good tidings of Yahya, confirming a word from Allah, and a leader and chaste."}]',
'[{"collection": "Sahih Bukhari", "number": "3259", "text": "During the Night Journey, the Prophet met Yahya and Isa in the second heaven."}]',
'True greatness begins with devotion to Allah from the earliest age — wisdom is not reserved for the old.',
'He was given a name no one had ever borne, wisdom before he could grow a beard, and a mission that would prepare the world for a miraculous birth.',
'Yahya lived just before and during the early life of Isa (Jesus), preparing people for his message.',
350, 5, true);

-- 24. Isa (Jesus)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('isa', 'Isa (Jesus)', 'عيسى', 'The Messiah, Word of Allah', 'المسيح كلمة الله', 'Palestine', 25, 3, 18, 'sky', '#0369A1', '#BAE6FD', 'Sparkles', 24, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'isa'), 1, 'The Miraculous Birth',
'The story of Isa begins with his mother Maryam — the only woman mentioned by name in the Quran, with an entire surah named after her. She was a devout woman who secluded herself in worship. The angel Jibreel appeared to her in human form and announced: "I am only the messenger of your Lord to give you a pure boy" (Quran 19:19).

Maryam was astonished: "How can I have a boy while no man has touched me and I have not been unchaste?" The angel replied: "Thus it will be; your Lord says, It is easy for Me, and We will make him a sign to the people and a mercy from Us" (Quran 19:20-21).

She withdrew to a remote place and gave birth alone, enduring tremendous physical and emotional pain. When she returned to her people carrying the baby, they accused her. But the infant Isa spoke from the cradle: "Indeed, I am the servant of Allah. He has given me the Scripture and made me a prophet" (Quran 19:30). This was his first miracle.',
'[{"surah": "Maryam", "ayah": "19:16-34", "text": "She said: How can I have a boy while no man has touched me?"}, {"surah": "Al-Imran", "ayah": "3:45-47", "text": "O Maryam, indeed Allah gives you good tidings of a word from Him, whose name will be the Messiah, Isa."}]',
'[{"collection": "Sahih Bukhari", "number": "3436", "text": "The Prophet said: Both in this world and in the Hereafter, I am the nearest of all people to Isa."}]',
'Allah''s power transcends natural laws — He says "Be" and it is. The birth of Isa is a reminder that nothing is impossible for the Creator.',
'A young woman alone, in labor beneath a palm tree, cried out in anguish — and then a newborn baby spoke words that would echo through eternity.',
'Isa''s birth without a father is presented in the Quran as comparable to the creation of Adam — both were acts of divine will.',
450, 6, true),

((SELECT id FROM prophets WHERE slug = 'isa'), 2, 'Miracles and Message',
'Isa was granted extraordinary miracles: he healed the blind and the leper, raised the dead by Allah''s permission, and fashioned a bird from clay and breathed life into it. Yet he always attributed every miracle to Allah: "I do not tell you that I have the depositories of Allah or that I know the unseen, nor do I tell you that I am an angel" (Quran 6:50).

His message was fundamentally one of tawhid — pure monotheism. He came to confirm the Torah and to make lawful some of what had been forbidden to the Children of Israel. He gathered twelve disciples (hawariyyun) who pledged to be Allah''s helpers.

The Quran is emphatic about his nature: "The Messiah, Isa, the son of Maryam, was but a messenger of Allah and His word which He directed to Maryam and a soul from Him" (Quran 4:171). He was not divine, nor the son of God, but one of the greatest prophets ever sent to humanity.',
'[{"surah": "Al-Imran", "ayah": "3:49", "text": "I heal the blind and the leper, and I give life to the dead — by permission of Allah."}, {"surah": "An-Nisa", "ayah": "4:171", "text": "The Messiah, Isa, son of Maryam, was but a messenger of Allah and His word."}]',
'[{"collection": "Sahih Muslim", "number": "2365", "text": "The Prophet said: I am closest to Isa son of Maryam in this life and the next."}]',
'Every gift and ability we have comes from Allah — true greatness lies in attributing all power back to the Source.',
'He gave sight to the blind, life to the dead, and form to clay — yet his greatest miracle was his unwavering humility before Allah.',
'Isa''s ministry lasted approximately three years according to most scholars.',
400, 5, true),

((SELECT id FROM prophets WHERE slug = 'isa'), 3, 'Ascension and Return',
'When the enemies of Isa plotted to crucify him, Allah saved him in a manner that confounded them: "They did not kill him, nor did they crucify him; but it was made to appear so to them" (Quran 4:157). Instead, Allah raised Isa to Himself, alive and honored.

This is one of the key theological differences between Islam and Christianity. In Islamic belief, Isa was neither killed nor crucified — he was raised to the heavens and will return before the Day of Judgment. The Prophet Muhammad (PBUH) described his return: he will descend near a white minaret in Damascus, will break the cross, kill the swine, and establish justice on earth.

During the Night Journey (Isra and Mi''raj), Prophet Muhammad met Isa in the second heaven alongside Yahya. Isa''s story in Islam is one of the most beautiful — he represents the perfect servant of Allah, a miraculous sign, and a promise of return that Muslims await with faith.',
'[{"surah": "An-Nisa", "ayah": "4:157-158", "text": "They did not kill him, nor did they crucify him; but it was made to appear so to them."}, {"surah": "Az-Zukhruf", "ayah": "43:61", "text": "And indeed, Isa will be a sign for the Hour, so be not in doubt of it."}]',
'[{"collection": "Sahih Muslim", "number": "155", "text": "By the One in whose hand is my soul, Isa son of Maryam will descend among you as a just judge."}]',
'The story of Isa reminds us that Allah''s plan always prevails — apparent defeat can be ultimate victory, and the truth will always return.',
'They thought they had silenced him forever. But the man they sought to kill was lifted to the heavens, alive — and he is coming back.',
'The return of Isa is one of the major signs of the Day of Judgment in Islamic eschatology.',
400, 5, true);

-- 25. Muhammad (PBUH)
INSERT INTO prophets (slug, name_en, name_ar, title_en, title_ar, era, quran_mentions, total_parts, estimated_read_time_minutes, color_theme, theme_primary, theme_secondary, icon, display_order, is_published)
VALUES ('muhammad', 'Muhammad (PBUH)', 'محمد ﷺ', 'The Seal of the Prophets', 'خاتم الأنبياء والمرسلين', 'Makkah and Madinah', 4, 5, 30, 'emerald', '#059669', '#D1FAE5', 'Star', 25, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO prophet_stories (prophet_id, part_number, title_en, content_en, quran_references, hadith_references, key_lesson, opening_hook, historical_context, word_count, estimated_read_minutes, is_published)
VALUES
((SELECT id FROM prophets WHERE slug = 'muhammad'), 1, 'The Orphan of Makkah',
'Muhammad (PBUH) was born in the Year of the Elephant (570 CE) in Makkah, into the noble tribe of Quraysh, the clan of Banu Hashim. His father Abdullah died before his birth, and his mother Aminah passed away when he was just six years old. Raised first by his grandfather Abdul Muttalib and then by his uncle Abu Talib, he grew up as an orphan — a fact the Quran later references: "Did He not find you an orphan and give you refuge?" (Quran 93:6).

Known as As-Sadiq Al-Amin (The Truthful, The Trustworthy) even before prophethood, Muhammad excelled in character and honesty. At age 25, he married Khadijah bint Khuwaylid, a successful businesswoman 15 years his senior, who would become his greatest supporter.

He used to retreat to the Cave of Hira on Mount Nur for contemplation. It was there, at age 40, that the Angel Jibreel appeared and commanded: "Read! In the name of your Lord who created" (Quran 96:1). These were the first words of the Quran, and they changed the course of human history.',
'[{"surah": "Ad-Duha", "ayah": "93:6-8", "text": "Did He not find you an orphan and give you refuge?"}, {"surah": "Al-Alaq", "ayah": "96:1-5", "text": "Read! In the name of your Lord who created."}]',
'[{"collection": "Sahih Bukhari", "number": "3", "text": "The commencement of divine revelation to the Prophet was in the form of good dreams which came true like bright daylight."}]',
'The greatest messenger in human history began as an orphan — a reminder that Allah raises whom He wills, regardless of worldly circumstances.',
'In a cave above a sleeping city, in the silence of the night, an angel appeared to an unlettered man and spoke the words that would transform civilization.',
'Pre-Islamic Arabia was in a state of jahiliyyah (ignorance), with tribal warfare, idol worship, and social injustice as the norm.',
480, 6, true),

((SELECT id FROM prophets WHERE slug = 'muhammad'), 2, 'The Makkan Struggle',
'The early years of prophethood were marked by intense persecution. When Muhammad (PBUH) began preaching openly, the Quraysh responded with ridicule, then threats, then violence. His followers were tortured — Bilal was placed under scorching rocks, Sumayyah became the first martyr of Islam, and the early Muslims endured years of social boycott.

Despite this, the message spread. The conversion of Umar ibn Al-Khattab and Hamzah ibn Abdul Muttalib strengthened the small community. But the loss of Khadijah and Abu Talib in the same year — the Year of Sorrow — left the Prophet deeply grieved.

It was during this darkest period that Allah granted him the Isra and Mi''raj — the miraculous Night Journey from Makkah to Jerusalem and then through the seven heavens. There he met previous prophets, received the command of five daily prayers, and was shown signs that reinforced his mission. When persecution became unbearable, the Prophet authorized his followers to emigrate to Madinah, and he himself followed, marking the beginning of the Islamic calendar.',
'[{"surah": "Al-Isra", "ayah": "17:1", "text": "Exalted is He who took His Servant by night from the Sacred Mosque to the Farthest Mosque."}, {"surah": "At-Tawbah", "ayah": "9:40", "text": "If you do not aid the Prophet, Allah has already aided him when those who disbelieved drove him out."}]',
'[{"collection": "Sahih Bukhari", "number": "3887", "text": "When Abu Talib died, the Prophet said: I will keep asking forgiveness for you unless I am forbidden."}]',
'The darkest moments often precede the greatest breakthroughs — patience in adversity is the hallmark of true faith.',
'For thirteen years, a man and his small band of followers endured everything the most powerful tribe in Arabia could inflict — and they never broke.',
'The Makkan period lasted 13 years (610-622 CE), during which the Quran was revealed gradually.',
450, 6, true),

((SELECT id FROM prophets WHERE slug = 'muhammad'), 3, 'Building a Civilization in Madinah',
'The Hijrah to Madinah was not an escape but a strategic migration that would establish the first Islamic state. The Prophet (PBUH) immediately began building a community: he constructed the first mosque (Masjid an-Nabawi), established the brotherhood between the Muhajirun (emigrants) and Ansar (helpers), and drafted the Constitution of Madinah — one of history''s first documents establishing rights for a multi-faith society.

The early years in Madinah saw the defining battles of Islam. At Badr, 313 ill-equipped Muslims faced over 1,000 Qurayshi warriors and won decisively with divine aid. At Uhud, the Muslims suffered setbacks but learned crucial lessons about obedience. The Battle of the Trench saw the entire Arabian Peninsula unite against Madinah, only to be repelled by strategy and faith.

Throughout these years, the Quran continued to be revealed, addressing the growing community''s needs — laws of inheritance, marriage, commerce, justice, and governance. Islam was becoming not just a faith but a complete way of life.',
'[{"surah": "Al-Anfal", "ayah": "8:17", "text": "You did not kill them, but it was Allah who killed them. And you did not throw when you threw, but it was Allah who threw."}, {"surah": "Al-Ahzab", "ayah": "33:9-11", "text": "O you who have believed, remember the favor of Allah upon you when armies came to you."}]',
'[{"collection": "Sahih Bukhari", "number": "3905", "text": "When the Prophet arrived in Madinah, the people came out in joy, and the young girls sang."}]',
'Building a just society requires both spiritual conviction and practical wisdom — Islam addresses the soul and the community equally.',
'From a small oasis town, a civilization was born that would stretch from Spain to China within a century.',
'The Madinan period (622-632 CE) saw the establishment of Islamic law, governance, and social institutions.',
450, 6, true),

((SELECT id FROM prophets WHERE slug = 'muhammad'), 4, 'The Conquest of Makkah',
'In the eighth year of Hijrah, the Prophet (PBUH) marched toward Makkah with 10,000 followers. The city that had tortured, boycotted, and expelled him now lay before him. Yet his entry was marked by humility — he bowed his head so low on his mount that it nearly touched the saddle, glorifying Allah.

He entered the Kaaba and destroyed the 360 idols within it, reciting: "Truth has come, and falsehood has departed. Indeed, falsehood is ever bound to depart" (Quran 17:81). Then came his greatest act of mercy. Standing before the Quraysh who had persecuted him for over twenty years, he asked: "What do you think I will do with you?" They replied: "Good. You are a noble brother, son of a noble brother." He declared: "Go, for you are free."

No vengeance, no retribution, no forced conversions. This act of mercy — unprecedented in the annals of conquest — led to the mass acceptance of Islam throughout Arabia. Delegations came from every corner of the peninsula, and the religion that had begun with one man in a cave now encompassed an entire civilization.',
'[{"surah": "Al-Isra", "ayah": "17:81", "text": "And say: Truth has come, and falsehood has departed. Indeed, falsehood is ever bound to depart."}, {"surah": "An-Nasr", "ayah": "110:1-3", "text": "When the victory of Allah has come and the conquest, and you see the people entering into the religion of Allah in multitudes."}]',
'[{"collection": "Sahih Bukhari", "number": "4280", "text": "On the day of the conquest of Makkah, the Prophet entered while lowering his head in humility."}]',
'The highest form of strength is mercy in the moment of power — forgiveness conquers hearts more surely than any sword.',
'The most powerful man in Arabia stood before his lifelong enemies — the people who had driven him from his home, killed his companions, and plotted his assassination — and he forgave them all.',
'The conquest of Makkah in 630 CE (8 AH) was achieved almost entirely without bloodshed.',
480, 6, true),

((SELECT id FROM prophets WHERE slug = 'muhammad'), 5, 'The Farewell and the Seal',
'In the tenth year of Hijrah, the Prophet (PBUH) performed his final pilgrimage — the Hajjat al-Wada. Standing on the plain of Arafat before more than 100,000 followers, he delivered what would be his last major sermon:

"O people, your blood and your property are inviolable... All mankind is from Adam and Eve. An Arab has no superiority over a non-Arab, nor does a non-Arab have any superiority over an Arab; a white has no superiority over a black, nor does a black have any superiority over a white — except by piety and good action."

These words, spoken fourteen centuries ago, remain among the most powerful statements of human equality ever uttered. Shortly after, the final verse of the Quran was revealed: "This day I have perfected for you your religion and completed My favor upon you and have approved for you Islam as religion" (Quran 5:3).

The Prophet (PBUH) passed away on the 12th of Rabi al-Awwal, 11 AH (632 CE), in the arms of Aisha. Abu Bakr addressed the grief-stricken community: "Whoever worshipped Muhammad, know that Muhammad has died. But whoever worshipped Allah, know that Allah is Alive and will never die."

His legacy endures in over 1.8 billion hearts. The Quran he received remains unchanged. The sunnah he established continues to guide. He was, as Allah described him, "a mercy to all the worlds" (Quran 21:107).',
'[{"surah": "Al-Maidah", "ayah": "5:3", "text": "This day I have perfected for you your religion and completed My favor upon you."}, {"surah": "Al-Anbiya", "ayah": "21:107", "text": "And We have not sent you except as a mercy to the worlds."}, {"surah": "Al-Ahzab", "ayah": "33:40", "text": "Muhammad is not the father of any of your men, but the Messenger of Allah and the seal of the prophets."}]',
'[{"collection": "Sahih Muslim", "number": "1218", "text": "The Prophet delivered the Farewell Sermon at Arafat during the Farewell Pilgrimage."}]',
'The final prophet''s legacy is not a dynasty or an empire, but a message of mercy, equality, and submission to the One God — a message that continues to transform lives.',
'On a sun-scorched plain, surrounded by more than a hundred thousand souls, a man spoke his final public words — and they contained a vision of human dignity that the world is still struggling to achieve.',
'The Farewell Pilgrimage of 632 CE remains the model for Hajj, with over 2 million Muslims performing it annually.',
500, 7, true);
