-- Seed the Al-Sahihayn catalog: collections + books (BUG 08/09/10).
--
-- WHY: the `collections` and `books` tables were empty, so the browse UI showed
-- untitled "Book 0/3/4..." with divergent counts. This seeds them so books have
-- real titles and every count comes from a SINGLE source.
--
-- COUNT INTEGRITY: every total_hadiths / total_books is computed FROM the
-- `hadiths` table in this script (not hand-typed), so they are exact and always
-- sum to the locked totals: Bukhari 7,277 + Muslim 7,167 = 14,444.
--
-- TITLE SOURCING (truth before completeness):
--  * Bukhari book_number 1-97 maps 1:1 to the canonical Sahih al-Bukhari kitabs
--    (sunnah.com), VERIFIED: each book's median hadith reference falls inside the
--    canonical hadith range for that book number. High confidence.
--  * Muslim book_number 1-56 maps to canonical Sahih Muslim book N+1 (the DB
--    numbering omits the Muqaddimah/Introduction). Anchored by content at Hajj,
--    Government, Merits of Companions, Tafsir. The prayer-section books (~4-7)
--    differ slightly by edition — flagged for a scholarly spot-check.
--  * book_number 0 in each collection is an anomaly bucket of narrations not
--    cleanly assigned to a titled book. Titled "Other Narrations", sorted last,
--    NOT given a fabricated canonical name. Flagged for review.

create unique index if not exists collections_slug_key on collections (slug);

-- 1) Collections -----------------------------------------------------------
insert into collections
  (name_en, name_ar, slug, scholar, scholar_dates, description_en, total_hadiths, total_books, is_featured, grade_distribution)
values
  ('Sahih al-Bukhari', 'صحيح البخاري', 'sahih-bukhari',
   'Imam Muhammad al-Bukhari', '194–256 AH (810–870 CE)',
   'The most authentic book after the Qur''an. One of the two Sahihs (Al-Sahihayn).',
   (select count(*) from hadiths where collection = 'sahih-bukhari'),
   (select count(distinct book_number) from hadiths where collection = 'sahih-bukhari'),
   true,
   jsonb_build_object('sahih', (select count(*) from hadiths where collection = 'sahih-bukhari'), 'hasan', 0, 'daif', 0)),
  ('Sahih Muslim', 'صحيح مسلم', 'sahih-muslim',
   'Imam Muslim ibn al-Hajjaj', '206–261 AH (821–875 CE)',
   'The second most authentic book of hadith. One of the two Sahihs (Al-Sahihayn).',
   (select count(*) from hadiths where collection = 'sahih-muslim'),
   (select count(distinct book_number) from hadiths where collection = 'sahih-muslim'),
   true,
   jsonb_build_object('sahih', (select count(*) from hadiths where collection = 'sahih-muslim'), 'hasan', 0, 'daif', 0))
on conflict (slug) do update set
  name_en = excluded.name_en, name_ar = excluded.name_ar, scholar = excluded.scholar,
  scholar_dates = excluded.scholar_dates, description_en = excluded.description_en,
  total_hadiths = excluded.total_hadiths, total_books = excluded.total_books,
  is_featured = excluded.is_featured, grade_distribution = excluded.grade_distribution;

-- 2) Books -----------------------------------------------------------------
-- Rebuild from scratch so this script is idempotent.
delete from books where collection_id in (select id from collections where slug in ('sahih-bukhari','sahih-muslim'));

