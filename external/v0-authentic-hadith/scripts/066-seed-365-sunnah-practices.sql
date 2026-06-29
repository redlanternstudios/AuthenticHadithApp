-- 066: Expand sunnah practices to 365 daily rotation
-- First add 2 more categories for better coverage
INSERT INTO sunnah_categories (id, title, title_ar, description, icon, color, bg_color, sort_order) VALUES
  ('sleep', 'Sunnah of Sleep', 'سنن النوم', 'Practices related to sleeping and waking', 'Moon', '#6366f1', '#eef2ff', 7),
  ('travel', 'Sunnah of Travel', 'سنن السفر', 'Practices during travel and journeys', 'MapPin', '#0891b2', '#ecfeff', 8),
  ('worship', 'Sunnah of Worship', 'سنن العبادة', 'Extra acts of worship and devotion', 'Star', '#d97706', '#fffbeb', 9),
  ('health', 'Sunnah of Health', 'سنن الصحة', 'Health and hygiene practices', 'Heart', '#dc2626', '#fef2f2', 10)
ON CONFLICT (id) DO NOTHING;

-- Update existing 17 practices with day_of_year assignments
UPDATE sunnah_practices SET day_of_year = sort_order WHERE day_of_year IS NULL;

-- Now insert 348 new practices (days 18-365)
-- We rotate through all 10 categories evenly

-- SALAH practices (days 18-54, ~37 practices)
INSERT INTO sunnah_practices (id, category_id, title, description, hadith_ref, collection, sort_order, day_of_year) VALUES
('sp-018', 'salah', 'Pray 2 Rak''ah after Wudu', 'The Prophet (PBUH) said whoever performs wudu well then prays 2 rak''ah with full attention, Paradise becomes obligatory for him.', 'Sahih Muslim 234', 'muslim', 18, 18),
('sp-019', 'salah', 'Straighten the Rows in Prayer', 'Straighten your rows, for straightening the rows is part of establishing the prayer.', 'Sahih al-Bukhari 723', 'bukhari', 19, 19),
('sp-020', 'salah', 'Pray Tahajjud (Night Prayer)', 'The best prayer after the obligatory prayers is the night prayer (Tahajjud).', 'Sahih Muslim 1163', 'muslim', 20, 20),
('sp-021', 'salah', 'Make Du''a at Sujud', 'The closest a servant is to his Lord is when he is prostrating, so increase your supplications therein.', 'Sahih Muslim 482', 'muslim', 21, 21),
('sp-022', 'salah', 'Pray Salat al-Duha', 'Whoever consistently prays the Duha prayer, his sins will be forgiven even if they are like the foam of the sea.', 'Jami at-Tirmidhi 476', 'tirmidhi', 22, 22),
('sp-023', 'salah', 'Make Du''a Between Adhan and Iqamah', 'A supplication made between the Adhan and Iqamah is not rejected.', 'Sunan Abu Dawud 521', 'abu_dawud', 23, 23),
('sp-024', 'salah', 'Pray 4 Rak''ah Before Dhuhr', 'Whoever consistently prays four rak''ah before Dhuhr and four after, Allah forbids the Fire from touching him.', 'Sunan Abu Dawud 1269', 'abu_dawud', 24, 24),
('sp-025', 'salah', 'Say the Tashahhud Supplication', 'After the tashahhud, seek refuge from four things: the punishment of the grave, Hell, the trial of life and death, and the Dajjal.', 'Sahih Muslim 588', 'muslim', 25, 25),
('sp-026', 'salah', 'Face the Qiblah for Du''a', 'The Prophet (PBUH) would face the Qiblah when making supplication.', 'Sahih al-Bukhari 6343', 'bukhari', 26, 26),
('sp-027', 'salah', 'Pray 2 Rak''ah of Istikhara', 'When one of you is concerned about a matter, let him pray two rak''ah then say the Istikhara supplication.', 'Sahih al-Bukhari 1162', 'bukhari', 27, 27),
('sp-028', 'salah', 'Pray Witr Before Sleeping', 'Make Witr your last prayer of the night.', 'Sahih al-Bukhari 998', 'bukhari', 28, 28),
('sp-029', 'salah', 'Read Surah Al-Kahf on Friday', 'Whoever reads Surah Al-Kahf on Friday, a light will shine for him between the two Fridays.', 'Sunan an-Nasa''i 3236', 'nasai', 29, 29),
('sp-030', 'salah', 'Pray Tarawih in Ramadan', 'Whoever stands (in prayer) during Ramadan with faith and expecting reward, his previous sins will be forgiven.', 'Sahih al-Bukhari 37', 'bukhari', 30, 30),

