import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const TARGETS = ['app', 'components', 'lib', 'app.config.js', 'app.json']
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json'])

const forbidden = [
  {
    label: 'temporary screenshot bypass marker',
    pattern: /SCREENSHOT-BYPASS/i,
  },
  {
    label: 'manual revert reminder in runtime/config code',
    pattern: /REVERT BEFORE COMMIT/i,
  },
  {
    label: 'forced premium entitlement',
    pattern: /\bconst\s+isPro\s*=\s*true\b/,
  },
  {
    label: 'disabled RevenueCat retry/init marker',
    pattern: /no RC retry|skip RevenueCat configure entirely/i,
  },
]

function collectFiles(target) {
  const absolute = path.join(ROOT, target)
  if (!fs.existsSync(absolute)) return []

  const stat = fs.statSync(absolute)
  if (stat.isFile()) return [absolute]

  const files = []
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.expo')) continue
    const child = path.join(absolute, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(path.relative(ROOT, child)))
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(child)
    }
  }
  return files
}

const files = TARGETS.flatMap(collectFiles)
const failures = []

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) {
      failures.push({
        file: path.relative(ROOT, file),
        reason: rule.label,
      })
    }
  }
}

if (failures.length > 0) {
  console.error('\nCTP RELEASE GUARD: BLOCKED\n')
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.reason}`)
  }
  console.error('\nRemove all temporary/test release overrides before building production.\n')
  process.exit(1)
}

console.log(`CTP RELEASE GUARD: PASS (${files.length} runtime/config files scanned)`)
