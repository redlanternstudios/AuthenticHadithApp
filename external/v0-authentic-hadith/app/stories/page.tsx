"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Bookmark,
  Shield,
  Sword,
  Star,
  Heart,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ShareBanner } from "@/components/share-banner"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  sword: Sword,
  star: Star,
  heart: Heart,
  users: Users,
  sparkles: Sparkles,
  book: BookOpen,
}

interface SahabiCard {
  id: string
  slug: string
  name_en: string
  name_ar: string
  title_en: string
  icon: string
  theme_primary: string
  theme_secondary: string | null
  notable_for: string[]
  total_parts: number
  estimated_read_time_minutes: number | null
  display_order: number
}

interface ProphetCard {
  id: string
  slug: string
  name_en: string
  name_ar: string
  title_en: string
  era: string
  quran_mentions: number
  total_parts: number
  estimated_read_time_minutes: number | null
  theme_primary: string
  icon: string
  display_order: number
}

interface ProgressMap {
  [id: string]: {
    parts_completed: number[]
    is_completed: boolean
    is_bookmarked: boolean
  }
}

type ActiveTab = "companions" | "prophets"

export default function StoriesPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [tab, setTab] = useState<ActiveTab>("companions")
  const [companions, setCompanions] = useState<SahabiCard[]>([])
  const [prophets, setProphets] = useState<ProphetCard[]>([])
  const [companionProgress, setCompanionProgress] = useState<ProgressMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [sahabaRes, prophetsRes] = await Promise.all([
        supabase.from("sahaba").select("*").order("display_order"),
        supabase.from("prophets").select("*").eq("is_published", true).order("display_order"),
      ])

      setCompanions(sahabaRes.data || [])
      setProphets(prophetsRes.data || [])

      // Fetch user progress
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: progressData } = await supabase
          .from("sahaba_reading_progress")
          .select("*")
          .eq("user_id", user.id)

        if (progressData) {
          const map: ProgressMap = {}
          for (const p of progressData) {
            map[p.sahabi_id] = {
              parts_completed: p.parts_completed || [],
              is_completed: p.is_completed,
              is_bookmarked: p.is_bookmarked,
            }
          }
          setCompanionProgress(map)
        }
      }

      setLoading(false)
    }
    load()
  }, [supabase])

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
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            aria-label="Go back home"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Stories</h1>
            <p className="text-xs text-muted-foreground">
              {companions.length} companions, {prophets.length} prophets
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 border-b border-transparent">
            <button
              onClick={() => setTab("companions")}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === "companions"
                  ? "border-[#C5A059] text-[#C5A059]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Companions ({companions.length})
            </button>
            <button
              onClick={() => setTab("prophets")}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === "prophets"
                  ? "border-[#1B5E43] text-[#1B5E43]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Prophets ({prophets.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
        {tab === "companions" ? (
          <CompanionsTab
            companions={companions}
            progress={companionProgress}
            onSelect={(slug) => router.push(`/stories/${slug}`)}
          />
        ) : (
          <ProphetsTab
            prophets={prophets}
            onSelect={(slug) => router.push(`/stories/prophets/${slug}`)}
          />
        )}
      </main>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 md:pb-8">
        <ShareBanner variant="compact" />
      </div>
    </div>
  )
}

