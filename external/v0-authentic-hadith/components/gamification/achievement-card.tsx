"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { getTierLabel, getTierColor } from "@/lib/gamification/level-calculator"
import {
  Lock,
  BookOpen,
  Search,
  GraduationCap,
  Library,
  Crown,
  PenLine,
  Notebook,
  Flame,
  Star,
  Gem,
  Trophy,
  Share2,
  Megaphone,
  Sparkles,
  BookCheck,
  Award,
  Bookmark,
  Heart,
  Archive,
  PartyPopper,
  Moon,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const ICON_MAP: Record<string, React.ElementType> = {
  "1": BookOpen,
  "2": Search,
  "3": GraduationCap,
  "4": Library,
  "5": Crown,
  "6": PenLine,
  "7": Notebook,
  "8": Flame,
  "9": Star,
  "10": Gem,
  "11": Trophy,
  "12": Share2,
  "13": Megaphone,
  "14": Sparkles,
  "15": BookCheck,
  "16": Award,
  "17": Bookmark,
  "18": Heart,
  "19": Archive,
  "20": PartyPopper,
  "21": Moon,
}

interface AchievementCardProps {
  achievement: {
    id: string
    name_en: string
    description_en: string
    icon: string
    category: string
    tier: number
    xp_reward: number
    isUnlocked: boolean
    unlockedAt: string | null
  }
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const IconComponent = ICON_MAP[achievement.icon] || Award
  const tierColor = getTierColor(achievement.tier)

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all",
        achievement.isUnlocked
          ? "border-secondary/50 bg-card shadow-sm"
          : "border-dashed border-border bg-card/50",
      )}
    >
      {/* Tier badge */}
      <span
        className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
      >
        {getTierLabel(achievement.tier)}
      </span>

      {/* Icon */}
      <div className="relative">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            achievement.isUnlocked ? "bg-secondary/15" : "bg-muted",
          )}
        >
          <IconComponent
            className={cn("h-7 w-7", achievement.isUnlocked ? "text-secondary" : "text-muted-foreground/40")}
          />
        </div>
        {!achievement.isUnlocked && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Text */}
      <div>
        <h3
          className={cn(
            "text-sm font-semibold",
            achievement.isUnlocked ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {achievement.name_en}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{achievement.description_en}</p>
      </div>

      {/* Footer */}
      {achievement.isUnlocked && achievement.unlockedAt ? (
        <span className="text-[10px] text-primary font-medium">
          Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
        </span>
      ) : (
        <span className="text-[10px] font-semibold text-secondary">+{achievement.xp_reward} XP</span>
      )}
    </div>
  )
}
