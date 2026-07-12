import { getSupabaseAdmin } from "@/lib/supabase/admin"

export type QuotaCheckResult = {
  allowed: boolean
  daily_remaining: number
  monthly_remaining: number
  daily_limit: number
  monthly_limit: number
  tier: "free" | "premium" | "lifetime"
  reason?: string
}

/**
 * Check AI usage quota using direct table queries instead of RPCs.
 * This avoids failures when the RPC functions haven't been created yet.
 */
export async function checkAIQuota(userId: string): Promise<QuotaCheckResult> {
  try {
    const supabase = getSupabaseAdmin()

    // 1. Determine user tier from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", userId)
      .single()

    const tier = (profile?.subscription_tier as "free" | "premium" | "lifetime") ?? "free"

    // 2. Paid tiers are unlimited — bypass all quota checks immediately
    if (tier === "premium" || tier === "lifetime") {
      return {
        allowed: true,
        daily_remaining: 9999,
        monthly_remaining: 9999,
        daily_limit: 9999,
        monthly_limit: 9999,
        tier,
      }
    }

    // 3. Free tier limits
    const dailyLimit = 5
    const monthlyLimit = 30

    // 4. Count today's usage
    const today = new Date().toISOString().split("T")[0]
    const { data: todayUsage } = await supabase
      .from("ai_usage")
      .select("query_count")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .single()

    const dailyUsed = todayUsage?.query_count ?? 0

    // 5. Count this month's usage
    const monthStart = `${today.substring(0, 7)}-01`
    const { data: monthUsage } = await supabase
      .from("ai_usage")
      .select("query_count")
      .eq("user_id", userId)
      .gte("usage_date", monthStart)

    const monthlyUsed = (monthUsage ?? []).reduce(
      (sum: number, row: { query_count: number }) => sum + (row.query_count ?? 0),
      0,
    )

    // 5. Check if allowed
    const allowed = dailyUsed < dailyLimit && monthlyUsed < monthlyLimit

    const result: QuotaCheckResult = {
      allowed,
      daily_remaining: Math.max(dailyLimit - dailyUsed, 0),
      monthly_remaining: Math.max(monthlyLimit - monthlyUsed, 0),
      daily_limit: dailyLimit,
      monthly_limit: monthlyLimit,
      tier,
    }

    if (!allowed) {
      if (dailyUsed >= dailyLimit) {
        result.reason = "Daily AI query limit reached. Upgrade for more."
      } else {
        result.reason = "Monthly AI query limit reached. Upgrade for more."
      }
    }

    return result
  } catch (err) {
    console.error("Quota check failed, allowing request:", err)
    // If quota check fails for any reason, allow the request rather than blocking
    return {
      allowed: true,
      daily_remaining: 1,
      monthly_remaining: 1,
      daily_limit: 5,
      monthly_limit: 30,
      tier: "free",
    }
  }
}

/**
 * Increment AI usage count for today using direct table upsert.
 */
export async function incrementAIUsage(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split("T")[0]

    // Try to get existing record
    const { data: existing } = await supabase
      .from("ai_usage")
      .select("id, query_count")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .single()

    if (existing) {
      await supabase
        .from("ai_usage")
        .update({ query_count: existing.query_count + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    } else {
      await supabase.from("ai_usage").insert({
        user_id: userId,
        usage_date: today,
        query_count: 1,
      })
    }
  } catch (err) {
    console.error("Failed to increment usage:", err)
  }
}

export async function getUserTier(userId: string): Promise<"free" | "premium" | "lifetime"> {
  const supabase = getSupabaseAdmin()

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", userId)
    .single()

  return (profile?.subscription_tier as "free" | "premium" | "lifetime") ?? "free"
}

export async function canUseFeature(
  userId: string,
  feature: "advanced_search" | "semantic_search" | "priority_support",
): Promise<boolean> {
  const tier = await getUserTier(userId)

  const featureMap: Record<string, Record<string, boolean>> = {
    free: { advanced_search: false, semantic_search: false, priority_support: false },
    premium: { advanced_search: true, semantic_search: true, priority_support: true },
    lifetime: { advanced_search: true, semantic_search: true, priority_support: true },
  }

  return featureMap[tier]?.[feature] ?? false
}