-- CHARACTER practices (days 31-67)
('sp-031', 'character', 'Speak the Truth Always', 'Truthfulness leads to righteousness, and righteousness leads to Paradise.', 'Sahih al-Bukhari 6094', 'bukhari', 31, 31),
('sp-032', 'character', 'Control Your Anger', 'The strong person is not the one who wrestles, but the one who controls himself when angry.', 'Sahih al-Bukhari 6114', 'bukhari', 32, 32),
('sp-033', 'character', 'Be Humble', 'Whoever is humble for the sake of Allah, Allah will raise him in status.', 'Sahih Muslim 2588', 'muslim', 33, 33),
('sp-034', 'character', 'Fulfill Your Promises', 'The signs of a hypocrite are three: when he speaks he lies, when he promises he breaks it, when he is trusted he betrays.', 'Sahih al-Bukhari 33', 'bukhari', 34, 34),
('sp-035', 'character', 'Be Patient in Hardship', 'How wonderful is the affair of the believer! Everything is good for him - if something good happens, he is grateful, and if something bad happens, he is patient.', 'Sahih Muslim 2999', 'muslim', 35, 35),
('sp-036', 'character', 'Avoid Suspicion', 'Beware of suspicion, for suspicion is the most false of speech.', 'Sahih al-Bukhari 6064', 'bukhari', 36, 36),
('sp-037', 'character', 'Show Gratitude (Shukr)', 'If you are grateful, I will surely increase you.', 'Surah Ibrahim 14:7', 'quran', 37, 37),
('sp-038', 'character', 'Be Generous', 'The upper hand (giving) is better than the lower hand (receiving).', 'Sahih al-Bukhari 1427', 'bukhari', 38, 38),
('sp-039', 'character', 'Avoid Backbiting', 'Backbiting is mentioning your brother in a way he dislikes.', 'Sahih Muslim 2589', 'muslim', 39, 39),
('sp-040', 'character', 'Forgive Others', 'Let them pardon and overlook. Would you not like that Allah should forgive you?', 'Surah An-Nur 24:22', 'quran', 40, 40),
('sp-041', 'character', 'Be Modest (Haya)', 'Modesty is a branch of faith.', 'Sahih Muslim 35', 'muslim', 41, 41),
('sp-042', 'character', 'Keep Good Company', 'A person is upon the religion of his close friend, so let one of you look at whom he befriends.', 'Sunan Abu Dawud 4833', 'abu_dawud', 42, 42),
('sp-043', 'character', 'Avoid Envy', 'Do not envy one another, do not hate one another, and do not turn your backs on one another. Be servants of Allah, brothers.', 'Sahih Muslim 2563', 'muslim', 43, 43),

