import { Platform } from 'react-native'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

// Set revenueCatApiKey in app.json > extra (development) or as an EAS secret (production).
// Do NOT ship the test key to production — it will show test products only.
export const REVENUECAT_API_KEY: string =
  extra.revenueCatApiKey ?? ''

// Must match exactly what is configured in your RevenueCat dashboard.
// Also used in lib/purchases/revenuecat.ts — keep both in sync.
export const ENTITLEMENT_ID = 'premium'

export const PRODUCT_IDS = {
  monthly: Platform.select({
    ios: 'rc_monthly',
    android: 'rc_monthly',
    default: 'rc_monthly',
  }) as string,
  yearly: Platform.select({
    ios: 'rc_yearly',
    android: 'rc_yearly',
    default: 'rc_yearly',
  }) as string,
  lifetime: Platform.select({
    ios: 'rc_lifetime',
    android: 'rc_lifetime',
    default: 'rc_lifetime',
  }) as string,
}
