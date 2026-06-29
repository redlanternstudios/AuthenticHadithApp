"use client"

import React from "react"

import { useRouter } from "next/navigation"
import { Flame, BookOpen, GraduationCap, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ReminderBannerProps {
  streakDays: number
  totalRead: number
  lastActiveDate: string | null
}

interface Reminder {
  icon: React.ElementType
  message: string
  cta: string
  href: string
  color: string
  bgColor: string
  borderColor: string
  iconBg: string
}

export function ReminderBanner({ streakDays, totalRead, lastActiveDate }: ReminderBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const reminder = getReminder(streakDays, totalRead, lastActiveDate)
  if (!reminder) return null

  const Icon = reminder.icon

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 flex items-start gap-3 transition-all",
        reminder.bgColor,
        reminder.borderColor,
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", reminder.iconBg)}>
        <Icon className={cn("w-5 h-5", reminder.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{reminder.message}</p>
        <button
          onClick={() => router.push(reminder.href)}
          className={cn("mt-2 text-xs font-semibold transition-colors hover:underline", reminder.color)}
        >
          {reminder.cta}
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0"
        aria-label="Dismiss reminder"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}

function getReminder(streakDays: number, totalRead: number, lastActiveDate: string | null): Reminder | null {
  const now = new Date()
  const hour = now.getHours()

  // Check if user was inactive yesterday (streak about to break)
  if (lastActiveDate) {
    const lastActive = new Date(lastActiveDate)
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)

    // User hasn't been active in 18-48 hours -- streak at risk
    if (diffHours >= 18 && diffHours < 48 && streakDays > 1) {
      return {
        icon: Flame,
        message: `Your ${streakDays}-day streak is at risk! Read a hadith today to keep it going.`,
        cta: "Read now to keep your streak",
        href: "/today",
        color: "text-[#C5A059]",
        bgColor: "bg-[#C5A059]/5",
        borderColor: "border-[#C5A059]/20",
        iconBg: "bg-[#C5A059]/10",
      }
    }

    // User broke their streak
    if (diffHours >= 48 && streakDays <= 1) {
      return {
        icon: Flame,
        message: "Start a new reading streak today. Consistency is the key to beneficial knowledge.",
        cta: "Begin reading",
        href: "/today",
        color: "text-[#C5A059]",
        bgColor: "bg-[#C5A059]/5",
        borderColor: "border-[#C5A059]/20",
        iconBg: "bg-[#C5A059]/10",
      }
    }
  }

  // Milestone celebrations
  if (totalRead === 0) {
    return {
      icon: BookOpen,
      message: "Start your hadith journey today. Mark your first hadith as read to begin tracking your progress.",
      cta: "Explore collections",
      href: "/collections",
      color: "text-[#1B5E43]",
      bgColor: "bg-[#1B5E43]/5",
      borderColor: "border-[#1B5E43]/20",
      iconBg: "bg-[#1B5E43]/10",
    }
  }

  // Quiz reminder -- afternoon/evening and has read some hadiths
  if (hour >= 14 && totalRead >= 10) {
    return {
      icon: GraduationCap,
      message: "Test your knowledge with a quick quiz based on the hadiths you've been reading.",
      cta: "Take a quiz",
      href: "/quiz",
      color: "text-[#1B5E43]",
      bgColor: "bg-[#1B5E43]/5",
      borderColor: "border-[#1B5E43]/20",
      iconBg: "bg-[#1B5E43]/10",
    }
  }

  // Streak celebration
  if (streakDays >= 7 && streakDays % 7 === 0) {
    return {
      icon: Flame,
      message: `Masha'Allah! You've maintained a ${streakDays}-day streak. Keep going!`,
      cta: "View your progress",
      href: "/progress",
      color: "text-[#C5A059]",
      bgColor: "bg-[#C5A059]/5",
      borderColor: "border-[#C5A059]/20",
      iconBg: "bg-[#C5A059]/10",
    }
  }

  // Default: no banner
  return null
}
