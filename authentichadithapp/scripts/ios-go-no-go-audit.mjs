#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const reportPath = path.join(rootDir, 'docs', 'reports', 'ios-go-no-go-latest.json')

function readText(relativePath) {
  const fullPath = path.join(rootDir, relativePath)
  return fs.readFileSync(fullPath, 'utf8')
}

function readJson(relativePath) {
  const raw = readText(relativePath)
  return JSON.parse(raw)
}

function makeCheck(name, pass, evidence, blocking = true) {
  return { name, pass, blocking, evidence }
}

function findInfoPlistBundleVersion(plistText) {
  const keyPattern = /<key>CFBundleVersion<\/key>[\s\S]*?<string>(.*?)<\/string>/m
  const match = plistText.match(keyPattern)
  return match ? match[1].trim() : null
}

function hasUncheckedLine(text, marker) {
  return text.includes(marker)
}

function run() {
  const appJson = readJson('app.json')
  const easJson = readJson('eas.json')
  const infoPlist = readText('ios/AuthenticHadith/Info.plist')
  const gateDoc = readText('PRE_TESTFLIGHT_READINESS_GATE.md')
  const goNoGoDoc = readText('IOS_SUBMISSION_GO_NO_GO.md')

  const buildNumber = appJson?.expo?.ios?.buildNumber ?? null
  const autoIncrement = easJson?.build?.production?.autoIncrement ?? null
  const ascAppId = easJson?.submit?.production?.ios?.ascAppId ?? null
  const plistBundleVersion = findInfoPlistBundleVersion(infoPlist)

  const checks = []

  checks.push(
    makeCheck(
      'app.json has expo.ios.buildNumber',
      Boolean(buildNumber),
      buildNumber ? `buildNumber=${buildNumber}` : 'missing expo.ios.buildNumber'
    )
  )

  checks.push(
    makeCheck(
      'eas.json has production autoIncrement enabled',
      autoIncrement === true,
      `autoIncrement=${String(autoIncrement)}`
    )
  )

  checks.push(
    makeCheck(
      'eas.json has submit.production.ios.ascAppId',
      Boolean(ascAppId),
      ascAppId ? `ascAppId=${ascAppId}` : 'missing submit.production.ios.ascAppId'
    )
  )

  checks.push(
    makeCheck(
      'ios Info.plist contains CFBundleVersion',
      Boolean(plistBundleVersion),
      plistBundleVersion ? `CFBundleVersion=${plistBundleVersion}` : 'missing CFBundleVersion string value'
    )
  )

  checks.push(
    makeCheck(
      'build number aligned between app.json and Info.plist',
      Boolean(buildNumber) && Boolean(plistBundleVersion) && String(buildNumber) === String(plistBundleVersion),
      `app.json=${String(buildNumber)} vs Info.plist=${String(plistBundleVersion)}`
    )
  )

  const manualCheckSignals = [
    {
      name: 'Gate F Ready to Submit line remains unchecked',
      marker: '| All three products status = Ready to Submit (not Missing Metadata) | [ ] |',
      reference: 'PRE_TESTFLIGHT_READINESS_GATE.md'
    },
    {
      name: 'Gate G RoPhone paywall proof remains unchecked',
      marker: '| Subscription / paywall screen can fetch offerings on RoPhone (no "no offerings configured" error) | [ ] |',
      reference: 'PRE_TESTFLIGHT_READINESS_GATE.md'
    },
    {
      name: 'Gate G restore purchases proof remains unchecked',
      marker: '| Restore Purchases path reachable from Profile / Settings | [ ] |',
      reference: 'PRE_TESTFLIGHT_READINESS_GATE.md'
    },
    {
      name: 'Go or no-go doc still marked NO-GO',
      marker: 'NO-GO for App Store submission.',
      reference: 'IOS_SUBMISSION_GO_NO_GO.md'
    }
  ]

  const manualFindings = manualCheckSignals.map((signal) => {
    const sourceText = signal.reference === 'PRE_TESTFLIGHT_READINESS_GATE.md' ? gateDoc : goNoGoDoc
    const present = hasUncheckedLine(sourceText, signal.marker)
    return {
      name: signal.name,
      blocking: true,
      pending: present,
      evidence: present ? `${signal.reference} still contains: ${signal.marker}` : `${signal.reference} marker not found`
    }
  })

  const automatedBlockingFailures = checks.filter((check) => check.blocking && !check.pass)
  const manualBlockingPending = manualFindings.filter((finding) => finding.blocking && finding.pending)

  const overallGo = automatedBlockingFailures.length === 0 && manualBlockingPending.length === 0

  const report = {
    generatedAt: new Date().toISOString(),
    overall: overallGo ? 'GO' : 'NO-GO',
    automated: {
      checks,
      failureCount: automatedBlockingFailures.length
    },
    manualSignals: {
      findings: manualFindings,
      pendingCount: manualBlockingPending.length
    },
    summary: {
      automatedBlockingFailures: automatedBlockingFailures.map((c) => c.name),
      manualBlockingPending: manualBlockingPending.map((f) => f.name)
    }
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')

  console.log('iOS Go/No-Go Audit')
  console.log(`overall=${report.overall}`)
  console.log(`automated_failures=${report.automated.failureCount}`)
  console.log(`manual_pending=${report.manualSignals.pendingCount}`)
  console.log(`report=${path.relative(rootDir, reportPath)}`)

  if (report.summary.automatedBlockingFailures.length > 0) {
    console.log('automated blocking failures:')
    for (const item of report.summary.automatedBlockingFailures) {
      console.log(`- ${item}`)
    }
  }

  if (report.summary.manualBlockingPending.length > 0) {
    console.log('manual blocking pending:')
    for (const item of report.summary.manualBlockingPending) {
      console.log(`- ${item}`)
    }
  }

  process.exitCode = overallGo ? 0 : 2
}

run()
