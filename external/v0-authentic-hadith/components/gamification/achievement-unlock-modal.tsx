"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface UnlockedAchievement {
  name_en: string
  description_en: string
  icon: string
  xp_reward: number
}

interface AchievementUnlockModalProps {
  achievements: UnlockedAchievement[]
  onClose: () => void
}

export function AchievementUnlockModal({ achievements, onClose }: AchievementUnlockModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animateIn, setAnimateIn] = useState(false)

  const currentAchievement = achievements[currentIndex]

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Re-trigger animation on index change
    setAnimateIn(false)
    const timer = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(timer)
  }, [currentIndex])

  if (!currentAchievement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm" onClick={onClose} />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: "-10px",
              backgroundColor: ["#c5a059", "#1b5e43", "#e8c77d", "#2d7a5b", "#FFD700"][i % 5],
              animation: `confetti-fall ${2 + Math.random() * 3}s ease-in ${Math.random() * 1}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border p-8 text-center shadow-2xl transition-all duration-500 ${animateIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <p className="text-sm font-semibold text-primary mb-4">Achievement Unlocked!</p>

        {/* Icon */}
        <div
          className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/15 transition-all duration-700 ${animateIn ? "scale-100" : "scale-50"}`}
        >
          <span className="text-4xl text-secondary font-bold">{currentAchievement.icon}</span>
        </div>

        {/* Achievement info */}
        <h2 className="text-xl font-bold text-foreground mb-1">{currentAchievement.name_en}</h2>
        <p className="text-sm text-muted-foreground mb-4">{currentAchievement.description_en}</p>

        {/* XP reward */}
        <div className="inline-flex items-center gap-1 bg-secondary/15 text-secondary font-bold text-sm px-4 py-1.5 rounded-full mb-6">
          +{currentAchievement.xp_reward} XP
        </div>

        {/* Navigation */}
        {achievements.length > 1 && currentIndex < achievements.length - 1 ? (
          <Button onClick={() => setCurrentIndex(currentIndex + 1)} className="w-full">
            Next ({currentIndex + 1} / {achievements.length})
          </Button>
        ) : (
          <Button onClick={onClose} className="w-full">
            Awesome!
          </Button>
        )}
      </div>

      {/* Confetti animation CSS */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
