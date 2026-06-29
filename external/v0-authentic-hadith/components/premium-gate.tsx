"use client"

import { Lock, Crown, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PremiumGateProps {
  /** Show as inline overlay on top of locked content */
  variant?: "overlay" | "card"
  /** Title of the locked feature */
  featureName?: string
  className?: string
}

export function PremiumGate({ variant = "card", featureName, className }: PremiumGateProps) {
  const router = useRouter()

  if (variant === "overlay") {
    return (
      <div className={cn("absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[2px] rounded-xl", className)}>
        <button
          onClick={() => router.push("/pricing")}
          className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Lock className="w-5 h-5" />
          <span className="text-sm font-semibold">Unlock {featureName || "Pro"}</span>
          <span className="text-[10px] opacity-80">7-day free trial</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push("/pricing")}
      className={cn(
        "w-full p-4 rounded-xl border border-[#C5A059]/30 bg-gradient-to-r from-[#C5A059]/5 to-[#E8C77D]/5 hover:from-[#C5A059]/10 hover:to-[#E8C77D]/10 transition-all text-left group",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#E8C77D] flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Upgrade to Pro
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unlimited AI, advanced search, all learning paths, and unlimited saves.
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#C5A059] group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
    </button>
  )
}
