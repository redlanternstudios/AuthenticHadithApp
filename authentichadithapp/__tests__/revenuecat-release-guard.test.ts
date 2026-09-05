import fs from 'fs'
import path from 'path'

describe('RevenueCat production release guard', () => {
  const providerPath = path.join(
    process.cwd(),
    'lib',
    'revenuecat',
    'RevenueCatProvider.tsx',
  )
  const providerSource = fs.readFileSync(providerPath, 'utf8')

  it('never ships the screenshot premium bypass', () => {
    expect(providerSource).not.toMatch(/const\s+isPro\s*=\s*true\b/)
    expect(providerSource).not.toContain('SCREENSHOT-BYPASS')
  })

  it('derives premium access from the reviewer allowlist or active entitlement', () => {
    expect(providerSource).toContain('isReviewerEmail(user?.email)')
    expect(providerSource).toContain(
      'customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true',
    )
  })

  it('initializes RevenueCat and preserves the bounded retry path', () => {
    expect(providerSource).toContain('configureRevenueCat(user?.id)')
    expect(providerSource).toContain('attemptConfigureRetry(user.id)')
    expect(providerSource).not.toMatch(/useEffect\(\(\)\s*=>\s*\{\s*return\s*(?:\/\/[^\n]*)?\s*if\s*\(isConfigured\)/s)
  })
})
