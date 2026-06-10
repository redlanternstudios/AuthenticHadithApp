#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const metadataPath = path.join(rootDir, 'APPSTORE_METADATA.md')
const revenuecatConfigPath = path.join(rootDir, 'lib', 'revenuecat', 'config.ts')
const reportPath = path.join(rootDir, 'docs', 'reports', 'appstore-metadata-latest.json')

function parseSections(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const sections = new Map()

  let currentHeading = null
  let buffer = []

  const flush = () => {
    if (currentHeading !== null) {
      sections.set(currentHeading, buffer.join('\n').trim())
    }
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flush()
      currentHeading = line.slice(3).trim()
      buffer = []
      continue
    }
    buffer.push(line)
  }

  flush()
  return sections
}

function extractSection(sections, heading) {
  return sections.get(heading) ?? ''
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function parseProductIds(configText) {
  const idRegex = /'ah_[a-z_]+_premium'/g
  const matches = configText.match(idRegex) ?? []
  return Array.from(new Set(matches.map((m) => m.replace(/'/g, ''))))
}

function firstNonEmptyLine(text) {
  const line = text
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0)
  return line ?? ''
}

function check(name, pass, evidence) {
  return { name, pass, evidence }
}

function run() {
  const metadata = readText(metadataPath)
  const rcConfig = readText(revenuecatConfigPath)
  const sections = parseSections(metadata)

  const appName = firstNonEmptyLine(extractSection(sections, 'App Name (max 30 chars)'))
  const subtitle = firstNonEmptyLine(extractSection(sections, 'Subtitle (max 30 chars)'))
  const promo = firstNonEmptyLine(
    extractSection(sections, 'Promotional Text (max 170 chars, can change anytime without review)')
  )
  const keywords = firstNonEmptyLine(
    extractSection(sections, 'Keywords (max 100 chars, comma-separated, no spaces after commas)')
  )

  const supportUrl = firstNonEmptyLine(extractSection(sections, 'Support URL'))
  const marketingUrl = firstNonEmptyLine(extractSection(sections, 'Marketing URL'))
  const privacyUrl = firstNonEmptyLine(extractSection(sections, 'Privacy Policy URL'))

  const expectedIds = parseProductIds(rcConfig)
  const missingIds = expectedIds.filter((id) => !metadata.includes(id))

  const checks = [
    check('App Name <= 30 chars', appName.length > 0 && appName.length <= 30, `len=${appName.length}`),
    check('Subtitle <= 30 chars', subtitle.length > 0 && subtitle.length <= 30, `len=${subtitle.length}`),
    check('Promotional Text <= 170 chars', promo.length > 0 && promo.length <= 170, `len=${promo.length}`),
    check('Keywords <= 100 chars', keywords.length > 0 && keywords.length <= 100, `len=${keywords.length}`),
    check('Keywords contain no spaces after commas', !keywords.includes(', '), 'pattern=comma_no_space'),
    check('Support URL starts with https://', supportUrl.startsWith('https://'), supportUrl),
    check('Marketing URL starts with https://', marketingUrl.startsWith('https://'), marketingUrl),
    check('Privacy Policy URL starts with https://', privacyUrl.startsWith('https://'), privacyUrl),
    check('RevenueCat product IDs present in metadata', missingIds.length === 0, `missing=${missingIds.join(',') || 'none'}`)
  ]

  const failed = checks.filter((item) => !item.pass)
  const report = {
    generatedAt: new Date().toISOString(),
    overall: failed.length === 0 ? 'PASS' : 'FAIL',
    checks,
    failedChecks: failed.map((f) => f.name)
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')

  console.log('App Store metadata audit')
  console.log(`overall=${report.overall}`)
  console.log(`failed=${failed.length}`)
  console.log(`report=${path.relative(rootDir, reportPath)}`)

  if (failed.length > 0) {
    console.log('failed checks:')
    for (const item of failed) {
      console.log(`- ${item.name} (${item.evidence})`)
    }
    process.exitCode = 2
    return
  }

  process.exitCode = 0
}

run()
