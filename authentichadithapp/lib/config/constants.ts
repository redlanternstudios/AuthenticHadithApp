/**
 * API Configuration Constants
 */

// Production API URL - must use the www. host directly. The apex
// authentichadith.app 307-redirects to www., and iOS NSURLSession
// (under React Native fetch) has been observed stalling on POST bodies
// across that redirect — see FIX-043. Hit www. directly, skip the hop.
export const PRODUCTION_API_URL = 'https://www.authentichadith.app'
