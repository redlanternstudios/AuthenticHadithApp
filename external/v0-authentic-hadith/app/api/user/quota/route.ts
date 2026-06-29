import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Get user tier
    const { data: profile } = await admin
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single()

    const tier = (profile?.subscription_tier as "free" | "premium" | "lifetime") ?? "free"

    // Saved count
    const { count: savedCount } = await admin
      .from("saved_hadiths")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    // AI usage today
    const today = new Date().toISOString().split("T")[0]
    const { data: aiUsage } = await admin
      .from("ai_usage")
      .select("query_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single()

    // Quiz count today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: quizCount } = await admin
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())

    const isPremium = tier !== "free"

    // Paid tiers: unlimited (9999 sentinel — safe for JSON, used by UI to show "Unlimited")
    if (isPremium) {
      return Response.json({
        tier,
        isPremium: true,
        usage: {
          saves: savedCount ?? 0,
          savesLimit: 9999,
          savesRemaining: 9999,
          aiToday: aiUsage?.query_count ?? 0,
          aiDailyLimit: 9999,
          aiRemaining: 9999,
          quizzesToday: quizCount ?? 0,
          quizDailyLimit: 9999,
          quizzesRemaining: 9999,
        },
      })
    }

    // Free tier limits (aligned: 5 AI/day, 1 quiz/day, 40 saves)
    const FREE = { saves: 40, aiPerDay: 5, quizzesPerDay: 1 }

    return Response.json({
      tier,
      isPremium: false,
      usage: {
        saves: savedCount ?? 0,
        savesLimit: FREE.saves,
        savesRemaining: Math.max(FREE.saves - (savedCount ?? 0), 0),
        aiToday: aiUsage?.query_count ?? 0,
        aiDailyLimit: FREE.aiPerDay,
        aiRemaining: Math.max(FREE.aiPerDay - (aiUsage?.query_count ?? 0), 0),
        quizzesToday: quizCount ?? 0,
        quizDailyLimit: FREE.quizzesPerDay,
        quizzesRemaining: Math.max(FREE.quizzesPerDay - (quizCount ?? 0), 0),
      },
    })
  } catch (err) {
    console.error("Quota API error:", err)
    return Response.json({ error: "Failed to fetch quota" }, { status: 500 })
  }
}
