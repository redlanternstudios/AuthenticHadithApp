"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Moon,
  Users,
  Home as HomeIcon,
  HandHeart,
  Utensils,
  Clock,
  BookOpen,
  Share2,
  Sparkles,
  Plane,
  Stethoscope,
  Shirt,
  Loader2,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ShareBanner } from "@/components/share-banner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface SunnahCategory {
  id: string
  title: string
  title_ar: string
  description: string
  icon: string
  color: string
  bg_color: string
  sort_order: number
  practiceCount: number
}

interface SunnahPractice {
  id: string
  title: string
  description: string
  hadith_ref: string
  collection: string
  category_id: string
  day_of_year: number | null
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Moon,
  HandHeart,
  Home: HomeIcon,
  Users,
  Utensils,
  Clock,
  Plane,
  Stethoscope,
  Shirt,
  BookOpen,
  Sparkles,
  Sun,
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

export default function SunnahPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [categories, setCategories] = useState<SunnahCategory[]>([])
  const [practices, setPractices] = useState<SunnahPractice[]>([])
  const [todaySunnah, setTodaySunnah] = useState<SunnahPractice | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [catsRes, practicesRes] = await Promise.all([
        supabase.from("sunnah_categories").select("*").order("sort_order"),
        supabase.from("sunnah_practices").select("*").order("day_of_year"),
      ])

      const allPractices: SunnahPractice[] = practicesRes.data || []
      setPractices(allPractices)

      // Enrich categories with practice counts
      const cats = (catsRes.data || []).map((cat: any) => ({
        ...cat,
        practiceCount: allPractices.filter((p) => p.category_id === cat.id).length,
      }))
      setCategories(cats)

      // Get today's sunnah based on day of year
      const dayOfYear = getDayOfYear()
      const today = allPractices.find((p) => p.day_of_year === dayOfYear)
      setTodaySunnah(today || allPractices[0] || null)

      if (cats.length > 0) setExpandedCategory(cats[0].id)
      setLoading(false)
    }
    loadData()
  }, [supabase])

  const sharePractice = async (practice: SunnahPractice) => {
    const text = `${practice.title}\n\n"${practice.description}"\n\n-- ${practice.collection || "Hadith"}, ${practice.hadith_ref}\n\nFrom Authentic Hadith`
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (navigator.share) {
      await navigator.share({ title: practice.title, text, url })
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Sunnah Practices</h1>
            <p className="text-xs text-muted-foreground">
              {practices.length} practices across {categories.length} categories
            </p>
          </div>
        </div>
      </header>

      {/* Today's Sunnah */}
      {todaySunnah && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <div className="rounded-xl border border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/5 to-transparent p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                {"Today's Sunnah"} -- Day {getDayOfYear()}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">{todaySunnah.title}</h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">{todaySunnah.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {todaySunnah.collection || "Hadith"} - {todaySunnah.hadith_ref}
                </span>
              </div>
              <button
                onClick={() => sharePractice(todaySunnah)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#C5A059]/10 transition-colors"
                aria-label="Share today's sunnah"
              >
                <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="premium-card rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#C5A059]" />
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Beyond the academic study of hadith, the <strong>Sunnah</strong> is the living tradition --
              the daily acts, habits, and character of the Prophet (peace be upon him) that we can embody today.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.id
          const Icon = ICON_MAP[cat.icon] || Moon
          const catPractices = practices.filter((p) => p.category_id === cat.id)

          return (
            <div
              key={cat.id}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                isExpanded ? "border-[#C5A059]/30 shadow-sm" : "border-border",
              )}
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="w-full p-4 flex items-center gap-4 premium-card text-left"
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", cat.bg_color)}>
                  <Icon className={cn("w-5 h-5", cat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
                    <span className="text-xs text-muted-foreground/60" dir="rtl">{cat.title_ar}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {cat.practiceCount}
                </span>
                <ChevronRight
                  className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")}
                />
              </button>

              {isExpanded && catPractices.length > 0 && (
                <div className="border-t border-border divide-y divide-border/50">
                  {catPractices.slice(0, 15).map((practice) => (
                    <div key={practice.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground mb-1">{practice.title}</h4>
                        <button
                          onClick={() => sharePractice(practice)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#C5A059]/10 transition-colors shrink-0"
                          aria-label={`Share ${practice.title}`}
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        </button>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed mb-2">{practice.description}</p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {practice.collection || "Hadith"} - {practice.hadith_ref}
                        </span>
                      </div>
                    </div>
                  ))}
                  {catPractices.length > 15 && (
                    <div className="p-3 text-center">
                      <span className="text-xs text-muted-foreground">
                        + {catPractices.length - 15} more practices in this category
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </main>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 md:pb-8">
        <ShareBanner variant="compact" />
      </div>
    </div>
  )
}
