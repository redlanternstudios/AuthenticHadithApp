import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface Entitlements {
  userId: string
  isPremium: boolean
  tier: "free" | "premium" | "lifetime"
  status: string | null
  expiresAt: string | null
}

const FREE_ENTITLEMENTS: Omit<Entitlements, "userId"> = {
  isPremium: false,
  tier: "free",
  status: null,
  expiresAt: null,
}

/**
 * Get user entitlements from the database.
 * Returns free tier if user is not authenticated or has no subscription.
 */
export async function getEntitlements(userId?: string): Promise<Entitlements | null> {
  const supabase = await getSupabaseServerClient()

  // If no userId provided, get from auth
  let effectiveUserId = userId
  if (!effectiveUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    effectiveUserId = user.id
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at")
    .eq("user_id", effectiveUserId)
    .single()

  if (!profile) {
    return { userId: effectiveUserId, ...FREE_ENTITLEMENTS }
  }

  const tier = (profile.subscription_tier as "free" | "premium" | "lifetime") ?? "free"
  const isPremium = tier === "premium" || tier === "lifetime"

  return {
    userId: effectiveUserId,
    isPremium,
    tier,
    status: profile.subscription_status,
    expiresAt: profile.subscription_expires_at,
  }
}

/**
 * Require premium access. Redirects to /pricing if user is not premium.
 * Use this in Server Components or Route Handlers.
 */
export async function requirePremium(redirectTo = "/pricing"): Promise<Entitlements> {
  const entitlements = await getEntitlements()

  if (!entitlements) {
    redirect("/login?redirect=" + encodeURIComponent(redirectTo))
  }

  if (!entitlements.isPremium) {
    redirect(redirectTo)
  }

  return entitlements
}

/**
 * Require authentication. Redirects to /login if user is not authenticated.
 */
export async function requireAuth(redirectTo?: string): Promise<Entitlements> {
  const entitlements = await getEntitlements()

  if (!entitlements) {
    const loginUrl = redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login"
    redirect(loginUrl)
  }

  return entitlements
}

/**
 * Check if user can access a premium feature.
 * Does not redirect - returns boolean.
 */
export async function canAccessPremiumFeature(
  feature: "advanced_search" | "semantic_search" | "unlimited_saves" | "all_learning_paths"
): Promise<boolean> {
  const entitlements = await getEntitlements()
  if (!entitlements) return false
  return entitlements.isPremium
}
