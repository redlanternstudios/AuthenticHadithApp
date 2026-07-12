import { getSupabaseAdmin } from "@/lib/supabase/admin"

interface AchievementCriteria {
  type: string
  threshold?: number
  collection?: string
  date?: string
  year?: number
}

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  const unlockedAchievements: string[] = []

  // Fetch user stats
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!stats) return []

  // Fetch all active achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)

  if (!achievements) return []

  // Fetch already unlocked achievement IDs
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId)

  const unlockedIds = new Set(unlocked?.map((u) => u.achievement_id) || [])

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue

    const criteria = achievement.criteria as AchievementCriteria
    let shouldUnlock = false

    switch (criteria.type) {
      case "hadith_read_count":
        shouldUnlock = stats.hadith_read_count >= (criteria.threshold || 0)
        break

      case "streak_days":
        shouldUnlock = stats.current_streak_days >= (criteria.threshold || 0)
        break

      case "shares":
        shouldUnlock = stats.shares_count >= (criteria.threshold || 0)
        break

      case "bookmarks_count":
        shouldUnlock = stats.bookmarks_count >= (criteria.threshold || 0)
        break

      case "notes_count":
        shouldUnlock = stats.notes_count >= (criteria.threshold || 0)
        break

      case "story_complete":
        shouldUnlock = stats.stories_completed >= (criteria.threshold || 1)
        break

      case "all_stories_complete": {
        const { count: totalStories } = await supabase
          .from("sahaba")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true)
        shouldUnlock = stats.stories_completed >= (totalStories || 999)
        break
      }

      case "all_prophet_stories_complete": {
        const { count: totalProphets } = await supabase
          .from("prophets")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true)
        // Check if user has read story parts for all prophets (simplified -- check total_parts)
        shouldUnlock = (stats.prophet_stories_completed || 0) >= (totalProphets || 25)
        break
      }

      case "learning_path_complete":
        shouldUnlock = (stats.learning_paths_completed || 0) >= (criteria.threshold || 1)
        break

      case "quiz_perfect_score":
        shouldUnlock = (stats.quiz_perfect_scores || 0) >= (criteria.threshold || 1)
        break

      case "sunnah_streak":
        shouldUnlock = (stats.sunnah_streak_days || 0) >= (criteria.threshold || 30)
        break

      case "account_age_before": {
        const cutoff = new Date(criteria.date || "2099-01-01")
        shouldUnlock = new Date(stats.created_at) < cutoff
        break
      }

      case "active_during_ramadan":
        // Skip complex date checking for now
        break
    }

    if (shouldUnlock) {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString(),
        is_new: true,
      })

      if (!error) {
        await supabase.rpc("increment_user_xp", {
          p_user_id: userId,
          p_xp_amount: achievement.xp_reward,
        })
        unlockedAchievements.push(achievement.slug)
      }
    }
  }

  return unlockedAchievements
}
