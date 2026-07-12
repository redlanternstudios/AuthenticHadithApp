"use client"

import { useRouter } from "next/navigation"
import { BookOpen, Bot, GraduationCap, Heart, Users, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const quickActions = [
  {
    id: "collections",
    icon: BookOpen,
    label: "Browse Collections",
    href: "/collections",
  },
  {
    id: "sunnah",
    icon: Heart,
    label: "Daily Sunnah",
    href: "/sunnah",
  },
  {
    id: "learn",
    icon: GraduationCap,
    label: "Learning Paths",
    href: "/learn",
  },
  {
    id: "stories",
    icon: Users,
    label: "Stories",
    href: "/stories",
  },
  {
    id: "assistant",
    icon: Bot,
    label: "AI Assistant",
    href: "/assistant",
  },
  {
    id: "quiz",
    icon: HelpCircle,
    label: "Test Knowledge",
    href: "/quiz",
  },
]

export function QuickActionsGrid() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-3 gap-3">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => router.push(action.href)}
          className={cn(
            "group relative flex flex-col items-center justify-center gap-2 p-4",
            "bg-card border border-secondary rounded-xl",
            "hover:bg-gradient-to-br hover:from-[#C5A059] hover:to-[#E8C77D]",
            "hover:-translate-y-1 hover:shadow-lg",
            "transition-all duration-200",
          )}
          aria-label={action.label}
        >
          <action.icon className="w-8 h-8 text-foreground group-hover:text-white transition-colors" />
          <span className="text-sm font-medium text-foreground group-hover:text-white text-center transition-colors">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