-- Sahih al-Bukhari (book 1-97 canonical, book 0 = Other Narrations)
with col as (select id from collections where slug = 'sahih-bukhari'),
cnt as (select book_number, count(*) c from hadiths where collection = 'sahih-bukhari' group by book_number),
titles (number, name_en, name_ar) as (values
  (1,'Revelation','كتاب بدء الوحى'),
  (2,'Belief','كتاب الإيمان'),
  (3,'Knowledge','كتاب العلم'),
  (4,'Ablutions (Wudu'')','كتاب الوضوء'),
  (5,'Bathing (Ghusl)','كتاب الغسل'),
  (6,'Menstrual Periods','كتاب الحيض'),
  (7,'Ablution with Dust (Tayammum)','كتاب التيمم'),
  (8,'Prayers (Salat)','كتاب الصلاة'),
  (9,'Times of the Prayers','كتاب مواقيت الصلاة'),
  (10,'Call to Prayers (Adhan)','كتاب الأذان'),
  (11,'Friday Prayer','كتاب الجمعة'),
  (12,'Fear Prayer','كتاب صلاة الخوف'),
  (13,'The Two Festivals (Eids)','كتاب العيدين'),
  (14,'Witr Prayer','كتاب الوتر'),
  (15,'Invoking Allah for Rain (Istisqa)','كتاب الاستسقاء'),
  (16,'Eclipses','كتاب الكسوف'),
  (17,'Prostration During Recital of Qur''an','كتاب سجود القرآن'),
  (18,'Shortening the Prayers (Taqsir)','كتاب التقصير'),
  (19,'Night Prayer (Tahajjud)','كتاب التهجد'),
  (20,'Virtues of Prayer at Makkah and Madinah','كتاب فضل الصلاة فى مسجد مكة والمدينة'),
  (21,'Actions while Praying','كتاب العمل فى الصلاة'),
  (22,'Forgetfulness in Prayer','كتاب السهو'),
  (23,'Funerals (Janaiz)','كتاب الجنائز'),
  (24,'Obligatory Charity Tax (Zakat)','كتاب الزكاة'),
  (25,'Hajj (Pilgrimage)','كتاب الحج'),
  (26,'Umrah (Minor Pilgrimage)','كتاب العمرة'),
  (27,'Pilgrims Prevented from Completing the Pilgrimage','كتاب المحصر'),
  (28,'Penalty of Hunting while on Pilgrimage','كتاب جزاء الصيد'),
  (29,'Virtues of Madinah','كتاب فضائل المدينة'),
  (30,'Fasting','كتاب الصوم'),
  (31,'Praying at Night in Ramadan (Taraweeh)','كتاب صلاة التراويح'),
  (32,'Virtues of the Night of Qadr','كتاب فضل ليلة القدر'),
  (33,'Retiring to a Mosque (I''tikaf)','كتاب الاعتكاف'),
  (34,'Sales and Trade','كتاب البيوع'),
  (35,'Sales with Advance Payment (Salam)','كتاب السلم'),
  (36,'Pre-emption (Shuf''a)','كتاب الشفعة'),
  (37,'Hiring','كتاب الإجارة'),
  (38,'Transfer of a Debt (Hawala)','كتاب الحوالات'),
  (39,'Guaranteeing (Kafala)','كتاب الكفالة'),
  (40,'Agency (Wakala)','كتاب الوكالة'),
  (41,'Agriculture','كتاب المزارعة'),
  (42,'Distribution of Water','كتاب المساقاة'),
  (43,'Loans, Bankruptcy and Freezing of Property','كتاب فى الاستقراض'),
  (44,'Disputes (Khusumat)','كتاب الخصومات'),
  (45,'Lost Things Picked Up (Luqata)','كتاب فى اللقطة'),
  (46,'Oppressions','كتاب المظالم'),
  (47,'Partnership','كتاب الشركة'),
  (48,'Mortgaging (Rahn)','كتاب الرهن'),
  (49,'Manumission of Slaves','كتاب العتق'),
  (50,'Contracts of Emancipation (Mukatab)','كتاب المكاتب'),
  (51,'Gifts','كتاب الهبة وفضلها والتحريض عليها'),
  (52,'Witnesses','كتاب الشهادات'),
  (53,'Peacemaking','كتاب الصلح'),
  (54,'Conditions','كتاب الشروط'),
  (55,'Wills and Testaments (Wasaya)','كتاب الوصايا'),
  (56,'Fighting for the Cause of Allah (Jihad)','كتاب الجهاد والسير'),
  (57,'One-fifth of Booty (Khumus)','كتاب فرض الخمس'),
  (58,'Jizyah and Truces','كتاب الجزية والموادعة'),
  (59,'Beginning of Creation','كتاب بدء الخلق'),
  (60,'Prophets','كتاب أحاديث الأنبياء'),
  (61,'Virtues and Merits of the Prophet and his Companions','كتاب المناقب'),
  (62,'Companions of the Prophet','كتاب فضائل أصحاب النبى صلى الله عليه وسلم'),
  (63,'Merits of the Helpers (Ansar)','كتاب مناقب الأنصار'),
  (64,'Military Expeditions (Maghazi)','كتاب المغازى'),
  (65,'Prophetic Commentary on the Qur''an (Tafsir)','كتاب التفسير'),
  (66,'Virtues of the Qur''an','كتاب فضائل القرآن'),
  (67,'Wedlock, Marriage (Nikah)','كتاب النكاح'),
  (68,'Divorce','كتاب الطلاق'),
  (69,'Supporting the Family','كتاب النفقات'),
  (70,'Food, Meals','كتاب الأطعمة'),
  (71,'Sacrifice on Birth (Aqiqa)','كتاب العقيقة'),
  (72,'Hunting and Slaughtering','كتاب الذبائح والصيد'),
  (73,'Al-Adha Festival Sacrifice (Adahi)','كتاب الأضاحي'),
  (74,'Drinks','كتاب الأشربة'),
  (75,'Patients','كتاب المرضى'),
  (76,'Medicine','كتاب الطب'),
  (77,'Dress','كتاب اللباس'),
  (78,'Good Manners and Form (Adab)','كتاب الأدب'),
  (79,'Asking Permission','كتاب الاستئذان'),
  (80,'Invocations','كتاب الدعوات'),
  (81,'To Make the Heart Tender (Riqaq)','كتاب الرقاق'),
  (82,'Divine Will (Qadar)','كتاب القدر'),
  (83,'Oaths and Vows','كتاب الأيمان والنذور'),
  (84,'Expiation for Unfulfilled Oaths','كتاب كفارات الأيمان'),
  (85,'Laws of Inheritance (Faraid)','كتاب الفرائض'),
  (86,'Limits and Punishments (Hudud)','كتاب الحدود'),
  (87,'Blood Money (Diyat)','كتاب الديات'),
  (88,'Apostates','كتاب استتابة المرتدين والمعاندين وقتالهم'),
  (89,'Coercion','كتاب الإكراه'),
  (90,'Tricks','كتاب الحيل'),
  (91,'Interpretation of Dreams','كتاب التعبير'),
  (92,'Afflictions and the End of the World','كتاب الفتن'),
  (93,'Judgments (Ahkam)','كتاب الأحكام'),
  (94,'Wishes','كتاب التمنى'),
  (95,'Accepting Information from a Truthful Person','كتاب أخبار الآحاد'),
  (96,'Holding Fast to the Qur''an and Sunnah','كتاب الاعتصام بالكتاب والسنة'),
  (97,'Oneness of Allah (Tawhid)','كتاب التوحيد'),
  (0,'Other Narrations','أحاديث أخرى')
)
insert into books (collection_id, number, name_en, name_ar, total_hadiths, total_chapters, sort_order)
select col.id, t.number, t.name_en, t.name_ar, coalesce(cnt.c, 0), 0,
       case when t.number = 0 then 999 else t.number end
