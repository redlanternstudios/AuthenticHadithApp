"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const LEARNING_LEVELS = ["Beginner", "Intermediate", "Advanced"]

interface StepPreferencesProps {
  data: {
    language: string
    collections: string[]
    learningLevel: string
  }
  onUpdate: (data: Partial<StepPreferencesProps["data"]>) => void
}

export function StepPreferences({ data, onUpdate }: StepPreferencesProps) {
  const activeIndex = Math.max(0, LEARNING_LEVELS.indexOf(data.learningLevel))
  const [sliderValue, setSliderValue] = useState<number>(activeIndex * 50)

  // Both Sahihs are always pre-selected — no user choice needed
  useEffect(() => {
    if (!data.collections.includes("bukhari") || !data.collections.includes("muslim")) {
      onUpdate({ collections: ["bukhari", "muslim"] })
    }
  }, [])

  const handleLevelSelect = (level: string) => {
    onUpdate({ learningLevel: level })
  }

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value)
    setSliderValue(value)
    const levelIndex = Math.floor(value / 50)
    if (levelIndex >= 0 && levelIndex < LEARNING_LEVELS.length) {
      handleLevelSelect(LEARNING_LEVELS[levelIndex])
    }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Customize your experience</h2>
        <p className="text-muted-foreground">Set your learning level to personalize your journey</p>
      </div>

      {/* Al-Sahihayn notice */}
      <div className="rounded-lg border border-[#C5A059]/30 bg-[#C5A059]/5 px-4 py-3 flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-[#C5A059] mt-1.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Al-Sahihayn — The Two Sahihs</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All 14,444 hadiths are from Sahih al-Bukhari and Sahih Muslim — the two most rigorously authenticated collections in Islam.
          </p>
        </div>
      </div>

      {/* Learning Level Toggle */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">Learning Level</label>
        <div className="relative flex items-center bg-[#F3F0EA] rounded-xl p-1" role="radiogroup" aria-label="Select your learning level">
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
            style={{
              width: `calc(${100 / LEARNING_LEVELS.length}% - 4px)`,
              left: `calc(${(activeIndex * 100) / LEARNING_LEVELS.length}% + 2px)`,
              background: "linear-gradient(135deg, #C5A059 0%, #D4B06A 100%)",
              boxShadow: "0 2px 8px rgba(197, 160, 89, 0.35)",
            }}
          />
          {LEARNING_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={data.learningLevel === level}
              onClick={() => handleLevelSelect(level)}
              className={cn(
                "relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg text-center transition-colors duration-200",
                data.learningLevel === level
                  ? "text-white"
                  : "text-[#6B6455] hover:text-foreground",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
