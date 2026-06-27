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

// FIX-138: trackActivity is a best-effort gamification side-effect. It must
// NEVER throw — a failed XP/streak write can't be allowed to break the primary
// user action (saving a hadith, completing a lesson, writing a reflection).
// The whole body is guarded so every call site is safe without its own try/catch.
export async function trackActivity(userId: string, activityType: ActivityType): Promise<void> {
  try {
    const column = STAT_COLUMN_MAP[activityType]
    const xpReward = XP_REWARDS[activityType]
    if (!column) return

    // Use maybeSingle() — single() throws PGRST116 when zero rows match. The
    // first time a user does anything, no user_stats row exists yet; that
    // should be a normal code path, not an exception.
    const { data: existing } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

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

    // Update streak — wrapped so a streak failure doesn't bubble up and tank
    // the rest of trackActivity (or the calling completion flow).
    try {
      await updateStreak(userId)
    } catch (err) {
      __DEV__ && console.warn('[trackActivity] updateStreak failed (non-fatal):', err)
    }
  } catch (err) {
    __DEV__ && console.warn('[trackActivity] failed (non-fatal):', err)
  }
}

async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

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