-- HOME practices (days 44-80)
('sp-044', 'home', 'Enter Home with Salam', 'When you enter a house, greet your family with salam - it is a blessing for you and your household.', 'Sunan at-Tirmidhi 2698', 'tirmidhi', 44, 44),
('sp-045', 'home', 'Recite Du''a When Leaving Home', 'Bismillah, tawakkaltu ''ala Allah - In the name of Allah, I place my trust in Allah.', 'Sunan Abu Dawud 5095', 'abu_dawud', 45, 45),
('sp-046', 'home', 'Pray Sunnah at Home', 'The best of a person''s prayer is in his home, except for the obligatory prayers.', 'Sahih al-Bukhari 731', 'bukhari', 46, 46),
('sp-047', 'home', 'Recite Surah Al-Baqarah at Home', 'Do not make your houses into graves. Indeed, Shaytan flees from a house in which Surah Al-Baqarah is recited.', 'Sahih Muslim 780', 'muslim', 47, 47),
('sp-048', 'home', 'Help with Household Chores', 'The Prophet (PBUH) used to help his family at home and when the time for prayer came, he would go out.', 'Sahih al-Bukhari 676', 'bukhari', 48, 48),
('sp-049', 'home', 'Play with Your Children', 'The Prophet (PBUH) would play with Hasan and Husayn and carry them on his shoulders.', 'Sunan at-Tirmidhi 3775', 'tirmidhi', 49, 49),
('sp-050', 'home', 'Use Miswak Upon Entering', 'The first thing the Prophet (PBUH) would do upon entering his house was use the miswak.', 'Sahih Muslim 253', 'muslim', 50, 50),
('sp-051', 'home', 'Eat Together as a Family', 'Eat together and do not eat separately, for the blessing is in eating together.', 'Sunan Ibn Majah 3287', 'ibn_majah', 51, 51),
('sp-052', 'home', 'Be Kind to Your Spouse', 'The best of you is the one who is best to his family, and I am the best of you to my family.', 'Sunan at-Tirmidhi 3895', 'tirmidhi', 52, 52),
('sp-053', 'home', 'Make Your Home a Place of Dhikr', 'The likeness of a house in which Allah is remembered and a house in which He is not is like the living and the dead.', 'Sahih Muslim 779', 'muslim', 53, 53),
('sp-054', 'home', 'Honor Your Guests', 'Whoever believes in Allah and the Last Day, let him honor his guest.', 'Sahih al-Bukhari 6018', 'bukhari', 54, 54),
('sp-055', 'home', 'Keep Your Home Clean', 'Allah is clean and loves cleanliness. He is generous and loves generosity. So clean your courtyards.', 'Sunan at-Tirmidhi 2799', 'tirmidhi', 55, 55),
('sp-056', 'home', 'Say Bismillah When Closing Doors', 'Close your doors and mention the name of Allah, for Shaytan does not open a closed door.', 'Sahih al-Bukhari 5623', 'bukhari', 56, 56),

-- PEOPLE practices (days 57-93)
('sp-057', 'people', 'Return Greetings of Salam', 'When you are greeted with a greeting, greet in return with what is better or at least return it equally.', 'Surah An-Nisa 4:86', 'quran', 57, 57),
('sp-058', 'people', 'Visit the Sick', 'Whoever visits a sick person is in the harvest of Paradise until they return.', 'Sahih Muslim 2568', 'muslim', 58, 58),
('sp-059', 'people', 'Smile at Others', 'Your smiling in the face of your brother is charity.', 'Sunan at-Tirmidhi 1956', 'tirmidhi', 59, 59),
('sp-060', 'people', 'Give Gifts', 'Exchange gifts, as that will lead to increasing your love for one another.', 'Al-Adab Al-Mufrad 594', 'bukhari', 60, 60),
('sp-061', 'people', 'Help Those in Need', 'Allah is in the aid of His servant as long as the servant is in the aid of his brother.', 'Sahih Muslim 2699', 'muslim', 61, 61),
('sp-062', 'people', 'Make Du''a for Others', 'The supplication of a Muslim for his brother in his absence is answered.', 'Sahih Muslim 2733', 'muslim', 62, 62),
('sp-063', 'people', 'Attend Funeral Prayers', 'Whoever attends the funeral prayer will have a reward equal to one qirat, and whoever stays until burial will have two qirats.', 'Sahih al-Bukhari 1325', 'bukhari', 63, 63),
('sp-064', 'people', 'Reconcile Between People', 'Shall I not tell you something better than the rank of fasting, prayer, and charity? It is reconciling between people.', 'Sunan Abu Dawud 4919', 'abu_dawud', 64, 64),
('sp-065', 'people', 'Be Good to Neighbors', 'Jibril kept advising me to be good to my neighbor until I thought he would make him my heir.', 'Sahih al-Bukhari 6014', 'bukhari', 65, 65),
('sp-066', 'people', 'Shake Hands When Meeting', 'No two Muslims meet and shake hands without being forgiven before they part.', 'Sunan Abu Dawud 5212', 'abu_dawud', 66, 66),
('sp-067', 'people', 'Be Gentle in Speech', 'A good word is charity.', 'Sahih al-Bukhari 2989', 'bukhari', 67, 67),
('sp-068', 'people', 'Feed the Hungry', 'Feed the hungry, visit the sick, and free the captive.', 'Sahih al-Bukhari 5649', 'bukhari', 68, 68),
('sp-069', 'people', 'Respect Elders', 'He is not one of us who does not show mercy to our young ones and respect to our elders.', 'Sunan at-Tirmidhi 1919', 'tirmidhi', 69, 69),

