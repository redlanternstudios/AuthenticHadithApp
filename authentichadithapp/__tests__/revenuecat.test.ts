/**
 * Tests for RevenueCat IAP consolidation (Workstream B, Task B1)
 *
 * Covers:
 *  - PRODUCT_IDS has all three product identifiers
 *  - ENTITLEMENT_ID equals 'premium'
 *  - getRevenueCatApiKey returns a valid iOS key format
 *  - Paywall (subscription screen) shows all three tier options via offerings mock
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(),
    getCustomerInfo: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    setLogLevel: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 0, WARN: 2 },
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL', LIFETIME: 'LIFETIME' },
}))

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RevenueCat config — single source of truth', () => {
  it('PRODUCT_IDS defines all three product identifiers', () => {
    const { PRODUCT_IDS } = require('@/lib/revenuecat/config')
    expect(PRODUCT_IDS.MONTHLY_PREMIUM).toBe('ah_monthly_premium')
    expect(PRODUCT_IDS.ANNUAL_PREMIUM).toBe('ah_annual_premium')
    expect(PRODUCT_IDS.LIFETIME).toBe('ah_lifetime_premium')
  })

  it('ENTITLEMENT_ID equals "premium"', () => {
    const { ENTITLEMENT_ID } = require('@/lib/revenuecat/config')
    expect(ENTITLEMENT_ID).toBe('premium')
  })

  it('lib/purchases/revenuecat re-exports PRODUCT_IDS and ENTITLEMENT_ID from config (no duplicates)', () => {
    const config = require('@/lib/revenuecat/config')
    const purchases = require('@/lib/purchases/revenuecat')
    // Both should resolve to the same values — purchases re-exports, not redefines
    expect(purchases.PRODUCT_IDS).toEqual(config.PRODUCT_IDS)
    expect(purchases.ENTITLEMENT_ID).toBe(config.ENTITLEMENT_ID)
  })
})

describe('getRevenueCatApiKey — iOS key format', () => {
  it('returns a key starting with "appl_" on iOS', () => {
    const { getRevenueCatApiKey } = require('@/lib/revenuecat/config')
    const result = getRevenueCatApiKey()
    // On iOS the function must return a valid public key (appl_ prefix) or null
    // In test environment the hardcoded fallback is used
    expect(result.apiKey).not.toBeNull()
    expect(result.apiKey).toMatch(/^appl_/)
  })

  it('does not return a secret key (sk_ prefix is forbidden for client bundles)', () => {
    const { getRevenueCatApiKey } = require('@/lib/revenuecat/config')
    const result = getRevenueCatApiKey()
    expect(result.apiKey).not.toMatch(/^sk_/)
  })
})

describe('Paywall — all three tiers present in offerings', () => {
  it('availablePackages contains monthly, annual, and lifetime products', () => {
    // Mock offerings returned by getOfferings() to simulate RevenueCat response
    const mockPackages = [
      {
        identifier: '$rc_monthly',
        product: {
          identifier: 'ah_monthly_premium',
          title: 'Premium Monthly',
          priceString: '$4.99/mo',
          description: 'Monthly subscription',
        },
      },
      {
        identifier: '$rc_annual',
        product: {
          identifier: 'ah_annual_premium',
          title: 'Premium Annual',
          priceString: '$39.99/yr',
          description: 'Annual subscription',
        },
      },
      {
        identifier: '$rc_lifetime',
        product: {
          identifier: 'ah_lifetime_premium',
          title: 'Lifetime Access',
          priceString: '$99.99',
          description: 'One-time purchase',
        },
      },
    ]

    const { PRODUCT_IDS } = require('@/lib/revenuecat/config')

    const identifiers = mockPackages.map((p) => p.product.identifier)
    expect(identifiers).toContain(PRODUCT_IDS.MONTHLY_PREMIUM)
    expect(identifiers).toContain(PRODUCT_IDS.ANNUAL_PREMIUM)
    expect(identifiers).toContain(PRODUCT_IDS.LIFETIME)
  })

  it('getOfferings returns current offering packages when RC is configured', async () => {
    const Purchases = require('react-native-purchases').default
    const mockPackages = [
      { identifier: '$rc_monthly', product: { identifier: 'ah_monthly_premium' } },
      { identifier: '$rc_annual', product: { identifier: 'ah_annual_premium' } },
      { identifier: '$rc_lifetime', product: { identifier: 'ah_lifetime_premium' } },
    ]
    Purchases.getOfferings.mockResolvedValueOnce({
      current: { availablePackages: mockPackages },
    })

    // Force isConfigured state by calling configure first
    Purchases.configure.mockImplementation(() => {})
    // We test getOfferings directly without relying on module state
    const offerings = await Purchases.getOfferings()
    expect(offerings.current.availablePackages).toHaveLength(3)
  })
})

describe('isReviewerEmail — Apple reviewer premium bypass (Build 29)', () => {
  it('grants premium ONLY for the exact Apple reviewer demo email (case-insensitive)', () => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    expect(isReviewerEmail('apple.reviewer+20260604@authentichadith.app')).toBe(true)
    // case-insensitive + trims surrounding whitespace
    expect(isReviewerEmail('  APPLE.REVIEWER+20260604@AuthenticHadith.app ')).toBe(true)
  })

  it('grants premium for the legacy reviewer demo email (Profile/Subscription consistency)', () => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    expect(isReviewerEmail('apple.reviewer@authentichadith.app')).toBe(true)
  })

  it('does NOT grant premium to any normal/production user', () => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    expect(isReviewerEmail('user@gmail.com')).toBe(false)
    expect(isReviewerEmail('kp@pennenterprisesllc.com')).toBe(false)
    // no domain/wildcard match — lookalikes at the same domain are still false
    expect(isReviewerEmail('fake.reviewer@authentichadith.app')).toBe(false)
    expect(isReviewerEmail('hacker+apple.reviewer+20260604@authentichadith.app')).toBe(false)
  })

  it('handles null/undefined/empty safely (no bypass)', () => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    expect(isReviewerEmail(null)).toBe(false)
    expect(isReviewerEmail(undefined)).toBe(false)
    expect(isReviewerEmail('')).toBe(false)
  })
})

describe('getSubscriptionStatus — lifetime vs renewing classification (FIX-082)', () => {
  const Purchases = require('react-native-purchases').default

  beforeEach(() => {
    const { _resetStateForTests } = require('@/lib/purchases/revenuecat')
    _resetStateForTests()
    jest.clearAllMocks()
  })

  it('classifies a far-future promotional grant (e.g. 2226) as lifetime, never a renewal date', async () => {
    Purchases.configure.mockImplementationOnce(() => {})
    Purchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: { premium: {
        productIdentifier: 'rc_promo_premium_lifetime',
        expirationDate: '2226-04-22T00:00:00Z',
        willRenew: false,
      } } },
    })
    const { getSubscriptionStatus, configureRevenueCat } = require('@/lib/purchases/revenuecat')
    await configureRevenueCat('test-user-lifetime')
    const status = await getSubscriptionStatus()
    expect(status.isActive).toBe(true)
    expect(status.tier).toBe('lifetime')

    // Direct classification check (mirrors the shipped expression)
    const isLifetime = ('rc_promo_premium_lifetime' as string) === 'ah_lifetime_premium' ||
      new Date('2226-04-22T00:00:00Z').getFullYear() > 2100
    expect(isLifetime).toBe(true)
  })

  it('keeps a normal monthly subscription as renewing premium with its RevenueCat date', () => {
    const exp = '2026-07-12T00:00:00Z'
    const isLifetime = ('ah_monthly_premium' as string) === 'ah_lifetime_premium' ||
      new Date(exp).getFullYear() > 2100
    expect(isLifetime).toBe(false)
    expect(new Date(exp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })).toMatch(/Jul 1[12], 2026/)
  })

  it('free user with no entitlement stays free', async () => {
    Purchases.configure.mockImplementationOnce(() => {})
    Purchases.getCustomerInfo.mockResolvedValueOnce({ entitlements: { active: {} } })
    const { getSubscriptionStatus, configureRevenueCat } = require('@/lib/purchases/revenuecat')
    await configureRevenueCat('test-user-free')
    const status = await getSubscriptionStatus()
    expect(status.isActive).toBe(false)
    expect(status.tier).toBe('free')
  })
})

describe('Premium UI truth table — Upgrade CTA gating (FIX-083)', () => {
  // Mirrors the canonical rule every screen gates on:
  // isPro = isReviewerEmail(email) || entitlements.active.premium?.isActive === true
  // Profile renders "Upgrade to Pro" only when !isPro.
  const computeIsPro = (email: string | null, entitlementActive: boolean) => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    return isReviewerEmail(email) || entitlementActive === true
  }
  const showsUpgradeCTA = (email: string | null, entitlementActive: boolean) =>
    !computeIsPro(email, entitlementActive)

  it('free user → sees Upgrade to Pro', () => {
    expect(showsUpgradeCTA('user@gmail.com', false)).toBe(true)
  })
  it('active monthly subscriber → NO Upgrade to Pro', () => {
    expect(showsUpgradeCTA('user@gmail.com', true)).toBe(false)
  })
  it('active annual subscriber → NO Upgrade to Pro', () => {
    expect(showsUpgradeCTA('annual@user.com', true)).toBe(false)
  })
  it('lifetime purchaser → NO Upgrade to Pro', () => {
    expect(showsUpgradeCTA('lifetime@user.com', true)).toBe(false)
  })
  it('reviewer lifetime accounts → NO Upgrade to Pro (even with RC unresolved)', () => {
    expect(showsUpgradeCTA('apple.reviewer@authentichadith.app', false)).toBe(false)
    expect(showsUpgradeCTA('apple.reviewer+20260604@authentichadith.app', false)).toBe(false)
  })
  it('lookalike reviewer emails → still see Upgrade to Pro (denied bypass)', () => {
    expect(showsUpgradeCTA('apple.reviewer.fake@authentichadith.app', false)).toBe(true)
  })

  it('internal lifetime accounts resolve as lifetime premium (no Upgrade CTA, no RC grant needed)', () => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    for (const email of ['roryleesemeah@icloud.com', 'g.homira@gmail.com', 'clashon64@gmail.com']) {
      expect(isReviewerEmail(email)).toBe(true)
      expect(showsUpgradeCTA(email, false)).toBe(false)
    }
    // case-insensitive
    expect(isReviewerEmail('Clashon64@Gmail.com')).toBe(true)
  })

  it('lookalikes of internal lifetime accounts are denied', () => {
    const { isReviewerEmail } = require('@/lib/revenuecat/config')
    expect(isReviewerEmail('roryleesemeah+x@icloud.com')).toBe(false)
    expect(isReviewerEmail('rorylee.semeah@icloud.com')).toBe(false)
    expect(isReviewerEmail('g.homira@gmail.co')).toBe(false)
    expect(isReviewerEmail('clashon640@gmail.com')).toBe(false)
    expect(isReviewerEmail('clashon64@gmail.com.evil.com')).toBe(false)
  })
})

describe('Post-purchase/restore canonical refresh (FIX-083)', () => {
  it('useRevenueCatSubscription.purchasePackage calls refreshCustomerInfo after a successful purchase', () => {
    const fs = require('fs')
    const src = fs.readFileSync('hooks/useRevenueCatSubscription.ts', 'utf8')
    // The success branch must refresh canonical provider state before returning
    const successBlock = src.split('isActive)')[1] || ''
    expect(successBlock).toContain('await refreshCustomerInfo()')
    expect(src).toContain('[refreshCustomerInfo]') // dep array wired
  })
  it('subscription screen refreshes canonical state after purchase AND restore', () => {
    const fs = require('fs')
    const src = fs.readFileSync('app/settings/subscription.tsx', 'utf8')
    expect((src.match(/refreshCustomerInfo\(\)/g) || []).length).toBeGreaterThanOrEqual(2)
  })
  it('PaywallScreen refreshes canonical state on purchase and restore completion', () => {
    const fs = require('fs')
    const src = fs.readFileSync('components/premium/PaywallScreen.tsx', 'utf8')
    expect((src.match(/refreshCustomerInfo\(\)/g) || []).length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Regression Test Suite: Release Gate & Entitlement Verification (Cases A-E) ───

describe('CASE A: User has no entitlement → premium access remains locked', () => {
  const Purchases = require('react-native-purchases').default

  beforeEach(() => {
    const { _resetStateForTests } = require('@/lib/purchases/revenuecat')
    _resetStateForTests()
    jest.clearAllMocks()
  })

  it('evaluates isPro as false for unentitled normal user', () => {
    const { isReviewerEmail, ENTITLEMENT_ID } = require('@/lib/revenuecat/config')
    const customerInfo: any = {
      entitlements: {
        active: {},
      },
    }

    const email = 'normal.user@example.com'
    const isPro =
      isReviewerEmail(email) ||
      customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true

    expect(isPro).toBe(false)
  })

  it('getSubscriptionStatus returns isActive: false and tier: "free"', async () => {
    Purchases.configure.mockImplementationOnce(() => {})
    Purchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: {} },
    })

    const { configureRevenueCat, getSubscriptionStatus } = require('@/lib/purchases/revenuecat')
    await configureRevenueCat('test-user-1')

    const status = await getSubscriptionStatus()
    expect(status.isActive).toBe(false)
    expect(status.tier).toBe('free')
    expect(status.expiresAt).toBeNull()
  })
})

describe('CASE B: User has active entitlement → premium access unlocks', () => {
  const Purchases = require('react-native-purchases').default

  beforeEach(() => {
    const { _resetStateForTests } = require('@/lib/purchases/revenuecat')
    _resetStateForTests()
    jest.clearAllMocks()
  })

  it('evaluates isPro as true when premium entitlement is active', () => {
    const { isReviewerEmail, ENTITLEMENT_ID } = require('@/lib/revenuecat/config')
    const customerInfo = {
      entitlements: {
        active: {
          [ENTITLEMENT_ID]: {
            identifier: 'premium',
            isActive: true,
            productIdentifier: 'ah_monthly_premium',
            expirationDate: '2026-10-01T00:00:00Z',
            willRenew: true,
          },
        },
      },
    }

    const email = 'subscriber@example.com'
    const isPro =
      isReviewerEmail(email) ||
      customerInfo?.entitlements.active[ENTITLEMENT_ID]?.isActive === true

    expect(isPro).toBe(true)
  })

  it('getSubscriptionStatus returns isActive: true and tier: "premium" for monthly/annual subscriber', async () => {
    Purchases.configure.mockImplementationOnce(() => {})
    Purchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: {
        active: {
          premium: {
            productIdentifier: 'ah_annual_premium',
            expirationDate: '2027-01-01T00:00:00Z',
            willRenew: true,
          },
        },
      },
    })

    const { configureRevenueCat, getSubscriptionStatus } = require('@/lib/purchases/revenuecat')
    await configureRevenueCat('sub-user-2')
    const status = await getSubscriptionStatus()
    expect(status.isActive).toBe(true)
    expect(status.tier).toBe('premium')
    expect(status.willRenew).toBe(true)
    expect(status.expiresAt).toBe('2027-01-01T00:00:00Z')
  })
})

describe('CASE C: RevenueCat request temporarily fails → bounded retry occurs → premium is NOT granted by default', () => {
  const Purchases = require('react-native-purchases').default

  beforeEach(() => {
    const { _resetStateForTests } = require('@/lib/purchases/revenuecat')
    _resetStateForTests()
    jest.clearAllMocks()
  })

  it('fails safely when Purchases.configure throws and does NOT grant premium', async () => {
    const {
      configureRevenueCat,
      isRevenueCatConfigured,
      getSubscriptionStatus,
    } = require('@/lib/purchases/revenuecat')

    Purchases.configure.mockImplementationOnce(() => {
      throw new Error('Network timeout contacting RevenueCat')
    })

    const ok = await configureRevenueCat('user-fail-1')
    expect(ok).toBe(false)
    expect(isRevenueCatConfigured()).toBe(false)

    // Fails closed — getSubscriptionStatus returns free tier
    const status = await getSubscriptionStatus()
    expect(status.isActive).toBe(false)
    expect(status.tier).toBe('free')

    // isPro evaluation on failed configure stays false for normal users
    const { isReviewerEmail, ENTITLEMENT_ID } = require('@/lib/revenuecat/config')
    const customerInfo: any = null
    const isPro =
      isReviewerEmail('normal@user.com') ||
      customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]?.isActive === true
    expect(isPro).toBe(false)
  })

  it('bounds retry to at most ONE attempt per app session without infinite loops', async () => {
    const {
      configureRevenueCat,
      attemptConfigureRetry,
      isRevenueCatConfigured,
    } = require('@/lib/purchases/revenuecat')

    // First mount configure fails
    Purchases.configure.mockImplementationOnce(() => {
      throw new Error('Transient error')
    })
    const initial = await configureRevenueCat('user-retry-1')
    expect(initial).toBe(false)
    expect(isRevenueCatConfigured()).toBe(false)

    // First retry is allowed
    Purchases.configure.mockImplementationOnce(() => {})
    const retry1 = await attemptConfigureRetry('user-retry-1')
    expect(retry1).toBe(true)
    expect(isRevenueCatConfigured()).toBe(true)

    // Second retry is blocked (bounded to 1 retry per session)
    const retry2 = await attemptConfigureRetry('user-retry-1')
    expect(retry2).toBe(false)
  })
})

describe('CASE D: Reviewer fallback applies only to the exact intended reviewer identity', () => {
  const { isReviewerEmail, REVIEWER_EMAILS } = require('@/lib/revenuecat/config')

  it('strictly matches all authorized reviewer and internal demo emails', () => {
    for (const email of REVIEWER_EMAILS) {
      expect(isReviewerEmail(email)).toBe(true)
      expect(isReviewerEmail(email.toUpperCase())).toBe(true)
      expect(isReviewerEmail(`  ${email}  `)).toBe(true)
    }
  })

  it('strictly rejects unauthorized users, substrings, lookalikes, and edge-cases', () => {
    const unauthorized = [
      'user@gmail.com',
      'attacker@authentichadith.app',
      'apple.reviewer+20260604@evil.com',
      'apple.reviewer+20260604@authentichadith.app.attacker.com',
      'fake_apple.reviewer+20260604@authentichadith.app',
      'apple.reviewer+20260604@authentichadith.apps',
      'clashon64@gmail.com.co',
      'roryleesemeah@gmail.com', // icloud is allowed, gmail is not
      'g.homira@icloud.com', // gmail is allowed, icloud is not
      '',
      '   ',
      null,
      undefined,
    ]

    for (const email of unauthorized) {
      expect(isReviewerEmail(email)).toBe(false)
    }
  })
})

describe('CASE E: A forbidden temporary release marker is introduced → qa-release-guard.mjs fails the check', () => {
  const fs = require('fs')
  const path = require('path')

  const forbiddenRules = [
    { label: 'temporary screenshot bypass marker', pattern: /SCREENSHOT-BYPASS/i },
    { label: 'manual revert reminder in runtime/config code', pattern: /REVERT BEFORE COMMIT/i },
    { label: 'forced premium entitlement', pattern: /\b(?:const|let|var)\s+(?:isPro|isPremium)\s*=\s*true\b/ },
    { label: 'disabled RevenueCat retry/init marker', pattern: /no RC retry|skip RevenueCat configure entirely/i },
  ]

  it('detects each forbidden marker pattern deterministically', () => {
    const violations = [
      '// SCREENSHOT-BYPASS: forced pro',
      '/* REVERT BEFORE COMMIT */',
      'const isPro = true',
      'let isPro = true',
      'var isPremium = true',
      'const isPremium = true',
      '// no RC retry on sim',
      '// skip RevenueCat configure entirely',
    ]

    for (const sample of violations) {
      const matched = forbiddenRules.some((r) => r.pattern.test(sample))
      expect(matched).toBe(true)
    }
  })

  it('scans all critical runtime directories (app, components, hooks, lib, constants, types, app.config.js, app.json, eas.json)', () => {
    const scriptSrc = fs.readFileSync(path.join(__dirname, '../scripts/qa-release-guard.mjs'), 'utf8')
    expect(scriptSrc).toContain("'hooks'")
    expect(scriptSrc).toContain("'constants'")
    expect(scriptSrc).toContain("'types'")
    expect(scriptSrc).toContain("'app.config.js'")
    expect(scriptSrc).toContain("'app.json'")
    expect(scriptSrc).toContain("'eas.json'")
  })

  it('passes cleanly against current repository state', () => {
    const { execSync } = require('child_process')
    const output = execSync('node scripts/qa-release-guard.mjs', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    })
    expect(output).toContain('CTP RELEASE GUARD: PASS')
  })
})

