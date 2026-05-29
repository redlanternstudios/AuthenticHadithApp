/**
 * RevenueCat integration for Apple In-App Purchases.
 *
 * react-native-purchases uses standard React Native autolinking (NOT an Expo
 * config plugin). Do NOT add it to the plugins array in app.json (FIX-027).
 * The In-App Purchase capability is enabled via the Apple Developer portal.
 */

import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { rcDiag, maskUserId } from '../revenuecat/diagnostics'

// Lazy import — will fail gracefully if SDK not installed yet
let Purchases: typeof import('react-native-purchases').default | null = null
let PurchasesPackageType: any = null

try {
  const mod = require('react-native-purchases')
  Purchases = mod.default
  PurchasesPackageType = mod.PACKAGE_TYPE
} catch {
  // SDK not installed — all functions below will return safe defaults.
  // Production-visible: rcDiag captures this for the Diagnostics screen.
  console.warn('[RC] react-native-purchases not installed. IAP disabled.')
  rcDiag.record('SDK_REQUIRE', 'fail', {
    message: 'react-native-purchases module require() threw — native module not linked',
  })
}

// ─── Product identifiers (must match App Store Connect + RevenueCat) ───
export const PRODUCT_IDS = {
  MONTHLY_PREMIUM: 'ah_monthly_premium',
  ANNUAL_PREMIUM: 'ah_annual_premium',
  LIFETIME: 'ah_lifetime_premium',
} as const

// ─── Entitlement identifier (configured in RevenueCat dashboard) ───
export const ENTITLEMENT_ID = 'premium'

// ─── Types ───
export type SubscriptionStatus = {
  isActive: boolean
  tier: 'free' | 'premium' | 'lifetime'
  expiresAt: string | null
  willRenew: boolean
}

// ─── Initialize ───
let isConfigured = false
let retryAttempted = false

/** Read by the React provider so both share one source of truth on configure state. */
export function isRevenueCatConfigured(): boolean {
  return isConfigured
}

/**
 * Bounded retry. At most ONE retry per app session.
 * No-op if configure already succeeded or if a retry has already been attempted.
 * Returns true if the underlying configureRevenueCat call succeeds.
 */
export async function attemptConfigureRetry(supabaseUserId?: string): Promise<boolean> {
  if (isConfigured) {
    rcDiag.record('CONFIGURE_RETRY_SKIPPED', 'info', { reason: 'already-configured' })
    return false
  }
  if (retryAttempted) {
    rcDiag.record('CONFIGURE_RETRY_SKIPPED', 'info', { reason: 'retry-already-attempted' })
    return false
  }
  retryAttempted = true
  rcDiag.record('CONFIGURE_RETRY_ATTEMPT', 'info', {
    userIdPresent: !!supabaseUserId,
  })
  return configureRevenueCat(supabaseUserId)
}

export async function configureRevenueCat(supabaseUserId?: string): Promise<boolean> {
  if (!Purchases) {
    rcDiag.record('CONFIGURE_ATTEMPT', 'fail', {
      message: 'SDK module missing (require() failed at module load)',
    })
    return false
  }
  if (isConfigured) {
    rcDiag.record('CONFIGURE_ALREADY_CONFIGURED', 'info', {
      userIdPresent: !!supabaseUserId,
    })
    if (supabaseUserId) {
      rcDiag.record('LOGIN_ATTEMPT', 'info', {
        userIdMasked: maskUserId(supabaseUserId),
        context: 'already-configured',
      })
      try {
        await Purchases.logIn(supabaseUserId)
        rcDiag.record('LOGIN_SUCCESS', 'ok', {
          userIdMasked: maskUserId(supabaseUserId),
          context: 'already-configured',
        })
      } catch (err) {
        const e = err as { name?: string; code?: string | number; message?: string }
        console.warn('[RC] logIn failed (already-configured):', e?.message)
        rcDiag.record('LOGIN_FAIL', 'fail', {
          name: e?.name,
          code: e?.code,
          message: e?.message,
          context: 'already-configured',
        })
      }
    }
    return true
  }

  const apiKey = (Platform.select({
    ios:
      Constants.expoConfig?.extra?.revenueCatApiKeyIos ??
      Constants.expoConfig?.extra?.revenueCatApiKey,
    android: Constants.expoConfig?.extra?.revenueCatApiKeyAndroid,
  }) as string | undefined) ?? null

  // Structure-only: 'appl_' prefix is identical for every iOS public publishable
  // key by RevenueCat design. Never store more than the first 5 chars in diagnostics.
  const keyPrefix = apiKey ? apiKey.slice(0, 5) : null

  if (!apiKey) {
    console.warn('[RC] No API key for platform:', Platform.OS, '— degraded mode.')
    rcDiag.record('CONFIGURE_ATTEMPT', 'fail', {
      platform: Platform.OS,
      keyPresent: false,
      message: 'Constants.expoConfig.extra.revenueCatApiKey[Ios] returned undefined at runtime',
    })
    return false
  }

  rcDiag.record('CONFIGURE_ATTEMPT', 'info', {
    platform: Platform.OS,
    keyPresent: true,
    keyPrefix,
  })

  try {
    Purchases.configure({ apiKey })
    // Per Build #17 design: flip isConfigured immediately after configure() succeeds,
    // BEFORE logIn(). If logIn fails or hangs, the diagnostic state still correctly
    // reflects "configured: true" so identifyUser() can run later.
    isConfigured = true
    rcDiag.record('CONFIGURE_SUCCESS', 'ok', { keyPrefix })
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string }
    console.warn('[RC] configure() threw:', e?.message)
    rcDiag.record('CONFIGURE_FAIL', 'fail', {
      name: e?.name,
      code: e?.code,
      message: e?.message,
      keyPrefix,
    })
    return false
  }

  if (supabaseUserId) {
    rcDiag.record('LOGIN_ATTEMPT', 'info', {
      userIdMasked: maskUserId(supabaseUserId),
      context: 'post-configure',
    })
    try {
      await Purchases.logIn(supabaseUserId)
      rcDiag.record('LOGIN_SUCCESS', 'ok', {
        userIdMasked: maskUserId(supabaseUserId),
        context: 'post-configure',
      })
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      console.warn('[RC] logIn failed (post-configure):', e?.message)
      rcDiag.record('LOGIN_FAIL', 'fail', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
        context: 'post-configure',
      })
    }
  }

  return true
}

