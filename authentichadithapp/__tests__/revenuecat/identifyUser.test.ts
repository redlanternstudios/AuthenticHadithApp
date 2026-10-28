/**
 * identifyUser — RevenueCat keystone tests
 *
 * Covers:
 *   1. identifyUser calls Purchases.logIn with the supplied Supabase UUID.
 *   2. identifyUser is a no-op when RC is not configured.
 *   3. identifyUser is a no-op when the Purchases SDK is absent.
 *   4. resetUser calls Purchases.logOut.
 *   5. resetUser is a no-op when RC is not configured.
 *   6. isRevenueCatConfigured reflects the module-level flag.
 */

// ─── Hoisted mocks (must precede imports) ──────────────────────────────────

const mockLogIn = jest.fn().mockResolvedValue(undefined)
const mockLogOut = jest.fn().mockResolvedValue(undefined)
const mockConfigure = jest.fn()

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: mockConfigure,
    logIn: mockLogIn,
    logOut: mockLogOut,
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
    setLogLevel: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN' },
  PACKAGE_TYPE: {},
}))

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        revenueCatApiKeyIos: 'appl_test_key_abc123',
      },
    },
  },
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

// ─── Imports (after mocks) ─────────────────────────────────────────────────

import {
  identifyUser,
  resetUser,
  configureRevenueCat,
  isRevenueCatConfigured,
} from '@/lib/purchases/revenuecat'

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Reset module-level state between tests.
 * jest.resetModules() is the cleanest way to get a fresh isConfigured = false.
 */
function freshModule() {
  jest.resetModules()
  // Re-apply mocks after reset
  jest.mock('react-native-purchases', () => ({
    __esModule: true,
    default: {
      configure: mockConfigure,
      logIn: mockLogIn,
      logOut: mockLogOut,
      getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
      getOfferings: jest.fn().mockResolvedValue({ current: null }),
      addCustomerInfoUpdateListener: jest.fn(),
      removeCustomerInfoUpdateListener: jest.fn(),
      setLogLevel: jest.fn(),
    },
    LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN' },
    PACKAGE_TYPE: {},
  }))
  return require('@/lib/purchases/revenuecat')
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('identifyUser — RevenueCat keystone', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 1. Happy path: identifyUser → Purchases.logIn ───────────────────────
  it('calls Purchases.logIn with the Supabase UUID after configure', async () => {
    const rc = freshModule()
    await rc.configureRevenueCat('user-uuid-111')
    jest.clearAllMocks()

    await rc.identifyUser('user-uuid-222')

    expect(mockLogIn).toHaveBeenCalledTimes(1)
    expect(mockLogIn).toHaveBeenCalledWith('user-uuid-222')
  })

  // ── 2. Guard: not configured ─────────────────────────────────────────────
  it('is a no-op when RC is not yet configured', async () => {
    const rc = freshModule()
    // Do NOT call configureRevenueCat — isConfigured stays false

    await rc.identifyUser('user-uuid-333')

    expect(mockLogIn).not.toHaveBeenCalled()
  })

  // ── 3. Guard: SDK absent ──────────────────────────────────────────────────
  it('is a no-op and does not throw when react-native-purchases is absent', async () => {
    jest.resetModules()
    jest.mock('react-native-purchases', () => {
      throw new Error('Module not found')
    })

    const rc = require('@/lib/purchases/revenuecat')

    await expect(rc.identifyUser('user-uuid-444')).resolves.toBeUndefined()
    expect(mockLogIn).not.toHaveBeenCalled()
  })

  // ── 4. resetUser → Purchases.logOut ─────────────────────────────────────
  it('calls Purchases.logOut via resetUser after configure', async () => {
    const rc = freshModule()
    await rc.configureRevenueCat()
    jest.clearAllMocks()

    await rc.resetUser()

    expect(mockLogOut).toHaveBeenCalledTimes(1)
  })

  // ── 5. resetUser guard: not configured ──────────────────────────────────
  it('resetUser is a no-op when RC is not configured', async () => {
    const rc = freshModule()
    // No configureRevenueCat call

    await rc.resetUser()

    expect(mockLogOut).not.toHaveBeenCalled()
  })

  // ── 6. isRevenueCatConfigured reflects state ──────────────────────────────
  it('isRevenueCatConfigured returns false before configure and true after', async () => {
    const rc = freshModule()

    expect(rc.isRevenueCatConfigured()).toBe(false)

    await rc.configureRevenueCat()

    expect(rc.isRevenueCatConfigured()).toBe(true)
  })

  // ── 7. identifyUser does not throw when logIn rejects ────────────────────
  it('swallows logIn errors and does not propagate', async () => {
    const rc = freshModule()
    await rc.configureRevenueCat()
    mockLogIn.mockRejectedValueOnce(new Error('network timeout'))

    await expect(rc.identifyUser('user-uuid-555')).resolves.toBeUndefined()
  })
})