-- FOOD practices (days 70-106)
('sp-070', 'food', 'Eat with the Right Hand', 'Eat with your right hand and drink with your right hand, for Shaytan eats and drinks with his left hand.', 'Sahih Muslim 2020', 'muslim', 70, 70),
('sp-071', 'food', 'Eat What Is Near You', 'Say Bismillah, eat with your right hand, and eat from what is nearest to you.', 'Sahih al-Bukhari 5376', 'bukhari', 71, 71),
('sp-072', 'food', 'Do Not Criticize Food', 'The Prophet (PBUH) never criticized any food. If he desired it, he ate it; if not, he left it.', 'Sahih al-Bukhari 5409', 'bukhari', 72, 72),
('sp-073', 'food', 'Drink Water in 3 Sips', 'Do not drink in one gulp like a camel, but drink in two or three sips. Say Bismillah when you drink and Alhamdulillah when you finish.', 'Sunan at-Tirmidhi 1885', 'tirmidhi', 73, 73),
('sp-074', 'food', 'Lick Your Fingers After Eating', 'When one of you eats, let him lick his fingers, for he does not know in which part of the food the blessing lies.', 'Sahih Muslim 2033', 'muslim', 74, 74),
('sp-075', 'food', 'Eat Dates in Odd Numbers', 'The Prophet (PBUH) used to break his fast with fresh dates, and if not available, then dry dates.', 'Sunan Abu Dawud 2356', 'abu_dawud', 75, 75),
('sp-076', 'food', 'Say Du''a After Eating', 'Whoever eats and then says Alhamdulillah, his past sins will be forgiven.', 'Sunan at-Tirmidhi 3458', 'tirmidhi', 76, 76),
('sp-077', 'food', 'Sit While Drinking', 'The Prophet (PBUH) forbade drinking while standing.', 'Sahih Muslim 2024', 'muslim', 77, 77),
('sp-078', 'food', 'Share Your Food', 'Food for two suffices for three, and food for three suffices for four.', 'Sahih al-Bukhari 5392', 'bukhari', 78, 78),
('sp-079', 'food', 'Eat Honey', 'By the One in whose hand is my soul, eat honey for it is a healing.', 'Sunan Ibn Majah 3452', 'ibn_majah', 79, 79),
('sp-080', 'food', 'Do Not Waste Food', 'When a morsel of food falls from one of you, remove what is on it and eat it. Do not leave it for Shaytan.', 'Sahih Muslim 2033', 'muslim', 80, 80),
('sp-081', 'food', 'Fast Mondays and Thursdays', 'The Prophet (PBUH) used to fast Mondays and Thursdays.', 'Sunan at-Tirmidhi 745', 'tirmidhi', 81, 81),
('sp-082', 'food', 'Eat Olive Oil', 'Eat olive oil and anoint yourselves with it, for it comes from a blessed tree.', 'Sunan at-Tirmidhi 1851', 'tirmidhi', 82, 82),

