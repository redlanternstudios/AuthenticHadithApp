export type BadgeKey =
  | 'seeker'
  | 'first_story'
  | 'first_lesson'
  | 'first_quiz'
  | 'first_sunnah'
  | 'story_5'
  | 'lesson_5'
  | 'quiz_5'
  | 'sunnah_5'
  | 'streak_7'
  | 'total_25'

export interface BadgeConfig {
  id: BadgeKey
  name: string
  description: string
  icon: string
  threshold: number
  metric: 'totalCompleted' | 'story' | 'lesson' | 'quiz' | 'sunnah' | 'days'
  shareTitle?: string
}

export const BADGE_CONFIG: BadgeConfig[] = [
  { id: 'seeker', name: 'Seeker', description: 'Begin your journey of learning.', icon: '🌱', metric: 'totalCompleted', threshold: 1 },
  { id: 'first_story', name: 'First Story', description: 'Complete your first story.', icon: '📖', metric: 'story', threshold: 1 },
  { id: 'first_lesson', name: 'First Lesson', description: 'Complete your first lesson.', icon: '📚', metric: 'lesson', threshold: 1 },
  { id: 'first_quiz', name: 'First Quiz', description: 'Finish your first quiz.', icon: '🧠', metric: 'quiz', threshold: 1 },
  { id: 'first_sunnah', name: 'First Sunnah', description: 'Practice your first Sunnah.', icon: '🕌', metric: 'sunnah', threshold: 1 },
  { id: 'story_5', name: 'Storyteller', description: 'Complete 5 stories.', icon: '📚', metric: 'story', threshold: 5 },
  { id: 'lesson_5', name: 'Student', description: 'Complete 5 lessons.', icon: '🎓', metric: 'lesson', threshold: 5 },
  { id: 'quiz_5', name: 'Student of Hadith', description: 'Finish 5 quizzes and sharpen your understanding.', icon: '🧩', metric: 'quiz', threshold: 5, shareTitle: 'Student of Hadith' },
  { id: 'sunnah_5', name: 'Devoted', description: 'Practice 5 Sunnah practices.', icon: '🌟', metric: 'sunnah', threshold: 5 },
  { id: 'streak_7', name: '7-Day Streak', description: 'Engage on 7 different days.', icon: '🔥', metric: 'days', threshold: 7 },
  { id: 'total_25', name: 'Dedicated', description: 'Complete 25 items in total.', icon: '🏆', metric: 'totalCompleted', threshold: 25 },
]

export function getBadgeProgress(metricValue: number, threshold: number) {
  return Math.min(metricValue / threshold, 1)
}

