import { Platform } from 'react-native'
import Constants from 'expo-constants'

/**
 * RevenueCat public SDK keys are designed to ship inside client apps.
 * Never place RevenueCat secret API keys (`sk_...`) in this file or in Expo
 * `extra`; those belong only on trusted backend infrastructure.
 */
const REVENUECAT_PUBLIC_KEYS = {
  ios: 'appl_FvpBcFnTcrDlbSGaTqJKsemcbZB',
  android: null,
} as const

export const PRODUCT_IDS = {
  MONTHLY_PREMIUM: 'ah_monthly_premium',
  ANNUAL_PREMIUM: 'ah_annual_premium',
  LIFETIME: 'ah_lifetime_premium',
} as const

export const ENTITLEMENT_ID = 'premium'

/**
 * Apple App Review demo account(s). Premium is force-granted in-app for these
 * exact emails ONLY, so the reviewer can always evaluate premium features even
 * if RevenueCat fails to resolve their promotional entitlement live. This is a
 * read-side client override — it writes nothing to RevenueCat and grants
 * nothing to any other user. Value is the ASC `demoAccountName`
 * (App Store Connect → App Review Information); keep in sync if it changes.
 */
export const REVIEWER_EMAILS = ['apple.reviewer+20260604@authentichadith.app'] as const

/** True only for an exact (case-insensitive) Apple-reviewer demo email match. */
export function isReviewerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return REVIEWER_EMAILS.some((e) => e.toLowerCase() === normalized)
}

type RevenueCatKeySource =
  | 'expo-extra-ios'
  | 'expo-extra-legacy'
  | 'hardcoded-ios-public-fallback'
  | 'hardcoded-android-public-fallback'
  | 'missing'

type RevenueCatKeyResult = {
  apiKey: string | null
  source: RevenueCatKeySource
}

function isValidPublicKey(key: string | null | undefined): key is string {
  if (!key) return false
  if (key.startsWith('sk_')) return false
  if (Platform.OS === 'ios') return key.startsWith('appl_')
  if (Platform.OS === 'android') return key.startsWith('goog_')
  return false
}

export function getRevenueCatApiKey(): RevenueCatKeyResult {
  const extra = Constants.expoConfig?.extra ?? {}

  if (Platform.OS === 'ios') {
    const iosExtra = extra.revenueCatApiKeyIos as string | undefined
    if (isValidPublicKey(iosExtra)) {
      return { apiKey: iosExtra, source: 'expo-extra-ios' }
    }

    const legacyExtra = extra.revenueCatApiKey as string | undefined
    if (isValidPublicKey(legacyExtra)) {
      return { apiKey: legacyExtra, source: 'expo-extra-legacy' }
    }

    return {
      apiKey: REVENUECAT_PUBLIC_KEYS.ios,
      source: 'hardcoded-ios-public-fallback',
    }
  }

  if (Platform.OS === 'android' && isValidPublicKey(REVENUECAT_PUBLIC_KEYS.android)) {
    return {
      apiKey: REVENUECAT_PUBLIC_KEYS.android,
      source: 'hardcoded-android-public-fallback',
    }
  }

  return { apiKey: null, source: 'missing' }
}
