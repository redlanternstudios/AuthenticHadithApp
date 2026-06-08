#!/usr/bin/env node
/**
 * Backfill arabic_text on existing Bukhari + Muslim rows in the nq production
 * Supabase project from the fawazahmed0/hadith-api Arabic editions.
 *
 * WHY: the bulk seed loaded English but dropped Arabic on bukhari (71/7277) and
 * muslim (22/7167). seed-full only INSERTS missing rows, so it never backfills
 * Arabic on rows that already exist. This does the UPDATE pass.
 *
 * DATA SOURCE: jsDelivr's main host 403s this repo (150MB limit), but the
 * fastly/gcore regional mirrors serve the per-edition files fine.
 *
 * SAFETY: dry-run by default. Pass --write to actually UPDATE. Writes require
 * the nq service-role key in env NQ_SERVICE_ROLE_KEY (RLS blocks anon writes).
 * Only touches arabic_text on rows where it is currently empty. Never inserts,
 * never deletes, never touches english_text/grade/etc.
 *
 * USAGE:
 *   NQ_URL=https://nqklipakrfuwebkdnhwg.supabase.co \
 *   NQ_ANON=<anon key>  NQ_SERVICE_ROLE_KEY=<service key> \
 *   node scripts/backfill-arabic.mjs            # dry run
 *   ... --write                                  # apply
 */

const NQ_URL = process.env.NQ_URL
const NQ_ANON = process.env.NQ_ANON
const NQ_SERVICE = process.env.NQ_SERVICE_ROLE_KEY
const WRITE = process.argv.includes('--write')

const MIRROR = 'https://fastly.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
const TARGETS = [
  { slug: 'sahih-bukhari', ara: 'ara-bukhari' },
  { slug: 'sahih-muslim', ara: 'ara-muslim' },
  { slug: 'sunan-abu-dawud', ara: 'ara-abudawud' },
]

if (!NQ_URL || !NQ_ANON) { console.error('Missing NQ_URL / NQ_ANON'); process.exit(1) }
if (WRITE && !NQ_SERVICE) { console.error('--write requires NQ_SERVICE_ROLE_KEY'); process.exit(1) }

const readHeaders = { apikey: NQ_ANON, Authorization: `Bearer ${NQ_ANON}` }
const writeHeaders = {
  apikey: NQ_SERVICE, Authorization: `Bearer ${NQ_SERVICE}`,
  'Content-Type': 'application/json', Prefer: 'return=minimal',
}

async function fetchArabic(ara) {
  // The edition file is keyed by hadithnumber -> arabic text.
  const r = await fetch(`${MIRROR}/${ara}.min.json`, { signal: AbortSignal.timeout(60000) })
  if (!r.ok) throw new Error(`${ara}: HTTP ${r.status}`)
  const j = await r.json()
  const map = new Map()
  for (const h of j.hadiths || []) {
    if (h.text && String(h.text).trim()) map.set(Number(h.hadithnumber), h.text)
  }
  return map
}

// Page through nq rows for a collection that are missing arabic_text.
async function fetchRowsMissingArabic(slug) {
  const rows = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const url = `${NQ_URL}/rest/v1/hadiths?collection_slug=eq.${slug}` +
      `&or=(arabic_text.is.null,arabic_text.eq.)` +
      `&select=id,hadith_number,arabic_text&order=hadith_number`
    const r = await fetch(url, { headers: { ...readHeaders, Range: `${from}-${from + PAGE - 1}` } })
    const batch = await r.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < PAGE) break
  }
  return rows
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Retry on transient network errors (ECONNRESET etc.) and 5xx, up to 5 tries
// with linear backoff. A single dropped connection should never kill the run.
async function updateRow(id, arabic, attempt = 1) {
  try {
    const r = await fetch(`${NQ_URL}/rest/v1/hadiths?id=eq.${id}`, {
      method: 'PATCH', headers: writeHeaders, body: JSON.stringify({ arabic_text: arabic }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) {
      if (r.status >= 500 && attempt < 5) { await sleep(attempt * 1000); return updateRow(id, arabic, attempt + 1) }
      throw new Error(`update ${id}: HTTP ${r.status} ${await r.text()}`)
    }
  } catch (e) {
    if (attempt < 5) { await sleep(attempt * 1000); return updateRow(id, arabic, attempt + 1) }
    throw new Error(`update ${id} failed after ${attempt} tries: ${e.message}`)
  }
}

async function main() {
  console.log(WRITE ? '*** WRITE MODE ***' : '--- DRY RUN (no writes) ---')
  for (const { slug, ara } of TARGETS) {
    const araMap = await fetchArabic(ara)
    const rows = await fetchRowsMissingArabic(slug)
    let matched = 0, missing = 0, updated = 0
    for (const row of rows) {
      const arabic = araMap.get(Number(row.hadith_number))
      if (!arabic) { missing++; continue }
      matched++
      if (WRITE) { await updateRow(row.id, arabic); updated++ }
    }
    console.log(`${slug}: ${rows.length} rows missing arabic | source has ${araMap.size} | matchable ${matched} | no-source-match ${missing}` + (WRITE ? ` | UPDATED ${updated}` : ''))
  }
  console.log('done.')
}
main().catch(e => { console.error(e); process.exit(1) })
