#!/usr/bin/env node
/**
 * Backfill Bukhari composite hadith narrations in Supabase hadiths table.
 * Applies Option A1: Sub-number cross-referencing and text backfill.
 */
import fs from 'fs';
import path from 'path';

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

const MAPPINGS = [
  {
    primary: 5709,
    subNumbers: [5710, 5711, 5712],
    narratorSuffix: 'Ibn `Abbas and `Aisha (via sub-chain)',
  },
  {
    primary: 5773,
    subNumbers: [5774, 5775],
    narratorSuffix: 'Abu Huraira (via sub-chain)',
  },
  {
    primary: 6073,
    subNumbers: [6074, 6075],
    narratorSuffix: '`Aisha (via sub-chain)',
  },
  {
    primary: 6173,
    subNumbers: [6174, 6175],
    narratorSuffix: '`Abdullah bin `Umar (via sub-chain)',
  }
];

async function run() {
  console.log('=== APPLYING BUKHARI COMPOSITE HADITH BACKFILL ===');
  console.log(`Target: ${SUPABASE_URL}\n`);

  for (const group of MAPPINGS) {
    // 1. Fetch primary parent record
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/hadiths?select=arabic_text,english_text,grade&collection_slug=eq.sahih-bukhari&hadith_number=eq.${group.primary}`,
      { headers }
    );
    const pRows = await pRes.json();
    if (!pRows || pRows.length === 0) {
      console.error(`Primary hadith #${group.primary} not found!`);
      continue;
    }
    const primary = pRows[0];
    console.log(`Fetched primary #${group.primary}: Arabic len=${primary.arabic_text?.length}, EN len=${primary.english_text?.length}`);

    // 2. Update each sub-number
    for (const subNum of group.subNumbers) {
      const updatePayload = {
        arabic_text: primary.arabic_text,
        english_translation: primary.english_text,
        english_text: primary.english_text,
        grade: primary.grade || 'sahih',
        narrator: group.narratorSuffix,
        updated_at: new Date().toISOString()
      };

      const uRes = await fetch(
        `${SUPABASE_URL}/rest/v1/hadiths?collection_slug=eq.sahih-bukhari&hadith_number=eq.${subNum}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updatePayload)
        }
      );

      if (!uRes.ok) {
        const errText = await uRes.text();
        console.error(`Failed to update Bukhari #${subNum}:`, errText);
      } else {
        const updated = await uRes.json();
        console.log(`✅ Successfully backfilled Bukhari #${subNum} (${updated.length} row updated).`);
      }
    }
  }

  console.log('\n=== ALL BUKHARI COMPOSITE HADITHS SUCCESSFULLY BACKFILLED ===');
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
