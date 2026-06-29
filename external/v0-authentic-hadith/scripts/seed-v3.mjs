#!/usr/bin/env node

/**
 * Hadith Seeding Script v3
 * Fetches full collections from fawazahmed0/hadith-api CDN
 * Uses /editions/{collection}.json for complete data in one request
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\n❌ Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const COLLECTIONS = [
  { slug: "sahih-bukhari", eng: "eng-bukhari", ara: "ara-bukhari", display: "Sahih al-Bukhari", displayAr: "صحيح البخاري", expected: 7563, scholar: "Imam Bukhari", dates: "810-870 CE", featured: true },
  { slug: "sahih-muslim", eng: "eng-muslim", ara: "ara-muslim", display: "Sahih Muslim", displayAr: "صحيح مسلم", expected: 7470, scholar: "Imam Muslim", dates: "815-875 CE", featured: true },
  { slug: "jami-tirmidhi", eng: "eng-tirmidhi", ara: "ara-tirmidhi", display: "Jami at-Tirmidhi", displayAr: "جامع الترمذي", expected: 3956, scholar: "Imam Tirmidhi", dates: "824-892 CE", featured: false },
  { slug: "sunan-abu-dawud", eng: "eng-abudawud", ara: "ara-abudawud", display: "Sunan Abu Dawud", displayAr: "سنن أبي داود", expected: 5274, scholar: "Imam Abu Dawud", dates: "817-889 CE", featured: true },
  { slug: "sunan-nasai", eng: "eng-nasai", ara: "ara-nasai", display: "Sunan an-Nasa'i", displayAr: "سنن النسائي", expected: 5758, scholar: "Imam an-Nasai", dates: "829-915 CE", featured: false },
  { slug: "sunan-ibn-majah", eng: "eng-ibnmajah", ara: "ara-ibnmajah", display: "Sunan Ibn Majah", displayAr: "سنن ابن ماجه", expected: 4341, scholar: "Imam Ibn Majah", dates: "824-887 CE", featured: false },
  { slug: "muwatta-malik", eng: "eng-malik", ara: "ara-malik", display: "Muwatta Malik", displayAr: "موطأ مالك", expected: 1858, scholar: "Imam Malik", dates: "711-795 CE", featured: false },
  { slug: "musnad-ahmad", eng: "eng-ahmad", ara: "ara-ahmad", display: "Musnad Ahmad", displayAr: "مسند أحمد", expected: 26363, scholar: "Imam Ahmad", dates: "780-855 CE", featured: false },
];

function log(msg) {
  const ts = new Date().toISOString().substr(11, 8);
  console.log(`[${ts}] ${msg}`);
}

function determineGrade(grades, slug) {
  if (slug === "sahih-bukhari" || slug === "sahih-muslim") return "sahih";
  if (!grades?.length) return "hasan";
  for (const g of grades) {
    const gl = (g.grade || "").toLowerCase();
    if (gl.includes("sahih")) return "sahih";
    if (gl.includes("hasan")) return "hasan";
    if (gl.includes("daif") || gl.includes("weak")) return "daif";
  }
  return "hasan";
}

function extractNarrator(text) {
  if (!text) return "";
  const m = text.match(/^(?:Narrated|It was narrated|It is narrated on the authority of)\s+([^:]{3,80}):/i);
  return m ? m[1].replace(/\(.*?\)/g, "").trim() : "";
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function ensureCollection(coll) {
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("slug", coll.slug)
    .single();
  
  if (existing) return existing.id;
  
  const { data: created, error } = await supabase
    .from("collections")
    .insert({
      name_en: coll.display,
      name_ar: coll.displayAr,
      slug: coll.slug,
      scholar: coll.scholar,
      scholar_dates: coll.dates,
      is_featured: coll.featured,
      total_hadiths: 0,
      total_books: 0,
    })
    .select("id")
    .single();
  
  if (error) {
    log(`❌ Failed to create collection: ${error.message}`);
    return null;
  }
  
  log(`✓ Created collection: ${coll.display}`);
  return created.id;
}

async function seedCollection(coll) {
  log(`\n${"=".repeat(50)}`);
  log(`SEEDING: ${coll.display}`);
  log(`${"=".repeat(50)}`);
  
  const collectionId = await ensureCollection(coll);
  if (!collectionId) return { inserted: 0, errors: 1 };
  
  // Get existing hadith numbers for this collection
  const { data: existingLinks } = await supabase
    .from("collection_hadiths")
    .select("hadith_number")
    .eq("collection_id", collectionId);
  
  const existingNums = new Set((existingLinks || []).map(l => l.hadith_number));
  log(`📦 Existing: ${existingNums.size} / ~${coll.expected}`);
  
  if (existingNums.size >= coll.expected * 0.95) {
    log(`✅ Collection appears complete, skipping...`);
    return { inserted: 0, skipped: existingNums.size, errors: 0 };
  }
  
  // Fetch FULL collection at once (not section by section)
  log(`📥 Fetching full English collection...`);
  const engData = await fetchJSON(`${CDN}/${coll.eng}.json`);
  if (!engData?.hadiths?.length) {
    log(`❌ Failed to fetch English hadiths`);
    return { inserted: 0, errors: 1 };
  }
  log(`📥 Got ${engData.hadiths.length} English hadiths`);
  
  log(`📥 Fetching full Arabic collection...`);
  const araData = await fetchJSON(`${CDN}/${coll.ara}.json`);
  const arabicMap = new Map();
  if (araData?.hadiths) {
    for (const h of araData.hadiths) arabicMap.set(h.hadithnumber, h.text);
    log(`📥 Got ${araData.hadiths.length} Arabic hadiths`);
  }
  
  // Filter out existing and hadiths with decimal numbers (variants like 402.2)
  const newHadiths = engData.hadiths.filter(h => {
    if (existingNums.has(h.hadithnumber)) return false;
    // Skip decimal hadith numbers (they cause integer column errors)
    if (typeof h.hadithnumber === 'number' && !Number.isInteger(h.hadithnumber)) return false;
    if (typeof h.hadithnumber === 'string' && h.hadithnumber.includes('.')) return false;
    return true;
  });
  log(`📝 New hadiths to insert: ${newHadiths.length}`);
  
  if (!newHadiths.length) {
    log(`✅ All hadiths already exist`);
    return { inserted: 0, errors: 0 };
  }
  
  let totalInserted = 0;
  let errors = 0;
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < newHadiths.length; i += BATCH_SIZE) {
    const batch = newHadiths.slice(i, i + BATCH_SIZE);
    const rows = batch.map(h => ({
      // Original table columns
      text_arabic: arabicMap.get(h.hadithnumber) || "لا يوجد نص عربي",
      text_translation: h.text || "",
      chain_of_narration: extractNarrator(h.text),
      grade: determineGrade(h.grades, coll.slug),
      status: "published",
      verification: {
        content_hash: `cdn-${coll.slug}-${h.hadithnumber}`,
        source_id: coll.slug,
        verified_at: new Date().toISOString(),
        verification_method: "cdn-import",
        verification_signature: "auto-seeded"
      },
      // New columns
      hadith_number: h.hadithnumber,
      book_number: h.reference?.book || 1,
      arabic_text: arabicMap.get(h.hadithnumber) || "",
      english_translation: h.text || "",
      narrator: extractNarrator(h.text),
      reference: `${coll.display} ${h.hadithnumber}`,
      collection: coll.slug,
      is_featured: false,
    }));
    
    const { data: inserted, error } = await supabase
      .from("hadiths")
      .insert(rows)
      .select("id, hadith_number");
    
    if (error) {
      log(`⚠️  Batch ${Math.floor(i/BATCH_SIZE)+1} error: ${error.message}`);
      errors++;
      continue;
    }
    
    if (inserted?.length) {
      // Link to collection
      const links = inserted.map(h => ({
        collection_id: collectionId,
        hadith_id: h.id,
        hadith_number: h.hadith_number,
        book_id: null,
        chapter_id: null,
      }));
      
      await supabase.from("collection_hadiths").insert(links);
      totalInserted += inserted.length;
      for (const h of inserted) existingNums.add(h.hadith_number);
    }
    
    // Progress indicator
    const pct = Math.round((i + batch.length) / newHadiths.length * 100);
    process.stdout.write(`\r📊 Progress: ${pct}% (${totalInserted}/${newHadiths.length})`);
  }
  
  // Update collection total
  const { count } = await supabase
    .from("collection_hadiths")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);
  
  if (count !== null) {
    await supabase.from("collections")
      .update({ total_hadiths: count })
      .eq("id", collectionId);
  }
  
  console.log(); // New line after progress
  log(`✅ DONE: +${totalInserted} inserted | Total: ${count}`);
  return { inserted: totalInserted, errors };
}

async function main() {
  const target = process.argv[2];
  
  console.log("\n🌙 Authentic Hadith - Seeding Script v3 (Full Collection Fetch)");
  console.log("=".repeat(50) + "\n");
  
  if (target === "--status") {
    for (const c of COLLECTIONS) {
      const { data } = await supabase.from("collections").select("id, total_hadiths").eq("slug", c.slug).single();
      const status = !data ? "❌ NOT IN DB" : data.total_hadiths >= c.expected * 0.95 ? "✅" : `🔄 ${data.total_hadiths}/${c.expected}`;
      console.log(`${status.padEnd(20)} ${c.display}`);
    }
    return;
  }
  
  let totalInserted = 0;
  let totalErrors = 0;
  const startTime = Date.now();
  
  const targets = target ? [COLLECTIONS.find(c => c.slug === target)].filter(Boolean) : COLLECTIONS;
  
  if (target && !targets.length) {
    console.log(`❌ Unknown collection: ${target}`);
    console.log("Valid slugs:", COLLECTIONS.map(c => c.slug).join(", "));
    process.exit(1);
  }
  
  for (const c of targets) {
    const result = await seedCollection(c);
    totalInserted += result.inserted || 0;
    totalErrors += result.errors || 0;
  }
  
  const mins = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log("\n" + "=".repeat(50));
  console.log(`📊 SUMMARY: +${totalInserted} hadiths, ${totalErrors} errors, ${mins} minutes`);
  console.log("=".repeat(50) + "\n");
}

main().catch(console.error);
