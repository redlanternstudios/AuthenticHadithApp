// XP thresholds: Level = floor(sqrt(XP / 100)) + 1
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, Level 5: 1600 XP

export function calculateLevel(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1)
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

export function xpForNextLevel(level: number): number {
  return Math.pow(level, 2) * 100
}

export function xpProgress(totalXp: number): { current: number; required: number; percentage: number } {
  const level = calculateLevel(totalXp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForNextLevel(level)
  const required = nextLevelXp - currentLevelXp
  const current = totalXp - currentLevelXp

  return {
    current,
    required,
    percentage: required > 0 ? Math.round((current / required) * 100) : 100,
  }
}

export function getTierLabel(tier: number): string {
  switch (tier) {
    case 1:
      return "Bronze"
    case 2:
      return "Silver"
    case 3:
      return "Gold"
    case 4:
      return "Platinum"
    default:
      return ""
  }
}

export function getTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return "#CD7F32"
    case 2:
      return "#C0C0C0"
    case 3:
      return "#FFD700"
    case 4:
      return "#B9F2FF"
    default:
      return "#6b7280"
  }
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Seeker",
  2: "Student",
  3: "Learner",
  4: "Scholar",
  5: "Muhadith",
  6: "Expert",
  7: "Master",
  8: "Sage",
  9: "Luminary",
  10: "Guardian",
}

export function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10]
  return LEVEL_TITLES[level] || "Seeker"
}

export function getLevelInfo(totalXp: number) {
  const level = calculateLevel(totalXp)
  const progress = xpProgress(totalXp)
  return {
    level,
    title: getLevelTitle(level),
    currentXp: totalXp,
    xpForCurrentLevel: xpForLevel(level),
    xpForNextLevel: xpForNextLevel(level),
    progressCurrent: progress.current,
    progressRequired: progress.required,
    progressPercentage: progress.percentage,
  }
}

// Achievement icon map (number string -> descriptive icon name for lucide)
export const ACHIEVEMENT_ICONS: Record<string, string> = {
  "1": "BookOpen",
  "2": "Search",
  "3": "GraduationCap",
  "4": "Library",
  "5": "Crown",
  "6": "PenLine",
  "7": "Notebook",
  "8": "Flame",
  "9": "Star",
  "10": "Gem",
  "11": "Trophy",
  "12": "Share2",
  "13": "Megaphone",
  "14": "Sparkles",
  "15": "BookCheck",
  "16": "Award",
  "17": "Bookmark",
  "18": "Heart",
  "19": "Archive",
  "20": "PartyPopper",
  "21": "Moon",
}
