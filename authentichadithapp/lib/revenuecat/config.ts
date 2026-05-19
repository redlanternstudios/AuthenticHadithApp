import { Platform } from 'react-native'
import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra ?? {}) as {
  revenueCatApiKeyIos?: string
  revenueCatApiKeyAndroid?: string
  revenueCatApiKey?: string // legacy single-key fallback
}

/**
 * Resolve the RevenueCat SDK key for the current platform.
 *
 * Priority:
 *   1. Platform-specific extra (revenueCatApiKeyIos / revenueCatApiKeyAndroid)
 *   2. Legacy generic extra.revenueCatApiKey
 *   3. In __DEV__ only: a labeled test key so the dev build still functions
 *   4. In production: THROW — better a loud crash on launch than a silent
 *      sandbox key that auto-rejects in App Store review.
 */
function resolveApiKey(): string {
  const platformKey =
    Platform.OS === 'ios'
      ? extra.revenueCatApiKeyIos
      : extra.revenueCatApiKeyAndroid

  const key = platformKey || extra.revenueCatApiKey

  if (key && key.length > 0) {
    return key
  }

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      '[RevenueCat] No production API key configured in app.json -> extra. ' +
        'Falling back to a test key for __DEV__ only.',
    )
    return 'test_gngYicqPNakjsEBKvUwfIlFHrUg'
  }

  throw new Error(
    '[RevenueCat] Missing production API key. Set ' +
      `extra.revenueCatApiKey${Platform.OS === 'ios' ? 'Ios' : 'Android'} in app.json.`,
  )
}

export const REVENUECAT_API_KEY: string = resolveApiKey()

export const ENTITLEMENT_ID = 'RedLantern Studios Pro'

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
