"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  BarChart3,
  BookOpen,
  Flame,
  TrendingUp,
  Calendar,
  ChevronRight,
  Award,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CollectionProgress {
  id: string
  name_en: string
  slug: string
  total_hadiths: number
  read_count: number
  percent: number
}

interface StreakData {
  current_streak: number
  longest_streak: number
  total_days_active: number
  last_active_date: string | null
}

interface WeekDay {
  label: string
  date: string
  active: boolean
}

export default function ProgressPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [collectionProgress, setCollectionProgress] = useState<CollectionProgress[]>([])
  const [streak, setStreak] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    total_days_active: 0,
    last_active_date: null,
  })
  const [totalRead, setTotalRead] = useState(0)
  const [totalViewed, setTotalViewed] = useState(0)
  const [weekActivity, setWeekActivity] = useState<WeekDay[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Fetch all collections
    const { data: collections } = await supabase
      .from("collections")
      .select("id, name_en, slug, total_hadiths")
      .order("name_en")

    // Fetch user's reading progress grouped by collection
    const { data: progress } = await supabase
      .from("reading_progress")
      .select("collection_id")
      .eq("user_id", user.id)

    // Fetch view count
    const { count: viewCount } = await supabase
      .from("hadith_views")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)

    // Fetch streak data
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Build collection progress
    if (collections) {
      const progressMap = new Map<string, number>()
      if (progress) {
        for (const p of progress) {
          if (p.collection_id) {
            progressMap.set(p.collection_id, (progressMap.get(p.collection_id) || 0) + 1)
          }
        }
      }

      const collProgArr = collections.map((c) => {
        const readCount = progressMap.get(c.id) || 0
        return {
          id: c.id,
          name_en: c.name_en,
          slug: c.slug,
          total_hadiths: c.total_hadiths,
          read_count: readCount,
          percent: c.total_hadiths > 0 ? Math.round((readCount / c.total_hadiths) * 100) : 0,
        }
      })

      setCollectionProgress(collProgArr.sort((a, b) => b.read_count - a.read_count))
      setTotalRead(progress?.length || 0)
    }

    setTotalViewed(viewCount || 0)

    if (streakData) {
      setStreak(streakData)
    }

    // Build week activity
    const days: WeekDay[] = []
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      days.push({
        label: dayLabels[d.getDay()],
        date: dateStr,
        active: false,
      })
    }

    // Check which days had views
    const { data: viewDays } = await supabase
      .from("hadith_views")
      .select("viewed_at")
      .eq("user_id", user.id)
      .gte("viewed_at", days[0].date)

    if (viewDays) {
      const activeDates = new Set(viewDays.map((v) => v.viewed_at?.split("T")[0]))
      for (const day of days) {
        day.active = activeDates.has(day.date)
      }
    }

    setWeekActivity(days)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Update streak on visit
  useEffect(() => {
    const updateStreak = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split("T")[0]
      const { data: existing } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!existing) {
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          total_days_active: 1,
          last_active_date: today,
        })
      } else if (existing.last_active_date !== today) {
        const lastDate = existing.last_active_date ? new Date(existing.last_active_date) : null
        const todayDate = new Date(today)
        const diffDays = lastDate ? Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000) : 999

        const newStreak = diffDays === 1 ? existing.current_streak + 1 : 1
        const newLongest = Math.max(newStreak, existing.longest_streak)

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            total_days_active: existing.total_days_active + 1,
            last_active_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
      }
    }
    updateStreak()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gold-icon-bg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Reading Progress</h1>
              <p className="text-sm text-muted-foreground">Track your hadith journey</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="premium-card gold-border rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{streak.current_streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="premium-card rounded-xl p-4 text-center">
            <Award className="w-6 h-6 text-[#1B5E43] mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{streak.longest_streak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="premium-card rounded-xl p-4 text-center">
            <BookOpen className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalRead}</p>
            <p className="text-xs text-muted-foreground">Hadiths Read</p>
          </div>
          <div className="premium-card rounded-xl p-4 text-center">
            <Eye className="w-6 h-6 text-[#1B5E43] mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalViewed}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
        </div>

        {/* Week Activity */}
        <div className="premium-card gold-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-semibold text-foreground">This Week</h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekActivity.map((day) => (
              <div key={day.date} className="text-center">
                <p className="text-[10px] text-muted-foreground mb-2">{day.label}</p>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-colors",
                    day.active
                      ? "bg-gradient-to-br from-[#C5A059] to-[#E8C77D]"
                      : "bg-muted",
                  )}
                >
                  {day.active && <Flame className="w-4 h-4 text-white" />}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {streak.total_days_active} total days active
          </p>
        </div>

        {/* Collection Progress */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C5A059]" />
              Collection Progress
            </h3>
          </div>
          <div className="space-y-3">
            {collectionProgress.map((cp) => (
              <button
                key={cp.id}
                onClick={() => router.push(`/collections/${cp.slug}`)}
                className="w-full premium-card rounded-xl p-4 text-left hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground group-hover:text-[#C5A059] transition-colors">
                    {cp.name_en}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {cp.read_count.toLocaleString()}/{cp.total_hadiths.toLocaleString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        cp.percent >= 50
                          ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D]"
                          : "bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]",
                      )}
                      style={{ width: `${Math.max(cp.percent, 1)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold min-w-[36px] text-right",
                      cp.percent >= 50 ? "text-[#C5A059]" : "text-[#1B5E43]",
                    )}
                  >
                    {cp.percent}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
