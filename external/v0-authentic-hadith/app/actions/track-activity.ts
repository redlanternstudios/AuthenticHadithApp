"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { checkAndAwardAchievements } from "@/lib/achievements"

const XP_REWARDS: Record<string, number> = {
  hadith_read: 5,
  hadith_save: 10,
  note_written: 15,
  hadith_shared: 10,
  story_completed: 50,
  quiz_completed: 30,
  lesson_completed: 25,
  sunnah_tracked: 10,
}

export async function trackActivity(activityType: string, itemId?: string) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  try {
    // Log activity
    const { error: activityError } = await supabase.from("user_activity_log").insert({
      user_id: user.id,
      activity_type: activityType,
      item_id: itemId || null,
    })

    if (activityError && !activityError.message.includes("duplicate")) {
      console.error("Activity log error:", activityError)
    }

    // Award XP (increment_stat increments by 1, so loop for larger amounts)
    const xp = XP_REWARDS[activityType] || 0
    for (let i = 0; i < xp; i++) {
      await supabase.rpc("increment_stat", {
        p_user_id: user.id,
        p_stat_name: "total_xp",
      })
    }

    // Increment the relevant stat
    const statMap: Record<string, string> = {
      hadith_read: "hadith_read_count",
      hadith_save: "bookmarks_count",
      note_written: "notes_count",
      hadith_shared: "shares_count",
      story_completed: "stories_completed",
    }

    const statName = statMap[activityType]
    if (statName) {
      await supabase.rpc("increment_stat", {
        p_user_id: user.id,
        p_stat_name: statName,
      })
    }

    // Check ALL achievements (comprehensive engine)
    const newAchievements = await checkAndAwardAchievements(user.id)

    return { success: true, xpEarned: xp, newAchievements }
  } catch (error) {
    console.error("Track activity error:", error)
    return { success: false, error: "Failed to track activity" }
  }
}
