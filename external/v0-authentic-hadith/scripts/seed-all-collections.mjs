#!/usr/bin/env node

/**
 * Enhanced Hadith Seeding Script
 * Seeds all 8 collections from fawazahmed0/hadith-api CDN
 *
 * Features:
 * - Progress tracking with ETA
 * - Resumable (skips existing data)
 * - Detailed summary report
 * - Error logging to file
 *
 * Usage:
 *   node scripts/seed-all-collections.mjs                    # Seed all
 *   node scripts/seed-all-collections.mjs sahih-bukhari      # Seed specific
 *   node scripts/seed-all-collections.mjs --status           # Check status
 *
 * Required ENV (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
  console.log("✓ Loaded environment from .env.local");
}

// Configuration
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\n❌ Missing environment variables!");
  console.error("   Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  console.error("   Required: SUPABASE_SERVICE_ROLE_KEY\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const COLLECTIONS = [
  {
    slug: "sahih-bukhari",
    eng: "eng-bukhari",
    ara: "ara-bukhari",
    display: "Sahih al-Bukhari",
    displayAr: "صحيح البخاري",
    expectedHadiths: 7563,
    scholar: "Imam Bukhari",
    scholarDates: "810-870 CE",
    isFeatured: true,
  },
  {
    slug: "sahih-muslim",
    eng: "eng-muslim",
    ara: "ara-muslim",
    display: "Sahih Muslim",
    displayAr: "صحيح مسلم",
    expectedHadiths: 7470,
    scholar: "Imam Muslim",
    scholarDates: "815-875 CE",
    isFeatured: true,
  },
  {
    slug: "jami-tirmidhi",
    eng: "eng-tirmidhi",
    ara: "ara-tirmidhi",
    display: "Jami at-Tirmidhi",
    displayAr: "جامع الترمذي",
    expectedHadiths: 3956,
    scholar: "Imam Tirmidhi",
    scholarDates: "824-892 CE",
    isFeatured: false,
  },
  {
    slug: "sunan-abu-dawud",
    eng: "eng-abudawud",
    ara: "ara-abudawud",
    display: "Sunan Abu Dawud",
    displayAr: "سنن أبي داود",
    expectedHadiths: 5274,
    scholar: "Imam Abu Dawud",
    scholarDates: "817-889 CE",
    isFeatured: true,
  },
  {
    slug: "sunan-nasai",
    eng: "eng-nasai",
    ara: "ara-nasai",
    display: "Sunan an-Nasa'i",
    displayAr: "سنن النسائي",
    expectedHadiths: 5758,
    scholar: "Imam an-Nasai",
    scholarDates: "829-915 CE",
    isFeatured: false,
  },
  {
    slug: "sunan-ibn-majah",
    eng: "eng-ibnmajah",
    ara: "ara-ibnmajah",
    display: "Sunan Ibn Majah",
    displayAr: "سنن ابن ماجه",
    expectedHadiths: 4341,
    scholar: "Imam Ibn Majah",
    scholarDates: "824-887 CE",
    isFeatured: false,
  },
  {
    slug: "muwatta-malik",
    eng: "eng-malik",
    ara: "ara-malik",
    display: "Muwatta Malik",
    displayAr: "موطأ مالك",
    expectedHadiths: 1858,
    scholar: "Imam Malik",
    scholarDates: "711-795 CE",
    isFeatured: false,
  },
  {
    slug: "musnad-ahmad",
    eng: "eng-ahmad",
    ara: "ara-ahmad",
    display: "Musnad Ahmad",
    displayAr: "مسند أحمد",
    expectedHadiths: 26363,
    scholar: "Imam Ahmad",
    scholarDates: "780-855 CE",
    isFeatured: false,
  },
];

// Ensure collections exist in database
async function ensureCollections() {
  log("Ensuring collections exist in database...");

  for (const coll of COLLECTIONS) {
    const { data: existing } = await supabase
      .from("collections")
      .select("id")
      .eq("slug", coll.slug)
      .single();

    if (!existing) {
      const { error } = await supabase.from("collections").insert({
        name_en: coll.display,
        name_ar: coll.displayAr,
        slug: coll.slug,
        description_en: `The authentic collection of hadith compiled by ${coll.scholar}.`,
        total_hadiths: 0,
        total_books: 0,
        scholar: coll.scholar,
        scholar_dates: coll.scholarDates,
        is_featured: coll.isFeatured,
        grade_distribution: { sahih: 0, hasan: 0, daif: 0 },
      });

      if (error) {
        log(`⚠️  Failed to create collection ${coll.slug}: ${error.message}`);
      } else {
        log(`✓ Created collection: ${coll.display}`);
      }
    }
  }

  log("✓ All collections ready");
}

const stats = {
  startTime: Date.now(),
  collections: {},
  errors: [],
};

function log(msg) {
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`[${timestamp}] ${msg}`);
}

function determineGrade(grades, slug) {
  if (slug === "sahih-bukhari" || slug === "sahih-muslim") return "sahih";
  if (!grades || grades.length === 0) return "hasan";
  for (const g of grades) {
    const gl = g.grade?.toLowerCase() || "";
    if (gl.includes("sahih")) return "sahih";
    if (gl.includes("hasan")) return "hasan";
    if (gl.includes("daif") || gl.includes("da'if") || gl.includes("weak"))
      return "daif";
  }
  return "hasan";
}

function extractNarrator(text) {
  if (!text) return "";
  const m = text.match(
    /^(?:Narrated|It was narrated (?:from|that)|It is narrated on the authority of)\s+([^:]{3,80}):/i,
  );
  if (m) return m[1].replace(/\(.*?\)/g, "").trim();
  return "";
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  return null;
}

async function checkStatus() {
  console.log("\n📊 COLLECTION STATUS\n" + "=".repeat(60));

  for (const coll of COLLECTIONS) {
    const { data: dbColl } = await supabase
      .from("collections")
      .select("id, total_hadiths")
      .eq("slug", coll.slug)
      .single();

    if (!dbColl) {
      console.log(`❌ ${coll.display.padEnd(25)} NOT IN DATABASE`);
      continue;
    }

    const { count } = await supabase
      .from("collection_hadiths")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", dbColl.id);

    const current = count || 0;
    const expected = coll.expectedHadiths;
    const pct = ((current / expected) * 100).toFixed(1);
    const status =
      current >= expected * 0.95 ? "✅" : current > 0 ? "🔄" : "⬜";

    console.log(
      `${status} ${coll.display.padEnd(25)} ${String(current).padStart(6)} / ${expected} (${pct}%)`,
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("Legend: ✅ Complete | 🔄 Partial | ⬜ Empty\n");
}

async function seedCollection(collConfig) {
  const { slug, eng, ara, display, expectedHadiths } = collConfig;
  log(`\n${"=".repeat(50)}`);
  log(`SEEDING: ${display}`);
  log(`${"=".repeat(50)}`);

  stats.collections[slug] = {
    inserted: 0,
    skipped: 0,
    errors: 0,
    startTime: Date.now(),
  };

  // Get collection from DB
  const { data: coll, error: collError } = await supabase
    .from("collections")
    .select("id")
    .eq("slug", slug)
    .single();

  if (collError || !coll) {
    log(`❌ Collection not found in database: ${slug}`);
    stats.collections[slug].errors++;
    return;
  }

  // Get existing hadith numbers
  const { data: existingLinks } = await supabase
    .from("collection_hadiths")
    .select("hadith_number")
    .eq("collection_id", coll.id);

  const existingNumbers = new Set(
    (existingLinks || []).map((l) => l.hadith_number),
  );
  log(`📦 Existing hadiths: ${existingNumbers.size} / ~${expectedHadiths}`);

  if (existingNumbers.size >= expectedHadiths * 0.95) {
    log(`✅ Collection appears complete, skipping...`);
    stats.collections[slug].skipped = existingNumbers.size;
    return;
  }

  let totalInserted = 0;
  let consecutiveMisses = 0;
  let lastProgressLog = Date.now();

  for (let secNum = 1; secNum <= 200; secNum++) {
    // Fetch English section
    const engData = await fetchJSON(`${CDN}/${eng}/${secNum}.min.json`);
    if (!engData) {
      consecutiveMisses++;
      if (consecutiveMisses >= 5) {
        log(`📑 Completed at section ${secNum - 1}`);
        break;
      }
      continue;
    }
    consecutiveMisses = 0;

    if (!engData.hadiths || engData.hadiths.length === 0) continue;

    // Fetch Arabic section
    const araData = await fetchJSON(`${CDN}/${ara}/${secNum}.min.json`);
    const arabicMap = new Map();
    if (araData?.hadiths) {
      for (const h of araData.hadiths) arabicMap.set(h.hadithnumber, h.text);
    }

    // Ensure book exists
    const sectionName =
      engData.metadata?.section?.[String(secNum)] || `Book ${secNum}`;
    const { data: existingBook } = await supabase
      .from("books")
      .select("id")
      .eq("collection_id", coll.id)
      .eq("number", secNum)
      .single();

    let bookId;
    if (existingBook) {
      bookId = existingBook.id;
      await supabase
        .from("books")
        .update({ name_en: sectionName, total_hadiths: engData.hadiths.length })
        .eq("id", bookId);
    } else {
      const { data: newBook } = await supabase
        .from("books")
        .insert({
          collection_id: coll.id,
          name_en: sectionName,
          name_ar: "",
          number: secNum,
          total_hadiths: engData.hadiths.length,
          total_chapters: 1,
          sort_order: secNum,
        })
        .select("id")
        .single();

      if (!newBook) {
        log(`⚠️  Failed to create book ${secNum}`);
        stats.collections[slug].errors++;
        continue;
      }
      bookId = newBook.id;
    }

    // Ensure chapter
    const { data: existingCh } = await supabase
      .from("chapters")
      .select("id")
      .eq("book_id", bookId)
      .limit(1)
      .single();

    let chapterId;
    if (existingCh) {
      chapterId = existingCh.id;
    } else {
      const { data: newCh } = await supabase
        .from("chapters")
        .insert({
          book_id: bookId,
          name_en: sectionName,
          name_ar: "",
          number: 1,
          total_hadiths: engData.hadiths.length,
          sort_order: 1,
        })
        .select("id")
        .single();

      if (!newCh) {
        log(`⚠️  Failed to create chapter for book ${secNum}`);
        stats.collections[slug].errors++;
        continue;
      }
      chapterId = newCh.id;
    }

    // Filter existing
    const newHadiths = engData.hadiths.filter(
      (h) => !existingNumbers.has(h.hadithnumber),
    );
    stats.collections[slug].skipped +=
      engData.hadiths.length - newHadiths.length;

    if (newHadiths.length === 0) {
      process.stdout.write(".");
      continue;
    }

    // Insert in batches of 50
    for (let i = 0; i < newHadiths.length; i += 50) {
      const batch = newHadiths.slice(i, i + 50);
      const rows = batch.map((h) => ({
        hadith_number: h.hadithnumber,
        book_number: secNum,
        arabic_text: arabicMap.get(h.hadithnumber) || "",
        english_translation: h.text || "",
        narrator: extractNarrator(h.text),
        grade: determineGrade(h.grades, slug),
        reference: `${display} ${h.hadithnumber}`,
        collection: slug,
        is_featured: false,
      }));

      const { data: inserted, error } = await supabase
        .from("hadiths")
        .insert(rows)
        .select("id, hadith_number");

      if (error) {
        log(`⚠️  Batch error sec ${secNum}: ${error.message}`);
        stats.collections[slug].errors++;
        stats.errors.push({
          collection: slug,
          section: secNum,
          error: error.message,
        });
        continue;
      }

      if (inserted?.length > 0) {
        const links = inserted.map((h) => ({
          collection_id: coll.id,
          book_id: bookId,
          chapter_id: chapterId,
          hadith_id: h.id,
          hadith_number: h.hadith_number,
        }));
        await supabase.from("collection_hadiths").insert(links);
        totalInserted += inserted.length;
        stats.collections[slug].inserted += inserted.length;
        for (const h of inserted) existingNumbers.add(h.hadith_number);
      }
    }

    // Progress log every 10 seconds
    if (Date.now() - lastProgressLog > 10000) {
      const pct = ((existingNumbers.size / expectedHadiths) * 100).toFixed(1);
      log(
        `📈 Progress: ${existingNumbers.size}/${expectedHadiths} (${pct}%) | Section ${secNum}`,
      );
      lastProgressLog = Date.now();
    }

    process.stdout.write(`[${secNum}:+${newHadiths.length}]`);
  }

  // Update collection total
  const { count } = await supabase
    .from("collection_hadiths")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", coll.id);

  if (count !== null) {
    await supabase
      .from("collections")
      .update({ total_hadiths: count })
      .eq("id", coll.id);
  }

  const elapsed = (
    (Date.now() - stats.collections[slug].startTime) /
    1000
  ).toFixed(1);
  log(`\n✅ DONE: +${totalInserted} inserted in ${elapsed}s | Total: ${count}`);
}

function printSummary() {
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);

  console.log("\n\n" + "=".repeat(60));
  console.log("📊 SEEDING SUMMARY");
  console.log("=".repeat(60) + "\n");

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [slug, data] of Object.entries(stats.collections)) {
    const coll = COLLECTIONS.find((c) => c.slug === slug);
    console.log(`${coll.display}`);
    console.log(
      `   Inserted: ${data.inserted} | Skipped: ${data.skipped} | Errors: ${data.errors}`,
    );
    totalInserted += data.inserted;
    totalSkipped += data.skipped;
    totalErrors += data.errors;
  }

  console.log("\n" + "-".repeat(40));
  console.log(
    `TOTAL: +${totalInserted} inserted, ${totalSkipped} skipped, ${totalErrors} errors`,
  );
  console.log(`TIME: ${elapsed} minutes`);
  console.log("=".repeat(60) + "\n");

  if (stats.errors.length > 0) {
    console.log("⚠️  ERRORS:");
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`   ${err.collection} sec${err.section}: ${err.error}`);
    }
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }
}

async function main() {
  const targetSlug = process.argv[2];

  console.log("\n🌙 Authentic Hadith - Data Seeding Script");
  console.log("=========================================\n");

  if (targetSlug === "--status") {
    await checkStatus();
    return;
  }

  if (targetSlug === "--help") {
    console.log("Usage:");
    console.log(
      "  node seed-all-collections.mjs           Seed all collections",
    );
    console.log(
      "  node seed-all-collections.mjs <slug>    Seed specific collection",
    );
    console.log(
      "  node seed-all-collections.mjs --status  Check seeding status",
    );
    console.log("\nCollection slugs:");
    for (const c of COLLECTIONS) {
      console.log(`  ${c.slug.padEnd(20)} ${c.display}`);
    }
    return;
  }

  if (targetSlug) {
    const config = COLLECTIONS.find((c) => c.slug === targetSlug);
    if (!config) {
      console.log(`❌ Unknown collection: ${targetSlug}`);
      console.log("\nValid options:");
      for (const c of COLLECTIONS) {
        console.log(`  ${c.slug}`);
      }
      process.exit(1);
    }
    await ensureCollections();
    await seedCollection(config);
  } else {
    console.log("🚀 Seeding all 8 collections...\n");
    await ensureCollections();
    for (const config of COLLECTIONS) {
      await seedCollection(config);
    }
  }

  printSummary();
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
