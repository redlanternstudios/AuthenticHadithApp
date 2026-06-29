-- Phase 2A: Expanded Taxonomy - 20 Categories + 150+ Tags
-- This restructures the 7 broad categories into 20 specific ones
-- and expands from 33 tags to 150+

BEGIN;

-- ============================================
-- Step 1: Update existing 7 categories (keep their IDs, update names/colors)
-- ============================================

-- worship -> Salah & Prayer (narrower focus)
UPDATE categories SET 
  name_en = 'Salah & Prayer', 
  name_ar = 'الصلاة',
  description = 'The five daily prayers, voluntary prayers, Friday prayer, and prayer etiquette',
  icon = 'mosque',
  color = '#1b5e43',
  display_order = 1
WHERE slug = 'worship';

-- character -> Character & Manners  
UPDATE categories SET
  name_en = 'Character & Manners',
  name_ar = 'الأخلاق والآداب',
  description = 'Noble character traits, good manners, and ethical conduct',
  icon = 'heart',
  color = '#8B4513',
  display_order = 5
WHERE slug = 'character';

-- family -> Family & Marriage
UPDATE categories SET
  name_en = 'Family & Marriage',
  name_ar = 'الأسرة والزواج',
  description = 'Marriage, parenting, kinship ties, and family responsibilities',
  icon = 'users',
  color = '#D4A574',
  display_order = 11
WHERE slug = 'family';

-- daily-life -> Daily Conduct & Etiquette
UPDATE categories SET
  name_en = 'Daily Conduct & Etiquette',
  name_ar = 'السلوك اليومي',
  description = 'Everyday manners, greetings, food etiquette, dress, and travel',
  icon = 'sun',
  color = '#C5A059',
  display_order = 12
WHERE slug = 'daily-life';

-- knowledge -> Knowledge & Learning
UPDATE categories SET
  name_en = 'Knowledge & Learning',
  name_ar = 'العلم والتعلم',
  description = 'Seeking knowledge, teaching, scholarship, and Hadith sciences',
  icon = 'book-open',
  color = '#2E7D32',
  display_order = 14
WHERE slug = 'knowledge';

-- community -> Social Justice & Rights
UPDATE categories SET
  name_en = 'Social Justice & Rights',
  name_ar = 'العدل والحقوق',
  description = 'Justice, human rights, governance, and social responsibility',
  icon = 'scale',
  color = '#5D4037',
  display_order = 16
WHERE slug = 'community';

-- afterlife -> Death & Afterlife
UPDATE categories SET
  name_en = 'Death & Afterlife',
  name_ar = 'الموت والآخرة',
  description = 'Death, the grave, resurrection, paradise, hellfire, and the Day of Judgment',
  icon = 'cloud',
  color = '#37474F',
  display_order = 19
WHERE slug = 'afterlife';

-- ============================================
-- Step 2: Insert 13 NEW categories
-- ============================================

INSERT INTO categories (slug, name_en, name_ar, description, icon, color, display_order, is_active) VALUES
('fasting', 'Fasting & Ramadan', 'الصيام ورمضان', 'Obligatory and voluntary fasting, Ramadan, I''tikaf, and Laylatul Qadr', 'moon', '#1A237E', 2, true),
('zakat', 'Zakat & Charity', 'الزكاة والصدقة', 'Obligatory zakat, voluntary charity, giving, and generosity', 'hand-coins', '#4A148C', 3, true),
('hajj', 'Hajj & Umrah', 'الحج والعمرة', 'Pilgrimage to Makkah, Umrah, and sacred sites', 'map-pin', '#BF360C', 4, true),
('faith', 'Iman & Aqeedah', 'الإيمان والعقيدة', 'Pillars of faith, belief in Allah, angels, books, prophets, Qadr, and creed', 'shield', '#0D47A1', 6, true),
('dhikr', 'Dhikr & Du''a', 'الذكر والدعاء', 'Remembrance of Allah, supplications, morning/evening adhkar, and istighfar', 'sparkles', '#006064', 7, true),
('quran', 'Quran & Revelation', 'القرآن والوحي', 'Recitation, memorization, tafsir, and virtues of Quranic surahs', 'book', '#1B5E20', 8, true),
('purification', 'Purification & Cleanliness', 'الطهارة والنظافة', 'Wudu, ghusl, tayammum, and spiritual/physical cleanliness', 'droplets', '#00838F', 9, true),
('sunnah-acts', 'Prophetic Sunnah', 'السنة النبوية', 'Following the Prophet''s way in worship, habits, and daily life', 'star', '#E65100', 10, true),
('business', 'Business & Trade', 'التجارة والمعاملات', 'Halal earnings, business ethics, transactions, and financial dealings', 'briefcase', '#4E342E', 13, true),
('dawah', 'Da''wah & Guidance', 'الدعوة والإرشاد', 'Inviting to Islam, enjoining good, forbidding evil, and giving advice', 'megaphone', '#880E4F', 15, true),
('warfare', 'Jihad & Defense', 'الجهاد والدفاع', 'Striving in the path of Allah, self-defense, treaties, and rules of engagement', 'sword', '#263238', 17, true),
('history', 'Prophetic History & Seerah', 'التاريخ والسيرة', 'Events from the Prophet''s life, companions, battles, and early Islamic history', 'scroll', '#3E2723', 18, true),
('fitna', 'Trials & End Times', 'الفتن وأشراط الساعة', 'Signs of the Hour, tribulations, Dajjal, and end-time prophecies', 'alert-triangle', '#B71C1C', 20, true)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order;