// ─── Set user identity (call on login) ───
export async function identifyUser(supabaseUserId: string): Promise<void> {
  if (!Purchases) {
    rcDiag.record('LOGIN_SKIPPED', 'info', {
      context: 'identifyUser',
      reason: 'sdk-missing',
      userIdMasked: maskUserId(supabaseUserId),
    })
    return
  }
  if (!isConfigured) {
    rcDiag.record('LOGIN_SKIPPED', 'info', {
      context: 'identifyUser',
      reason: 'not-configured',
      userIdMasked: maskUserId(supabaseUserId),
    })
    return
  }
  rcDiag.record('LOGIN_ATTEMPT', 'info', {
    userIdMasked: maskUserId(supabaseUserId),
    context: 'identifyUser',
  })
  try {
    await Purchases.logIn(supabaseUserId)
    rcDiag.record('LOGIN_SUCCESS', 'ok', {
      userIdMasked: maskUserId(supabaseUserId),
      context: 'identifyUser',
    })
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string }
    console.warn('[RC] identifyUser logIn failed:', e?.message)
    rcDiag.record('LOGIN_FAIL', 'fail', {
      name: e?.name,
      code: e?.code,
      message: e?.message,
      context: 'identifyUser',
    })
  }
}

// ─── Clear identity (call on logout) ───
export async function resetUser(): Promise<void> {
  if (!Purchases) {
    rcDiag.record('LOGOUT_SKIPPED', 'info', { reason: 'sdk-missing' })
    return
  }
  if (!isConfigured) {
    rcDiag.record('LOGOUT_SKIPPED', 'info', { reason: 'not-configured' })
    return
  }
  try {
    await Purchases.logOut()
    rcDiag.record('LOGOUT', 'ok', {})
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string }
    console.warn('[RC] resetUser logOut failed:', e?.message)
    rcDiag.record('LOGOUT', 'fail', {
      name: e?.name,
      code: e?.code,
      message: e?.message,
    })
  }
}

// ─── Get available packages ───
export async function getOfferings() {
  if (!Purchases || !isConfigured) return null

  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current
  } catch (err) {
    __DEV__ && console.error('[RevenueCat] Failed to get offerings:', err)
    return null
  }
}

// ─── Purchase a package ───
export async function purchasePackage(pkg: any): Promise<boolean> {
  if (!Purchases || !isConfigured) return false

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch (err: any) {
    if (err.userCancelled) return false
    __DEV__ && console.error('[RevenueCat] Purchase error:', err)
    throw err
  }
}

// ─── Check current entitlement ───
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const defaultStatus: SubscriptionStatus = {
    isActive: false,
    tier: 'free',
    expiresAt: null,
    willRenew: false,
  }

  if (!Purchases || !isConfigured) return defaultStatus

  try {
    const customerInfo = await Purchases.getCustomerInfo()
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID]

    if (!entitlement) return defaultStatus

    const isLifetime = entitlement.productIdentifier === PRODUCT_IDS.LIFETIME
    return {
      isActive: true,
      tier: isLifetime ? 'lifetime' : 'premium',
      expiresAt: entitlement.expirationDate,
      willRenew: !entitlement.willRenew ? false : entitlement.willRenew,
    }
  } catch (err) {
    __DEV__ && console.error('[RevenueCat] Failed to get status:', err)
    return defaultStatus
  }
}

// ─── Restore purchases (Apple requires this) ───
export async function restorePurchases(): Promise<SubscriptionStatus> {
  const defaultStatus: SubscriptionStatus = {
    isActive: false,
    tier: 'free',
    expiresAt: null,
    willRenew: false,
  }

  if (!Purchases || !isConfigured) return defaultStatus

  try {
    const customerInfo = await Purchases.restorePurchases()
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID]

    if (!entitlement) return defaultStatus

    const isLifetime = entitlement.productIdentifier === PRODUCT_IDS.LIFETIME
    return {
      isActive: true,
      tier: isLifetime ? 'lifetime' : 'premium',
      expiresAt: entitlement.expirationDate,
      willRenew: !entitlement.willRenew ? false : entitlement.willRenew,
    }
  } catch (err) {
    __DEV__ && console.error('[RevenueCat] Restore error:', err)
    return defaultStatus
  }
}

// ─── Sync subscription status to Supabase profiles table ───
export async function syncSubscriptionToSupabase(
  supabase: any,
  userId: string,
): Promise<void> {
  const status = await getSubscriptionStatus()

  await supabase
    .from('profiles')
    .update({
      subscription_tier: status.tier,
      subscription_status: status.isActive ? 'active' : 'expired',
      subscription_expires_at: status.expiresAt,
    })
    .eq('user_id', userId)
}
