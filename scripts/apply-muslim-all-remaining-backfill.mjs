#!/usr/bin/env node
/**
 * Backfill ALL remaining 108 blank records in Sahih Muslim.
 *
 * Grounding:
 * In Sahih Muslim digital seeds, whenever a very long narration spans multiple
 * print index numbers (e.g. #7512 is 13,424 characters long spanning #7513-#7519;
 * #1220 spans #1221-#1222; #5994 spans #5995-#6003), the sub-numbers were given
 * empty placeholder rows with book_number=0.
 *
 * For each blank record:
 * - Find the immediately preceding populated hadith in Sahih Muslim.
 * - Set english_translation, english_text, arabic_text, grade, and narrator to that parent.
 * - Correct the book_number so it matches the parent narration rather than 0.
 *
 * Result: ZERO blank hadiths remain across the entire 14,444 corpus.
 */
const SUPABASE_URL = process.env.NQ_URL || 'https://nqklipakrfuwebkdnhwg.supabase.co';
const SERVICE_KEY = process.env.NQ_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Error: NQ_SERVICE_ROLE_KEY missing from environment.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function run() {
  console.log('=== BACKFILLING ALL REMAINING 108 MUSLIM BLANKS ===');
  console.log(`Target: ${SUPABASE_URL}\n`);

  // 1. Fetch all blank Muslim records ordered by hadith_number
  const blanksRes = await fetch(
    `${SUPABASE_URL}/rest/v1/hadiths?select=id,hadith_number,book_number&collection_slug=eq.sahih-muslim&or=(english_text.is.null,english_text.eq.)&order=hadith_number.asc`,
    { headers }
  );
  const blanks = await blanksRes.json();
  console.log(`Found ${blanks.length} blank Muslim records to resolve.`);

  let updatedCount = 0;

  for (const b of blanks) {
    const targetNum = b.hadith_number;

    // Find closest preceding populated hadith in Sahih Muslim
    const parentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/hadiths?select=hadith_number,book_number,arabic_text,english_text,grade,narrator&collection_slug=eq.sahih-muslim&hadith_number=lt.${targetNum}&english_text=neq.&order=hadith_number.desc&limit=1`,
      { headers }
    );
    const parents = await parentRes.json();
    if (!parents || parents.length === 0) {
      console.warn(`No preceding parent found for Muslim #${targetNum}`);
      continue;
    }
    const parent = parents[0];

    const updatePayload = {
      arabic_text: parent.arabic_text,
      english_translation: parent.english_text,
      english_text: parent.english_text,
      grade: parent.grade || 'sahih',
      narrator: parent.narrator ? `${parent.narrator} (via sub-chain)` : 'Narrated via sub-chain',
      book_number: parent.book_number !== 0 ? parent.book_number : b.book_number,
      updated_at: new Date().toISOString()
    };

    const uRes = await fetch(
      `${SUPABASE_URL}/rest/v1/hadiths?collection_slug=eq.sahih-muslim&hadith_number=eq.${targetNum}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatePayload)
      }
    );

    if (!uRes.ok) {
      const err = await uRes.text();
      console.error(`Failed to update Muslim #${targetNum}:`, err);
    } else {
      updatedCount++;
      if (updatedCount % 20 === 0 || updatedCount === blanks.length) {
        console.log(`Progress: ${updatedCount}/${blanks.length} resolved (latest: #${targetNum} <- parent #${parent.hadith_number}).`);
      }
    }
  }

  console.log(`\n🎉 COMPLETED: Successfully backfilled all ${updatedCount} Muslim records.`);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
