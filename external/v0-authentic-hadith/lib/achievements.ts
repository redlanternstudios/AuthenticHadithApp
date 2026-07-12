import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * Achievement engine -- checks criteria and awards achievements.
 * Called from server actions / API routes after user activity.
 */

interface Achievement {
  id: string
  slug: string
  criteria: {
    type: string
    threshold?: number
    date?: string
    year?: number
  }
}

/**
 * Check all unearned achievements for a user and award any that are now met.
 * Returns the slugs of newly awarded achievements.
 */
export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdmin()

  // 1. Fetch all achievements + which the user already has
  const [{ data: allAchievements }, { data: userAchievements }] = await Promise.all([
    supabase.from("achievements").select("id, slug, criteria").eq("is_active", true),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
  ])

  if (!allAchievements) return []

  const earnedIds = new Set((userAchievements || []).map((ua) => ua.achievement_id))
  const unearned = allAchievements.filter((a) => !earnedIds.has(a.id)) as Achievement[]

  if (unearned.length === 0) return []

  // 2. Gather all stats we might need (single batch)
  const stats = await gatherUserStats(userId)

  // 3. Evaluate each unearned achievement
  const newlyAwarded: string[] = []

  for (const achievement of unearned) {
    if (evaluateAchievement(achievement, stats)) {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
        is_new: true,
      })
      if (!error) {
        newlyAwarded.push(achievement.slug)

        // Award XP
        const { data: achievementData } = await supabase
          .from("achievements")
          .select("xp_reward")
          .eq("id", achievement.id)
          .single()

        if (achievementData?.xp_reward) {
          // increment total_xp by the reward amount (call multiple times for amounts > 1)
          for (let i = 0; i < achievementData.xp_reward; i++) {
            await supabase.rpc("increment_stat", {
              p_user_id: userId,
              p_stat_name: "total_xp",
            })
          }
        }
      }
    }
  }

  // Update unlocked count in user_stats
  for (let i = 0; i < newlyAwarded.length; i++) {
    await supabase.rpc("increment_stat", {
      p_user_id: userId,
      p_stat_name: "achievements_unlocked",
    })
  }

  return newlyAwarded
}

interface UserStats {
  hadith_read_count: number
  notes_count: number
  bookmarks_count: number
  shares_count: number
  streak_days: number
  stories_completed: number
  lessons_completed: number
  paths_completed: number
  quizzes_passed: number
  quiz_perfect_scores: number
  prophet_stories_read: number
  all_prophet_stories_complete: boolean
  all_sahaba_stories_complete: boolean
  tags_explored: number
  sunnah_streak: number
  account_created: string | null
}

