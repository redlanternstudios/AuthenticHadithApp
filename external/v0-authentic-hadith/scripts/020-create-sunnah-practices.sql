-- Create sunnah categories table
CREATE TABLE IF NOT EXISTS sunnah_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Heart',
  color TEXT NOT NULL DEFAULT 'text-[#1B5E43]',
  bg_color TEXT NOT NULL DEFAULT 'bg-[#1B5E43]/10',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sunnah practices table
CREATE TABLE IF NOT EXISTS sunnah_practices (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES sunnah_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hadith_ref TEXT NOT NULL,
  collection TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed categories
INSERT INTO sunnah_categories (id, title, title_ar, description, icon, color, bg_color, sort_order) VALUES
  ('salah', 'Sunnah of Salah', 'سنن الصلاة', 'Voluntary prayers, adhkar before and after salah, and prophetic etiquettes of worship', 'Moon', 'text-[#1B5E43]', 'bg-[#1B5E43]/10', 1),
  ('character', 'Sunnah of Character', 'سنن الأخلاق', 'The prophetic way of dealing with people: kindness, patience, honesty, and mercy', 'HandHeart', 'text-[#C5A059]', 'bg-[#C5A059]/10', 2),
  ('home', 'Sunnah at Home', 'سنن المنزل', 'Prophetic practices for the household: entering, eating, sleeping, and family life', 'Home', 'text-[#3b82f6]', 'bg-blue-50', 3),
  ('people', 'Sunnah with People', 'سنن المعاملات', 'How the Prophet interacted with neighbors, guests, the elderly, and children', 'Users', 'text-[#7c3aed]', 'bg-purple-50', 4),
  ('food', 'Sunnah of Eating', 'سنن الطعام', 'Prophetic etiquettes of food: bismillah, eating with the right hand, and gratitude', 'Utensils', 'text-[#059669]', 'bg-emerald-50', 5),
  ('daily', 'Daily Sunnah', 'أذكار اليوم', 'Morning and evening adhkar, remembrances throughout the day', 'Clock', 'text-[#d97706]', 'bg-amber-50', 6)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_ar = EXCLUDED.title_ar,
  description = EXCLUDED.description;

-- Seed practices
INSERT INTO sunnah_practices (id, category_id, title, description, hadith_ref, collection, sort_order) VALUES
  -- Salah
  ('rawatib', 'salah', 'The Rawatib (Regular Sunnah Prayers)', '12 rak''ahs daily: 2 before Fajr, 4 before Dhuhr, 2 after Dhuhr, 2 after Maghrib, 2 after Isha', 'Hadith 1761', 'Jami at-Tirmidhi', 1),
  ('duha', 'salah', 'Salat al-Duha (Forenoon Prayer)', 'The Prophet would pray between 2-8 rak''ahs after sunrise', 'Book 8, Hadith 669', 'Sahih Muslim', 2),
  ('witr', 'salah', 'Witr Prayer', 'An odd-numbered prayer performed after Isha, the last prayer of the night', 'Book 14, Hadith 1', 'Sunan Abu Dawud', 3),
  -- Character
  ('smile', 'character', 'Smiling', 'Your smiling in the face of your brother is charity', 'Hadith 1956', 'Jami at-Tirmidhi', 1),
  ('greet', 'character', 'Spreading Salam', 'Spread peace, feed the hungry, pray at night while people sleep, and you will enter Paradise', 'Hadith 1334', 'Sunan Ibn Majah', 2),
  ('patience', 'character', 'Patience in Difficulty', 'How wonderful is the affair of the believer, for all of it is good', 'Book 55, Hadith 82', 'Sahih Muslim', 3),
  -- Home
  ('enter', 'home', 'Entering the Home', 'Say salam when entering, mention Allah''s name, and eat', 'Book 36, Hadith 28', 'Sahih Muslim', 1),
  ('sleep', 'home', 'Sleeping Etiquette', 'Sleep on your right side, recite Ayat al-Kursi and the last three surahs', 'Book 75, Hadith 7', 'Sahih Bukhari', 2),
  ('wakeup', 'home', 'Waking Up', 'Praise Allah upon waking, wash hands before using them, and perform wudu', 'Book 4, Hadith 183', 'Sahih Bukhari', 3),
  -- People
  ('neighbor', 'people', 'Rights of the Neighbor', 'Jibril kept advising me about the neighbor until I thought he would inherit from me', 'Book 45, Hadith 28', 'Sahih Bukhari', 1),
  ('guest', 'people', 'Honoring the Guest', 'Whoever believes in Allah and the Last Day, let him honor his guest', 'Book 79, Hadith 6019', 'Sahih Bukhari', 2),
  ('children', 'people', 'Kindness to Children', 'The Prophet would greet children, play with them, and carry them during prayer', 'Book 78, Hadith 5993', 'Sahih Bukhari', 3),
  -- Food
  ('bismillah', 'food', 'Saying Bismillah', 'Mention Allah''s name, eat with your right hand, and eat what is nearest to you', 'Book 70, Hadith 5376', 'Sahih Bukhari', 1),
  ('moderation', 'food', 'Moderation in Eating', 'A third for food, a third for drink, and a third for air', 'Hadith 2380', 'Jami at-Tirmidhi', 2),
  -- Daily
  ('morning', 'daily', 'Morning Adhkar', 'Supplications to recite between Fajr and sunrise for protection and blessings', 'Book 49', 'Jami at-Tirmidhi', 1),
  ('evening', 'daily', 'Evening Adhkar', 'Supplications to recite between Asr and Maghrib', 'Book 49', 'Jami at-Tirmidhi', 2),
  ('istighfar', 'daily', 'Seeking Forgiveness', 'The Prophet would seek forgiveness more than 70 times a day', 'Book 80, Hadith 6307', 'Sahih Bukhari', 3)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  hadith_ref = EXCLUDED.hadith_ref,
  collection = EXCLUDED.collection;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sunnah_practices_category ON sunnah_practices(category_id);
CREATE INDEX IF NOT EXISTS idx_sunnah_categories_sort ON sunnah_categories(sort_order);
