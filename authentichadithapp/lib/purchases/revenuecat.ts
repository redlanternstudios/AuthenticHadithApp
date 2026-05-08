/**
 * RevenueCat integration for Apple In-App Purchases.
 *
 * SETUP REQUIRED:
 * 1. Install: npx expo install react-native-purchases
 * 2. Add plugin to app.json: ["react-native-purchases", { "ios": { "usesStoreKi
t2": true } }]
 * 3. Create products in App Store Connect
 * 4. Configure products in RevenueCat dashboard
 * 5. Set REVENUECAT_API_KEY_IOS in app.json > extra
 *
 * This file provides a clean abstraction over RevenueCat so the rest of
 * the app doesn't import the SDK directly.
 */

import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Lazy import — will fail gracefully if SDK not installed yet
let Purchases: typeof import('react-native-purchases').default | null = null
let PurchasesPackageType: any = null

try {
  const mod = require('react-native-purchases')
  Purchases = mod.default
  PurchasesPackageType = mod.PACKAGE_TYPE
} catch {
  // SDK not installed — all functions below will return safe defaults
  __DEV__ && console.warn('[RevenueCat] react-native-purchases not installed. IAP disabled.')
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

/** Read by the React provider so both share one source of truth on configure state. */
export function isRevenueCatConfigured(): boolean {
  return isConfigured
}

export async function configureRevenueCat(supabaseUserId?: string): Promise<boolean> {
  if (!Purchases) return false
  if (isConfigured) {
    if (supabaseUserId) {
      try {
        await Purchases.logIn(supabaseUserId)
      } catch (err) {
        __DEV__ && console.error('[RevenueCat] logIn failed:', err)
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

  if (!apiKey) {
    __DEV__ &&
      console.warn(
        '[RevenueCat] No API key found for platform:',
        Platform.OS,
        '— running in degraded mode (no IAP).'
      )
    return false
  }

  try {
    Purchases.configure({ apiKey })
  } catch (err) {
    __DEV__ && console.error('[RevenueCat] configure() threw:', err)
    return false
  }

  if (supabaseUserId) {
    try {
      await Purchases.logIn(supabaseUserId)
    } catch (err) {
      __DEV__ && console.error('[RevenueCat] logIn failed:', err)
    }
  }

  isConfigured = true
  return true
}

// ─── Set user identity (call on login) ───
export async function identifyUser(supabaseUserId: string): Promise<void> {
  if (!Purchases || !isConfigured) return
  await Purchases.logIn(supabaseUserId)
}

// ─── Clear identity (call on logout) ───
export async function resetUser(): Promise<void> {
  if (!Purchases || !isConfigured) return
  await Purchases.logOut()
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
