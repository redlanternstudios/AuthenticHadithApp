"use client"

import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  className?: string
}

export function StreakCounter({ currentStreak, longestStreak, className }: StreakCounterProps) {
  const isOnFire = currentStreak >= 3

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-4", className)}>
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          isOnFire ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted",
        )}
      >
        <Flame className={cn("h-6 w-6", isOnFire ? "text-orange-500" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <span className="text-xs text-muted-foreground">Best: {longestStreak} days</span>
      </div>
    </div>
  )
}
