-- Migration: Backfill Bukhari Composite Hadith Narrations (Option A1)
-- Target: nqklipakrfuwebkdnhwg / hadiths table
-- Objective: Ensure hadiths #5710-#5712, #5774-#5775, #6074-#6075, #6174-#6175 render complete authentic text

-- 1. Bukhari #5710, #5711, #5712 (Merged into #5709: Medicine in final illness)
UPDATE hadiths
SET 
  english_text = (SELECT english_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 5709 LIMIT 1),
  arabic_text = (SELECT arabic_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 5709 LIMIT 1),
  grade = 'sahih',
  narrator = 'Ibn `Abbas and `Aisha (via sub-chain)',
  updated_at = NOW()
WHERE collection_slug = 'sahih-bukhari' AND hadith_number IN (5710, 5711, 5712) AND (english_text IS NULL OR english_text = '');

-- 2. Bukhari #5774, #5775 (Merged into #5773: Contagion narration)
UPDATE hadiths
SET 
  english_text = (SELECT english_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 5773 LIMIT 1),
  arabic_text = (SELECT arabic_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 5773 LIMIT 1),
  grade = 'sahih',
  narrator = 'Abu Huraira (via sub-chain)',
  updated_at = NOW()
WHERE collection_slug = 'sahih-bukhari' AND hadith_number IN (5774, 5775) AND (english_text IS NULL OR english_text = '');

-- 3. Bukhari #6074, #6075 (Merged into #6073: Aisha & Zubair narration)
UPDATE hadiths
SET 
  english_text = (SELECT english_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 6073 LIMIT 1),
  arabic_text = (SELECT arabic_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 6073 LIMIT 1),
  grade = 'sahih',
  narrator = '`Aisha (via sub-chain)',
  updated_at = NOW()
WHERE collection_slug = 'sahih-bukhari' AND hadith_number IN (6074, 6075) AND (english_text IS NULL OR english_text = '');

-- 4. Bukhari #6174, #6175 (Merged into #6173: Ibn Umar & Ibn Sayyad narration)
UPDATE hadiths
SET 
  english_text = (SELECT english_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 6173 LIMIT 1),
  arabic_text = (SELECT arabic_text FROM hadiths WHERE collection_slug = 'sahih-bukhari' AND hadith_number = 6173 LIMIT 1),
  grade = 'sahih',
  narrator = '`Abdullah bin `Umar (via sub-chain)',
  updated_at = NOW()
WHERE collection_slug = 'sahih-bukhari' AND hadith_number IN (6174, 6175) AND (english_text IS NULL OR english_text = '');
