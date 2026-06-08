#!/usr/bin/env node
/**
 * General English + Arabic backfill for ALL CDN-backed collections in the nq
 * production DB. Fills hadiths.english_text and hadiths.arabic_text from the
 * fawazahmed0/hadith-api editions, keyed by hadith_number. Only touches rows
 * where the target column is empty. Never inserts, never deletes, never grades.
 *
 * Supersedes backfill-arabic.mjs (which did Arabic-only for bukhari/muslim).
 *
 * DATA SOURCE: fastly.jsdelivr.net mirror (main jsDelivr 403s the 150MB repo).
 * Musnad Ahmad is NOT in fawazahmed0 — excluded here (content-sourcing project).
 *
 * SAFETY: dry-run by default. --write to apply. Needs NQ_SERVICE_ROLE_KEY.
 *
 * USAGE:
 *   NQ_URL=... NQ_ANON=... NQ_SERVICE_ROLE_KEY=... node scripts/backfill-text.mjs        # dry run
 *   ... --write                                                                            # apply
 *   ... --only=sunan-abu-dawud                                                              # one collection
 */

const NQ_URL = process.env.NQ_URL
const NQ_ANON = process.env.NQ_ANON
const NQ_SERVICE = process.env.NQ_SERVICE_ROLE_KEY
const WRITE = process.argv.includes('--write')
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1]

const MIRROR = 'https://fastly.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
// slug in nq  ->  fawazahmed0 edition stem
const TARGETS = [
  { slug: 'sahih-bukhari',   stem: 'bukhari'  },
  { slug: 'sahih-muslim',    stem: 'muslim'   },
  { slug: 'sunan-nasai',     stem: 'nasai'    },
  { slug: 'jami-tirmidhi',   stem: 'tirmidhi' },
  { slug: 'sunan-ibn-majah', stem: 'ibnmajah' },
  { slug: 'muwatta-malik',   stem: 'malik'    },
  { slug: 'sunan-abu-dawud', stem: 'abudawud' },
].filter(t => !ONLY || t.slug === ONLY)

if (!NQ_URL || !NQ_ANON) { console.error('Missing NQ_URL / NQ_ANON'); process.exit(1) }
if (WRITE && !NQ_SERVICE) { console.error('--write requires NQ_SERVICE_ROLE_KEY'); process.exit(1) }

const readHeaders = { apikey: NQ_ANON, Authorization: `Bearer ${NQ_ANON}` }
const writeHeaders = {
  apikey: NQ_SERVICE, Authorization: `Bearer ${NQ_SERVICE}`,
  'Content-Type': 'application/json', Prefer: 'return=minimal',
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchEdition(edition) {
  const r = await fetch(`${MIRROR}/${edition}.min.json`, { signal: AbortSignal.timeout(90000) })
  if (!r.ok) throw new Error(`${edition}: HTTP ${r.status}`)
  const j = await r.json()
  const map = new Map()
  for (const h of j.hadiths || []) {
    if (h.text && String(h.text).trim()) map.set(Number(h.hadithnumber), String(h.text))
  }
  return map
}

// Rows where EITHER english_text OR arabic_text is empty.
async function fetchRowsMissing(slug) {
  const rows = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const url = `${NQ_URL}/rest/v1/hadiths?collection_slug=eq.${slug}` +
      `&or=(english_text.is.null,english_text.eq.,arabic_text.is.null,arabic_text.eq.)` +
      `&select=id,hadith_number,english_text,arabic_text&order=hadith_number`
    const r = await fetch(url, { headers: { ...readHeaders, Range: `${from}-${from + PAGE - 1}` } })
    const batch = await r.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < PAGE) break
  }
  return rows
}

async function patchRow(id, patch, attempt = 1) {
  try {
    const r = await fetch(`${NQ_URL}/rest/v1/hadiths?id=eq.${id}`, {
      method: 'PATCH', headers: writeHeaders, body: JSON.stringify(patch),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) {
      if (r.status >= 500 && attempt < 5) { await sleep(attempt * 1000); return patchRow(id, patch, attempt + 1) }
      throw new Error(`patch ${id}: HTTP ${r.status} ${await r.text()}`)
    }
  } catch (e) {
    if (attempt < 5) { await sleep(attempt * 1000); return patchRow(id, patch, attempt + 1) }
    throw new Error(`patch ${id} failed after ${attempt} tries: ${e.message}`)
  }
}

const isEmpty = v => v == null || String(v).trim() === ''

async function main() {
  console.log(WRITE ? '*** WRITE MODE ***' : '--- DRY RUN (no writes) ---')
  let grandEn = 0, grandAr = 0
  for (const { slug, stem } of TARGETS) {
    const [engMap, araMap] = await Promise.all([fetchEdition(`eng-${stem}`), fetchEdition(`ara-${stem}`)])
    const rows = await fetchRowsMissing(slug)
    let enFix = 0, arFix = 0, enNo = 0, arNo = 0
    for (const row of rows) {
      const n = Number(row.hadith_number)
      const patch = {}
      if (isEmpty(row.english_text)) { const v = engMap.get(n); if (v) { patch.english_text = v; enFix++ } else enNo++ }
      if (isEmpty(row.arabic_text))  { const v = araMap.get(n); if (v) { patch.arabic_text = v;  arFix++ } else arNo++ }
      if (WRITE && Object.keys(patch).length) await patchRow(row.id, patch)
    }
    grandEn += enFix; grandAr += arFix
    console.log(`${slug}: rows_missing=${rows.length} | EN fillable=${enFix} no-src=${enNo} | AR fillable=${arFix} no-src=${arNo}`)
  }
  console.log(`TOTAL fillable -> english=${grandEn}  arabic=${grandAr}` + (WRITE ? ' (WRITTEN)' : ''))
  console.log('done.')
}
main().catch(e => { console.error(e); process.exit(1) })
