#!/usr/bin/env node
/**
 * seed-ahmad-sunnah.mjs — Source the full Musnad Ahmad corpus (~27,647 hadiths)
 * from the sunnah.com API into the nq production Supabase hadiths table.
 *
 * WHY THIS SOURCE: fawazahmed0/hadith-api has no Musnad Ahmad edition (eng-ahmad
 * does not exist); CDN fetches for the raw repo 403 above 150 MB. sunnah.com is
 * the only clean source that supplies Arabic text, English translation, grades,
 * and chapter metadata for Musnad Ahmad in a paginated REST API.
 *
 * SAFETY (SYSTEM_RULES Rule 033 — Prove the Pipe Before You Fill It):
 *   1. assertWritableTarget() canary PATCH on `hadiths` runs BEFORE any row is
 *      touched. Aborts if the target is a view / missing / RLS-blocked.
 *   2. Pre-fetches ALL existing musnad-ahmad rows (hadith_number + content flags)
 *      into a Map at startup. New rows → INSERT. Existing rows → PATCH only if
 *      arabic/english is empty. No duplicate inserts. No silent overwrite.
 *   3. Idempotent: re-run safe. Resume after partial failure with --resume.
 *   4. CircuitBreaker(15): aborts after 15 consecutive page-fetch or write
 *      failures instead of grinding the full 500+ page batch on a broken pipe.
 *   5. Per-item retry (5 attempts, exponential backoff): one ECONNRESET / 5xx
 *      / sunnah.com 429 never kills the run.
 *   6. State file (scripts/.ahmad-seed-state.json): stores lastPage + counters
 *      so interrupted runs resume from where they left off.
 *   7. Ground-truth verification: queries live Supabase COUNT after the run.
 *      Never reports success from the script's own counter alone.
 *   8. Dry-run by default. --write flag required for any writes.
 *
 * ENV (required):
 *   SUNNAH_API_KEY         sunnah.com API key (from .env.local)
 *   NQ_URL                 Supabase project URL  (= EXPO_PUBLIC_SUPABASE_URL)
 *   NQ_ANON                Supabase anon key     (= EXPO_PUBLIC_SUPABASE_ANON_KEY)
 *   NQ_SERVICE_ROLE_KEY    Supabase service-role key  (write; --write only)
 *
 *   Shortcut: if NQ_URL / NQ_ANON are not set, the script falls back to
 *   EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY automatically.
 *
 * USAGE:
 *   # Source env, then run dry run first:
 *   node scripts/seed-ahmad-sunnah.mjs
 *
 *   # Apply writes (KP only — NO agent executes this):
 *   node scripts/seed-ahmad-sunnah.mjs --write
 *
 *   # Resume interrupted write run:
 *   node scripts/seed-ahmad-sunnah.mjs --write --resume
 *
 *   # Start from a specific sunnah.com page (useful for targeted retry):
 *   node scripts/seed-ahmad-sunnah.mjs --write --resume --page=150
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { assertWritableTarget, CircuitBreaker, assertNonEmpty } from './lib/preflight.mjs'

// ─── ENV ──────────────────────────────────────────────────────────────────────
const SUNNAH_KEY = process.env.SUNNAH_API_KEY
const NQ_URL     = process.env.NQ_URL     || process.env.EXPO_PUBLIC_SUPABASE_URL
const NQ_ANON    = process.env.NQ_ANON    || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const NQ_SERVICE = process.env.NQ_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const WRITE      = process.argv.includes('--write')
const RESUME     = process.argv.includes('--resume')
const PAGE_ARG   = parseInt((process.argv.find(a => a.startsWith('--page=')) || '').split('=')[1] || '0', 10) || null

// ─── ENV VALIDATION ───────────────────────────────────────────────────────────
if (!SUNNAH_KEY) { console.error('MISSING env: SUNNAH_API_KEY'); process.exit(1) }
if (!NQ_URL)     { console.error('MISSING env: NQ_URL (or EXPO_PUBLIC_SUPABASE_URL)'); process.exit(1) }
if (!NQ_ANON)    { console.error('MISSING env: NQ_ANON (or EXPO_PUBLIC_SUPABASE_ANON_KEY)'); process.exit(1) }
if (WRITE && !NQ_SERVICE) {
  console.error('MISSING env: NQ_SERVICE_ROLE_KEY (required for --write)')
  process.exit(1)
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SUNNAH_BASE     = 'https://api.sunnah.com/v1'
const SUNNAH_COLL     = 'ahmad'           // sunnah.com collection name for Musnad Ahmad
const COLLECTION_SLUG = 'musnad-ahmad'   // our hadiths.collection_slug value
const PAGE_LIMIT      = 50               // sunnah.com documented max per page
const SUPABASE_BATCH  = 50               // rows per Supabase POST (keeps payloads small)
const RETRY_MAX       = 5
const RATE_DELAY_MS   = 1200             // ~50 req/min — well under sunnah.com limits

// State file lives next to the script so partial runs are easy to inspect.
const STATE_FILE = new URL('.ahmad-seed-state.json', import.meta.url).pathname

// ─── HEADERS ──────────────────────────────────────────────────────────────────
const sunnahH = { 'X-API-Key': SUNNAH_KEY, Accept: 'application/json' }
const readH   = { apikey: NQ_ANON, Authorization: `Bearer ${NQ_ANON}` }
const writeH  = {
  apikey: NQ_SERVICE, Authorization: `Bearer ${NQ_SERVICE}`,
  'Content-Type': 'application/json', Prefer: 'return=minimal',
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const sleep   = ms => new Promise(r => setTimeout(r, ms))
const isEmpty = v  => v == null || String(v).trim() === ''

function loadState()      { try { return existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : null } catch { return null } }
function saveState(state) { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)) }

// ─── SUNNAH.COM PAGE FETCH (with retry + 429 backoff) ─────────────────────────
async function fetchSunnahPage(page, attempt = 1) {
  const url = `${SUNNAH_BASE}/collections/${SUNNAH_COLL}/hadiths?page=${page}&limit=${PAGE_LIMIT}`
  let r
  try {
    r = await fetch(url, { headers: sunnahH, signal: AbortSignal.timeout(30_000) })
  } catch (e) {
    if (attempt <= RETRY_MAX) { await sleep(Math.min(attempt * 2000, 16_000)); return fetchSunnahPage(page, attempt + 1) }
    throw new Error(`sunnah.com page ${page} unreachable after ${RETRY_MAX} tries: ${e.message}`)
  }
  if (r.status === 429) {
    // Honour Retry-After header if present; default 60s.
    const wait = parseInt(r.headers.get('Retry-After') || '60', 10) * 1000
    console.warn(`  sunnah.com 429 (page ${page}) — waiting ${wait / 1000}s then retrying...`)
    await sleep(wait)
    return fetchSunnahPage(page, attempt) // 429 not counted as an attempt
  }
  if (!r.ok) {
    if (r.status >= 500 && attempt <= RETRY_MAX) { await sleep(Math.min(attempt * 2000, 16_000)); return fetchSunnahPage(page, attempt + 1) }
    throw new Error(`sunnah.com page ${page}: HTTP ${r.status}`)
  }
  return r.json()
}

// ─── FIELD MAP: sunnah.com item → hadiths table row ───────────────────────────
//
//  sunnah.com item shape:
//    { collection, bookNumber, chapterNumber, hadithNumber,
//      hadith: [ { lang, chapterNumber, chapterTitle, urn, body, grades[] } ] }
//
//  hadiths table columns (from SYSTEM_RULES + enrich-summaries.mjs):
//    id (UUID, auto), collection_slug, hadith_number, book_number,
//    arabic_text, english_text, grade, chapter, reference, narrator
//
function mapRow(item) {
  const arEntry  = item.hadith?.find(h => h.lang === 'ar')
  const enEntry  = item.hadith?.find(h => h.lang === 'en')
  const grades   = enEntry?.grades ?? arEntry?.grades ?? []
  const topGrade = grades[0]?.grade ?? null

  return {
    collection_slug : COLLECTION_SLUG,
    hadith_number   : Number(item.hadithNumber),
    book_number     : String(item.bookNumber),                             // consistent with other collections
    arabic_text     : arEntry?.body?.trim()        || null,
    english_text    : enEntry?.body?.trim()        || null,
    grade           : topGrade,
    chapter         : enEntry?.chapterTitle?.trim() || arEntry?.chapterTitle?.trim() || null,
    reference       : `Musnad Ahmad ${item.hadithNumber}`,                // e.g. "Musnad Ahmad 1234"
    narrator        : null,   // embedded in arabic_text body for Musnad Ahmad; no separate sunnah.com field
  }
}

// ─── FETCH EXISTING musnad-ahmad ROWS FROM SUPABASE (paginated) ───────────────
async function fetchExistingRows() {
  const rows = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const url = `${NQ_URL}/rest/v1/hadiths` +
      `?collection_slug=eq.${COLLECTION_SLUG}` +
      `&select=id,hadith_number,arabic_text,english_text` +
      `&order=hadith_number`
    const r = await fetch(url, {
      headers: { ...readH, Range: `${from}-${from + PAGE - 1}` },
      signal: AbortSignal.timeout(30_000),
    })
    if (!r.ok) throw new Error(`fetchExistingRows: HTTP ${r.status} — ${await r.text()}`)
    const batch = await r.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < PAGE) break
  }
  return rows
}

// ─── SUPABASE INSERT BATCH ────────────────────────────────────────────────────
async function insertBatch(rows, attempt = 1) {
  const r = await fetch(`${NQ_URL}/rest/v1/hadiths`, {
    method: 'POST',
    headers: { ...writeH, Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(30_000),
  }).catch(async e => {
    if (attempt <= RETRY_MAX) { await sleep(Math.min(attempt * 2000, 16_000)); return insertBatch(rows, attempt + 1) }
    throw new Error(`insertBatch network: ${e.message}`)
  })
  if (!r.ok) {
    const text = await r.text()
    if (r.status >= 500 && attempt <= RETRY_MAX) { await sleep(Math.min(attempt * 2000, 16_000)); return insertBatch(rows, attempt + 1) }
    throw new Error(`insertBatch HTTP ${r.status}: ${text.slice(0, 200)}`)
  }
}

// ─── SUPABASE PATCH ROW (reconcile — fill missing arabic/english on 393 rows) ─
async function patchRow(id, patch, attempt = 1) {
  const r = await fetch(`${NQ_URL}/rest/v1/hadiths?id=eq.${id}`, {
    method: 'PATCH', headers: writeH, body: JSON.stringify(patch),
    signal: AbortSignal.timeout(30_000),
  }).catch(async e => {
    if (attempt <= RETRY_MAX) { await sleep(Math.min(attempt * 2000, 16_000)); return patchRow(id, patch, attempt + 1) }
    throw new Error(`patchRow ${id} network: ${e.message}`)
  })
  if (!r.ok) {
    if (r.status >= 500 && attempt <= RETRY_MAX) { await sleep(Math.min(attempt * 2000, 16_000)); return patchRow(id, patch, attempt + 1) }
    throw new Error(`patchRow ${id}: HTTP ${r.status}`)
  }
}

// ─── LIVE GROUND-TRUTH COUNT ──────────────────────────────────────────────────
async function liveCount() {
  const r = await fetch(
    `${NQ_URL}/rest/v1/hadiths?collection_slug=eq.${COLLECTION_SLUG}&select=id`,
    { headers: { ...readH, Prefer: 'count=exact', Range: '0-0' } }
  )
  const cr = r.headers.get('content-range') || ''
  return parseInt(cr.split('/')[1] || '0', 10)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('════════════════════════════════════════════════════')
  console.log('  seed-ahmad-sunnah.mjs — Musnad Ahmad bulk seed')
  console.log(WRITE ? '  MODE: *** WRITE — will INSERT/PATCH production ***' : '  MODE: DRY RUN (no writes)')
  console.log(`  Target: ${NQ_URL}`)
  console.log('════════════════════════════════════════════════════\n')

  // ── STEP 1: assertWritableTarget (Rule 033 — must run BEFORE any generation) ─
  if (WRITE) {
    process.stdout.write('[preflight] assertWritableTarget on hadiths... ')
    await assertWritableTarget({
      urlBase: NQ_URL, target: 'hadiths', headers: writeH, probeColumn: 'id',
    })
    console.log('✓ writable')
  }

  // ── STEP 2: Fetch page 1 → get total count ─────────────────────────────────
  process.stdout.write('[sunnah.com] fetching page 1 for total count... ')
  const firstPage   = await fetchSunnahPage(1)
  const totalSunnah = firstPage.total            // authoritative count from sunnah.com
  const totalPages  = Math.ceil(totalSunnah / PAGE_LIMIT)
  console.log(`total=${totalSunnah} hadiths | ${totalPages} pages @ ${PAGE_LIMIT}/page`)

  assertNonEmpty(firstPage.data, 'sunnah.com page 1 hadiths')

  // ── STEP 3: Pre-fetch existing musnad-ahmad rows ───────────────────────────
  process.stdout.write('[supabase] fetching existing musnad-ahmad rows... ')
  const existingRows = await fetchExistingRows()
  // Map: hadith_number (int) → { id, arabic_text, english_text }
  const existingMap  = new Map(existingRows.map(r => [r.hadith_number, r]))
  console.log(`found ${existingRows.length} existing rows`)

  // ── STEP 4: Determine start page (resume) ─────────────────────────────────
  let state = (RESUME || PAGE_ARG) ? loadState() : null
  if (state && RESUME) {
    console.log(`[resume] resuming from page ${state.lastPage + 1} | prev: ${state.inserted} inserted, ${state.reconciled} reconciled`)
  }
  const startPage = PAGE_ARG ?? (state?.lastPage ? state.lastPage + 1 : 1)
  if (!state) state = { lastPage: 0, inserted: 0, reconciled: 0, skipped: 0 }

  // ── STEP 5: Dry-run prediction ─────────────────────────────────────────────
  if (!WRITE) {
    console.log('\n── DRY RUN PREDICTION ───────────────────────────────')
    console.log(`  sunnah.com total hadiths : ${totalSunnah}`)
    console.log(`  existing in Supabase     : ${existingRows.length}`)
    console.log(`  net new rows to INSERT   : ~${totalSunnah - existingRows.length}`)
    console.log(`  existing rows to reconcile if arabic/english empty: (run to find out)`)
    console.log(`  pages to fetch           : ${totalPages}`)
    console.log(`  estimated API calls      : ${totalPages} (${RATE_DELAY_MS}ms apart = ~${Math.ceil(totalPages * RATE_DELAY_MS / 60000)} min)`)
    console.log(`  NQ_URL resolved          : ${NQ_URL}`)
    console.log('\n  Re-run with --write when ready.')
    return
  }

  // ── STEP 6: Page loop ──────────────────────────────────────────────────────
  const breaker     = new CircuitBreaker(15)
  let inserted      = state.inserted
  let reconciled    = state.reconciled
  let skipped       = state.skipped
  let insertQueue   = []

  /** Flush the insert queue to Supabase in batches of SUPABASE_BATCH. */
  const flushInserts = async (force = false) => {
    if (insertQueue.length === 0) return
    if (!force && insertQueue.length < SUPABASE_BATCH) return
    while (insertQueue.length > 0) {
      const batch = insertQueue.splice(0, SUPABASE_BATCH)
      await insertBatch(batch)
    }
  }

  for (let page = startPage; page <= totalPages; page++) {
    if (breaker.tripped()) {
      console.error('\n' + breaker.reason())
      process.exit(1)
    }

    // Reuse already-fetched page-1 data to avoid an extra API call.
    let pageData
    try {
      pageData = (page === 1) ? firstPage.data : (await fetchSunnahPage(page)).data
      if (page > 1) await sleep(RATE_DELAY_MS)
    } catch (e) {
      breaker.fail()
      console.error(`  PAGE ${page} FETCH FAILED (consecutive ${breaker.consecutiveFails}): ${e.message}`)
      if (breaker.tripped()) { console.error(breaker.reason()); process.exit(1) }
      continue
    }

    if (!Array.isArray(pageData) || pageData.length === 0) {
      console.warn(`  PAGE ${page}: empty data — reached end of collection`)
      break
    }

    let pageNew = 0, pageRec = 0, pageSkip = 0

    for (const item of pageData) {
      const row      = mapRow(item)
      const existing = existingMap.get(row.hadith_number)

      if (!existing) {
        // Net new hadith — queue for INSERT
        insertQueue.push(row)
        pageNew++
      } else {
        // Already exists — reconcile only if arabic/english is missing
        const patch = {}
        if (isEmpty(existing.arabic_text)  && row.arabic_text)  patch.arabic_text  = row.arabic_text
        if (isEmpty(existing.english_text) && row.english_text) patch.english_text = row.english_text
        if (Object.keys(patch).length > 0) {
          try {
            await patchRow(existing.id, patch)
            pageRec++
          } catch (e) {
            console.error(`  RECONCILE FAIL hadith_number=${row.hadith_number}: ${e.message}`)
          }
        } else {
          pageSkip++
        }
      }
    }

    // Flush insert queue when it reaches batch size
    try {
      await flushInserts()
      breaker.ok()
    } catch (e) {
      breaker.fail()
      console.error(`  PAGE ${page} INSERT FAILED (consecutive ${breaker.consecutiveFails}): ${e.message}`)
      if (breaker.tripped()) { console.error(breaker.reason()); process.exit(1) }
    }

    inserted   += pageNew
    reconciled += pageRec
    skipped    += pageSkip

    // Persist resume checkpoint after every page
    state.lastPage   = page
    state.inserted   = inserted
    state.reconciled = reconciled
    state.skipped    = skipped
    saveState(state)

    // Progress log: every page for first 10, then every 50
    if (page <= 10 || page % 50 === 0 || page === totalPages) {
      console.log(
        `  page ${String(page).padStart(4)}/${totalPages}` +
        ` | +new=${pageNew} +rec=${pageRec} skip=${pageSkip}` +
        ` | total: ${inserted} inserted, ${reconciled} reconciled`
      )
    }
  }

  // Final flush for any remainder rows in the queue
  try {
    await flushInserts(true)
    breaker.ok()
  } catch (e) {
    console.error(`  FINAL FLUSH FAILED: ${e.message}`)
  }

  // ── STEP 7: Ground-truth live count verify (Rule 033) ─────────────────────
  const countAfter = await liveCount()
  const expectedMin = existingRows.length + inserted

  console.log('\n── RESULT ────────────────────────────────────────────')
  console.log(`  sunnah.com total reported  : ${totalSunnah}`)
  console.log(`  rows in DB before run      : ${existingRows.length}`)
  console.log(`  new rows inserted          : ${inserted}`)
  console.log(`  existing rows reconciled   : ${reconciled}`)
  console.log(`  existing rows already full : ${skipped}`)
  console.log(`  live Supabase count (now)  : ${countAfter}   ← ground truth`)
  console.log(`  expected minimum           : ${expectedMin}`)

  if (countAfter < expectedMin) {
    console.warn(`\n  ⚠  WARNING: live count ${countAfter} < expected ${expectedMin}.`)
    console.warn('  Some inserts may have failed. Check circuit breaker output above.')
    console.warn('  Re-run with --write --resume to fill gaps.')
  } else {
    console.log(`\n  ✓  live count meets expected minimum`)
  }

  const remaining = totalSunnah - countAfter
  if (remaining > 0) {
    console.warn(`  ⚠  ${remaining} hadiths still missing vs sunnah.com total (may be missing english translation in source)`)
  }

  console.log('\ndone.')
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1) })
