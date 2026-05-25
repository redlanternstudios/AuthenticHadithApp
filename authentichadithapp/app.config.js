// Dynamic Expo config — reads secrets from .env files at build time.
// Static config still lives in app.json. This file extends it with values
// that must vary per environment (dev / staging / production).
//
// Anything placed in `extra` ends up bundled into the JS — never put
// server-only secrets here (service role keys, Stripe secret keys, etc.).
// Use those only in app/api/* server routes via process.env directly.

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),

    // Supabase (client-safe)
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? config.extra?.supabaseUrl,
    supabaseAnonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? config.extra?.supabaseAnonKey,

    // API base URL (web backend the mobile app calls)
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ??
      config.extra?.apiUrl ??
      'https://www.authentichadith.app',

    // Environment marker
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',

    // RevenueCat (client-safe iOS / Android keys)
    // Both naming patterns are populated because two files in the codebase
    // read different keys. Unify in a follow-up cleanup.
    revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    revenueCatApiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    revenueCatApiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,

    // EAS project linkage (set when you run `eas init`)
    eas: {
      ...(config.extra?.eas ?? {}),
    },
  },
})
