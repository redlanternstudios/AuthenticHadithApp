import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const EXPECTED_PRODUCT_IDS = [
  'ah_monthly_premium',
  'ah_annual_premium',
  'ah_lifetime_premium',
]

function loadDotEnv(path) {
  if (!existsSync(path)) return
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const raw = trimmed.slice(index + 1).trim()
    if (process.env[key]) continue
    process.env[key] = raw.replace(/^['"]|['"]$/g, '')
  }
}

function summarizeOfferings(offerings) {
  if (!Array.isArray(offerings)) return []
  return offerings.map((offering) => ({
    identifier: offering.identifier,
    description: offering.description ?? null,
    packages: (offering.packages ?? []).map((pkg) => ({
      identifier: pkg.identifier,
      platform_product_identifier: pkg.platform_product_identifier,
    })),
  }))
}

loadDotEnv(resolve(process.cwd(), '.env.local'))

function readIosFallbackKey() {
  const configPath = resolve(process.cwd(), 'lib', 'revenuecat', 'config.ts')
  if (!existsSync(configPath)) return null
  const source = readFileSync(configPath, 'utf8')
  const match = source.match(/ios:\s*['"]([^'"]+)['"]/)
  return match?.[1] ?? null
}

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || readIosFallbackKey()

if (!apiKey) {
  console.error('RevenueCat offering audit: FAIL')
  console.error('Reason: missing EXPO_PUBLIC_REVENUECAT_API_KEY_IOS and no public iOS fallback in lib/revenuecat/config.ts')
  process.exit(1)
}

if (apiKey.startsWith('sk_')) {
  console.error('RevenueCat offering audit: FAIL')
  console.error('Reason: secret RevenueCat key was provided where public iOS SDK key is required')
  process.exit(1)
}

if (!apiKey.startsWith('appl_')) {
  console.error('RevenueCat offering audit: FAIL')
  console.error('Reason: iOS RevenueCat SDK key must start with appl_')
  process.exit(1)
}

const appUserId = `codex-offerings-smoke-${Date.now()}`
const response = await fetch(
  `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/offerings`,
  {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  },
)

const body = await response.json().catch(() => null)

if (!response.ok) {
  console.error('RevenueCat offering audit: FAIL')
  console.error(`Reason: RevenueCat returned HTTP ${response.status}`)
  if (body?.message) console.error(`Message: ${body.message}`)
  process.exit(1)
}

const offerings = summarizeOfferings(body?.offerings)
const currentOffering = offerings.find((offering) => offering.identifier === body?.current_offering_id)
const packages = currentOffering?.packages ?? []
const actualProductIds = packages
  .map((pkg) => pkg.platform_product_identifier)
  .filter(Boolean)
const missingProductIds = EXPECTED_PRODUCT_IDS.filter((id) => !actualProductIds.includes(id))

const receipt = {
  current_offering_id: body?.current_offering_id ?? null,
  current_package_count: packages.length,
  expected_product_ids: EXPECTED_PRODUCT_IDS,
  actual_product_ids: actualProductIds,
  missing_product_ids: missingProductIds,
}

if (!currentOffering) {
  console.error('RevenueCat offering audit: FAIL')
  console.error('Reason: no current offering returned')
  console.error(JSON.stringify(receipt, null, 2))
  process.exit(1)
}

if (packages.length === 0) {
  console.error('RevenueCat offering audit: FAIL')
  console.error('Reason: current offering has zero packages')
  console.error(JSON.stringify(receipt, null, 2))
  process.exit(1)
}

if (missingProductIds.length > 0) {
  console.error('RevenueCat offering audit: FAIL')
  console.error('Reason: current offering is missing expected App Store product IDs')
  console.error(JSON.stringify(receipt, null, 2))
  process.exit(1)
}

console.log('RevenueCat offering audit: PASS')
console.log(JSON.stringify(receipt, null, 2))
