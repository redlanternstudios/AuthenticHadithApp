#!/usr/bin/env node

/**
 * Fix collection_hadiths that have NULL book_id / chapter_id.
 * For each collection, looks up the hadith_number ranges per book (from CDN metadata),
 * then assigns the correct book_id and chapter_id.
 * Also re-counts chapter/book totals.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const COLLECTIONS_MAP = {
  "sahih-bukhari": "eng-bukhari",
  "sahih-muslim": "eng-muslim",
  "jami-tirmidhi": "eng-tirmidhi",
  "sunan-abu-dawud": "eng-abudawud",
  "sunan-nasai": "eng-nasai",
  "sunan-ibn-majah": "eng-ibnmajah",
  "muwatta-malik": "eng-malik",
  "musnad-ahmad": "eng-ahmad",
};

async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fixCollection(slug) {
  console.log(`\n===== Fixing: ${slug} =====`);

  // Get collection
  const { data: coll } = await supabase.from("collections").select("id").eq("slug", slug).single();
  if (!coll) { console.log("  Collection not found"); return; }

  // Count NULL links
  const { count: nullCount } = await supabase
    .from("collection_hadiths")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", coll.id)
    .is("book_id", null);

  console.log(`  NULL book_id links: ${nullCount}`);
  if (!nullCount || nullCount === 0) {
    console.log("  No NULL links to fix");
    return;
  }

  // Get all books for this collection, ordered by number
  const { data: books } = await supabase
    .from("books")
    .select("id, number, name_en")
    .eq("collection_id", coll.id)
    .order("number");

  if (!books?.length) {
    console.log("  No books found - creating books from CDN sections...");
    // Fetch section metadata to create books
    const cdnKey = COLLECTIONS_MAP[slug];
    if (!cdnKey) { console.log("  No CDN key for " + slug); return; }

    const engData = await fetchJSON(`${CDN}/${cdnKey}.json`);
    if (!engData?.hadiths?.length) { console.log("  Failed to fetch CDN data"); return; }

    // Group hadiths by section (book_number equivalent)
    const sectionMap = new Map();
    for (const h of engData.hadiths) {
      const ref = h.reference;
      const bookNum = ref?.book || 1;
      if (!sectionMap.has(bookNum)) sectionMap.set(bookNum, []);
      sectionMap.get(bookNum).push(h.hadithnumber);
    }

    // Create books and chapters
    for (const [bookNum, hadithNums] of sectionMap) {
      const sectionName = engData.metadata?.section?.[String(bookNum)] || `Book ${bookNum}`;
      const { data: newBook } = await supabase.from("books").insert({
        collection_id: coll.id, name_en: sectionName, name_ar: "", number: bookNum,
        total_hadiths: hadithNums.length, total_chapters: 1, sort_order: bookNum,
      }).select("id").single();

      if (newBook) {
        const { data: newCh } = await supabase.from("chapters").insert({
          book_id: newBook.id, name_en: sectionName, name_ar: "", number: 1,
          total_hadiths: hadithNums.length, sort_order: 1,
        }).select("id").single();

        if (newCh) {
          // Update collection_hadiths for these hadith numbers
          for (let i = 0; i < hadithNums.length; i += 200) {
            const batch = hadithNums.slice(i, i + 200);
            await supabase.from("collection_hadiths")
              .update({ book_id: newBook.id, chapter_id: newCh.id })
              .eq("collection_id", coll.id)
              .in("hadith_number", batch)
              .is("book_id", null);
          }
        }
      }
    }
    console.log(`  Created ${sectionMap.size} books with chapters`);
    return;
  }

  // We have books. Build a hadith_number -> book mapping from the CDN.
  const cdnKey = COLLECTIONS_MAP[slug];
  if (!cdnKey) { console.log("  No CDN key for " + slug); return; }

  console.log("  Fetching CDN section data for hadith-to-book mapping...");

  // For each book number, try to fetch the section data to get hadith number ranges
  let fixed = 0;
  for (const book of books) {
    // Get or create a chapter for this book
    let { data: chapters } = await supabase
      .from("chapters")
      .select("id")
      .eq("book_id", book.id)
      .limit(1);

    let chapterId;
    if (chapters?.length) {
      chapterId = chapters[0].id;
    } else {
      const { data: newCh } = await supabase.from("chapters").insert({
        book_id: book.id, name_en: book.name_en || `Book ${book.number}`, name_ar: "",
        number: 1, total_hadiths: 0, sort_order: 1,
      }).select("id").single();
      chapterId = newCh?.id;
    }

    if (!chapterId) continue;

    // Fetch section from CDN to get hadith numbers for this book
    const secData = await fetchJSON(`${CDN}/${cdnKey}/${book.number}.min.json`);
    if (!secData?.hadiths?.length) continue;

    const hadithNums = secData.hadiths.map(h => h.hadithnumber).filter(n => Number.isInteger(n));
    if (!hadithNums.length) continue;

    // Update collection_hadiths in batches
    for (let i = 0; i < hadithNums.length; i += 200) {
      const batch = hadithNums.slice(i, i + 200);
      const { count } = await supabase.from("collection_hadiths")
        .update({ book_id: book.id, chapter_id: chapterId })
        .eq("collection_id", coll.id)
        .in("hadith_number", batch)
        .is("book_id", null)
        .select("id", { count: "exact", head: true });
      fixed += (count || 0);
    }

    // Update chapter total
    const { count: chCount } = await supabase.from("collection_hadiths")
      .select("id", { count: "exact", head: true })
      .eq("chapter_id", chapterId);
    if (chCount !== null) {
      await supabase.from("chapters").update({ total_hadiths: chCount }).eq("id", chapterId);
    }

    // Update book total
    const { count: bkCount } = await supabase.from("collection_hadiths")
      .select("id", { count: "exact", head: true })
      .eq("book_id", book.id);
    if (bkCount !== null) {
      await supabase.from("books").update({ total_hadiths: bkCount }).eq("id", book.id);
    }

    process.stdout.write(`  [Book ${book.number}: ${hadithNums.length} hadiths]\n`);
  }

  console.log(`  Fixed ${fixed} links`);

  // Final: check remaining NULLs
  const { count: remaining } = await supabase
    .from("collection_hadiths")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", coll.id)
    .is("book_id", null);
  console.log(`  Remaining NULL links: ${remaining}`);
}

async function main() {
  console.log("Fixing collection_hadiths NULL book/chapter links...\n");
  const target = process.argv[2];

  if (target) {
    await fixCollection(target);
  } else {
    for (const slug of Object.keys(COLLECTIONS_MAP)) {
      await fixCollection(slug);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
