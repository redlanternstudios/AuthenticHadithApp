// Seed all hadith data from fawazahmed0 CDN using direct REST API calls
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nqklipakrfuwebkdnhwg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY required"); process.exit(1); }

const H = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function dbGet(table, q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, { headers: H });
  return r.ok ? await r.json() : [];
}
async function dbInsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: H, body: JSON.stringify(rows) });
  if (!r.ok) { console.log(`  INSERT ${table} err:`, await r.text()); return null; }
  return await r.json();
}
async function dbUpdate(table, data, q) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, { method: "PATCH", headers: H, body: JSON.stringify(data) });
}
async function dbCount(table, q) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}&select=id`, { headers: { ...H, "Prefer": "count=exact", "Range": "0-0" } });
  const c = r.headers.get("content-range");
  return c ? parseInt(c.split("/")[1], 10) : 0;
}

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const COLLS = [
  { slug: "jami-tirmidhi", eng: "eng-tirmidhi", ara: "ara-tirmidhi", display: "Jami at-Tirmidhi" },
  { slug: "sunan-ibn-majah", eng: "eng-ibnmajah", ara: "ara-ibnmajah", display: "Sunan Ibn Majah" },
  { slug: "sunan-abu-dawud", eng: "eng-abudawud", ara: "ara-abudawud", display: "Sunan Abu Dawud" },
  { slug: "sahih-muslim", eng: "eng-muslim", ara: "ara-muslim", display: "Sahih Muslim" },
  { slug: "sunan-nasai", eng: "eng-nasai", ara: "ara-nasai", display: "Sunan an-Nasai" },
  { slug: "sahih-bukhari", eng: "eng-bukhari", ara: "ara-bukhari", display: "Sahih al-Bukhari" },
  { slug: "muwatta-malik", eng: "eng-malik", ara: "ara-malik", display: "Muwatta Malik" },
  { slug: "musnad-ahmad", eng: "eng-ahmad", ara: "ara-ahmad", display: "Musnad Ahmad" },
];

function grade(grades, slug) {
  if (slug === "sahih-bukhari" || slug === "sahih-muslim") return "sahih";
  if (!grades || !grades.length) return "hasan";
  for (const g of grades) {
    const l = g.grade.toLowerCase();
    if (l.includes("sahih")) return "sahih";
    if (l.includes("hasan")) return "hasan";
    if (l.includes("daif") || l.includes("da'if") || l.includes("weak")) return "daif";
  }
  return "hasan";
}

function narrator(text) {
  if (!text) return "";
  const m = text.match(/^(?:Narrated|It was narrated (?:from|that)|It is narrated on the authority of)\s+([^:]{3,80}):/i);
  return m ? m[1].replace(/\(.*?\)/g, "").trim() : "";
}

async function fetchJ(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
}

async function seed(c) {
  console.log(`\n=== SEEDING: ${c.display} ===`);
  const colls = await dbGet("collections", `slug=eq.${c.slug}&select=id`);
  if (!colls.length) { console.log("  Not in DB, skip"); return; }
  const collId = colls[0].id;

  const existLinks = await dbGet("collection_hadiths", `collection_id=eq.${collId}&select=hadith_number&limit=50000`);
  const existing = new Set(existLinks.map(l => l.hadith_number));
  console.log(`  Existing: ${existing.size}`);

  const existBooks = await dbGet("books", `collection_id=eq.${collId}&select=id,number`);
  const bookMap = new Map(existBooks.map(b => [b.number, b.id]));

  let inserted = 0, misses = 0;

  for (let s = 1; s <= 200; s++) {
    const eng = await fetchJ(`${CDN}/${c.eng}/${s}.min.json`);
    if (!eng) { misses++; if (misses >= 5) break; continue; }
    misses = 0;
    if (!eng.hadiths?.length) continue;

    const ara = await fetchJ(`${CDN}/${c.ara}/${s}.min.json`);
    const arMap = new Map();
    if (ara?.hadiths) for (const h of ara.hadiths) arMap.set(h.hadithnumber, h.text);

    const name = eng.metadata?.section?.[String(s)] || `Book ${s}`;

    let bookId = bookMap.get(s);
    if (bookId) {
      await dbUpdate("books", { name_en: name, total_hadiths: eng.hadiths.length }, `id=eq.${bookId}`);
    } else {
      const res = await dbInsert("books", [{ collection_id: collId, name_en: name, name_ar: "", number: s, total_hadiths: eng.hadiths.length, total_chapters: 1, sort_order: s }]);
      if (!res?.length) continue;
      bookId = res[0].id;
      bookMap.set(s, bookId);
    }

    const existCh = await dbGet("chapters", `book_id=eq.${bookId}&select=id&limit=1`);
    let chId;
    if (existCh.length) { chId = existCh[0].id; }
    else {
      const res = await dbInsert("chapters", [{ book_id: bookId, name_en: name, name_ar: "", number: 1, total_hadiths: eng.hadiths.length, sort_order: 1 }]);
      if (!res?.length) continue;
      chId = res[0].id;
    }

    const newH = eng.hadiths.filter(h => !existing.has(h.hadithnumber));
    if (!newH.length) continue;

    for (let i = 0; i < newH.length; i += 50) {
      const batch = newH.slice(i, i + 50);
      const rows = batch.map(h => ({
        hadith_number: h.hadithnumber, book_number: s,
        arabic_text: arMap.get(h.hadithnumber) || "",
        english_translation: h.text || "",
        narrator: narrator(h.text),
        grade: grade(h.grades, c.slug),
        reference: `${c.display} ${h.hadithnumber}`,
        collection: c.slug, is_featured: false,
      }));

      const ins = await dbInsert("hadiths", rows);
      if (!ins?.length) continue;

      const links = ins.map(h => ({ collection_id: collId, book_id: bookId, chapter_id: chId, hadith_id: h.id, hadith_number: h.hadith_number }));
      await dbInsert("collection_hadiths", links);
      inserted += ins.length;
      for (const h of ins) existing.add(h.hadith_number);
    }
    console.log(`  Book ${s} (${name}): +${newH.length}`);
  }

  const total = await dbCount("collection_hadiths", `collection_id=eq.${collId}`);
  const books = await dbCount("books", `collection_id=eq.${collId}`);
  await dbUpdate("collections", { total_hadiths: total, total_books: books }, `id=eq.${collId}`);
  console.log(`  DONE: +${inserted}, total=${total}, books=${books}`);
}

async function main() {
  console.log("Starting full hadith seed...");
  const t = Date.now();
  for (const c of COLLS) await seed(c);
  console.log(`\nDone in ${((Date.now()-t)/1000).toFixed(1)}s`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
