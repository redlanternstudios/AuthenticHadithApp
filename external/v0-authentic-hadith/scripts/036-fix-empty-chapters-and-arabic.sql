-- Fix 1: Delete chapters that have 0 actual collection_hadiths links
-- These are ghost chapters created by a seed script with fake counts

DELETE FROM chapters
WHERE id IN (
  SELECT ch.id
  FROM chapters ch
  LEFT JOIN collection_hadiths cl ON cl.chapter_id = ch.id
  GROUP BY ch.id
  HAVING count(cl.id) = 0
);

-- Fix 2: Update remaining chapter total_hadiths to match actual link count
UPDATE chapters
SET total_hadiths = sub.actual_count
FROM (
  SELECT ch.id, count(cl.id) as actual_count
  FROM chapters ch
  LEFT JOIN collection_hadiths cl ON cl.chapter_id = ch.id
  GROUP BY ch.id
) sub
WHERE chapters.id = sub.id AND chapters.total_hadiths != sub.actual_count;

-- Fix 3: Update book total_hadiths to match actual links
UPDATE books
SET total_hadiths = sub.actual_count
FROM (
  SELECT b.id, count(cl.id) as actual_count
  FROM books b
  LEFT JOIN collection_hadiths cl ON cl.book_id = b.id
  GROUP BY b.id
) sub
WHERE books.id = sub.id AND books.total_hadiths != sub.actual_count;

-- Fix 4: Update book total_chapters to match actual chapter count
UPDATE books
SET total_chapters = sub.ch_count
FROM (
  SELECT b.id, count(ch.id) as ch_count
  FROM books b
  LEFT JOIN chapters ch ON ch.book_id = b.id
  GROUP BY b.id
) sub
WHERE books.id = sub.id AND books.total_chapters != sub.ch_count;

-- Fix 5: Update collection total_hadiths
UPDATE collections
SET total_hadiths = sub.actual_count
FROM (
  SELECT c.id, count(cl.id) as actual_count
  FROM collections c
  LEFT JOIN collection_hadiths cl ON cl.collection_id = c.id
  GROUP BY c.id
) sub
WHERE collections.id = sub.id AND collections.total_hadiths != sub.actual_count;

-- Fix 6: Update collection total_books
UPDATE collections
SET total_books = sub.book_count
FROM (
  SELECT c.id, count(DISTINCT b.id) as book_count
  FROM collections c
  LEFT JOIN books b ON b.collection_id = c.id
  GROUP BY c.id
) sub
WHERE collections.id = sub.id AND collections.total_books != sub.book_count;