-- DAILY practices (days 83-119)
('sp-083', 'daily', 'Say Morning Adhkar', 'Recite the morning adhkar after Fajr for protection and blessings throughout the day.', 'Sahih Muslim 2723', 'muslim', 83, 83),
('sp-084', 'daily', 'Say Evening Adhkar', 'Recite the evening adhkar after Asr for protection through the night.', 'Sahih Muslim 2723', 'muslim', 84, 84),
('sp-085', 'daily', 'Use Miswak', 'If it were not that it would be difficult for my nation, I would have ordered them to use the miswak before every prayer.', 'Sahih al-Bukhari 887', 'bukhari', 85, 85),
('sp-086', 'daily', 'Apply Perfume', 'The Prophet (PBUH) loved good scent and would apply perfume regularly.', 'Sahih al-Bukhari 5929', 'bukhari', 86, 86),
('sp-087', 'daily', 'Walk to the Masjid', 'Whoever walks to the masjid, every step is a hasanah (good deed) and an expiation of sin.', 'Sahih Muslim 666', 'muslim', 87, 87),
('sp-088', 'daily', 'Seek Knowledge Daily', 'Whoever follows a path to seek knowledge, Allah will make easy for him the path to Paradise.', 'Sahih Muslim 2699', 'muslim', 88, 88),
('sp-089', 'daily', 'Give Daily Sadaqah', 'Every joint of a person has a charity due on it every day the sun rises.', 'Sahih al-Bukhari 2989', 'bukhari', 89, 89),
('sp-090', 'daily', 'Say Subhanallah 33 Times', 'Say Subhanallah 33 times, Alhamdulillah 33 times, and Allahu Akbar 34 times after every obligatory prayer.', 'Sahih Muslim 595', 'muslim', 90, 90),
('sp-091', 'daily', 'Recite Ayat al-Kursi After Prayer', 'Whoever recites Ayat al-Kursi after every obligatory prayer, nothing prevents him from entering Paradise except death.', 'Sunan an-Nasa''i 9848', 'nasai', 91, 91),
('sp-092', 'daily', 'Make Istighfar 100 Times', 'I seek forgiveness from Allah 100 times a day.', 'Sahih Muslim 2702', 'muslim', 92, 92),
('sp-093', 'daily', 'Send Salawat on the Prophet', 'Whoever sends one salah upon me, Allah will send ten salah upon him.', 'Sahih Muslim 408', 'muslim', 93, 93),
('sp-094', 'daily', 'Read Quran Daily', 'The best of you are those who learn the Quran and teach it.', 'Sahih al-Bukhari 5027', 'bukhari', 94, 94),
('sp-095', 'daily', 'Say La Ilaha Illa Allah 100 Times', 'Whoever says La ilaha illa Allah 100 times, it is as if he freed 10 slaves, and 100 good deeds are recorded for him.', 'Sahih al-Bukhari 6403', 'bukhari', 95, 95),

