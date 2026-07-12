-- Diagnostic: check why chapters show empty in Sunan Abu Dawud

-- 1. Count collection_hadiths with NULL book_id for Abu Dawud
SELECT 'NULL book_id links' as check_name, count(*) as cnt
FROM collection_hadiths ch
JOIN collections c ON c.id = ch.collection_id
WHERE c.slug = 'sunan-abu-dawud' AND ch.book_id IS NULL;

-- 2. Count total links for Abu Dawud
SELECT 'Total Abu Dawud links' as check_name, count(*) as cnt
FROM collection_hadiths ch
JOIN collections c ON c.id = ch.collection_id
WHERE c.slug = 'sunan-abu-dawud';

-- 3. Show chapters in Book 10 of Abu Dawud with their actual linked hadith count
SELECT ch.id, ch.number as chapter_num, ch.name_en, ch.total_hadiths as stored_count,
  (SELECT count(*) FROM collection_hadiths cl WHERE cl.chapter_id = ch.id) as actual_links,
  (SELECT count(*) FROM collection_hadiths cl 
   JOIN hadiths h ON h.id = cl.hadith_id 
   WHERE cl.chapter_id = ch.id AND (h.english_translation IS NULL OR h.english_translation = '')) as empty_translations
FROM chapters ch
JOIN books b ON b.id = ch.book_id
JOIN collections c ON c.id = b.collection_id
WHERE c.slug = 'sunan-abu-dawud' AND b.number = 10
ORDER BY ch.number
LIMIT 15;

-- 4. Sample: get 3 hadiths from chapter 5 of book 10 Abu Dawud
SELECT h.id, h.hadith_number, length(h.english_translation) as eng_len, length(h.arabic_text) as ar_len,
  left(h.english_translation, 80) as eng_preview
FROM collection_hadiths cl
JOIN hadiths h ON h.id = cl.hadith_id
JOIN chapters ch ON ch.id = cl.chapter_id
JOIN books b ON b.id = ch.book_id
JOIN collections c ON c.id = b.collection_id
WHERE c.slug = 'sunan-abu-dawud' AND b.number = 10 AND ch.number = 5
LIMIT 5;

-- 5. Count hadiths that have empty english_translation overall
SELECT 'Hadiths with empty english_translation' as check_name, count(*) as cnt
FROM hadiths WHERE english_translation IS NULL OR english_translation = '';

-- 6. Count hadiths that have empty arabic_text overall  
SELECT 'Hadiths with empty arabic_text' as check_name, count(*) as cnt
FROM hadiths WHERE arabic_text IS NULL OR arabic_text = '';
