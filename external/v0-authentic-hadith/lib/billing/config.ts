/**
 * Centralized billing configuration.
 * All Stripe price IDs are stored in environment variables.
 * 
 * To set up:
 * 1. Create products in Stripe Dashboard (https://dashboard.stripe.com/products)
 * 2. Create prices for each product
 * 3. Copy the price IDs (price_xxx) to environment variables
 */

export const BILLING_CONFIG = {
  // Price IDs from Stripe Dashboard
  prices: {
    monthly: process.env.STRIPE_PRICE_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_ANNUAL || "",
    lifetime: process.env.STRIPE_PRICE_LIFETIME || "",
  },

  // Fallback pricing (used for inline price_data if no Price ID is set)
  fallbackPricing: {
    monthly: {
      amount: 999, // $9.99
      currency: "usd",
      interval: "month" as const,
      trialDays: 7,
    },
    annual: {
      amount: 4999, // $49.99
      currency: "usd",
      interval: "year" as const,
    },
    lifetime: {
      amount: 9999, // $99.99
      currency: "usd",
    },
  },

  // Feature flags for different tiers
  features: {
    free: {
      maxSavedHadith: 40,
      aiExplanationsPerDay: 3,
      quizzesPerDay: 1,
      advancedSearch: false,
      semanticSearch: false,
      allLearningPaths: false,
    },
    premium: {
      maxSavedHadith: Infinity,
      aiExplanationsPerDay: 100,
      quizzesPerDay: Infinity,
      advancedSearch: true,
      semanticSearch: true,
      allLearningPaths: true,
    },
    lifetime: {
      maxSavedHadith: Infinity,
      aiExplanationsPerDay: 100,
      quizzesPerDay: Infinity,
      advancedSearch: true,
      semanticSearch: true,
      allLearningPaths: true,
    },
  },
} as const

export type BillingTier = keyof typeof BILLING_CONFIG.features

/**
 * Check if Stripe Price IDs are configured.
 * If not, the system will use inline price_data (works but less reliable for trials).
 */
export function hasStripePriceIds(): boolean {
  return Boolean(
    BILLING_CONFIG.prices.monthly &&
    BILLING_CONFIG.prices.annual &&
    BILLING_CONFIG.prices.lifetime
  )
}

/**
 * Get the Stripe Price ID for a plan.
 * Returns null if not configured (will use fallback inline pricing).
 */
export function getStripePriceId(plan: "monthly" | "annual" | "lifetime"): string | null {
  const priceId = BILLING_CONFIG.prices[plan]
  return priceId || null
}