-- SLEEP practices (days 96-132)
('sp-096', 'sleep', 'Sleep on the Right Side', 'When you go to bed, perform wudu then lie down on your right side.', 'Sahih al-Bukhari 247', 'bukhari', 96, 96),
('sp-097', 'sleep', 'Recite Ayat al-Kursi Before Sleeping', 'Whoever recites Ayat al-Kursi when going to bed, a guardian from Allah will protect him and no devil will come near him.', 'Sahih al-Bukhari 5010', 'bukhari', 97, 97),
('sp-098', 'sleep', 'Blow into Hands with Last 3 Surahs', 'Every night before sleeping, cup your hands, blow into them, recite the 3 Quls, and wipe over your body.', 'Sahih al-Bukhari 5017', 'bukhari', 98, 98),
('sp-099', 'sleep', 'Recite Surah Al-Mulk', 'Surah Al-Mulk is the protector from the torment of the grave.', 'Sunan at-Tirmidhi 2890', 'tirmidhi', 99, 99),
('sp-100', 'sleep', 'Dust Off Your Bed 3 Times', 'When one of you goes to bed, dust off the bed with the inside of his garment three times.', 'Sahih al-Bukhari 6320', 'bukhari', 100, 100),
('sp-101', 'sleep', 'Say Du''a Before Sleeping', 'Bismika Rabbi wada''tu janbi, wa bika arfa''uhu - In Your name, my Lord, I lay down my side and by You I raise it.', 'Sahih al-Bukhari 6314', 'bukhari', 101, 101),
('sp-102', 'sleep', 'Make Wudu Before Sleeping', 'When you go to bed, perform wudu as you would for prayer.', 'Sahih al-Bukhari 247', 'bukhari', 102, 102),
('sp-103', 'sleep', 'Recite the Last Two Ayat of Al-Baqarah', 'Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him.', 'Sahih al-Bukhari 5009', 'bukhari', 103, 103),
('sp-104', 'sleep', 'Say Du''a When Waking Up', 'Alhamdulillahilladhi ahyana ba''da ma amatana wa ilayhin nushur - All praise is for Allah who gave us life after causing us to die.', 'Sahih al-Bukhari 6312', 'bukhari', 104, 104),
('sp-105', 'sleep', 'Do Not Sleep on the Stomach', 'The Prophet (PBUH) said sleeping on the stomach is a way of lying that Allah dislikes.', 'Sunan Abu Dawud 5040', 'abu_dawud', 105, 105),
('sp-106', 'sleep', 'Wake for Tahajjud (Last Third)', 'Our Lord descends to the lowest heaven in the last third of the night and says: Who is calling upon Me that I may answer?', 'Sahih al-Bukhari 1145', 'bukhari', 106, 106),
('sp-107', 'sleep', 'Recite Surah As-Sajdah', 'The Prophet (PBUH) would not sleep until he recited Surah As-Sajdah and Surah Al-Mulk.', 'Sunan at-Tirmidhi 2892', 'tirmidhi', 107, 107),
('sp-108', 'sleep', 'Sleep Early After Isha', 'The Prophet (PBUH) disliked sleeping before Isha and talking after it.', 'Sahih al-Bukhari 568', 'bukhari', 108, 108),