function CompanionsTab({
  companions,
  progress,
  onSelect,
}: {
  companions: SahabiCard[]
  progress: ProgressMap
  onSelect: (slug: string) => void
}) {
  const continueReading = companions.filter(
    (c) => progress[c.id] && !progress[c.id].is_completed && (progress[c.id].parts_completed?.length || 0) > 0,
  )
  const notStarted = companions.filter((c) => !progress[c.id] || (progress[c.id].parts_completed?.length || 0) === 0)
  const completed = companions.filter((c) => progress[c.id]?.is_completed)

  return (
    <>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Companions (Sahaba) were the people who lived alongside the Prophet Muhammad (peace be upon
        him). Read their full stories with authentic references.
      </p>

      {continueReading.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#1B5E43] mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Continue Reading
          </h2>
          <div className="flex flex-col gap-3">
            {continueReading.map((c) => (
              <CompanionCard key={c.id} companion={c} progress={progress[c.id]} onClick={() => onSelect(c.slug)} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {continueReading.length > 0 ? "Not Yet Started" : "All Companions"}
        </h2>
        <div className="flex flex-col gap-3">
          {(continueReading.length > 0 ? notStarted : companions).map((c) => (
            <CompanionCard key={c.id} companion={c} progress={progress[c.id]} onClick={() => onSelect(c.slug)} />
          ))}
        </div>
      </section>

      {completed.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#C5A059] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </h2>
          <div className="flex flex-col gap-3">
            {completed.map((c) => (
              <CompanionCard key={c.id} companion={c} progress={progress[c.id]} onClick={() => onSelect(c.slug)} isComplete />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function ProphetsTab({
  prophets,
  onSelect,
}: {
  prophets: ProphetCard[]
  onSelect: (slug: string) => void
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The 25 prophets mentioned in the Quran, from Adam (peace be upon him) to Muhammad (peace be upon him).
        Multi-part narratives with Quranic references and historical context.
      </p>

      <div className="flex flex-col gap-3">
        {prophets.map((prophet, idx) => {
          const Icon = ICON_MAP[prophet.icon] || Star
          return (
            <button
              key={prophet.id}
              onClick={() => onSelect(prophet.slug)}
              className="w-full rounded-xl border border-border text-left transition-all hover:shadow-md hover:border-[#1B5E43]/30 premium-card overflow-hidden"
            >
              <div className="p-4 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${prophet.theme_primary}15` }}
                >
                  <span className="text-lg font-bold" style={{ color: prophet.theme_primary }}>
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{prophet.name_en}</h3>
                    {prophet.name_ar && (
                      <span className="text-xs text-muted-foreground/60" dir="rtl">{prophet.name_ar}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium" style={{ color: prophet.theme_primary }}>
                    {prophet.title_en}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {prophet.total_parts} parts
                    </span>
                    {prophet.estimated_read_time_minutes && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {prophet.estimated_read_time_minutes} min
                      </span>
                    )}
                    {prophet.quran_mentions > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {prophet.quran_mentions} Quran mentions
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      {prophet.era}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

function CompanionCard({
  companion,
  progress,
  onClick,
  featured,
  isComplete,
}: {
  companion: SahabiCard
  progress?: ProgressMap[string]
  onClick: () => void
  featured?: boolean
  isComplete?: boolean
}) {
  const Icon = ICON_MAP[companion.icon] || Star
  const partsCompleted = progress?.parts_completed?.length || 0
  const progressPercent = companion.total_parts > 0 ? (partsCompleted / companion.total_parts) * 100 : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border text-left transition-all hover:shadow-md hover:border-[#C5A059]/30 premium-card overflow-hidden",
        featured ? "border-[#C5A059]/30 shadow-sm" : "border-border",
        isComplete && "border-[#1B5E43]/20 opacity-80",
      )}
    >
      {partsCompleted > 0 && !isComplete && (
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(to right, ${companion.theme_primary}, ${companion.theme_secondary || companion.theme_primary})`,
            }}
          />
        </div>
      )}
      <div className="p-4 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${companion.theme_primary}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: companion.theme_primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{companion.name_en}</h3>
            {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E43] shrink-0" />}
            {progress?.is_bookmarked && <Bookmark className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059] shrink-0" />}
          </div>
          <p className="text-xs font-medium" style={{ color: companion.theme_primary }}>
            {companion.title_en}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {companion.total_parts} parts
            </span>
            {companion.estimated_read_time_minutes && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {companion.estimated_read_time_minutes} min
              </span>
            )}
            {partsCompleted > 0 && !isComplete && (
              <span className="text-[10px] font-medium" style={{ color: companion.theme_primary }}>
                {partsCompleted}/{companion.total_parts} read
              </span>
            )}
          </div>
          {companion.notable_for && companion.notable_for.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {companion.notable_for.slice(0, 2).map((tag, i) => (
                <span key={i} className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  )
}
