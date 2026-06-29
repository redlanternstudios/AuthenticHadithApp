import { getSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Ensure stats row exists
  await supabase.from("user_stats").upsert({ user_id: user.id }, { onConflict: "user_id" })

  const { data: stats, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch recent achievements
  const { data: recentAchievements } = await supabase
    .from("user_achievements")
    .select(`*, achievement:achievement_id (name_en, description_en, icon, category, tier, xp_reward)`)
    .eq("user_id", user.id)
    .eq("is_new", true)
    .order("unlocked_at", { ascending: false })
    .limit(5)

  return NextResponse.json({ stats, recentAchievements: recentAchievements || [] })
}
