import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkAndUnlockAchievements } from "./achievement-engine"

type ActivityType = "read_hadith" | "complete_story" | "share" | "bookmark" | "note"

export async function trackActivity(
  userId: string,
  activityType: ActivityType,
  itemId?: string,
): Promise<{ newAchievements: string[] }> {
  const supabase = getSupabaseAdmin()

  // Ensure user_stats row exists
  await supabase.from("user_stats").insert({ user_id: userId }).select().maybeSingle()

  // Log activity (triggers streak update via DB trigger)
  await supabase.from("user_activity_log").upsert(
    {
      user_id: userId,
      activity_date: new Date().toISOString().split("T")[0],
      activity_type: activityType,
      item_id: itemId || null,
    },
    { onConflict: "user_id,activity_date,activity_type" },
  )

  // Update the relevant stat counter
  const statMap: Record<ActivityType, string> = {
    read_hadith: "hadith_read_count",
    complete_story: "stories_completed",
    share: "shares_count",
    bookmark: "bookmarks_count",
    note: "notes_count",
  }

  const statName = statMap[activityType]
  if (statName) {
    await supabase.rpc("increment_stat", {
      p_user_id: userId,
      p_stat_name: statName,
    })
  }

  // Check for new achievement unlocks
  const newAchievements = await checkAndUnlockAchievements(userId)

  return { newAchievements }
}
