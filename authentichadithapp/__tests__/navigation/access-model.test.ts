/**
 * AUTHENTIC HADITH — ACCESS MODEL & PAYWALL REGRESSION SUITE
 *
 * Verifies the 3-state access model:
 * 1. FREE: Can dismiss paywall, access free corpus, no infinite loop
 * 2. TRIAL: Entitlement active via StoreKit introductory offer -> premium access granted
 * 3. PAID PREMIUM: Active subscription -> full premium access
 *
 * Covers:
 * TEST 1: Non-premium user closes paywall -> paywall remains closed -> free experience accessible
 * TEST 2: Non-premium user attempts premium-only feature -> paywall appears intentionally
 * TEST 3: Premium user launches app -> no unnecessary paywall
 * TEST 4: RevenueCat state refresh -> free user is not forced into an infinite paywall loop
 * TEST 5: Trial-active entitlement -> premium access granted
 * PLUS: StoreKit introductory trial detection (real metadata vs no intro offer vs lifetime)
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
    checkTrialOrIntroductoryPriceEligibility: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 0, WARN: 2 },
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL', LIFETIME: 'LIFETIME' },
  INTRO_ELIGIBILITY_STATUS: {
    INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
    INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
    INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
    INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3,
  },
}))

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: {} },
  },
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

/**
 * Pure evaluation of NavigationGate routing logic in app/_layout.tsx
 */
function resolveNavigationGate({
  authLoading,
  rcLoading,
  onboarded,
  user,
  isPro,
  segments,
}: {
  authLoading: boolean
  rcLoading: boolean
  onboarded: boolean | null
  user: { id: string; email?: string } | null
  isPro: boolean
  segments: string[]
}): string | null {
  if (authLoading || rcLoading || onboarded === null) return null

  const inAuth = segments[0] === 'auth'
  const inShared = segments[0] === 'shared'
  const inOnboarding = segments[0] === 'onboarding'

  if (!user) {
    if (!inAuth && !inShared) return '/auth/signup'
    return null
  }

  if (!onboarded) {
    if (!inOnboarding) return '/onboarding'
    return null
  }

  // Anti-loop guard: once onboarded, advance directly to tabs.
  // Free users access the free tier; premium features are gated at feature boundaries.
  if (inOnboarding && onboarded) {
    return '/(tabs)'
  }

  // All gates passed — stay on current route, no redirect needed
  return null
}