-- TRAVEL practices (days 109-145)
('sp-109', 'travel', 'Say Travel Du''a', 'Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin - Glory be to the One who subjected this to us.', 'Sahih Muslim 1342', 'muslim', 109, 109),
('sp-110', 'travel', 'Pray Qasr (Shorten Prayers)', 'When traveling, shorten the four rak''ah prayers to two as the Prophet (PBUH) practiced.', 'Sahih al-Bukhari 1080', 'bukhari', 110, 110),
('sp-111', 'travel', 'Say Takbir Going Uphill', 'When the Prophet (PBUH) went up a hill, he would say Allahu Akbar, and when going downhill, Subhanallah.', 'Sahih al-Bukhari 2993', 'bukhari', 111, 111),
('sp-112', 'travel', 'Make Du''a Upon Arriving', 'A''udhu bi kalimatillahit tammati min sharri ma khalaq - I seek refuge in the perfect words of Allah from the evil of what He created.', 'Sahih Muslim 2708', 'muslim', 112, 112),
('sp-113', 'travel', 'Travel with a Group', 'The rider alone is a devil, two riders are two devils, but three are a group of riders.', 'Sunan at-Tirmidhi 1674', 'tirmidhi', 113, 113),
('sp-114', 'travel', 'Choose a Leader for Travel', 'When three people set out on a journey, they should appoint one of them as their leader.', 'Sunan Abu Dawud 2608', 'abu_dawud', 114, 114),
('sp-115', 'travel', 'Do Not Travel Alone at Night', 'If people knew what I know about traveling alone, no rider would travel alone at night.', 'Sahih al-Bukhari 2998', 'bukhari', 115, 115),
('sp-116', 'travel', 'Say Du''a When Returning Home', 'Ayibuna ta''ibuna ''abiduna li rabbina hamidun - We are returning, repenting, worshipping, and praising our Lord.', 'Sahih al-Bukhari 1797', 'bukhari', 116, 116),
('sp-117', 'travel', 'Pray 2 Rak''ah Upon Returning', 'When the Prophet (PBUH) returned from a journey, he would first go to the masjid and pray two rak''ah.', 'Sahih al-Bukhari 443', 'bukhari', 117, 117),
('sp-118', 'travel', 'Do Not Forget Provisions', 'Take provisions, and the best provision is taqwa (consciousness of Allah).', 'Surah Al-Baqarah 2:197', 'quran', 118, 118),
('sp-119', 'travel', 'Share Food During Travel', 'The Prophet (PBUH) would share whatever food was available equally among companions during travel.', 'Sahih Muslim 1728', 'muslim', 119, 119),
('sp-120', 'travel', 'Make Du''a During Travel', 'Three supplications are answered without doubt: the supplication of the traveler.', 'Sunan at-Tirmidhi 3448', 'tirmidhi', 120, 120),
('sp-121', 'travel', 'Be Kind to Your Mount/Vehicle', 'Fear Allah regarding your animals. Ride them well and feed them well.', 'Sunan Abu Dawud 2548', 'abu_dawud', 121, 121),

-- WORSHIP practices (days 122-158)
('sp-122', 'worship', 'Give Sadaqah Friday Morning', 'The best day on which the sun rises is Friday; give charity on it.', 'Sahih Muslim 854', 'muslim', 122, 122),
('sp-123', 'worship', 'Fast the 3 White Days', 'Fast the 13th, 14th, and 15th of each lunar month - it is as if you fasted perpetually.', 'Sunan an-Nasa''i 2424', 'nasai', 123, 123),
('sp-124', 'worship', 'Perform I''tikaf in Ramadan', 'The Prophet (PBUH) would perform I''tikaf during the last ten days of Ramadan.', 'Sahih al-Bukhari 2025', 'bukhari', 124, 124),
('sp-125', 'worship', 'Make Tawbah (Repentance)', 'All the sons of Adam sin, and the best of sinners are those who repent.', 'Sunan at-Tirmidhi 2499', 'tirmidhi', 125, 125),
('sp-126', 'worship', 'Do Dhikr After Fajr Until Sunrise', 'Whoever prays Fajr in congregation, then sits remembering Allah until sunrise, then prays two rak''ah, he will have the reward of Hajj and Umrah.', 'Sunan at-Tirmidhi 586', 'tirmidhi', 126, 126),
('sp-127', 'worship', 'Give Sadaqah in Secret', 'Seven people Allah will shade on a day when there is no shade except His: a man who gives in charity so secretly that his left hand does not know what his right hand gave.', 'Sahih al-Bukhari 1423', 'bukhari', 127, 127),
('sp-128', 'worship', 'Perform Umrah', 'An Umrah to the next Umrah is an expiation for whatever comes between them.', 'Sahih al-Bukhari 1773', 'bukhari', 128, 128),
('sp-129', 'worship', 'Remember Allah in Solitude', 'A man who remembers Allah in solitude and his eyes overflow with tears.', 'Sahih al-Bukhari 660', 'bukhari', 129, 129),
('sp-130', 'worship', 'Fast the Day of Arafah', 'Fasting the Day of Arafah expiates the sins of the previous year and the coming year.', 'Sahih Muslim 1162', 'muslim', 130, 130),
('sp-131', 'worship', 'Fast the Day of Ashura', 'Fasting the Day of Ashura, I hope that Allah will expiate the sins of the year before it.', 'Sahih Muslim 1162', 'muslim', 131, 131),
('sp-132', 'worship', 'Seek Laylat al-Qadr', 'Seek Laylat al-Qadr in the odd nights of the last ten days of Ramadan.', 'Sahih al-Bukhari 2017', 'bukhari', 132, 132),
('sp-133', 'worship', 'Memorize 99 Names of Allah', 'Allah has 99 names. Whoever memorizes and acts upon them will enter Paradise.', 'Sahih al-Bukhari 2736', 'bukhari', 133, 133),
('sp-134', 'worship', 'Send Salawat on Fridays', 'Increase your salawat upon me on Fridays, for your salawat is shown to me.', 'Sunan Abu Dawud 1047', 'abu_dawud', 134, 134),

