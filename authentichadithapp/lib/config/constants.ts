/**
 * API Configuration Constants
 */

// Production API URL - must use the www. host directly. The apex
// authentichadith.app 307-redirects to www., and iOS NSURLSession
// (under React Native fetch) has been observed stalling on POST bodies
// across that redirect — see FIX-043. Hit www. directly, skip the hop.
export const PRODUCTION_API_URL = 'https://www.authentichadith.app'

/**
 * Keep native POST requests off the redirecting apex host. Normalizing here
 * protects runtime even if an older EAS or local env value is injected.
 */
export function normalizeApiBaseUrl(value?: string | null): string {
  const trimmed = value?.trim().replace(/\/+$/, '')
  if (!trimmed) return PRODUCTION_API_URL
  if (trimmed === 'https://authentichadith.app') return PRODUCTION_API_URL
  return trimmed
}
