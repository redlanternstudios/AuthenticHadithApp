"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  BookOpen,
  Clock,
  CheckCircle2,
  Quote,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Prophet {
  id: string
  slug: string
  name_en: string
  name_ar: string
  title_en: string
  title_ar: string | null
  era: string
  quran_mentions: number
  total_parts: number
  estimated_read_time_minutes: number | null
  theme_primary: string
  theme_secondary: string | null
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
  quran_references: { surah: string; ayah: string; text: string }[] | null
  hadith_references: { collection: string; reference: string; text: string }[] | null
  estimated_read_minutes: number | null
}

export default function ProphetStoryPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = getSupabaseBrowserClient()

  const [prophet, setProphet] = useState<Prophet | null>(null)
  const [parts, setParts] = useState<StoryPart[]>([])
  const [currentPart, setCurrentPart] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: prophetData } = await supabase
        .from("prophets")
        .select("*")
        .eq("slug", slug)
        .single()

      if (!prophetData) {
        router.push("/stories")
        return
      }

      setProphet(prophetData)

      const { data: partsData } = await supabase
        .from("prophet_stories")
        .select("*")
        .eq("prophet_id", prophetData.id)
        .eq("is_published", true)
        .order("part_number", { ascending: true })

      if (partsData) setParts(partsData)
      setLoading(false)
    }
    load()
  }, [supabase, slug, router])

  const handleNext = () => {
    if (currentPart >= parts.length) return
    setCurrentPart(currentPart + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePrev = () => {
    if (currentPart <= 1) return
    setCurrentPart(currentPart - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const text = `Read the story of Prophet ${prophet?.name_en} on Authentic Hadith`
    if (navigator.share) {
      await navigator.share({ title: prophet?.name_en || "Story", text, url })
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`)
    }
  }

  if (loading || !prophet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B5E43] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const part = parts[currentPart - 1]
  const themeColor = prophet.theme_primary || "#1B5E43"

  const renderContent = (content: string) => {
    const paragraphs = content.split("\n\n")
    return paragraphs.map((p, i) => {
      const isQuranQuote = /Quran \d+:\d+/.test(p) || /Surah/.test(p)
      const isHadithQuote = p.includes("Prophet") && (p.includes("said:") || p.includes("peace be upon him"))

      if (isQuranQuote && (p.includes('"') || p.includes("'"))) {
        return (
          <div
            key={i}
            className="my-6 border-l-4 rounded-r-xl px-5 py-4"
            style={{ borderColor: themeColor, backgroundColor: `${themeColor}08` }}
          >
            <p className="text-base leading-relaxed text-foreground italic">{p}</p>
          </div>
        )
      }

      if (isHadithQuote) {
        return (
          <div key={i} className="my-6 border-l-4 border-[#C5A059] rounded-r-xl bg-[#C5A059]/5 px-5 py-4">
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
              <h1 className="text-sm font-bold text-foreground line-clamp-1">
                Prophet {prophet.name_en}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Part {currentPart} of {parts.length || prophet.total_parts}
              </p>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Share story"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(currentPart / (parts.length || prophet.total_parts)) * 100}%`,
              background: `linear-gradient(to right, ${themeColor}, ${prophet.theme_secondary || themeColor})`,
            }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-36">
        {part ? (
          <>
            {/* Part header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>
                  Part {part.part_number}
                </span>
                {prophet.name_ar && (
                  <span className="text-xs text-muted-foreground/50" dir="rtl">{prophet.name_ar}</span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight text-balance mb-2">
                {part.title_en}
              </h2>
              {part.title_ar && (
                <p className="text-lg text-muted-foreground/60 font-serif" dir="rtl">{part.title_ar}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {part.estimated_read_minutes && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {part.estimated_read_minutes} min read
                  </span>
                )}
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {prophet.era}
                </span>
                {prophet.quran_mentions > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {prophet.quran_mentions} Quran mentions
                  </span>
                )}
              </div>
            </div>

            {/* Opening hook */}
            {part.opening_hook && (
              <div
                className="mb-8 rounded-xl px-5 py-4 border-l-4"
                style={{ borderColor: themeColor, backgroundColor: `${themeColor}08` }}
              >
                <p className="text-lg font-medium italic text-foreground leading-relaxed">{part.opening_hook}</p>
              </div>
            )}

            {/* Historical context */}
            {part.historical_context && (
              <div className="mb-6 rounded-lg bg-muted/50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Historical Context
                </span>
                <p className="text-sm text-foreground/70 leading-relaxed mt-1">{part.historical_context}</p>
              </div>
            )}

            {/* Main content */}
            <article className="prose-custom">{renderContent(part.content_en)}</article>

            {/* Key Lesson */}
            {part.key_lesson && (
              <div className="mt-10 rounded-xl bg-gradient-to-br from-[#1B5E43]/5 to-[#C5A059]/5 border border-[#1B5E43]/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="w-4 h-4 text-[#1B5E43]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#1B5E43]">Key Lesson</span>
                </div>
                <p className="text-base font-medium text-foreground leading-relaxed">{part.key_lesson}</p>
              </div>
            )}

            {/* Quran References */}
            {part.quran_references && part.quran_references.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Quran References
                </h4>
                <div className="flex flex-col gap-2">
                  {part.quran_references.map((ref, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: themeColor }} />
                      <span>
                        Surah {ref.surah}:{ref.ayah}
                        {ref.text && <span className="text-foreground/60 ml-1">-- {ref.text}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hadith References */}
            {part.hadith_references && part.hadith_references.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Hadith References
                </h4>
                <div className="flex flex-wrap gap-2">
                  {part.hadith_references.map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C5A059]/10 text-[#8A6E3A] text-[11px] font-medium whitespace-nowrap"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      {ref.collection} {ref.reference}
                    </span>
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
            {Array.from({ length: parts.length || prophet.total_parts }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => {
                  setCurrentPart(num)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  num === currentPart ? "w-6 rounded-full" : "bg-muted",
                )}
                style={
                  num === currentPart
                    ? { background: `linear-gradient(to right, ${themeColor}, ${prophet.theme_secondary || themeColor})` }
                    : undefined
                }
                aria-label={`Go to part ${num}`}
              />
            ))}
          </div>

          {currentPart >= parts.length ? (
            <button
              onClick={() => router.push("/stories")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: `linear-gradient(to right, ${themeColor}, ${prophet.theme_secondary || themeColor})` }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Done
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: `linear-gradient(to right, ${themeColor}, ${prophet.theme_secondary || themeColor})` }}
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
