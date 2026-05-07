import { LevelInfo, AchievementTier } from '@/types/gamification'

const LEVEL_TITLES: Record<number, string> = {
  1: 'Seeker',
  2: 'Student',
  3: 'Learner',
  4: 'Scholar',
  5: 'Muhadith',
  6: 'Expert',
  7: 'Master',
  8: 'Sage',
  9: 'Luminary',
  10: 'Guardian',
}

const TIER_THRESHOLDS: { min: number; tier: AchievementTier; color: string }[] = [
  { min: 1, tier: 'bronze', color: '#CD7F32' },
  { min: 4, tier: 'silver', color: '#C0C0C0' },
  { min: 7, tier: 'gold', color: '#FFD700' },
  { min: 9, tier: 'platinum', color: '#B9F2FF' },
]

export function calculateLevel(xp: number): number {
  return Math.min(Math.floor(Math.sqrt(xp / 100)) + 1, 10)
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

export function xpForNextLevel(level: number): number {
  if (level >= 10) return xpForLevel(10)
  return Math.pow(level, 2) * 100
}

export function xpProgress(xp: number): number {
  const level = calculateLevel(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForNextLevel(level)
  const range = nextLevelXp - currentLevelXp
  if (range <= 0) return 1
  return (xp - currentLevelXp) / range
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] || 'Seeker'
}

function getTier(level: number): { tier: AchievementTier; color: string } {
  let result = TIER_THRESHOLDS[0]
  for (const threshold of TIER_THRESHOLDS) {
    if (level >= threshold.min) result = threshold
  }
  return { tier: result.tier, color: result.color }
}

export function getLevelInfo(xp: number): LevelInfo {
  const level = calculateLevel(xp)
  const { tier, color } = getTier(level)

  return {
    level,
    title: getLevelTitle(level),
    tier,
    tierColor: color,
    currentXp: xp,
    xpForCurrentLevel: xpForLevel(level),
    xpForNextLevel: xpForNextLevel(level),
    progress: xpProgress(xp),
  }
}