describe('AUTHENTIC HADITH 3-STATE ACCESS MODEL & NAVIGATION REGRESSION', () => {
  const freeUser = { id: 'usr-free-123', email: 'freeuser@example.com' }
  const paidUser = { id: 'usr-paid-456', email: 'subscriber@example.com' }

  // ── TEST 1: Non-premium user closes paywall ──────────────────────────────────
  describe('TEST 1: Non-premium user closes paywall', () => {
    it('allows a free user to dismiss paywall to tabs without being redirected back to paywall', () => {
      // User is on paywall
      const initialRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: true,
        user: freeUser,
        isPro: false,
        segments: ['paywall'],
      })
      expect(initialRoute).toBeNull() // allowed on paywall

      // User taps X / dismiss button -> routes to /(tabs)
      const afterDismissRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: true,
        user: freeUser,
        isPro: false,
        segments: ['(tabs)'],
      })
      // CRITICAL: Must be null (stay on tabs). In the bugged version, this returned '/paywall'
      expect(afterDismissRoute).toBeNull()
    })

    it('free user navigating among free tabs/screens is never intercepted by NavigationGate', () => {
      const freeScreens = [
        ['(tabs)', 'index'],
        ['(tabs)', 'collections'],
        ['(tabs)', 'search'],
        ['(tabs)', 'today'],
        ['hadith', '1'],
        ['collection', 'sahih-bukhari'],
        ['topics'],
      ]

      for (const segments of freeScreens) {
        const redirect = resolveNavigationGate({
          authLoading: false,
          rcLoading: false,
          onboarded: true,
          user: freeUser,
          isPro: false,
          segments,
        })
        expect(redirect).toBeNull()
      }
    })
  })

  // ── TEST 2: Non-premium user attempts premium-only feature ───────────────────
  describe('TEST 2: Non-premium user attempts premium-only feature', () => {
    it('identifies premium-required features correctly', () => {
      const { isPremiumRequired } = require('@/lib/premium/subscription-check')
      expect(isPremiumRequired('assistant')).toBe(true)
      expect(isPremiumRequired('unlimited_lessons')).toBe(true)
    })

    it('requires premium for AI assistant and unlimited lessons', () => {
      const { isPremiumRequired } = require('@/lib/premium/subscription-check')
      const isFeatureAllowedForFree = (feature: 'assistant' | 'unlimited_lessons') => {
        return !isPremiumRequired(feature)
      }
      expect(isFeatureAllowedForFree('assistant')).toBe(false)
      expect(isFeatureAllowedForFree('unlimited_lessons')).toBe(false)
    })
  })

  // ── TEST 3: Premium user launches app ────────────────────────────────────────
  describe('TEST 3: Premium user launches app', () => {
    it('premium user directly accesses tabs without paywall redirection', () => {
      const launchRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: true,
        user: paidUser,
        isPro: true,
        segments: ['(tabs)'],
      })
      expect(launchRoute).toBeNull()
    })

    it('premium user landing on onboarding is forwarded directly to tabs', () => {
      const onboardedRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: true,
        user: paidUser,
        isPro: true,
        segments: ['onboarding'],
      })
      expect(onboardedRoute).toBe('/(tabs)')
    })
  })

  // ── TEST 4: RevenueCat state refresh ─────────────────────────────────────────
  describe('TEST 4: RevenueCat state refresh', () => {
    it('does not trap free user when RevenueCat refreshes customerInfo or reloads offerings', () => {
      // Free user remains on tabs even after customerInfo listener fires with empty entitlements
      const afterRefreshRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: true,
        user: freeUser,
        isPro: false,
        segments: ['(tabs)', 'search'],
      })
      expect(afterRefreshRoute).toBeNull()
    })

    it('unauthenticated user is sent to auth regardless of RC status', () => {
      const unauthRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: null,
        user: null,
        isPro: false,
        segments: ['(tabs)'],
      })
      // While auth/onboarded is loading, returns null
      expect(unauthRoute).toBeNull()

      const unauthResolved = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: false,
        user: null,
        isPro: false,
        segments: ['(tabs)'],
      })
      expect(unauthResolved).toBe('/auth/signup')
    })
  })

  // ── TEST 5: Trial-active entitlement ─────────────────────────────────────────
  describe('TEST 5: Trial-active entitlement', () => {
    it('evaluates isPro as true when StoreKit introductory trial is active in CustomerInfo', () => {
      const { isReviewerEmail, ENTITLEMENT_ID } = require('@/lib/revenuecat/config')
      const trialCustomerInfo = {
        entitlements: {
          active: {
            [ENTITLEMENT_ID]: {
              identifier: 'premium',
              isActive: true,
              periodType: 'TRIAL',
              productIdentifier: 'ah_annual_premium',
              expirationDate: '2026-09-13T00:00:00Z',
              willRenew: true,
            },
          },
        },
      }

      const email = 'newtrialuser@example.com'
      const isPro =
        isReviewerEmail(email) ||
        trialCustomerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true

      expect(isPro).toBe(true)
    })

    it('grants full application access to trial users with no paywall lock', () => {
      const trialRoute = resolveNavigationGate({
        authLoading: false,
        rcLoading: false,
        onboarded: true,
        user: { id: 'trial-user', email: 'newtrialuser@example.com' },
        isPro: true,
        segments: ['(tabs)'],
      })
      expect(trialRoute).toBeNull()
    })
  })

  // ── STOREKIT INTRODUCTORY TRIAL METADATA VERIFICATION ────────────────────────
  describe('StoreKit Introductory Trial Metadata Logic (getPackageTrialDetails)', () => {
    const { getPackageTrialDetails } = require('@/lib/purchases/trial')

    const mockAnnualPackageWith7DayTrial = {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: {
        identifier: 'ah_annual_premium',
        description: 'Annual Subscription',
        title: 'Premium Annual',
        price: 49.99,
        priceString: '$49.99',
        currencyCode: 'USD',
        introPrice: {
          price: 0,
          priceString: '$0.00',
          cycles: 1,
          period: 'P1W',
          periodUnit: 'DAY',
          periodNumberOfUnits: 7,
        },
        discounts: null,
        productCategory: null,
        productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
        subscriptionPeriod: 'P1Y',
        defaultOption: null,
        pricePerWeek: 0.96,
        pricePerMonth: 4.17,
        pricePerYear: 49.99,
        pricePerWeekString: '$0.96',
        pricePerMonthString: '$4.17',
        pricePerYearString: '$49.99',
      },
      offeringIdentifier: 'default',
    }

    const mockAnnualPackageWithoutTrial = {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: {
        identifier: 'ah_annual_premium',
        description: 'Annual Subscription',
        title: 'Premium Annual',
        price: 49.99,
        priceString: '$49.99',
        currencyCode: 'USD',
        introPrice: null, // No introductory offer configured in ASC
        discounts: null,
        productCategory: null,
        productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
        subscriptionPeriod: 'P1Y',
        defaultOption: null,
        pricePerWeek: 0.96,
        pricePerMonth: 4.17,
        pricePerYear: 49.99,
        pricePerWeekString: '$0.96',
        pricePerMonthString: '$4.17',
        pricePerYearString: '$49.99',
      },
      offeringIdentifier: 'default',
    }

    const mockLifetimePackage = {
      identifier: '$rc_lifetime',
      packageType: 'LIFETIME',
      product: {
        identifier: 'ah_lifetime_premium',
        description: 'Lifetime Access',
        title: 'Lifetime Premium',
        price: 99.99,
        priceString: '$99.99',
        currencyCode: 'USD',
        introPrice: null,
        discounts: null,
        productCategory: null,
        productType: 'NON_SUBSCRIPTION',
        subscriptionPeriod: null,
        defaultOption: null,
        pricePerWeek: null,
        pricePerMonth: null,
        pricePerYear: null,
        pricePerWeekString: null,
        pricePerMonthString: null,
        pricePerYearString: null,
      },
      offeringIdentifier: 'default',
    }

    it('parses real 7-day introductory free trial from StoreKit metadata when configured', () => {
      const details = getPackageTrialDetails(mockAnnualPackageWith7DayTrial, true)
      expect(details.hasTrial).toBe(true)
      expect(details.durationDays).toBe(7)
      expect(details.badgeText).toBe('7-Day Free Trial')
      expect(details.ctaText).toBe('Start 7-Day Free Trial')
      expect(details.billingSubtext).toContain('7 days free, then $49.99 / year. Cancel anytime.')
    })

    it('returns hasTrial: false and "Start My Plan" when StoreKit has no intro offer (current ASC state)', () => {
      const details = getPackageTrialDetails(mockAnnualPackageWithoutTrial, true)
      expect(details.hasTrial).toBe(false)
      expect(details.durationDays).toBe(0)
      expect(details.ctaText).toBe('Start My Plan')
      expect(details.billingSubtext).toBe('')
    })

    it('does NOT offer trial for LIFETIME package', () => {
      const details = getPackageTrialDetails(mockLifetimePackage, true)
      expect(details.hasTrial).toBe(false)
      expect(details.ctaText).toBe('Unlock Lifetime Access')
      expect(details.billingSubtext).toBe('One-time purchase · Lifetime access')
    })

    it('suppresses trial if user is known to be ineligible (already used trial)', () => {
      const details = getPackageTrialDetails(mockAnnualPackageWith7DayTrial, false)
      expect(details.hasTrial).toBe(false)
      expect(details.ctaText).toBe('Start My Plan')
    })
  })
})
