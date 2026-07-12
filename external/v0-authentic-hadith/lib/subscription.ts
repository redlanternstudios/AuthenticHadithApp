import { getSupabaseServerClient } from "@/lib/supabase/server"

export interface UserSubscription {
  isPremium: boolean
  tier: "free" | "premium" | "lifetime"
  plan: string | null
  status: string | null
  currentPeriodEnd: string | null
}

const FREE_SUBSCRIPTION: UserSubscription = {
  isPremium: false,
  tier: "free",
  plan: null,
  status: null,
  currentPeriodEnd: null,
}

export async function getUserSubscription(): Promise<UserSubscription> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return FREE_SUBSCRIPTION

    // Check profile tier first (fast path)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .single()

    if (profile?.subscription_tier && profile.subscription_tier !== "free") {
      return {
        isPremium: true,
        tier: profile.subscription_tier as "premium" | "lifetime",
        plan: profile.subscription_tier,
        status: profile.subscription_status,
        currentPeriodEnd: profile.subscription_expires_at,
      }
    }

    // Fallback: check subscriptions table
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "lifetime"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!sub) return FREE_SUBSCRIPTION

    const tier = sub.status === "lifetime" ? "lifetime" : "premium"

    return {
      isPremium: true,
      tier,
      plan: sub.product_id,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
    }
  } catch {
    return FREE_SUBSCRIPTION
  }
}
