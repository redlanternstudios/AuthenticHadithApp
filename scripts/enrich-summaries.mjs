#!/usr/bin/env node
/**
 * AI enrichment generator for enriched_hadiths. For each hadith it produces
 * summary_line, summary_ar, key_teaching_en, key_teaching_ar via Groq (cheap,
 * fast) and writes them to the matching enriched_hadiths row (keyed by
 * collection + hadith_number).
 *
 * EFFICIENCY: uses Groq llama-3.3-70b-versatile, NOT Claude. ~25M tokens for the
 * full 31,886-row run ≈ a few dollars.
 *
 * MODES:
 *   --pilot[=N]   generate N (default 50), PRINT for quality review, NO DB write
 *   --write       generate + write to enriched_hadiths (full run unless --only)
 *   --only=slug   restrict to one collection
 *   --limit=N     cap rows processed
 *
 * ENV: GROQ_API_KEY, NQ_URL, NQ_ANON, NQ_SERVICE_ROLE_KEY (write only)
 */

import { assertWritableTarget, assertNonEmpty, CircuitBreaker } from './lib/preflight.mjs'

const GROQ = process.env.GROQ_API_KEY
const NQ_URL = process.env.NQ_URL
const NQ_ANON = process.env.NQ_ANON
const NQ_SERVICE = process.env.NQ_SERVICE_ROLE_KEY
const args = process.argv.slice(2)
const PILOT = args.some(a => a === '--pilot' || a.startsWith('--pilot='))
const WRITE = args.includes('--write')
const ONLY = (args.find(a => a.startsWith('--only=')) || '').split('=')[1]
const pilotN = Number((args.find(a => a.startsWith('--pilot=')) || '').split('=')[1]) || 50
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || (PILOT ? pilotN : 0)
const MODEL = 'llama-3.3-70b-versatile'
const CONC = 5

if (!GROQ) { console.error('Missing GROQ_API_KEY'); process.exit(1) }
if (!NQ_URL || !NQ_ANON) { console.error('Missing NQ_URL / NQ_ANON'); process.exit(1) }
if (WRITE && !NQ_SERVICE) { console.error('--write requires NQ_SERVICE_ROLE_KEY'); process.exit(1) }

const read = { apikey: NQ_ANON, Authorization: `Bearer ${NQ_ANON}` }
const write = { apikey: NQ_SERVICE, Authorization: `Bearer ${NQ_SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const SYSTEM = `You are an Islamic studies assistant generating concise, accurate metadata for a hadith. ` +
  `You are given a hadith's English translation, Arabic text, collection, and grade. Produce exactly four fields:\n` +
  `- summary_line: one clear sentence (max 18 words) stating what this hadith is about. Neutral, descriptive.\n` +
  `- summary_ar: a faithful Arabic translation of summary_line.\n` +
  `- key_teaching_en: the core practical lesson (max 12 words).\n` +
  `- key_teaching_ar: a faithful Arabic translation of key_teaching_en.\n` +
  `Rules: Be accurate to the text. Do NOT fabricate. Do NOT issue new rulings or fatwa beyond what the hadith states. ` +
  `Respectful tone. Return ONLY a valid JSON object with those four keys. No markdown, no commentary, no text before or after.`

// Resilient page fetch: retry transient network errors / 5xx up to 5 times,
// and THROW (loud) on a non-array body instead of silently returning 0 rows.
async function fetchPage(url, from, attempt = 1) {
  try {
    const r = await fetch(url, {
      headers: { ...read, Range: `${from}-${from + 999}` },
      signal: AbortSignal.timeout(40000),
    })
    if (!r.ok) {
      if (r.status >= 500 && attempt < 5) { await sleep(attempt * 1000); return fetchPage(url, from, attempt + 1) }
      throw new Error(`fetch page from ${from}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`)
    }
    const b = await r.json()
    if (!Array.isArray(b)) throw new Error(`fetch page from ${from}: non-array body ${JSON.stringify(b).slice(0, 120)}`)
    return b
  } catch (e) {
    if (attempt < 5) { await sleep(attempt * 1000); return fetchPage(url, from, attempt + 1) }
    throw new Error(`fetch page from ${from} failed after ${attempt} tries: ${e.message}`)
  }
}

async function fetchBatch(slug, limit) {
  // Hadiths that HAVE english+arabic but whose enriched row lacks a summary.
  const rows = []
  const PAGE = 1000
  const slugFilter = slug ? `&collection_slug=eq.${slug}` : ''
  for (let from = 0; rows.length < (limit || 1e9); from += PAGE) {
    const url = `${NQ_URL}/rest/v1/hadiths?select=hadith_number,collection_slug,english_text,arabic_text,grade,narrator,reference` +
      `${slugFilter}&english_text=not.is.null&english_text=neq.&arabic_text=not.is.null&arabic_text=neq.&order=collection_slug,hadith_number`
    const b = await fetchPage(url, from)
    if (b.length === 0) break
    rows.push(...b)
    if (b.length < PAGE) break
  }
  return limit ? rows.slice(0, limit) : rows
}

async function generate(h, attempt = 1) {
  const user = `Collection: ${h.collection_slug}\nReference: ${h.reference || ''}\nGrade: ${h.grade || ''}\n` +
    `English: ${String(h.english_text).slice(0, 1500)}\nArabic: ${String(h.arabic_text).slice(0, 1500)}`
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, temperature: 0.3, max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(40000),
    })
    if (!r.ok) {
      if ((r.status === 429 || r.status >= 500) && attempt < 5) { await sleep(attempt * 2000); return generate(h, attempt + 1) }
      throw new Error(`groq HTTP ${r.status}: ${(await r.text()).slice(0, 120)}`)
    }
    const j = await r.json()
    const obj = JSON.parse(j.choices[0].message.content)
    return {
      summary_line: obj.summary_line || '', summary_ar: obj.summary_ar || '',
      key_teaching_en: obj.key_teaching_en || '', key_teaching_ar: obj.key_teaching_ar || '',
    }
  } catch (e) {
    if (attempt < 5) { await sleep(attempt * 2000); return generate(h, attempt + 1) }
    throw e
  }
}

