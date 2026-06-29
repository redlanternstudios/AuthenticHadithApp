"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, Share2, ChevronRight, Hash, BookOpen, ChevronDown, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getCleanTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"

interface HadithCardCondensedProps {
  hadith: {
    id: string
    text_ar?: string
    arabic_text?: string
    text_en?: string
    english_translation?: string
    grade: "sahih" | "hasan" | "daif"
    narrator?: string
    narrator_primary?: string
    hadith_number?: number
    reference?: string
    summary_line?: string
    key_teaching_en?: string
    category?: { slug: string; name_en: string } | null
    tags?: Array<{ slug: string; name_en: string }>
  }
  referenceNumber: number
  collectionName: string
  isSaved?: boolean
  onSaveToggle?: (hadithId: string, saved: boolean) => void
}

export function HadithCardCondensed({
  hadith,
  referenceNumber,
  collectionName,
  isSaved = false,
  onSaveToggle,
}: HadithCardCondensedProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(isSaved)
  const [saving, setSaving] = useState(false)
  const [teachingOpen, setTeachingOpen] = useState(false)
  const teachingRef = useRef<HTMLDivElement>(null)
  const [teachingHeight, setTeachingHeight] = useState(0)
  const [summarizing, setSummarizing] = useState(false)
  const [localTeaching, setLocalTeaching] = useState<string | null>(hadith.key_teaching_en || null)
  const [localSummary, setLocalSummary] = useState<string | null>(hadith.summary_line || null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (teachingRef.current) {
      setTeachingHeight(teachingRef.current.scrollHeight)
    }
  }, [teachingOpen, localTeaching])

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setSummarizing(true)
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hadithId: hadith.id }),
      })
      const data = await res.json()
      if (res.ok && data.key_teaching_en) {
        setLocalTeaching(data.key_teaching_en)
        if (data.summary_line) setLocalSummary(data.summary_line)
        setTeachingOpen(true)
      }
    } catch (err) {
      console.error("Summarize failed:", err)
    }
    setSummarizing(false)
  }

  const arabicText = hadith.text_ar || hadith.arabic_text || ""
  const englishText = getCleanTranslation(hadith.text_en || hadith.english_translation || "")
  const narrator = hadith.narrator || hadith.narrator_primary || "Unknown narrator"

  const gradeColors = {
    sahih: "from-[#C5A059] to-[#E8C77D]",
    hasan: "from-[#1B5E43] to-[#2D7A5B]",
    daif: "from-[#6b7280] to-[#9ca3af]",
  }

  const gradeLabels = {
    sahih: "Sahih",
    hasan: "Hasan",
    daif: "Da'if",
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }

      if (saved) {
        await supabase.from("saved_hadiths").delete().eq("user_id", user.id).eq("hadith_id", hadith.id)
      } else {
        await supabase.from("saved_hadiths").insert({ user_id: user.id, hadith_id: hadith.id })
      }

      setSaved(!saved)
      onSaveToggle?.(hadith.id, !saved)
    } catch (error) {
      console.error("Failed to save hadith:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/hadith/${hadith.id}`

    if (navigator.share) {
      await navigator.share({
        title: `${collectionName} - Hadith #${referenceNumber}`,
        text: englishText.substring(0, 200) + "...",
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <div className="relative rounded-xl premium-card overflow-hidden border-l-4 border-l-[#C5A059]">
      <div className="p-5 md:p-6">
        {/* Summary Line */}
        {localSummary && (
          <p className="text-sm font-semibold text-[#C5A059] mb-3 leading-snug">{localSummary}</p>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-foreground">Hadith #{referenceNumber}</span>
          <span className="text-xs text-muted-foreground">
            ({collectionName} {hadith.hadith_number || referenceNumber})
          </span>
          <span
            className={cn(
              "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r",
              gradeColors[hadith.grade],
            )}
          >
            {gradeLabels[hadith.grade]}
          </span>
        </div>

        {/* Narrator */}
        <p className="text-xs text-muted-foreground italic mb-4">Narrated by: {narrator}</p>

        {/* Arabic Text */}
        <div className="mb-4" dir="rtl" lang="ar">
          <p
            className="text-lg md:text-xl leading-[2] text-foreground line-clamp-3"
            style={{ fontFamily: "Amiri, serif" }}
          >
            {arabicText}
          </p>
        </div>

        {/* English Translation */}
        <div className="mb-4" dir="ltr" lang="en">
          <p className="text-sm md:text-base text-muted-foreground line-clamp-4 leading-relaxed">{englishText}</p>
        </div>

        {/* Key Teaching / Summarize */}
        <div className="mb-4">
          {localTeaching ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setTeachingOpen(!teachingOpen)
                }}
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
                  <p className="text-xs leading-relaxed text-foreground/75">{localTeaching}</p>
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

        {/* Category Badge */}
        {hadith.category && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1B5E43]/10 text-[#1B5E43] text-[11px] font-medium">
              <Hash className="w-3 h-3" />
              {hadith.category.name_en}
            </span>
          </div>
        )}

        {/* Enrichment Tags */}
        {hadith.tags && hadith.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hadith.tags.map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#8A6E3A] text-[11px] font-medium whitespace-nowrap"
              >
                <Hash className="w-2.5 h-2.5 shrink-0" />
                {tag.name_en}
              </span>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              saved
                ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                : "border border-border text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059]",
            )}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
            {saved ? "Saved" : "Save"}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059] transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            onClick={() => router.push(`/hadith/${hadith.id}`)}
            className="ml-auto flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold emerald-button"
          >
            Read Full Hadith
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