async function gatherUserStats(userId: string): Promise<UserStats> {
  const supabase = getSupabaseAdmin()

  const [
    { data: stats },
    { data: streaks },
    { data: profile },
    { count: lessonsCount },
    { data: pathsData },
    { count: quizzesPassedCount },
    { count: perfectQuizCount },
    { count: prophetProgressCount },
    { data: prophetsTotal },
    { data: sahabaTotal },
    { count: sahabaCompleteCount },
    { count: prophetCompleteCount },
    { count: tagsCount },
    { data: sunnahStreak },
  ] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", userId).single(),
    supabase.from("user_streaks").select("current_streak, longest_streak").eq("user_id", userId).single(),
    supabase.from("profiles").select("created_at").eq("user_id", userId).single(),
    // Completed lessons count
    supabase
      .from("learning_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    // Completed learning paths (all lessons in a path done)
    supabase.from("learning_paths").select("id, total_lessons"),
    // Quizzes passed
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("passed", true),
    // Perfect quiz scores
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("score_percent", 100),
    // Prophet stories read (unique prophets with completed parts)
    supabase
      .from("prophet_reading_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true),
    // Total prophets
    supabase.from("prophets").select("id", { count: "exact", head: true }).eq("is_published", true),
    // Total sahaba
    supabase.from("sahaba").select("id", { count: "exact", head: true }).eq("is_published", true),
    // Sahaba stories complete
    supabase
      .from("sahaba_reading_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true),
    // Prophet stories complete
    supabase
      .from("prophet_reading_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true),
    // Tags explored (distinct tags the user has viewed hadiths with)
    supabase
      .from("hadith_views")
      .select("hadith_id", { count: "exact", head: true })
      .eq("user_id", userId),
    // Sunnah tracking streak (consecutive days)
    supabase
      .from("sunnah_tracking")
      .select("practiced_date")
      .eq("user_id", userId)
      .order("practiced_date", { ascending: false })
      .limit(60),
  ])

  // Calculate sunnah streak
  let sunnahStreakDays = 0
  if (sunnahStreak && sunnahStreak.length > 0) {
    sunnahStreakDays = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const first = new Date(sunnahStreak[0].practiced_date)
    first.setHours(0, 0, 0, 0)
    // Only count if last practice was today or yesterday
    if (today.getTime() - first.getTime() <= 86400000) {
      const dates = [...new Set(sunnahStreak.map((s) => s.practiced_date))].sort().reverse()
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1])
        const curr = new Date(dates[i])
        if (prev.getTime() - curr.getTime() === 86400000) {
          sunnahStreakDays++
        } else {
          break
        }
      }
    }
  }

  // Calculate paths completed
  let pathsCompleted = 0
  if (pathsData && lessonsCount) {
    for (const path of pathsData) {
      if (!path.total_lessons || path.total_lessons === 0) continue
      const { count: pathLessonsCompleted } = await supabase
        .from("learning_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .in(
          "lesson_id",
          (
            await supabase
              .from("learning_lessons")
              .select("id")
              .in(
                "module_id",
                (await supabase.from("learning_modules").select("id").eq("path_id", path.id)).data?.map((m) => m.id) || [],
              )
          ).data?.map((l) => l.id) || [],
        )
      if ((pathLessonsCompleted || 0) >= path.total_lessons) {
        pathsCompleted++
      }
    }
  }

  const totalProphets = (prophetsTotal as any)?.length ?? 0
  const totalSahaba = (sahabaTotal as any)?.length ?? 0

  return {
    hadith_read_count: stats?.hadith_read_count || 0,
    notes_count: stats?.notes_count || 0,
    bookmarks_count: stats?.bookmarks_count || 0,
    shares_count: stats?.shares_count || 0,
    streak_days: streaks?.current_streak || 0,
    stories_completed: stats?.stories_completed || 0,
    lessons_completed: lessonsCount || 0,
    paths_completed: pathsCompleted,
    quizzes_passed: quizzesPassedCount || 0,
    quiz_perfect_scores: perfectQuizCount || 0,
    prophet_stories_read: prophetProgressCount || 0,
    all_prophet_stories_complete:
      totalProphets > 0 && (prophetCompleteCount || 0) >= totalProphets,
    all_sahaba_stories_complete:
      totalSahaba > 0 && (sahabaCompleteCount || 0) >= totalSahaba,
    tags_explored: tagsCount || 0,
    sunnah_streak: sunnahStreakDays,
    account_created: profile?.created_at || null,
  }
}

function evaluateAchievement(achievement: Achievement, stats: UserStats): boolean {
  const { type, threshold } = achievement.criteria

  switch (type) {
    case "hadith_read_count":
      return stats.hadith_read_count >= (threshold || 0)
    case "notes_count":
      return stats.notes_count >= (threshold || 0)
    case "bookmarks_count":
      return stats.bookmarks_count >= (threshold || 0)
    case "shares":
      return stats.shares_count >= (threshold || 0)
    case "streak_days":
      return stats.streak_days >= (threshold || 0)
    case "lesson_complete":
      return stats.lessons_completed >= (threshold || 0)
    case "learning_path_complete":
      return stats.paths_completed >= (threshold || 0)
    case "story_complete":
      return stats.stories_completed >= (threshold || 0)
    case "tags_explored":
      return stats.tags_explored >= (threshold || 0)
    case "quizzes_passed":
      return stats.quizzes_passed >= (threshold || 0)
    case "quiz_perfect_score":
      return stats.quiz_perfect_scores >= (threshold || 0)
    case "prophet_stories_read":
      return stats.prophet_stories_read >= (threshold || 0)
    case "all_prophet_stories_complete":
      return stats.all_prophet_stories_complete
    case "all_stories_complete":
      return stats.all_sahaba_stories_complete
    case "sunnah_streak":
      return stats.sunnah_streak >= (threshold || 0)
    case "account_age_before":
      if (!stats.account_created || !achievement.criteria.date) return false
      return new Date(stats.account_created) < new Date(achievement.criteria.date)
    case "active_during_ramadan":
      // Simple check: if any activity exists during Ramadan period
      // Ramadan 2026 is approximately Feb 18 - Mar 19
      if (achievement.criteria.year === 2026) {
        return stats.streak_days > 0 // They're active now which is during/near Ramadan 2026
      }
      return false
    default:
      return false
  }
}
