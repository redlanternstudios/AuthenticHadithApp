"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Crown, Brain, FolderOpen, HelpCircle, Sparkles } from "lucide-react"
import { isNativeApp, showNativePaywall } from "@/lib/native-bridge"
import { cn } from "@/lib/utils"

export type UpgradeReason = "save_limit" | "ai_limit" | "quiz_limit" | "advanced_search" | "learning_path" | "generic"

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason?: UpgradeReason
}

const REASON_CONFIG: Record<UpgradeReason, {
  icon: typeof Crown
  title: string
  description: string
  highlight: string
}> = {
  save_limit: {
    icon: FolderOpen,
    title: "You've reached 40 saved hadiths",
    description: "Explorer accounts can save up to 40 hadiths. Upgrade to Pro for unlimited saves, folders, and organization tools.",
    highlight: "Unlimited saves & folders",
  },
  ai_limit: {
    icon: Brain,
    title: "You've used your 3 daily AI explanations",
    description: "Explorer accounts get 3 AI explanations per day. Upgrade to Pro for unlimited Deep Mode explanations with full scholarly context.",
    highlight: "Unlimited AI (Deep Mode)",
  },
  quiz_limit: {
    icon: HelpCircle,
    title: "You've completed today's quiz",
    description: "Explorer accounts can take 1 quiz per day. Upgrade to Pro for unlimited quizzes across all difficulty levels.",
    highlight: "Unlimited quizzes",
  },
  advanced_search: {
    icon: Sparkles,
    title: "Advanced search is a Pro feature",
    description: "Unlock synonym expansion, tag filtering, and semantic search to find exactly the hadiths you need.",
    highlight: "Advanced search & filtering",
  },
  learning_path: {
    icon: Crown,
    title: "This learning path requires Pro",
    description: "Advanced and Scholar-level learning paths are available with Pro. Continue your journey with deeper, structured study.",
    highlight: "All learning paths",
  },
  generic: {
    icon: Crown,
    title: "Upgrade to Pro",
    description: "Get deeper AI insights, advanced search, unlimited saves, and all learning paths to accelerate your hadith studies.",
    highlight: "Full access to everything",
  },
}

export function UpgradeModal({ open, onClose, reason = "generic" }: UpgradeModalProps) {
  const router = useRouter()
  const config = REASON_CONFIG[reason]
  const Icon = config.icon

  const handleUpgrade = useCallback(async () => {
    if (isNativeApp()) {
      const success = await showNativePaywall()
      if (success) {
        onClose()
        window.location.reload()
      }
    } else {
      onClose()
      router.push("/pricing")
    }
  }, [onClose, router])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        className={cn(
          "relative z-10 w-full sm:max-w-md mx-auto",
          "rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-xl",
          "p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200",
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C5A059]/15 to-[#E8C77D]/10 border border-[#C5A059]/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-[#C5A059]" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-lg font-bold text-foreground text-center text-balance mb-2">
          {config.title}
        </h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-5">
          {config.description}
        </p>

        {/* Highlight feature */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#C5A059]/5 border border-[#C5A059]/15 mb-5">
          <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span className="text-sm font-medium text-foreground">{config.highlight}</span>
        </div>

        {/* CTA buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            View Pro Plans
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue with Explorer
          </button>
        </div>

        {/* Micro-pitch */}
        <p className="text-[11px] text-muted-foreground/60 text-center mt-4 leading-relaxed">
          Study deeper, understand context, build consistent growth. Start with a 7-day free trial.
        </p>
      </div>
    </div>
  )
}
