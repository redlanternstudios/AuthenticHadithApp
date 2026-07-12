"use client"

import { useRouter } from "next/navigation"
import { Crown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageBannerProps {
  used: number
  limit: number
  label: string
  className?: string
}

export function UsageBanner({ used, limit, label, className }: UsageBannerProps) {
  const router = useRouter()
  const remaining = Math.max(limit - used, 0)
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const isNearLimit = pct >= 60
  const isAtLimit = remaining === 0

  if (!isNearLimit) return null

  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex items-center gap-3 transition-all",
        isAtLimit
          ? "border-[#C5A059]/40 bg-[#C5A059]/5"
          : "border-border bg-muted/50",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-foreground">
            {label}
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              isAtLimit ? "text-[#C5A059]" : "text-muted-foreground",
            )}
          >
            {used}/{limit}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isAtLimit
                ? "bg-[#C5A059]"
                : "bg-[#1B5E43]",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isAtLimit && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Limit reached. Upgrade to Pro for unlimited access.
          </p>
        )}
      </div>
      {isAtLimit && (
        <button
          onClick={() => router.push("/pricing")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade
        </button>
      )}
    </div>
  )
}

/** Compact inline "Upgrade to Pro" CTA for free users. */
export function ProUpgradeCTA({ className }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push("/pricing")}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl",
        "border border-[#C5A059]/30 bg-gradient-to-r from-[#C5A059]/5 to-[#E8C77D]/5",
        "hover:from-[#C5A059]/10 hover:to-[#E8C77D]/10 transition-all text-left group w-full",
        className,
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#E8C77D] flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">Unlock Pro Features</p>
        <p className="text-[10px] text-muted-foreground">Unlimited AI, saves, quizzes & more</p>
      </div>
      <Crown className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform shrink-0" />
    </button>
  )
}
