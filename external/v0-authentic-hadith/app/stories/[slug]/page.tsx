"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  BookOpen,
  Clock,
  CheckCircle2,
  Quote,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { cn } from "@/lib/utils"

interface Sahabi {
  id: string
  slug: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string | null
  icon: string
  color_theme: string
  theme_primary: string
  theme_secondary: string | null
  notable_for: string[]
  total_parts: number
  estimated_read_time_minutes: number | null
}

interface StoryPart {
  id: string
  part_number: number
  title_en: string
  title_ar: string | null
  content_en: string
  opening_hook: string | null
  key_lesson: string | null
  historical_context: string | null
  related_hadith_refs: string[] | null
  related_quran_ayat: { ayat?: { surah: string; verse: string; text: string }[] } | null
  estimated_read_minutes: number | null
}

interface ReadingProgress {
  current_part: number
  parts_completed: number[]
  is_completed: boolean
  is_bookmarked: boolean
}

interface Snippet {
  id: string
  text_en: string
  attribution_en: string | null
  source_reference: string | null
  background_color: string
  accent_color: string | null
}

export default function StoryReaderPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = getSupabaseBrowserClient()

  const [sahabi, setSahabi] = useState<Sahabi | null>(null)
  const [parts, setParts] = useState<StoryPart[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [currentPart, setCurrentPart] = useState(1)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [readStartTime, setReadStartTime] = useState<number>(Date.now())

  useEffect(() => {
    async function load() {
      // Fetch sahabi
      const { data: sahabiData } = await supabase
        .from("sahaba")
        .select("*")
        .eq("slug", slug)
        .single()

      if (!sahabiData) {
        router.push("/stories")
        return
      }

      setSahabi(sahabiData)

      // Fetch story parts
      const { data: partsData } = await supabase
        .from("story_parts")
        .select("*")
        .eq("sahabi_id", sahabiData.id)
        .order("part_number", { ascending: true })

      if (partsData) setParts(partsData)

      // Fetch snippets
      const { data: snippetsData } = await supabase
        .from("shareable_snippets")
        .select("*")
        .eq("sahabi_id", sahabiData.id)

      if (snippetsData) setSnippets(snippetsData)

      // Fetch reading progress
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: progressData } = await supabase
          .from("sahaba_reading_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("sahabi_id", sahabiData.id)
          .single()

        if (progressData) {
          setProgress(progressData)
          setCurrentPart(progressData.current_part)
          setIsBookmarked(progressData.is_bookmarked)
        }
      }

      setLoading(false)
    }
    load()
  }, [supabase, slug, router])

  const saveProgress = useCallback(
    async (partNum: number, completed?: number[]) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !sahabi) return

      const timeSpent = Math.round((Date.now() - readStartTime) / 1000)
      const partsCompleted = completed || progress?.parts_completed || []

      const { error } = await supabase.from("sahaba_reading_progress").upsert(
        {
          user_id: user.id,
          sahabi_id: sahabi.id,
          current_part: partNum,
          parts_completed: partsCompleted,
          is_completed: partsCompleted.length >= sahabi.total_parts,
          is_bookmarked: isBookmarked,
          last_read_at: new Date().toISOString(),
          total_time_spent_seconds: (progress as any)?.total_time_spent_seconds
            ? (progress as any).total_time_spent_seconds + timeSpent
            : timeSpent,
        },
        { onConflict: "user_id,sahabi_id" },
      )

      if (!error) {
        setProgress((prev) => ({
          current_part: partNum,
          parts_completed: partsCompleted,
          is_completed: partsCompleted.length >= sahabi.total_parts,
          is_bookmarked: isBookmarked,
        }))
      }

      setReadStartTime(Date.now())
    },
    [supabase, sahabi, progress, isBookmarked, readStartTime],
  )

  const handleNext = async () => {
    if (!sahabi || currentPart >= parts.length) return
    const completed = [...(progress?.parts_completed || [])]
    if (!completed.includes(currentPart)) completed.push(currentPart)
    const next = currentPart + 1
    setCurrentPart(next)
    await saveProgress(next, completed)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePrev = () => {
    if (currentPart <= 1) return
    setCurrentPart(currentPart - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleComplete = async () => {
    if (!sahabi) return
    const completed = [...(progress?.parts_completed || [])]
    if (!completed.includes(currentPart)) completed.push(currentPart)
    await saveProgress(currentPart, completed)
  }

  const handleBookmark = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !sahabi) return

    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    await supabase.from("sahaba_reading_progress").upsert(
      {
        user_id: user.id,
        sahabi_id: sahabi.id,
        current_part: currentPart,
        parts_completed: progress?.parts_completed || [],
        is_bookmarked: newBookmarked,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,sahabi_id" },
    )
  }

  const handleShare = async (text?: string) => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const shareText = text || `Read the story of ${sahabi?.name_en} on Authentic Hadith`

    if (navigator.share) {
      await navigator.share({ title: sahabi?.name_en || "Story", text: shareText, url })
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${url}`)
    }
  }

  if (loading || !sahabi) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const part = parts[currentPart - 1]
  const isPartCompleted = progress?.parts_completed?.includes(currentPart)
  const progressPercent = sahabi.total_parts > 0 ? Math.round(((progress?.parts_completed?.length || 0) / sahabi.total_parts) * 100) : 0
  const partSnippets = snippets.filter((s) => s.source_reference && part?.related_hadith_refs?.some((ref) => s.source_reference?.includes(ref.split(" ")[0])))

  // Render paragraphs with special formatting for hadith references and Quran ayat
  const renderContent = (content: string) => {
    const paragraphs = content.split("\n\n")
    return paragraphs.map((p, i) => {
      // Check if this paragraph contains a Quran quote (has Quran X:Y pattern)
      const isQuranQuote = /Quran \d+:\d+/.test(p) && (p.includes('"') || p.includes("'"))
      // Check if this paragraph is a direct hadith quote
      const isHadithQuote =
        (p.startsWith('"') || p.startsWith("The Prophet")) && (p.includes("said:") || p.includes("peace be upon him"))

      if (isQuranQuote) {
        return (
          <div
            key={i}
            className="my-6 border-l-4 rounded-r-xl px-5 py-4"
            style={{ borderColor: sahabi.theme_primary, backgroundColor: `${sahabi.theme_primary}08` }}
          >
            <p className="text-base leading-relaxed text-foreground italic">{p}</p>
          </div>
        )
      }

      if (isHadithQuote) {
        return (
          <div
            key={i}
            className="my-6 border-l-4 border-[#C5A059] rounded-r-xl bg-[#C5A059]/5 px-5 py-4"
          >
            <p className="text-base leading-relaxed text-foreground">{p}</p>
          </div>
        )
      }

      return (
        <p key={i} className="text-base leading-[1.8] text-foreground/80 mb-4">
          {p}
        </p>
      )
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/stories")}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Back to stories"
            >
              <ChevronLeft className="w-4 h-4 text-foreground/80" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-foreground line-clamp-1">{sahabi.name_en}</h1>
              <p className="text-[10px] text-muted-foreground">
                Part {currentPart} of {sahabi.total_parts}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleBookmark}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                isBookmarked ? "bg-[#C5A059]/10 text-[#C5A059]" : "text-muted-foreground hover:bg-muted",
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark story"}
            >
              <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
            </button>
            <button
              onClick={() => handleShare()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Share story"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(currentPart / sahabi.total_parts) * 100}%`,
              background: `linear-gradient(to right, ${sahabi.theme_primary}, ${sahabi.theme_secondary || sahabi.theme_primary})`,
            }}
          />
        </div>
      </header>

      {/* Part Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-36">
        {part ? (
          <>
            {/* Part header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: sahabi.theme_primary }}
                >
                  Part {part.part_number}
                </span>
                {isPartCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E43]" />}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight text-balance mb-2">
                {part.title_en}
              </h2>
              {part.title_ar && (
                <p className="text-lg text-muted-foreground/60 font-serif" dir="rtl">
                  {part.title_ar}
                </p>
              )}
              {part.estimated_read_minutes && (
                <div className="flex items-center gap-1.5 mt-3">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {part.estimated_read_minutes} min read
                  </span>
                </div>
              )}
            </div>

            {/* Opening hook */}
            {part.opening_hook && (
              <div
                className="mb-8 rounded-xl px-5 py-4 border-l-4"
                style={{
                  borderColor: sahabi.theme_primary,
                  backgroundColor: `${sahabi.theme_primary}08`,
                }}
              >
                <p className="text-lg font-medium italic text-foreground leading-relaxed">
                  {part.opening_hook}
                </p>
              </div>
            )}

            {/* Main content */}
            <article className="prose-custom">{renderContent(part.content_en)}</article>

            {/* Key Lesson */}
            {part.key_lesson && (
              <div className="mt-10 rounded-xl bg-gradient-to-br from-[#1B5E43]/5 to-[#C5A059]/5 border border-[#1B5E43]/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="w-4 h-4 text-[#1B5E43]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#1B5E43]">
                    Key Lesson
                  </span>
                </div>
                <p className="text-base font-medium text-foreground leading-relaxed">
                  {part.key_lesson}
                </p>
              </div>
            )}

            {/* Quran References */}
            {part.related_quran_ayat?.ayat && part.related_quran_ayat.ayat.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Quran References
                </h4>
                <div className="flex flex-col gap-2">
                  {part.related_quran_ayat.ayat.map((ayah, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: sahabi.theme_primary }} />
                      <span>
                        Surah {ayah.surah} ({ayah.verse})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hadith References */}
            {part.related_hadith_refs && part.related_hadith_refs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Hadith References
                </h4>
                <div className="flex flex-wrap gap-2">
                  {part.related_hadith_refs.map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C5A059]/10 text-[#8A6E3A] text-[11px] font-medium whitespace-nowrap"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Shareable snippets for this part */}
            {partSnippets.length > 0 && (
              <div className="mt-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Share a Moment
                </h4>
                <div className="flex flex-col gap-3">
                  {partSnippets.map((snippet) => (
                    <button
                      key={snippet.id}
                      onClick={() =>
                        handleShare(`"${snippet.text_en}"${snippet.attribution_en ? ` -- ${snippet.attribution_en}` : ""}`)
                      }
                      className="w-full rounded-xl p-4 text-left transition-all hover:scale-[1.01] hover:shadow-lg"
                      style={{ backgroundColor: snippet.background_color, color: "#ffffff" }}
                    >
                      <p className="text-sm leading-relaxed font-medium mb-2">
                        {'"'}
                        {snippet.text_en}
                        {'"'}
                      </p>
                      {snippet.attribution_en && (
                        <p className="text-xs opacity-70">-- {snippet.attribution_en}</p>
                      )}
                      <div className="flex items-center gap-1 mt-3 opacity-60">
                        <Share2 className="w-3 h-3" />
                        <span className="text-[10px]">Tap to share</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">This part is not available yet.</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentPart <= 1}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              currentPart <= 1
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-foreground/80 hover:bg-muted",
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Part dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: sahabi.total_parts }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => {
                  setCurrentPart(num)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  num === currentPart
                    ? "w-6 rounded-full"
                    : progress?.parts_completed?.includes(num)
                      ? "bg-[#1B5E43]/40"
                      : "bg-muted",
                )}
                style={
                  num === currentPart
                    ? {
                        background: `linear-gradient(to right, ${sahabi.theme_primary}, ${sahabi.theme_secondary || sahabi.theme_primary})`,
                      }
                    : undefined
                }
                aria-label={`Go to part ${num}`}
              />
            ))}
          </div>

          {currentPart >= parts.length ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: `linear-gradient(to right, ${sahabi.theme_primary}, ${sahabi.theme_secondary || sahabi.theme_primary})`,
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: `linear-gradient(to right, ${sahabi.theme_primary}, ${sahabi.theme_secondary || sahabi.theme_primary})`,
              }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