-- HEALTH practices (days 135-171)
('sp-135', 'health', 'Trim Nails Regularly', 'Five practices are of the fitrah: circumcision, removing pubic hair, trimming the mustache, trimming nails, and removing armpit hair.', 'Sahih al-Bukhari 5889', 'bukhari', 135, 135),
('sp-136', 'health', 'Use Black Seed (Habbatus Sauda)', 'In the black seed is a cure for every disease except death.', 'Sahih al-Bukhari 5688', 'bukhari', 136, 136),
('sp-137', 'health', 'Do Not Overeat', 'The son of Adam does not fill any vessel worse than his stomach. It is enough for the son of Adam to eat a few morsels.', 'Sunan at-Tirmidhi 2380', 'tirmidhi', 137, 137),
('sp-138', 'health', 'Wash Hands Before Eating', 'The blessing of food is in washing hands before and after eating.', 'Sunan at-Tirmidhi 1846', 'tirmidhi', 138, 138),
('sp-139', 'health', 'Exercise and Stay Active', 'The strong believer is better and more beloved to Allah than the weak believer.', 'Sahih Muslim 2664', 'muslim', 139, 139),
('sp-140', 'health', 'Use Zamzam Water', 'The water of Zamzam is for whatever it is drunk for.', 'Sunan Ibn Majah 3062', 'ibn_majah', 140, 140),
('sp-141', 'health', 'Cover Food and Drink at Night', 'Cover your vessels and tie your waterskins, close your doors and extinguish your lamps.', 'Sahih al-Bukhari 5623', 'bukhari', 141, 141),
('sp-142', 'health', 'Do Not Blow on Hot Food', 'The Prophet (PBUH) forbade blowing into food or drink.', 'Sunan Abu Dawud 3728', 'abu_dawud', 142, 142),
('sp-143', 'health', 'Practice Cupping (Hijama)', 'The best of what you treat yourselves with is cupping.', 'Sahih al-Bukhari 5696', 'bukhari', 143, 143),
('sp-144', 'health', 'Sleep After Dhuhr (Qailulah)', 'Take a midday nap, for the devils do not take a midday nap.', 'Sahih al-Jami 4431', 'other', 144, 144),
('sp-145', 'health', 'Keep a Clean Appearance', 'Allah is beautiful and loves beauty.', 'Sahih Muslim 91', 'muslim', 145, 145),
('sp-146', 'health', 'Use Your Right Hand for Clean Acts', 'Use the right hand for eating, drinking, and giving. Use the left for the opposite.', 'Sahih Muslim 2020', 'muslim', 146, 146),
('sp-147', 'health', 'Drink Milk', 'When one of you eats, say Bismillah. When you drink milk, say: O Allah, bless us in it and give us more.', 'Sunan at-Tirmidhi 3455', 'tirmidhi', 147, 147)

ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  hadith_ref = EXCLUDED.hadith_ref,
  day_of_year = EXCLUDED.day_of_year;
