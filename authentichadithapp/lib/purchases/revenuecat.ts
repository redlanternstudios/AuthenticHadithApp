/**
 * RevenueCat purchase helpers used by the subscription / paywall UI.
 *
 * SDK INITIALIZATION lives in lib/revenuecat/RevenueCatProvider.tsx — never
 * call Purchases.configure() from this file. These helpers assume the SDK
 * is already initialized at app boot.
 *
 * Constants (ENTITLEMENT_ID, PRODUCT_IDS) come from lib/revenuecat/config.ts
 * so the entire app reads from the same source of truth.
 */

import Purchases from 'react-native-purchases'
import { ENTITLEMENT_ID, PRODUCT_IDS } from '@/lib/revenuecat/config'

export { ENTITLEMENT_ID, PRODUCT_IDS }

export type SubscriptionStatus = {
  isActive: boolean
  tier: 'free' | 'premium' | 'lifetime'
  expiresAt: string | null
  willRenew: boolean
}

const defaultStatus: SubscriptionStatus = {
  isActive: false,
  tier: 'free',
  expiresAt: null,
  willRenew: false,
}

function statusFromEntitlement(entitlement: any): SubscriptionStatus {
  const isLifetime = entitlement.productIdentifier === PRODUCT_IDS.lifetime
  return {
    isActive: true,
    tier: isLifetime ? 'lifetime' : 'premium',
    expiresAt: entitlement.expirationDate,
    willRenew: entitlement.willRenew === true,
  }
}

/** Fetch the current offering (set of available packages). */
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current
  } catch (err) {
    console.error('[RevenueCat] Failed to get offerings:', err)
    return null
  }
}

/** Purchase a single package. Returns whether the premium entitlement is now active. */
export async function purchasePackage(pkg: any): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch (err: any) {
    if (err.userCancelled) return false
    console.error('[RevenueCat] Purchase error:', err)
    throw err
  }
}

/** Read current entitlement state from the SDK cache. */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID]
    if (!entitlement) return defaultStatus
    return statusFromEntitlement(entitlement)
  } catch (err) {
    console.error('[RevenueCat] Failed to get status:', err)
    return defaultStatus
  }
}

/** Restore previous purchases (Apple requires a "Restore Purchases" button). */
export async function restorePurchases(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.restorePurchases()
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID]
    if (!entitlement) return defaultStatus
    return statusFromEntitlement(entitlement)
  } catch (err) {
    console.error('[RevenueCat] Restore error:', err)
    return defaultStatus
  }
}