from titles t cross join col left join cnt on cnt.book_number = t.number;

-- Sahih Muslim (DB book N = canonical book N+1; book 0 = Other Narrations)
with col as (select id from collections where slug = 'sahih-muslim'),
cnt as (select book_number, count(*) c from hadiths where collection = 'sahih-muslim' group by book_number),
titles (number, name_en, name_ar) as (values
  (1,'Faith (Iman)','كتاب الإيمان'),
  (2,'Purification (Taharah)','كتاب الطهارة'),
  (3,'Menstruation','كتاب الحيض'),
  (4,'Prayers (Salat)','كتاب الصلاة'),
  (5,'Mosques and Places of Prayer','كتاب المساجد ومواضع الصلاة'),
  (6,'Travellers'' Prayer','كتاب صلاة المسافرين وقصرها'),
  (7,'Friday Prayer','كتاب الجمعة'),
  (8,'The Two Eid Prayers','كتاب صلاة العيدين'),
  (9,'Prayer for Rain (Istisqa)','كتاب صلاة الاستسقاء'),
  (10,'Eclipses','كتاب الكسوف'),
  (11,'Funerals','كتاب الجنائز'),
  (12,'Zakat','كتاب الزكاة'),
  (13,'Fasting','كتاب الصيام'),
  (14,'I''tikaf','كتاب الاعتكاف'),
  (15,'Pilgrimage (Hajj)','كتاب الحج'),
  (16,'Marriage (Nikah)','كتاب النكاح'),
  (17,'Suckling (Rida)','كتاب الرضاع'),
  (18,'Divorce','كتاب الطلاق'),
  (19,'Invoking Curses (Li''an)','كتاب اللعان'),
  (20,'Emancipating Slaves','كتاب العتق'),
  (21,'Transactions (Buyu)','كتاب البيوع'),
  (22,'Musaqah','كتاب المساقاة'),
  (23,'Rules of Inheritance (Faraid)','كتاب الفرائض'),
  (24,'Gifts','كتاب الهبات'),
  (25,'Wills','كتاب الوصية'),
  (26,'Vows','كتاب النذر'),
  (27,'Oaths','كتاب الأيمان'),
  (28,'Brigandage, Retaliation and Blood Money','كتاب القسامة والمحاربين والقصاص والديات'),
  (29,'Legal Punishments (Hudud)','كتاب الحدود'),
  (30,'Judicial Decisions','كتاب الأقضية'),
  (31,'Lost Property','كتاب اللقطة'),
  (32,'Jihad and Expeditions','كتاب الجهاد والسير'),
  (33,'Government (Imara)','كتاب الإمارة'),
  (34,'Hunting, Slaughter and Game','كتاب الصيد والذبائح وما يؤكل من الحيوان'),
  (35,'Sacrifices (Adahi)','كتاب الأضاحى'),
  (36,'Drinks','كتاب الأشربة'),
  (37,'Clothes and Adornment','كتاب اللباس والزينة'),
  (38,'Manners and Etiquette (Adab)','كتاب الآداب'),
  (39,'Greetings (Salam)','كتاب السلام'),
  (40,'The Use of Correct Words','كتاب الألفاظ من الأدب وغيرها'),
  (41,'Poetry','كتاب الشعر'),
  (42,'Dreams','كتاب الرؤيا'),
  (43,'Virtues','كتاب الفضائل'),
  (44,'Merits of the Companions','كتاب فضائل الصحابة'),
  (45,'Virtue, Good Manners and Kinship (Birr)','كتاب البر والصلة والآداب'),
  (46,'Destiny (Qadar)','كتاب القدر'),
  (47,'Knowledge','كتاب العلم'),
  (48,'Remembrance, Supplication and Repentance','كتاب الذكر والدعاء والتوبة والاستغفار'),
  (49,'Heart-Melting Traditions (Riqaq)','كتاب الرقاق'),
  (50,'Repentance','كتاب التوبة'),
  (51,'Characteristics of the Hypocrites','كتاب صفات المنافقين وأحكامهم'),
  (52,'Description of the Day of Judgment, Paradise and Hell','كتاب صفة القيامة والجنة والنار'),
  (53,'Paradise, its Description and Bounties','كتاب الجنة وصفة نعيمها وأهلها'),
  (54,'Tribulations and Portents of the Last Hour','كتاب الفتن وأشراط الساعة'),
  (55,'Asceticism and Softening of Hearts (Zuhd)','كتاب الزهد والرقائق'),
  (56,'Commentary on the Qur''an (Tafsir)','كتاب التفسير'),
  (0,'Other Narrations','أحاديث أخرى')
)
insert into books (collection_id, number, name_en, name_ar, total_hadiths, total_chapters, sort_order)
select col.id, t.number, t.name_en, t.name_ar, coalesce(cnt.c, 0), 0,
       case when t.number = 0 then 999 else t.number end
from titles t cross join col left join cnt on cnt.book_number = t.number;
