export interface Product {
  id: string
  stripeProductId: string
  stripePriceId: string
  revenuecatProductId?: string
  name: string
  tierLabel: string
  description: string
  priceInCents: number
  mode: "payment" | "subscription"
  interval?: "month" | "year"
  tier: "free" | "premium" | "lifetime"
  features?: string[]
  highlighted?: boolean
  badge?: string
  trialDays?: number
}

/** Free tier limits -- used by quota RPCs and upgrade prompts */
export const FREE_TIER_LIMITS = {
  maxSavedHadith: 40,
  aiExplanationsPerDay: 5,
  quizzesPerDay: 1,
  learningPaths: "beginner" as const,
} as const

/** Feature lists for display in comparison tables */
export const TIER_FEATURES = {
  explorer: [
    "Browse all 8 hadith collections",
    "Full hadith text (Arabic + English)",
    "Narrator chain & grading info",
    "Basic search",
    "Topic browsing",
    "Save up to 40 hadiths",
    "5 AI explanations per day",
    "Beginner learning paths",
    "1 quiz per day",
  ],
  pro: [
    "Unlimited AI explanations (Deep mode)",
    "Advanced search with synonym expansion",
    "Tag filtering & semantic search",
    "Unlimited saves & folders",
    "All learning paths (Advanced + Scholar)",
    "Unlimited quizzes",
    "Priority support",
    "Early access to new features",
  ],
  founding: [
    "Everything in Pro, forever",
    "Founding member badge & recognition",
    "All future features included",
    "No recurring charges",
    "Lifetime priority support",
  ],
} as const

export const PRODUCTS: Product[] = [
  {
    id: "monthly-premium",
    stripeProductId: "",
    stripePriceId: "",
    revenuecatProductId: "ah_monthly_999",
    name: "Monthly",
    tierLabel: "Pro",
    description: "Unlimited AI, advanced search, all learning paths, and unlimited saves.",
    priceInCents: 999,
    mode: "subscription",
    interval: "month",
    tier: "premium",
    trialDays: 7,
    features: TIER_FEATURES.pro.slice(0, 5) as unknown as string[],
  },
  {
    id: "annual-premium",
    stripeProductId: "",
    stripePriceId: "",
    revenuecatProductId: "ah_annual_4999",
    name: "Annual",
    tierLabel: "Pro",
    description: "Best value -- full Pro access for one year at a significant discount.",
    priceInCents: 4999,
    mode: "subscription",
    interval: "year",
    tier: "premium",
    highlighted: true,
    badge: "Best Value",
    features: [
      "Everything in Pro",
      "Save 58% vs monthly",
      "Early access to new features",
      "Priority support",
    ],
  },
  {
    id: "lifetime-access",
    stripeProductId: "",
    stripePriceId: "",
    revenuecatProductId: "ah_lifetime_9999",
    name: "Lifetime",
    tierLabel: "Founding",
    description: "One-time payment. Permanent access to all current and future features.",
    priceInCents: 9999,
    mode: "payment",
    tier: "lifetime",
    badge: "Founding Member",
    features: TIER_FEATURES.founding.slice(0, 5) as unknown as string[],
  },
]

export function getSubscriptionProducts() {
  return PRODUCTS.filter((p) => p.mode === "subscription")
}

export function getOneTimeProducts() {
  return PRODUCTS.filter((p) => p.mode === "payment")
}

export function getProductById(id: string) {
  return PRODUCTS.find((p) => p.id === id)
}

export function getTierFromProductId(productId: string): "free" | "premium" | "lifetime" {
  const product = PRODUCTS.find(
    (p) =>
      p.stripeProductId === productId ||
      p.id === productId ||
      p.revenuecatProductId === productId
  )
  return product?.tier ?? "free"
}
