/**
 * RevenueCat integration for Apple In-App Purchases.
 *
 * react-native-purchases uses standard React Native autolinking (NOT an Expo
 * config plugin). Do NOT add it to the plugins array in app.json (FIX-027).
 * The In-App Purchase capability is enabled via the Apple Developer portal.
 */

import { ENTITLEMENT_ID, PRODUCT_IDS, getRevenueCatApiKey } from '../revenuecat/config'

export { ENTITLEMENT_ID, PRODUCT_IDS } from '../revenuecat/config'

// Lazy import — will fail gracefully if SDK not installed yet.
// require() inside try/catch is the only way to conditionally load a native module.
let Purchases: typeof import('react-native-purchases').default | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-native-purchases')
  Purchases = mod.default
} catch {
  // SDK not installed — all functions below will return safe defaults.
  __DEV__ && console.warn('[RC] react-native-purchases not installed. IAP disabled.')
}

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

export function isRevenueCatAnonymousId(appUserId: string | null | undefined): boolean {
  return typeof appUserId === 'string' && appUserId.startsWith('$RCAnonymousID:')
}

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
    return false
  }
  if (retryAttempted) {
    return false
  }
  retryAttempted = true
  return configureRevenueCat(supabaseUserId)
}

export async function configureRevenueCat(supabaseUserId?: string): Promise<boolean> {
  if (!Purchases) {
    return false
  }
  if (isConfigured) {
    if (supabaseUserId) {
      try {
        await Purchases.logIn(supabaseUserId)
      } catch (err) {
        const e = err as { name?: string; code?: string | number; message?: string }
        __DEV__ && console.warn('[RC] logIn failed (already-configured):', e?.message)
      }
    }
    return true
  }

  const { apiKey, source } = getRevenueCatApiKey()

  if (!apiKey) {
    __DEV__ && console.warn('[RC] No public SDK key for this platform; degraded mode.')
    return false
  }

  try {
    Purchases.configure({ apiKey })
    if (source === 'hardcoded-ios-public-fallback') {
      __DEV__ && console.warn('[RC] Using hardcoded iOS public SDK key fallback.')
    }
    // Per Build #17 design: flip isConfigured immediately after configure() succeeds,
    // BEFORE logIn(). If logIn fails, identifyUser() can still run later.
    isConfigured = true
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string }
    __DEV__ && console.warn('[RC] configure() threw:', e?.message)
    return false
  }

  if (supabaseUserId) {
    try {
      await Purchases.logIn(supabaseUserId)
    } catch (err) {
      const e = err as { name?: string; code?: string | number; message?: string }
      __DEV__ && console.warn('[RC] logIn failed (post-configure):', e?.message)
    }
  }

  return true
}

// ─── Set user identity (call on login) ───
export async function identifyUser(supabaseUserId: string): Promise<void> {
  if (!Purchases) {
    return
  }
  if (!isConfigured) {
    return
  }
  try {
    await Purchases.logIn(supabaseUserId)
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string }
    __DEV__ && console.warn('[RC] identifyUser logIn failed:', e?.message)
  }
}

// ─── Clear identity (call on logout) ───
export async function resetUser(): Promise<void> {
  if (!Purchases) {
    return
  }
  if (!isConfigured) {
    return
  }
  try {
    const appUserId = await Purchases.getAppUserID()
    if (isRevenueCatAnonymousId(appUserId)) {
      return
    }
    await Purchases.logOut()
  } catch (err) {
    const e = err as { name?: string; code?: string | number; message?: string }
    __DEV__ && console.warn('[RC] resetUser logOut failed:', e?.message)
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

    // Lifetime = the lifetime product OR a far-future promotional grant
    // (e.g. RC promo "lifetime" sets expiration ~200 years out). Prevents
    // "Expires: Apr 22, 2226" rendering as a normal renewal date.
    const isLifetime =
      entitlement.productIdentifier === PRODUCT_IDS.LIFETIME ||
      (!!entitlement.expirationDate && new Date(entitlement.expirationDate).getFullYear() > 2100)
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

    // Lifetime = the lifetime product OR a far-future promotional grant
    // (e.g. RC promo "lifetime" sets expiration ~200 years out). Prevents
    // "Expires: Apr 22, 2226" rendering as a normal renewal date.
    const isLifetime =
      entitlement.productIdentifier === PRODUCT_IDS.LIFETIME ||
      (!!entitlement.expirationDate && new Date(entitlement.expirationDate).getFullYear() > 2100)
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

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: status.tier,
      subscription_status: status.isActive ? 'active' : 'expired',
      subscription_expires_at: status.expiresAt,
    })
    .eq('user_id', userId)

  if (error) {
    __DEV__ && console.error('[RevenueCat] syncSubscriptionToSupabase failed:', error)
  }
}