-- ============================================
-- Step 3: Reassign existing tags to better-fitting categories and add new tags
-- ============================================

-- Move "fasting" tag to fasting category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'fasting') WHERE slug = 'fasting';
-- Move "pilgrimage" tag to hajj category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'hajj') WHERE slug = 'pilgrimage';
-- Move "charity" tag to zakat category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'zakat') WHERE slug = 'charity';
-- Move "remembrance" tag to dhikr category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'dhikr') WHERE slug = 'remembrance';
-- Move "faith" tag to faith category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'faith') WHERE slug = 'faith';
-- Move "intention" tag to faith category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'faith') WHERE slug = 'intention';
-- Move "quran" tag to quran category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'quran') WHERE slug = 'quran';
-- Move "seeking-knowledge" to knowledge category (stays)
-- Move "work" to business category
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'business') WHERE slug = 'work';
-- Move "cleanliness" to purification
UPDATE tags SET category_id = (SELECT id FROM categories WHERE slug = 'purification') WHERE slug = 'cleanliness';

-- ============================================
-- Step 4: Insert 120+ NEW tags across all 20 categories
-- ============================================

-- Salah & Prayer (worship)
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('five-daily-prayers', 'Five Daily Prayers', 'الصلوات الخمس', (SELECT id FROM categories WHERE slug = 'worship'), true),
('friday-prayer', 'Friday Prayer (Jumu''ah)', 'صلاة الجمعة', (SELECT id FROM categories WHERE slug = 'worship'), true),
('night-prayer', 'Night Prayer (Tahajjud)', 'صلاة التهجد', (SELECT id FROM categories WHERE slug = 'worship'), true),
('sunnah-prayers', 'Sunnah Prayers (Rawatib)', 'السنن الرواتب', (SELECT id FROM categories WHERE slug = 'worship'), true),
('prayer-times', 'Prayer Times', 'أوقات الصلاة', (SELECT id FROM categories WHERE slug = 'worship'), true),
('congregational-prayer', 'Congregational Prayer', 'صلاة الجماعة', (SELECT id FROM categories WHERE slug = 'worship'), true),
('prostration', 'Prostration (Sujud)', 'السجود', (SELECT id FROM categories WHERE slug = 'worship'), true),
('eid-prayer', 'Eid Prayer', 'صلاة العيد', (SELECT id FROM categories WHERE slug = 'worship'), true),
('funeral-prayer', 'Funeral Prayer (Janazah)', 'صلاة الجنازة', (SELECT id FROM categories WHERE slug = 'worship'), true),
('prayer-for-rain', 'Prayer for Rain (Istisqa)', 'صلاة الاستسقاء', (SELECT id FROM categories WHERE slug = 'worship'), true)
ON CONFLICT (slug) DO NOTHING;

