"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, Bookmark, Share2, ChevronRight, BookOpen, Sparkles, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseEnglishTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"

interface Hadith {
  id: string
  arabic_text: string
  english_translation: string
  collection: string
  reference: string
  grade: "sahih" | "hasan" | "daif"
  narrator: string
  is_saved?: boolean
}

interface DailyHadithCardProps {
  hadith: Hadith
  onSave?: (id: string) => void
  onShare?: (id: string) => void
  onPlayAudio?: (id: string) => void
}

export function DailyHadithCard({ hadith, onSave, onShare, onPlayAudio }: DailyHadithCardProps) {
  const [isSaved, setIsSaved] = useState(hadith.is_saved || false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [teaching, setTeaching] = useState<string | null>(null)
  const [teachingOpen, setTeachingOpen] = useState(false)
  const teachingRef = useRef<HTMLDivElement>(null)
  const [teachingHeight, setTeachingHeight] = useState(0)

  useEffect(() => {
    if (teachingRef.current) {
      setTeachingHeight(teachingRef.current.scrollHeight)
    }
  }, [teachingOpen, teaching])

  const handleSummarize = async () => {
    setSummarizing(true)
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hadithId: hadith.id }),
      })
      const data = await res.json()
      if (res.ok && data.key_teaching_en) {
        setTeaching(data.key_teaching_en)
        setTeachingOpen(true)
      }
    } catch (err) {
      console.error("Summarize failed:", err)
    }
    setSummarizing(false)
  }
  const { narrator: parsedNarrator, text: parsedText } = parseEnglishTranslation(hadith.english_translation)
  const displayNarrator = hadith.narrator || parsedNarrator || "Unknown"
  const displayText = parsedText || hadith.english_translation
  const displayCollection = getCollectionDisplayName(hadith.collection)

  const gradeColors = {
    sahih: "from-[#10b981] to-[#34d399]",
    hasan: "from-[#3b82f6] to-[#60a5fa]",
    daif: "from-[#6b7280] to-[#9ca3af]",
  }

  const gradeLabels = {
    sahih: "Sahih",
    hasan: "Hasan",
    daif: "Da'if",
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.(hadith.id)
  }

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying)
    onPlayAudio?.(hadith.id)
  }

  return (
    <div className="gold-border rounded-2xl p-6 sm:p-10 premium-card relative overflow-hidden">
      {/* Badges */}
      <div className="flex items-center justify-between mb-6">
        <span className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]">
          {displayCollection}
        </span>
        <span
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-bold text-white bg-gradient-to-r",
            gradeColors[hadith.grade],
          )}
        >
          {gradeLabels[hadith.grade]}
        </span>
      </div>

      {/* Arabic Text */}
      <div className="mb-6" dir="rtl" lang="ar">
        <p
          className="text-2xl sm:text-3xl leading-[1.8] text-foreground font-serif text-right"
          style={{ fontFamily: "Amiri, serif" }}
        >
          {hadith.arabic_text}
        </p>
      </div>

      {/* English Translation */}
      <div className="mb-6" dir="ltr" lang="en">
        <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">{displayText}</p>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <BookOpen className="w-4 h-4" />
        <span>{hadith.reference}</span>
        <span className="mx-2">•</span>
        <span>Narrated by {displayNarrator}</span>
      </div>

      {/* Summarize / Key Teaching */}
      <div className="mb-6">
        {teaching ? (
          <>
            <button
              onClick={() => setTeachingOpen(!teachingOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#C5A059] bg-[#C5A059]/8 hover:bg-[#C5A059]/15 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Key Teaching
              <ChevronDown
                className={cn("w-3.5 h-3.5 transition-transform duration-200", teachingOpen && "rotate-180")}
              />
            </button>
            <div
              ref={teachingRef}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: teachingOpen ? `${teachingHeight}px` : "0px", opacity: teachingOpen ? 1 : 0 }}
            >
              <div className="mt-3 rounded-lg border border-[#C5A059]/15 bg-[#C5A059]/5 p-3.5">
                <p className="text-sm leading-relaxed text-foreground/75">{teaching}</p>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1B5E43] bg-[#1B5E43]/8 hover:bg-[#1B5E43]/15 transition-colors disabled:opacity-50"
          >
            {summarizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {summarizing ? "Summarizing..." : "Summarize"}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAudio}
            className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center transition-all",
              isPlaying
                ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                : "bg-muted/50 border border-border text-foreground hover:bg-[#C5A059] hover:text-white hover:border-transparent",
            )}
            aria-label={isPlaying ? "Pause audio recitation" : "Play audio recitation"}
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center transition-all",
              isSaved
                ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                : "bg-muted/50 border border-border text-foreground hover:bg-[#C5A059] hover:text-white hover:border-transparent",
            )}
            aria-label={isSaved ? "Remove from saved" : "Save this hadith"}
          >
            <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
          </button>
          <button
            onClick={() => onShare?.(hadith.id)}
            className="w-11 h-11 rounded-lg flex items-center justify-center bg-muted/50 border border-border text-foreground hover:bg-[#C5A059] hover:text-white hover:border-transparent transition-all"
            aria-label="Share this hadith"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <a
          href={`/hadith/${hadith.id}`}
          className="inline-flex items-center gap-1 text-[#C5A059] font-medium hover:underline transition-all group"
        >
          Read full hadith
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  )
}
