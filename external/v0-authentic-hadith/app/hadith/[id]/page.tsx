"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Bookmark, Share2, BookOpen, ImageIcon, CheckCircle2, Hash, FolderOpen, Sparkles, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { DiscussionSection } from "@/components/hadith/discussion-section"
import { cn } from "@/lib/utils"
import { parseEnglishTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"
import { trackActivity } from "@/app/actions/track-activity"
import { useLanguage } from "@/hooks/use-language"
import { Languages } from "lucide-react"

interface Hadith {
  id: string
  arabic_text: string
  english_translation: string
  collection: string
  book_number: number
  hadith_number: number
  reference: string
  grade: "sahih" | "hasan" | "daif"
  narrator: string
}

type DisplayMode = "arabic" | "english" | "both"

export default function HadithDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()
  const { isArabicPrimary, showBoth } = useLanguage()
  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isRead, setIsRead] = useState(false)
  const [loading, setLoading] = useState(true)
  const [summarizing, setSummarizing] = useState(false)
  
  // Initialize display mode based on user's language preference
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (showBoth) return "both"
    if (isArabicPrimary) return "arabic"
    return "both" // Default to both so users always see Arabic
  })
  
  // Update display mode when language preference changes
  useEffect(() => {
    if (showBoth) setDisplayMode("both")
    else if (isArabicPrimary) setDisplayMode("arabic")
  }, [isArabicPrimary, showBoth])
  const [enrichment, setEnrichment] = useState<{
    summary_line: string | null
    key_teaching_en: string | null
    key_teaching_ar: string | null
    category: { slug: string; name_en: string } | null
    tags: Array<{ slug: string; name_en: string }>
  } | null>(null)

  useEffect(() => {
    const fetchHadith = async () => {
      const { data } = await supabase.from("hadiths").select("*").eq("id", params.id).single()

      if (data) {
        setHadith(data)

        // Check if saved
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: savedData } = await supabase
            .from("saved_hadiths")
            .select("id")
            .eq("user_id", user.id)
            .eq("hadith_id", data.id)
            .single()

          setIsSaved(!!savedData)

          // Check if marked as read
          const { data: readData } = await supabase
            .from("reading_progress")
            .select("id")
            .eq("user_id", user.id)
            .eq("hadith_id", data.id)
            .single()
          setIsRead(!!readData)

          // Track view
          await supabase
            .from("hadith_views")
            .upsert(
              { user_id: user.id, hadith_id: data.id, viewed_at: new Date().toISOString() },
              { onConflict: "user_id,hadith_id" },
            )
        }
      }
      // Fetch enrichment data
      const { data: enrichData } = await supabase
        .from("hadith_enrichment")
        .select("summary_line, key_teaching_en, key_teaching_ar, category:categories!category_id(slug, name_en)")
        .eq("hadith_id", params.id)
        .eq("status", "published")
        .single()

      if (enrichData) {
        // Fetch tags
        const { data: tagData } = await supabase
          .from("hadith_tags")
          .select("tag:tags!tag_id(slug, name_en)")
          .eq("hadith_id", params.id as string)
          .eq("status", "published")

        setEnrichment({
          summary_line: enrichData.summary_line,
          key_teaching_en: enrichData.key_teaching_en,
          key_teaching_ar: enrichData.key_teaching_ar,
          category: enrichData.category as { slug: string; name_en: string } | null,
          tags: (tagData || []).map((t: { tag: { slug: string; name_en: string } | null }) => t.tag).filter(Boolean) as Array<{ slug: string; name_en: string }>,
        })
      }

      setLoading(false)
    }

    fetchHadith()
  }, [supabase, params.id])

  const handleSummarize = async () => {
    if (!hadith) return
    setSummarizing(true)
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hadithId: hadith.id }),
      })
      const data = await res.json()
      if (res.ok && (data.key_teaching_en || data.summary_line)) {
        setEnrichment({
          summary_line: data.summary_line || null,
          key_teaching_en: data.key_teaching_en || null,
          key_teaching_ar: data.key_teaching_ar || null,
          category: enrichment?.category || null,
          tags: enrichment?.tags || [],
        })
      } else {
        console.error("[v0] Summarize API error:", data.error)
      }
    } catch (err) {
      console.error("[v0] Summarize failed:", err)
    }
    setSummarizing(false)
  }

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !hadith) return

    if (isSaved) {
      await supabase.from("saved_hadiths").delete().eq("user_id", user.id).eq("hadith_id", hadith.id)
      // Also remove from user_bookmarks
      await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", hadith.id)
        .eq("item_type", "hadith")
    } else {
      await supabase.from("saved_hadiths").insert({
        user_id: user.id,
        hadith_id: hadith.id,
      })
      // Also add to user_bookmarks for My Hadith
      await supabase.from("user_bookmarks").upsert(
        {
          user_id: user.id,
          item_id: hadith.id,
          item_type: "hadith",
          bookmarked_at: new Date().toISOString(),
        },
        { onConflict: "user_id,item_id,item_type" },
      )
      trackActivity("hadith_save", hadith.id).catch(() => {})
    }
    setIsSaved(!isSaved)
  }

  const handleMarkRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !hadith) return

    if (isRead) {
      await supabase.from("reading_progress").delete().eq("user_id", user.id).eq("hadith_id", hadith.id)
    } else {
      // Find the collection_id for this hadith
      const { data: collData } = await supabase
        .from("collections")
        .select("id")
        .eq("slug", hadith.collection)
        .single()

      await supabase.from("reading_progress").insert({
        user_id: user.id,
        hadith_id: hadith.id,
        collection_id: collData?.id || null,
      })

      // Award XP for reading a hadith
      trackActivity("hadith_read", hadith.id).catch(() => {})
    }
    setIsRead(!isRead)
  }

  const handleShare = async () => {
    if (!hadith) return
    if (navigator.share) {
      await navigator.share({
        title: "Authentic Hadith",
        text: hadith.english_translation,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
    trackActivity("hadith_shared", hadith.id).catch(() => {})
  }

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

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hadith) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Hadith not found</p>
          <button onClick={() => router.push("/home")} className="mt-4 px-4 py-2 rounded-lg gold-button">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">Hadith Detail</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all",
                isSaved
                  ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                  : "bg-background border border-border text-muted-foreground hover:border-[#C5A059]",
              )}
            >
              <Bookmark className={cn("w-4 h-4 sm:w-5 sm:h-5", isSaved && "fill-current")} />
            </button>
            <button
              onClick={() => router.push(`/share?hadith=${hadith?.id}`)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:border-[#C5A059] transition-colors"
              title="Create sharing card"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:border-[#C5A059] transition-colors"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="gold-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 premium-card">
          {/* Badges */}
          <div className="flex items-center justify-between gap-2 mb-5 sm:mb-6">
            <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] uppercase tracking-wide">
              {getCollectionDisplayName(hadith.collection)}
            </span>
            <span
              className={cn(
                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r uppercase tracking-wide",
                gradeColors[hadith.grade],
              )}
            >
              {gradeLabels[hadith.grade]}
            </span>
          </div>

          {/* Enrichment: Summary + Tags */}
          {enrichment && (
            <div className="mb-6 space-y-3">
              {enrichment.summary_line && (
                <p className="text-base font-semibold text-[#8A6E3A] dark:text-[#D4B876] leading-snug">
                  {enrichment.summary_line}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                {enrichment.category && (
                  <button
                    onClick={() => router.push(`/topics/${enrichment.category!.slug}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1B5E43]/10 text-[#1B5E43] text-xs font-medium hover:bg-[#1B5E43]/20 transition-colors"
                  >
                    <FolderOpen className="w-3 h-3" />
                    {enrichment.category.name_en}
                  </button>
                )}
                {enrichment.tags.map((tag) => (
                  <button
                    key={tag.slug}
                    onClick={() => router.push(`/topics/tag/${tag.slug}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C5A059]/10 text-[#8A6E3A] text-xs font-medium hover:bg-[#C5A059]/20 transition-colors"
                  >
                    <Hash className="w-3 h-3" />
                    {tag.name_en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Key Teaching - only shown when enrichment exists */}
          {enrichment?.key_teaching_en && (
            <div className="mb-6 sm:mb-8 rounded-lg sm:rounded-xl border border-[#8A6E3A]/20 bg-[#8A6E3A]/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8A6E3A] dark:text-[#C5A059]/80" />
                <h3 className="text-xs sm:text-sm font-semibold text-[#8A6E3A] dark:text-[#C5A059]/80 uppercase tracking-wider">Key Teaching</h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{enrichment.key_teaching_en}</p>
              {enrichment.key_teaching_ar && (
                <p
                  className="mt-4 pt-4 border-t border-[#8A6E3A]/15 text-sm leading-[2] text-foreground/70 text-right"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "Amiri, serif" }}
                >
                  {enrichment.key_teaching_ar}
                </p>
              )}
            </div>
          )}

          {/* Language Toggle */}
          <div className="flex items-center justify-center gap-1 mb-6 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setDisplayMode("arabic")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                displayMode === "arabic"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="hidden sm:inline">العربية</span>
              <span className="sm:hidden">AR</span>
            </button>
            <button
              onClick={() => setDisplayMode("both")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                displayMode === "both"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Both</span>
            </button>
            <button
              onClick={() => setDisplayMode("english")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                displayMode === "english"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="hidden sm:inline">English</span>
              <span className="sm:hidden">EN</span>
            </button>
          </div>

          {/* Arabic Text - shown when mode is "arabic" or "both" */}
          {(displayMode === "arabic" || displayMode === "both") && (
            <div className={cn("mb-6 sm:mb-8", displayMode === "both" && "pb-6 sm:pb-8 border-b border-border/50")} dir="rtl" lang="ar">
              {displayMode === "both" && (
                <h3 className="text-xs sm:text-sm font-semibold text-[#8A6E3A] dark:text-[#C5A059]/80 mb-2 sm:mb-3 uppercase tracking-wider text-right">النص العربي</h3>
              )}
              <p
                className="text-lg sm:text-xl md:text-2xl leading-[2] sm:leading-[2.2] text-foreground"
                style={{ fontFamily: "Amiri, serif" }}
              >
                {hadith.arabic_text}
              </p>
            </div>
          )}

          {/* Divider - only shown when displaying both */}
          {displayMode === "both" && <div className="gold-divider mb-6 sm:mb-8" />}

          {/* English Translation - shown when mode is "english" or "both" */}
          {(displayMode === "english" || displayMode === "both") && (
            <div className="mb-6 sm:mb-8" dir="ltr" lang="en">
              {displayMode === "both" && (
                <h3 className="text-xs sm:text-sm font-semibold text-[#8A6E3A] dark:text-[#C5A059]/80 mb-2 sm:mb-3 uppercase tracking-wider">Translation</h3>
              )}
              {(() => {
                const { narrator: parsedNarrator, text: parsedText } = parseEnglishTranslation(hadith.english_translation)
                return (
                  <>
                    {parsedNarrator && (
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground italic mb-2">
                        Narrated by {parsedNarrator}
                      </p>
                    )}
                    <p className="text-sm sm:text-base leading-relaxed text-foreground/85">{parsedText}</p>
                  </>
                )
              })()}
            </div>
          )}

          {/* Metadata */}
          <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Reference</span>
              <span className="text-foreground font-medium text-right truncate">{hadith.reference}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Narrator</span>
              <span className="text-foreground font-medium text-right truncate">
                {hadith.narrator || parseEnglishTranslation(hadith.english_translation).narrator || "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground flex-shrink-0">Grade</span>
              <span className="text-foreground font-medium">{gradeLabels[hadith.grade]}</span>
            </div>
          </div>

          {/* Summarize Button - below metadata, above mark as read */}
          {!enrichment?.key_teaching_en && (
            <div className="mt-6">
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white hover:opacity-90 transition-all disabled:opacity-50 w-full justify-center shadow-sm"
              >
                {summarizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {summarizing ? "Summarizing..." : "Summarize this Hadith"}
              </button>
            </div>
          )}

          {/* Mark as Read Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={handleMarkRead}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                isRead
                  ? "bg-[#1B5E43]/10 border-2 border-[#1B5E43] text-[#1B5E43]"
                  : "emerald-button text-white",
              )}
            >
              <CheckCircle2 className={cn("w-5 h-5", isRead && "fill-[#1B5E43] text-white")} />
              {isRead ? "Marked as Read" : "Mark as Read"}
            </button>
          </div>
        </div>

        {/* Community Discussion */}
        <DiscussionSection hadithId={hadith.id} />
      </main>

    </div>
  )
}
