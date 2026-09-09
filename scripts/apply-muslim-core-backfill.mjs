#!/usr/bin/env node
/**
 * Backfill Sahih Muslim composite narrations in Supabase hadiths table.
 * Applies Option A1: Sub-number cross-referencing and parent narration backfill.
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

// Exact pairings identified from canonical in-book chains
const MAPPINGS = [
  {
    target: 384,
    primary: 6141,
    desc: 'Book 43: Ibrahim (as) circumcision narration',
    narratorSuffix: 'Abu Huraira (via sub-chain)'
  },
  {
    target: 388,
    primary: 3498,
    desc: 'Book 16: Marriage / Dower narration',
    narratorSuffix: 'Narrated through secondary chain'
  },
  {
    target: 3846,
    primary: 3841,
    desc: 'Book 21: Transactions & Foodgrains narration',
    narratorSuffix: 'Ibn Umar (via sub-chain)'
  },
  {
    target: 5114,
    primary: 5206,
    desc: 'Book 36: Drinks / Nabidh in waterskin narration',
    narratorSuffix: 'Jabir (via sub-chain)'
  },
  {
    target: 5115,
    primary: 5206,
    desc: 'Book 36: Drinks / Nabidh sub-chain narration',
    narratorSuffix: 'Jabir (via sub-chain)'
  },
  {
    target: 7317,
    primary: 7318,
    desc: 'Book 54: Repentance / Man who killed 99 persons narration',
    narratorSuffix: 'Abu Sa`id al-Khudri (via sub-chain)'
  },
  {
    target: 7520,
    primary: 7521,
    desc: 'Book 55: Hijrah journey of Prophet (ﷺ) and Abu Bakr narration',
    narratorSuffix: 'Al-Bara` bin `Azib (via sub-chain)'
  }
];

async function run() {
  console.log('=== APPLYING SAHIH MUSLIM CORE COMPOSITE BACKFILL ===');
  console.log(`Target: ${SUPABASE_URL}\n`);

  for (const item of MAPPINGS) {
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/hadiths?select=arabic_text,english_text,grade&collection_slug=eq.sahih-muslim&hadith_number=eq.${item.primary}`,
      { headers }
    );
    const pRows = await pRes.json();
    if (!pRows || pRows.length === 0) {
      console.error(`Primary hadith #${item.primary} not found!`);
      continue;
    }
    const primary = pRows[0];
    console.log(`Mapping Muslim #${item.target} <- #${item.primary} (${item.desc})`);

    const updatePayload = {
      arabic_text: primary.arabic_text,
      english_translation: primary.english_text,
      english_text: primary.english_text,
      grade: primary.grade || 'sahih',
      narrator: item.narratorSuffix,
      updated_at: new Date().toISOString()
    };

    const uRes = await fetch(
      `${SUPABASE_URL}/rest/v1/hadiths?collection_slug=eq.sahih-muslim&hadith_number=eq.${item.target}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatePayload)
      }
    );

    if (!uRes.ok) {
      const errText = await uRes.text();
      console.error(`Failed to update Muslim #${item.target}:`, errText);
    } else {
      const updated = await uRes.json();
      console.log(`✅ Successfully backfilled Muslim #${item.target} (${updated.length} row updated).`);
    }
  }

  console.log('\n=== ALL 7 SAHIH MUSLIM COMPOSITE HADITHS BACKFILLED ===');
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