-- Fasting & Ramadan
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('ramadan', 'Ramadan', 'رمضان', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('voluntary-fasting', 'Voluntary Fasting', 'صيام التطوع', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('itikaf', 'I''tikaf', 'الاعتكاف', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('laylatul-qadr', 'Laylatul Qadr', 'ليلة القدر', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('suhoor', 'Suhoor', 'السحور', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('iftar', 'Iftar', 'الإفطار', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('ashura', 'Day of Ashura', 'يوم عاشوراء', (SELECT id FROM categories WHERE slug = 'fasting'), true),
('shawwal', 'Fasting in Shawwal', 'صيام شوال', (SELECT id FROM categories WHERE slug = 'fasting'), true)
ON CONFLICT (slug) DO NOTHING;

-- Zakat & Charity
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('sadaqah', 'Sadaqah (Voluntary Charity)', 'الصدقة', (SELECT id FROM categories WHERE slug = 'zakat'), true),
('zakat-al-fitr', 'Zakat al-Fitr', 'زكاة الفطر', (SELECT id FROM categories WHERE slug = 'zakat'), true),
('generosity', 'Generosity', 'الكرم', (SELECT id FROM categories WHERE slug = 'zakat'), true),
('sadaqah-jariyah', 'Ongoing Charity (Sadaqah Jariyah)', 'الصدقة الجارية', (SELECT id FROM categories WHERE slug = 'zakat'), true),
('feeding-the-poor', 'Feeding the Poor', 'إطعام الفقراء', (SELECT id FROM categories WHERE slug = 'zakat'), true),
('wealth', 'Wealth & Contentment', 'المال والقناعة', (SELECT id FROM categories WHERE slug = 'zakat'), true)
ON CONFLICT (slug) DO NOTHING;

-- Hajj & Umrah
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('hajj-rituals', 'Hajj Rituals', 'مناسك الحج', (SELECT id FROM categories WHERE slug = 'hajj'), true),
('umrah', 'Umrah', 'العمرة', (SELECT id FROM categories WHERE slug = 'hajj'), true),
('tawaf', 'Tawaf', 'الطواف', (SELECT id FROM categories WHERE slug = 'hajj'), true),
('arafah', 'Day of Arafah', 'يوم عرفة', (SELECT id FROM categories WHERE slug = 'hajj'), true),
('makkah', 'Makkah', 'مكة', (SELECT id FROM categories WHERE slug = 'hajj'), true),
('madinah', 'Madinah', 'المدينة', (SELECT id FROM categories WHERE slug = 'hajj'), true),
('sacrifice', 'Sacrifice (Udhiyah)', 'الأضحية', (SELECT id FROM categories WHERE slug = 'hajj'), true)
ON CONFLICT (slug) DO NOTHING;

-- Character & Manners
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('sincerity', 'Sincerity (Ikhlas)', 'الإخلاص', (SELECT id FROM categories WHERE slug = 'character'), true),
('gratitude', 'Gratitude (Shukr)', 'الشكر', (SELECT id FROM categories WHERE slug = 'character'), true),
('modesty', 'Modesty (Haya)', 'الحياء', (SELECT id FROM categories WHERE slug = 'character'), true),
('trustworthiness', 'Trustworthiness (Amanah)', 'الأمانة', (SELECT id FROM categories WHERE slug = 'character'), true),
('gentleness', 'Gentleness (Rifq)', 'الرفق', (SELECT id FROM categories WHERE slug = 'character'), true),
('mercy', 'Mercy (Rahmah)', 'الرحمة', (SELECT id FROM categories WHERE slug = 'character'), true),
('jealousy', 'Avoiding Jealousy', 'تجنب الحسد', (SELECT id FROM categories WHERE slug = 'character'), true),
('backbiting', 'Avoiding Backbiting', 'تجنب الغيبة', (SELECT id FROM categories WHERE slug = 'character'), true),
('lying', 'Avoiding Lying', 'تجنب الكذب', (SELECT id FROM categories WHERE slug = 'character'), true),
('good-deeds', 'Good Deeds', 'الأعمال الصالحة', (SELECT id FROM categories WHERE slug = 'character'), true),
('tawbah', 'Repentance (Tawbah)', 'التوبة', (SELECT id FROM categories WHERE slug = 'character'), true)
ON CONFLICT (slug) DO NOTHING;

-- Iman & Aqeedah (faith)
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('tawheed', 'Tawheed (Oneness of Allah)', 'التوحيد', (SELECT id FROM categories WHERE slug = 'faith'), true),
('angels', 'Angels', 'الملائكة', (SELECT id FROM categories WHERE slug = 'faith'), true),
('qadr', 'Divine Decree (Qadr)', 'القدر', (SELECT id FROM categories WHERE slug = 'faith'), true),
('prophets', 'Belief in Prophets', 'الإيمان بالرسل', (SELECT id FROM categories WHERE slug = 'faith'), true),
('day-of-judgment', 'Day of Judgment', 'يوم القيامة', (SELECT id FROM categories WHERE slug = 'faith'), true),
('tawakkul', 'Trust in Allah (Tawakkul)', 'التوكل', (SELECT id FROM categories WHERE slug = 'faith'), true),
('fear-of-allah', 'Fear of Allah (Taqwa)', 'التقوى', (SELECT id FROM categories WHERE slug = 'faith'), true),
('love-of-allah', 'Love of Allah', 'محبة الله', (SELECT id FROM categories WHERE slug = 'faith'), true),
('shirk', 'Avoiding Shirk', 'تجنب الشرك', (SELECT id FROM categories WHERE slug = 'faith'), true),
('hypocrisy', 'Signs of Hypocrisy', 'علامات النفاق', (SELECT id FROM categories WHERE slug = 'faith'), true)
ON CONFLICT (slug) DO NOTHING;

-- Dhikr & Du'a
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('morning-adhkar', 'Morning Adhkar', 'أذكار الصباح', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('evening-adhkar', 'Evening Adhkar', 'أذكار المساء', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('istighfar', 'Seeking Forgiveness', 'الاستغفار', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('salawat', 'Salawat upon the Prophet', 'الصلاة على النبي', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('dua-etiquette', 'Du''a Etiquette', 'آداب الدعاء', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('dua-acceptance', 'Times of Du''a Acceptance', 'أوقات إجابة الدعاء', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('Names-of-allah', 'Names of Allah', 'أسماء الله الحسنى', (SELECT id FROM categories WHERE slug = 'dhikr'), true),
('tasbeeh', 'Tasbeeh & Tahmeed', 'التسبيح والتحميد', (SELECT id FROM categories WHERE slug = 'dhikr'), true)
ON CONFLICT (slug) DO NOTHING;

-- Quran & Revelation
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('quran-recitation', 'Quran Recitation', 'تلاوة القرآن', (SELECT id FROM categories WHERE slug = 'quran'), true),
('quran-memorization', 'Quran Memorization', 'حفظ القرآن', (SELECT id FROM categories WHERE slug = 'quran'), true),
('surah-virtues', 'Virtues of Surahs', 'فضائل السور', (SELECT id FROM categories WHERE slug = 'quran'), true),
('tafsir', 'Tafsir & Explanation', 'التفسير', (SELECT id FROM categories WHERE slug = 'quran'), true),
('al-fatiha', 'Al-Fatiha', 'الفاتحة', (SELECT id FROM categories WHERE slug = 'quran'), true),
('al-baqarah', 'Al-Baqarah', 'البقرة', (SELECT id FROM categories WHERE slug = 'quran'), true),
('ayat-al-kursi', 'Ayat al-Kursi', 'آية الكرسي', (SELECT id FROM categories WHERE slug = 'quran'), true)
ON CONFLICT (slug) DO NOTHING;

-- Purification & Cleanliness
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('wudu', 'Wudu (Ablution)', 'الوضوء', (SELECT id FROM categories WHERE slug = 'purification'), true),
('ghusl', 'Ghusl (Full Bathing)', 'الغسل', (SELECT id FROM categories WHERE slug = 'purification'), true),
('tayammum', 'Tayammum (Dry Ablution)', 'التيمم', (SELECT id FROM categories WHERE slug = 'purification'), true),
('menstruation', 'Menstruation Rulings', 'أحكام الحيض', (SELECT id FROM categories WHERE slug = 'purification'), true),
('miswak', 'Miswak (Tooth Stick)', 'المسواك', (SELECT id FROM categories WHERE slug = 'purification'), true)
ON CONFLICT (slug) DO NOTHING;

-- Prophetic Sunnah (sunnah-acts)
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('sunnah-of-eating', 'Sunnah of Eating', 'سنن الأكل', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true),
('sunnah-of-sleeping', 'Sunnah of Sleeping', 'سنن النوم', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true),
('sunnah-of-dressing', 'Sunnah of Dressing', 'سنن اللباس', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true),
('sunnah-of-travel', 'Sunnah of Travel', 'سنن السفر', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true),
('sunnah-of-greeting', 'Sunnah of Greeting (Salam)', 'سنن السلام', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true),
('friday-sunnah', 'Friday Sunnah', 'سنن الجمعة', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true),
('sunnah-of-eid', 'Sunnah of Eid', 'سنن العيد', (SELECT id FROM categories WHERE slug = 'sunnah-acts'), true)
ON CONFLICT (slug) DO NOTHING;

-- Family & Marriage
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('spouse-rights', 'Spouse Rights', 'حقوق الزوجين', (SELECT id FROM categories WHERE slug = 'family'), true),
('parenting', 'Parenting', 'تربية الأبناء', (SELECT id FROM categories WHERE slug = 'family'), true),
('honoring-parents', 'Honoring Parents', 'بر الوالدين', (SELECT id FROM categories WHERE slug = 'family'), true),
('kinship-ties', 'Kinship Ties (Silat ar-Rahim)', 'صلة الرحم', (SELECT id FROM categories WHERE slug = 'family'), true),
('orphans', 'Caring for Orphans', 'كفالة اليتيم', (SELECT id FROM categories WHERE slug = 'family'), true),
('wedding', 'Wedding (Walimah)', 'الوليمة', (SELECT id FROM categories WHERE slug = 'family'), true)
ON CONFLICT (slug) DO NOTHING;

-- Daily Conduct & Etiquette
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('hospitality', 'Hospitality', 'الضيافة', (SELECT id FROM categories WHERE slug = 'daily-life'), true),
('travel-etiquette', 'Travel Etiquette', 'آداب السفر', (SELECT id FROM categories WHERE slug = 'daily-life'), true),
('sleeping-etiquette', 'Sleeping Etiquette', 'آداب النوم', (SELECT id FROM categories WHERE slug = 'daily-life'), true),
('gathering-etiquette', 'Gathering Etiquette', 'آداب المجلس', (SELECT id FROM categories WHERE slug = 'daily-life'), true),
('visiting-sick', 'Visiting the Sick', 'عيادة المريض', (SELECT id FROM categories WHERE slug = 'daily-life'), true),
('sneezing', 'Sneezing & Yawning', 'العطاس والتثاؤب', (SELECT id FROM categories WHERE slug = 'daily-life'), true)
ON CONFLICT (slug) DO NOTHING;

-- Business & Trade
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('halal-earning', 'Halal Earning', 'الكسب الحلال', (SELECT id FROM categories WHERE slug = 'business'), true),
('riba', 'Riba (Interest/Usury)', 'الربا', (SELECT id FROM categories WHERE slug = 'business'), true),
('debt', 'Debt & Loans', 'الدين والقرض', (SELECT id FROM categories WHERE slug = 'business'), true),
('trade-ethics', 'Trade Ethics', 'أخلاق التجارة', (SELECT id FROM categories WHERE slug = 'business'), true),
('contracts', 'Contracts & Agreements', 'العقود', (SELECT id FROM categories WHERE slug = 'business'), true)
ON CONFLICT (slug) DO NOTHING;

-- Knowledge & Learning
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('hadith-sciences', 'Hadith Sciences', 'علوم الحديث', (SELECT id FROM categories WHERE slug = 'knowledge'), true),
('scholars', 'Scholars & Teachers', 'العلماء', (SELECT id FROM categories WHERE slug = 'knowledge'), true),
('memorization', 'Memorization', 'الحفظ', (SELECT id FROM categories WHERE slug = 'knowledge'), true),
('teaching', 'Teaching & Sharing Knowledge', 'التعليم', (SELECT id FROM categories WHERE slug = 'knowledge'), true),
('islamic-jurisprudence', 'Islamic Jurisprudence (Fiqh)', 'الفقه', (SELECT id FROM categories WHERE slug = 'knowledge'), true)
ON CONFLICT (slug) DO NOTHING;

-- Da'wah & Guidance
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('enjoining-good', 'Enjoining Good', 'الأمر بالمعروف', (SELECT id FROM categories WHERE slug = 'dawah'), true),
('forbidding-evil', 'Forbidding Evil', 'النهي عن المنكر', (SELECT id FROM categories WHERE slug = 'dawah'), true),
('advice', 'Giving Advice (Nasihah)', 'النصيحة', (SELECT id FROM categories WHERE slug = 'dawah'), true),
('new-muslims', 'New Muslims', 'المسلمون الجدد', (SELECT id FROM categories WHERE slug = 'dawah'), true),
('calling-to-islam', 'Calling to Islam', 'الدعوة إلى الإسلام', (SELECT id FROM categories WHERE slug = 'dawah'), true)
ON CONFLICT (slug) DO NOTHING;

-- Social Justice & Rights
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('equality', 'Equality', 'المساواة', (SELECT id FROM categories WHERE slug = 'community'), true),
('oppression', 'Standing Against Oppression', 'مواجهة الظلم', (SELECT id FROM categories WHERE slug = 'community'), true),
('neighbors-rights', 'Neighbors'' Rights', 'حق الجار', (SELECT id FROM categories WHERE slug = 'community'), true),
('animal-rights', 'Animal Rights', 'حقوق الحيوان', (SELECT id FROM categories WHERE slug = 'community'), true),
('environment', 'Environment & Nature', 'البيئة', (SELECT id FROM categories WHERE slug = 'community'), true),
('consultation', 'Consultation (Shura)', 'الشورى', (SELECT id FROM categories WHERE slug = 'community'), true)
ON CONFLICT (slug) DO NOTHING;

-- Jihad & Defense
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('inner-jihad', 'Inner Struggle (Jihad an-Nafs)', 'جهاد النفس', (SELECT id FROM categories WHERE slug = 'warfare'), true),
('martyrdom', 'Martyrdom (Shaheed)', 'الشهادة', (SELECT id FROM categories WHERE slug = 'warfare'), true),
('treaties', 'Treaties & Peace', 'المعاهدات والسلام', (SELECT id FROM categories WHERE slug = 'warfare'), true),
('rules-of-war', 'Rules of Engagement', 'أحكام القتال', (SELECT id FROM categories WHERE slug = 'warfare'), true),
('bravery', 'Bravery & Courage', 'الشجاعة', (SELECT id FROM categories WHERE slug = 'warfare'), true)
ON CONFLICT (slug) DO NOTHING;

-- Prophetic History & Seerah
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('hijrah', 'Hijrah (Migration)', 'الهجرة', (SELECT id FROM categories WHERE slug = 'history'), true),
('badr', 'Battle of Badr', 'غزوة بدر', (SELECT id FROM categories WHERE slug = 'history'), true),
('uhud', 'Battle of Uhud', 'غزوة أحد', (SELECT id FROM categories WHERE slug = 'history'), true),
('conquest-makkah', 'Conquest of Makkah', 'فتح مكة', (SELECT id FROM categories WHERE slug = 'history'), true),
('farewell-sermon', 'Farewell Sermon', 'خطبة الوداع', (SELECT id FROM categories WHERE slug = 'history'), true),
('companions', 'The Companions (Sahaba)', 'الصحابة', (SELECT id FROM categories WHERE slug = 'history'), true),
('ahlul-bayt', 'Ahlul Bayt (Prophet''s Family)', 'أهل البيت', (SELECT id FROM categories WHERE slug = 'history'), true)
ON CONFLICT (slug) DO NOTHING;

-- Death & Afterlife
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('grave', 'The Grave (Barzakh)', 'البرزخ', (SELECT id FROM categories WHERE slug = 'afterlife'), true),
('resurrection', 'Resurrection', 'البعث', (SELECT id FROM categories WHERE slug = 'afterlife'), true),
('intercession', 'Intercession (Shafa''ah)', 'الشفاعة', (SELECT id FROM categories WHERE slug = 'afterlife'), true),
('sirat', 'The Bridge (Sirat)', 'الصراط', (SELECT id FROM categories WHERE slug = 'afterlife'), true),
('hereafter', 'The Hereafter', 'الآخرة', (SELECT id FROM categories WHERE slug = 'afterlife'), true)
ON CONFLICT (slug) DO NOTHING;

-- Trials & End Times (fitna)
INSERT INTO tags (slug, name_en, name_ar, category_id, is_active) VALUES
('signs-of-hour', 'Signs of the Hour', 'أشراط الساعة', (SELECT id FROM categories WHERE slug = 'fitna'), true),
('dajjal', 'Dajjal (Antichrist)', 'الدجال', (SELECT id FROM categories WHERE slug = 'fitna'), true),
('mahdi', 'The Mahdi', 'المهدي', (SELECT id FROM categories WHERE slug = 'fitna'), true),
('isa-return', 'Return of Isa (AS)', 'نزول عيسى', (SELECT id FROM categories WHERE slug = 'fitna'), true),
('tribulations', 'Tribulations (Fitan)', 'الفتن', (SELECT id FROM categories WHERE slug = 'fitna'), true),
('patience-in-trials', 'Patience in Trials', 'الصبر في المحن', (SELECT id FROM categories WHERE slug = 'fitna'), true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
