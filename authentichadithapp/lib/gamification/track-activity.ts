import { supabase } from '@/lib/supabase/client'
import { ActivityType } from '@/types/gamification'

const STAT_COLUMN_MAP: Record<ActivityType, string> = {
  read_hadith: 'hadiths_read',
  complete_story: 'stories_completed',
  share: 'shares_count',
  bookmark: 'bookmarks_count',
  note: 'notes_count',
  complete_quiz: 'quizzes_completed',
  complete_lesson: 'lessons_completed',
  sunnah_practice: 'sunnah_streak',
}

const XP_REWARDS: Record<ActivityType, number> = {
  read_hadith: 5,
  complete_story: 25,
  share: 10,
  bookmark: 3,
  note: 8,
  complete_quiz: 20,
  complete_lesson: 15,
  sunnah_practice: 10,
}

export async function trackActivity(userId: string, activityType: ActivityType): Promise<void> {
  const column = STAT_COLUMN_MAP[activityType]
  const xpReward = XP_REWARDS[activityType]
  if (!column) return

  // Upsert user_stats — increment the relevant column and XP
  const { data: existing } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase
      .from('user_stats')
      .update({
        [column]: (existing[column] || 0) + 1,
        xp: (existing.xp || 0) + xpReward,
      })
      .eq('user_id', userId)
  } else {
    await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        [column]: 1,
        xp: xpReward,
      })
  }

  // Update streak
  await updateStreak(userId)
}

async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (streak) {
    const lastActive = streak.last_active_date
    const activeDays: string[] = streak.active_days || []

    if (lastActive === today) return // Already tracked today

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const newStreak = lastActive === yesterdayStr
      ? streak.current_streak + 1
      : 1

    const newLongest = Math.max(streak.longest_streak || 0, newStreak)

    if (!activeDays.includes(today)) {
      activeDays.push(today)
    }
    // Keep last 30 days
    const recentDays = activeDays.slice(-30)

    await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today,
        active_days: recentDays,
      })
      .eq('user_id', userId)
  } else {
    await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
        active_days: [today],
      })
  }
}