async function writeEnriched(h, gen) {
  const url = `${NQ_URL}/rest/v1/enriched_hadiths?collection=eq.${h.collection_slug}&hadith_number=eq.${h.hadith_number}`
  const r = await fetch(url, { method: 'PATCH', headers: write, body: JSON.stringify({ ...gen, enrichment_status: 'ai_generated' }) })
  if (!r.ok) throw new Error(`write ${h.collection_slug}#${h.hadith_number}: HTTP ${r.status}`)
}

async function main() {
  console.log(PILOT ? `=== PILOT (${LIMIT} rows, model ${MODEL}, NO WRITE) ===` : (WRITE ? `*** WRITE MODE (${MODEL}) ***` : '--- DRY (no groq, no write) ---'))

  // RULE 033 — Prove the Pipe Before You Fill It. Before spending a single Groq
  // token, prove the write target actually accepts writes. This aborts the run
  // (no inference cost) if the target is a view / missing / RLS-blocked.
  if (WRITE) {
    await assertWritableTarget({ urlBase: NQ_URL, target: 'enriched_hadiths', headers: write, probeColumn: 'id' })
    console.log('preflight ✓ write target accepts writes')
  }

  const rows = await fetchBatch(ONLY, LIMIT)
  assertNonEmpty(rows, 'candidate hadiths') // a silent 0-row fetch is a no-op, not a success
  console.log(`fetched ${rows.length} candidate hadiths\n`)

  // Circuit breaker: if the pipeline is structurally broken, fail after ~15
  // consecutive errors instead of burning the whole batch.
  const breaker = new CircuitBreaker(15)
  let done = 0, fail = 0
  for (let i = 0; i < rows.length; i += CONC) {
    if (breaker.tripped()) throw new Error(breaker.reason())
    const chunk = rows.slice(i, i + CONC)
    await Promise.all(chunk.map(async h => {
      try {
        const gen = await generate(h)
        if (WRITE) await writeEnriched(h, gen)
        breaker.ok(); done++
        if (PILOT) {
          console.log(`# ${h.collection_slug} ${h.hadith_number}  [${h.grade}]`)
          console.log(`  EN src : ${String(h.english_text).replace(/\s+/g, ' ').slice(0, 90)}…`)
          console.log(`  summary: ${gen.summary_line}`)
          console.log(`  ملخص   : ${gen.summary_ar}`)
          console.log(`  teach  : ${gen.key_teaching_en}`)
          console.log(`  درس    : ${gen.key_teaching_ar}\n`)
        } else if (done % 200 === 0) console.log(`  …${done} done`)
      } catch (e) { breaker.fail(); fail++; console.error(`  FAIL ${h.collection_slug}#${h.hadith_number}: ${e.message}`) }
    }))
  }
  console.log(`\nGenerated ${done}, failed ${fail}` + (WRITE ? ' (written to enriched_hadiths)' : ''))
}
main().catch(e => { console.error(e); process.exit(1) })
