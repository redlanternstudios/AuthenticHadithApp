"use client";

import { xpProgress } from "@/lib/gamification/level-calculator";

interface LevelProgressBarProps {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
}

export function LevelProgressBar({
  level,
  title,
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
}: LevelProgressBarProps) {
  const progress = xpProgress(currentXp);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C5A059] to-[#E8C77D] text-white font-bold text-lg">
        {level}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            Level {level} -- {title}
          </span>
          <span className="text-xs text-muted-foreground">
            {progress.current} / {progress.required} XP
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-[#E8C77D] transition-all duration-500"
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
