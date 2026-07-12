"use client"

import { Share2, Copy, Check, Heart } from "lucide-react"
import { useState } from "react"

interface ShareBannerProps {
  variant?: "full" | "compact"
  className?: string
}

export function ShareBanner({ variant = "full", className }: ShareBannerProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://authentichadith.app"
  const shareText = "Explore authentic hadith collections for free -- verified, searchable, and beautifully presented."

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Authentic Hadith - Free Hadith Study App",
        text: shareText,
        url: appUrl,
      })
    } else {
      handleCopy()
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(appUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border border-[#C5A059]/20 bg-[#C5A059]/5 ${className || ""}`}>
        <Heart className="w-4 h-4 text-[#C5A059] shrink-0" />
        <p className="text-xs text-muted-foreground flex-1">
          Share this app with someone who could benefit.
        </p>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white text-xs font-medium shrink-0 hover:opacity-90 transition-opacity"
        >
          <Share2 className="w-3 h-3" />
          Share
        </button>
      </div>
    )
  }

  return (
    <section className={`px-4 md:px-6 py-10 md:py-16 max-w-4xl mx-auto ${className || ""}`}>
      <div className="rounded-2xl bg-gradient-to-br from-[#1B5E43] to-[#0a2a1f] p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <pattern id="sharePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#sharePattern)" />
          </svg>
        </div>
        <div className="relative">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#C5A059]/20 flex items-center justify-center">
            <Heart className="w-7 h-7 text-[#E8C77D]" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 text-balance">
            Share the Knowledge
          </h2>
          <p className="text-sm md:text-base text-[#d4cfc7] max-w-lg mx-auto mb-8 leading-relaxed text-pretty">
            This app is free for the entire Ummah. Help spread authentic prophetic knowledge by sharing with family, friends, and your community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleShare}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              Share with Friends
            </button>
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors border border-white/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#4a9973]" />
                  Link Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
