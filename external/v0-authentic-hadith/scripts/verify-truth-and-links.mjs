#!/usr/bin/env node
/**
 * Deterministic Truth & Store Link Gate for Authentic Hadith (authentichadith.app).
 *
 * Blocks hallucinated corpus counts (e.g., 64,464 / Six Books), fake Google Play links,
 * placeholder /login App Store buttons, and dead # footer links from shipping.
 *
 * Usage:
 *   node scripts/verify-truth-and-links.mjs
 *   node scripts/verify-truth-and-links.mjs --live
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CHECK_LIVE = process.argv.includes('--live')
const APP_STORE_URL = 'https://apps.apple.com/us/app/authentic-hadith/id6764673665'

const FORBIDDEN_MARKETING_PATTERNS = [
  { pattern: /\b64[,.]?464\b/i, reason: 'Erroneous 64,464 count; verified Al-Sahihayn corpus is 14,444' },
  { pattern: /\bFour Sunans\b/i, reason: 'Unverified Four Sunans claim; app is scoped to Al-Sahihayn' },
  { pattern: /\bSix Books\b/i, reason: 'Unverified Six Books claim; app is scoped to Al-Sahihayn' },
  { pattern: /\bAbu Dawud\b/i, reason: 'Unverified Abu Dawud collection claim on marketing surface' },
  { pattern: /\bIbn Majah\b/i, reason: 'Unverified Ibn Majah collection claim on marketing surface' },
  { pattern: /\bNasai\b/i, reason: 'Unverified Nasai collection claim on marketing surface' },
  { pattern: /\bGoogle Play\b/i, reason: 'No live Google Play listing exists (404)' },
  { pattern: /play\.google\.com/i, reason: 'No live Google Play URL exists (404)' },
  { pattern: /iOS and Android/i, reason: 'Android store build is not live; state iOS App Store & Web' },
  { pattern: /href=["']#["']/i, reason: 'Dead placeholder # href detected' },
]

function walkPages(dir) {
  const routes = new Set()
  if (!fs.existsSync(dir)) return routes
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      for (const r of walkPages(full)) routes.add(r)
    } else if (entry.name === 'page.tsx') {
      const rel = path.relative(path.join(ROOT, 'app'), path.dirname(full))
      routes.add(rel === '' ? '/' : `/${rel.replaceAll(path.sep, '/')}`)
    }
  }
  return routes
}

function runStaticGate() {
  const errors = []
  const routes = walkPages(path.join(ROOT, 'app'))

  for (const targetFile of ['app/page.tsx', 'app/about/page.tsx']) {
    const full = path.join(ROOT, targetFile)
    if (!fs.existsSync(full)) continue
    const src = fs.readFileSync(full, 'utf8')
    for (const rule of FORBIDDEN_MARKETING_PATTERNS) {
      if (rule.pattern.test(src)) {
        errors.push(`[FORBIDDEN_CLAIM] ${targetFile}: matched ${rule.pattern} (${rule.reason})`)
      }
    }
  }

  const landingSrc = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf8')

  if (!landingSrc.includes('14,444') || !landingSrc.includes('Al-Sahihayn')) {
    errors.push('[MISSING_CORPUS_PARITY] app/page.tsx must explicitly state 14,444 and Al-Sahihayn')
  }

  const storeCount = landingSrc.split(APP_STORE_URL).length - 1
  if (storeCount < 2) {
    errors.push(`[MISSING_STORE_CTA] app/page.tsx must route App Store buttons directly to ${APP_STORE_URL} (found ${storeCount})`)
  }

  if (/href="\/login"[^>]*>[\s\S]{0,180}App Store/i.test(landingSrc)) {
    errors.push('[BROKEN_STORE_CTA] app/page.tsx still links an App Store button to /login')
  }

  for (const match of landingSrc.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g)) {
    const tag = match[0]
    if (!tag.includes('target="_blank"') || !tag.includes('rel="noopener noreferrer"')) {
      errors.push(`[UNSAFE_EXTERNAL_ANCHOR] app/page.tsx external <a> missing target/rel: ${tag}`)
    }
  }

  for (const match of landingSrc.matchAll(/href="(\/[^"#?]+)"/g)) {
    const route = match[1]
    if (!routes.has(route)) {
      errors.push(`[BROKEN_INTERNAL_ROUTE] app/page.tsx links to missing route "${route}"`)
    }
  }

  return { errors, routeCount: routes.size, storeLinkCount: storeCount }
}

async function runLiveAppleCheck() {
  const errors = []
  const lookupRes = await fetch('https://itunes.apple.com/lookup?id=6764673665&country=us', {
    signal: AbortSignal.timeout(15000),
  })
  if (lookupRes.status !== 200) {
    return { errors: [`[APPLE_LOOKUP_HTTP_${lookupRes.status}] Failed to reach Apple Lookup API`] }
  }
  const data = await lookupRes.json()
  const app = (data.results || [])[0]
  if (!app || app.trackId !== 6764673665) {
    errors.push('[APPLE_APP_MISSING] Track ID 6764673665 not found in US App Store lookup')
  } else {
    const desc = String(app.description || '')
    if (!desc.includes('Sahihayn') || !desc.includes('Sahih al-Bukhari') || !desc.includes('Sahih Muslim')) {
      errors.push('[APPLE_CORPUS_MISMATCH] App Store description missing Sahihayn parity')
    }
  }

  const pageRes = await fetch(APP_STORE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (pageRes.status !== 200) {
    errors.push(`[APPLE_PAGE_HTTP_${pageRes.status}] ${APP_STORE_URL} returned ${pageRes.status}`)
  }

  return { errors, version: app?.version }
}

async function main() {
  const staticRes = runStaticGate()
  const errors = [...staticRes.errors]
  console.log(
    `[STATIC_TRUTH_AND_LINK_CHECK] routes=${staticRes.routeCount} store_links=${staticRes.storeLinkCount} errors=${staticRes.errors.length}`,
  )

  if (CHECK_LIVE) {
    const liveRes = await runLiveAppleCheck()
    errors.push(...liveRes.errors)
    console.log(`[LIVE_APPLE_VERIFICATION] version=${liveRes.version || 'unknown'} errors=${liveRes.errors.length}`)
  }

  if (errors.length > 0) {
    console.error('\n[AUTHENTIC_HADITH_TRUTH_GATE_FAILED]')
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }

  console.log('[AUTHENTIC_HADITH_TRUTH_GATE_PASSED] Store links and 14,444 Al-Sahihayn facts verified.')
}

main()
