import { getSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch all active achievements
  const { data: allAchievements, error: achError } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  if (achError) return NextResponse.json({ error: achError.message }, { status: 500 })

  // Fetch user's unlocked achievements
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at, is_new")
    .eq("user_id", user.id)

  const unlockedMap = new Map(
    unlocked?.map((u) => [u.achievement_id, { unlocked_at: u.unlocked_at, is_new: u.is_new }]) || [],
  )

  const achievements = allAchievements?.map((a) => ({
    ...a,
    isUnlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.unlocked_at || null,
    isNew: unlockedMap.get(a.id)?.is_new || false,
  })) || []

  return NextResponse.json({ achievements })
}

// Mark achievements as viewed (dismiss "new" badge)
export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { achievement_ids } = body

  if (achievement_ids && achievement_ids.length > 0) {
    await supabase
      .from("user_achievements")
      .update({ is_new: false, viewed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("achievement_id", achievement_ids)
  } else {
    // Mark all as viewed
    await supabase
      .from("user_achievements")
      .update({ is_new: false, viewed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_new", true)
  }

  return NextResponse.json({ success: true })
}
