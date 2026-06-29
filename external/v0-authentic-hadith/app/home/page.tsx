"use client"

import React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DailyHadithCard } from "@/components/home/daily-hadith-card"
import { AIAssistantBlock } from "@/components/home/ai-assistant-block"


import { ShareBanner } from "@/components/share-banner"
import { ReminderBanner } from "@/components/home/reminder-banner"
import { ProUpgradeCTA } from "@/components/usage-banner"
import { useQuota } from "@/hooks/use-quota"
import {
  User,
  Search,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Bookmark,
  GraduationCap,
  Bot,
  TrendingUp,
  Sun,
  Heart,
  Users,
  PenLine,
  PlayCircle,
  Crown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getCleanTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"

interface UserProfile {
  name: string
  avatar_url: string | null
  school_of_thought?: string | null
}

interface UserPreferences {
  learning_level: string
}

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

interface RecentHadith {
  id: string
  title: string
  collection: string
  viewed_at: string
}

interface ContinueReading {
  collection_name: string
  collection_slug: string
  last_hadith_id: string
  hadith_number: number
  total_hadiths: number
  progress_percent: number
}

interface FeaturedCollection {
  id: string
  name_en: string
  name_ar: string
  slug: string
  total_hadiths: number
  is_featured: boolean
  grade_distribution: {
    sahih: number
    hasan: number
    daif: number
  }
}

export default function HomePage() {
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)
  const { quota } = useQuota()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentHadith[]>([])
  const [featuredCollections, setFeaturedCollections] = useState<FeaturedCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [savedCount, setSavedCount] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [continueReading, setContinueReading] = useState<ContinueReading[]>([])
  const [totalReadCount, setTotalReadCount] = useState(0)
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null)
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        if (user) {
          // Fetch profile + preferences in parallel
          const [{ data: profileData }, { data: prefsData }] = await Promise.all([
            supabase
              .from("profiles")
              .select("name, avatar_url, school_of_thought")
              .eq("user_id", user.id)
              .single(),
            supabase
              .from("user_preferences")
              .select("learning_level")
              .eq("user_id", user.id)
              .single(),
          ])
          if (profileData) setProfile(profileData)
          if (prefsData) setUserPrefs(prefsData)

          // Fetch daily hadith from API
          try {
            const dailyRes = await fetch("/api/daily-hadith")
            const dailyData = await dailyRes.json()
            if (dailyData.hadith) {
              const hadithData = dailyData.hadith
              const { data: savedData } = await supabase
                .from("saved_hadiths")
                .select("id")
                .eq("user_id", user.id)
                .eq("hadith_id", hadithData.id)
                .maybeSingle()
              setDailyHadith({ ...hadithData, is_saved: !!savedData })
            }
          } catch (e) {
            // Daily hadith fetch failed silently
          }

          // Fetch recently viewed
          const { data: recentData } = await supabase
            .from("hadith_views")
            .select(`viewed_at, hadiths (id, english_translation, collection)`)
            .eq("user_id", user.id)
            .order("viewed_at", { ascending: false })
            .limit(5)
          if (recentData) {
            setRecentlyViewed(
              recentData
                .filter((item: any) => item.hadiths)
                .map((item: any) => ({
                  id: item.hadiths.id,
                  title: getCleanTranslation(item.hadiths.english_translation).substring(0, 60) + "...",
                  collection: getCollectionDisplayName(item.hadiths.collection),
                  viewed_at: item.viewed_at,
                })),
            )
          }

          // Fetch saved count
          const { count } = await supabase
            .from("saved_hadiths")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
          setSavedCount(count || 0)

          // Calculate streak (days with views in a row)
          const { data: viewDays } = await supabase
            .from("hadith_views")
            .select("viewed_at")
            .eq("user_id", user.id)
            .order("viewed_at", { ascending: false })
            .limit(30)
          if (viewDays && viewDays.length > 0) {
            let streak = 1
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const firstView = new Date(viewDays[0].viewed_at)
            firstView.setHours(0, 0, 0, 0)
            if (today.getTime() - firstView.getTime() <= 86400000) {
              for (let i = 1; i < viewDays.length; i++) {
                const prev = new Date(viewDays[i - 1].viewed_at)
                const curr = new Date(viewDays[i].viewed_at)
                prev.setHours(0, 0, 0, 0)
                curr.setHours(0, 0, 0, 0)
                if (prev.getTime() - curr.getTime() <= 86400000 && prev.getTime() !== curr.getTime()) {
                  streak++
                } else if (prev.getTime() !== curr.getTime()) {
                  break
                }
              }
            }
            setStreakDays(streak)
          }

          // Fetch total read count for reminder banner
          const { count: readCount } = await supabase
            .from("reading_progress")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
          setTotalReadCount(readCount || 0)

          // Fetch last active date from streaks
          const { data: streakRow } = await supabase
            .from("user_streaks")
            .select("last_active_date")
            .eq("user_id", user.id)
            .single()
          if (streakRow) setLastActiveDate(streakRow.last_active_date)

          // Fetch continue reading -- last read hadith per collection
          const { data: lastReadData } = await supabase
            .from("reading_progress")
            .select("hadith_id, collection_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50)

          if (lastReadData && lastReadData.length > 0) {
            // Group by collection, keep the latest per collection
            const byCollection = new Map<string, typeof lastReadData[0]>()
            const readCountByCollection = new Map<string, number>()
            for (const rp of lastReadData) {
              if (!rp.collection_id) continue
              readCountByCollection.set(rp.collection_id, (readCountByCollection.get(rp.collection_id) || 0) + 1)
              if (!byCollection.has(rp.collection_id)) {
                byCollection.set(rp.collection_id, rp)
              }
            }

            // Fetch collection details separately
            const collectionIds = Array.from(byCollection.keys())
            const { data: collectionsData } = await supabase
              .from("collections")
              .select("id, name_en, slug, total_hadiths")
              .in("id", collectionIds)

            const collMap = new Map<string, { name_en: string; slug: string; total_hadiths: number }>()
            if (collectionsData) {
              for (const c of collectionsData) {
                collMap.set(c.id, c)
              }
            }

            // For each latest entry, get the hadith number
            const continueItems: ContinueReading[] = []
            for (const [collId, rp] of byCollection) {
              const coll = collMap.get(collId)
              if (!coll) continue
              const { data: hData } = await supabase
                .from("hadiths")
                .select("hadith_number")
                .eq("id", rp.hadith_id)
                .single()
              continueItems.push({
                collection_name: coll.name_en,
                collection_slug: coll.slug,
                last_hadith_id: rp.hadith_id,
                hadith_number: hData?.hadith_number || 0,
                total_hadiths: coll.total_hadiths,
                progress_percent: coll.total_hadiths > 0 ? Math.round(((readCountByCollection.get(collId) || 0) / coll.total_hadiths) * 100) : 0,
              })
            }
            setContinueReading(continueItems.slice(0, 3))
          }
        }

        // Fetch featured collections (public)
        const supabase2 = getSupabaseBrowserClient()
        const { data: featured } = await supabase2
          .from("collections")
          .select("id, name_en, name_ar, slug, total_hadiths, is_featured, grade_distribution")
          .eq("is_featured", true)
          .order("total_hadiths", { ascending: false })
          .limit(4)
        if (featured) setFeaturedCollections(featured)
      } catch (err) {
        // Home fetch error
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSaveHadith = async (hadithId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      if (dailyHadith?.is_saved) {
        await supabase.from("saved_hadiths").delete().eq("user_id", user.id).eq("hadith_id", hadithId)
      } else {
        await supabase.from("saved_hadiths").insert({ user_id: user.id, hadith_id: hadithId })
      }
      setDailyHadith((prev) => (prev ? { ...prev, is_saved: !prev.is_saved } : null))
    } catch (err) {
      // Save failed
    }
  }

  const handleShareHadith = async (hadithId: string) => {
    if (navigator.share) {
      await navigator.share({
        title: "Authentic Hadith",
        text: dailyHadith?.english_translation,
        url: `${window.location.origin}/hadith/${hadithId}`,
      })
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/hadith/${hadithId}`)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === "left" ? -280 : 280,
        behavior: "smooth",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayHadith = dailyHadith || {
    id: "default",
    arabic_text: "\u0625\u0650\u0646\u0651\u064E\u0645\u064E\u0627 \u0627\u0644\u0623\u064E\u0639\u0652\u0645\u064E\u0627\u0644\u064F \u0628\u0650\u0627\u0644\u0646\u0651\u0650\u064A\u0651\u064E\u0627\u062A\u0650",
    english_translation:
      "Actions are according to intentions, and everyone will get what was intended.",
    collection: "Sahih Bukhari",
    reference: "Book 1, Hadith 1",
    grade: "sahih" as const,
    narrator: "Umar ibn al-Khattab",
    is_saved: false,
  }

  const firstName = profile?.name?.split(" ")[0] || "Scholar"
  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="home-hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" className="text-secondary" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#home-hero-pattern)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8 md:pt-10 md:pb-12">
          {/* Top bar with logo + profile */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/gemini-generated-image-xw5svjxw5svjxw5s.jpeg"
                  alt="Authentic Hadith"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <span className="text-sm font-semibold text-foreground tracking-wide hidden sm:block">
                Authentic Hadith
              </span>
            </div>
            {profile?.avatar_url ? (
              <button onClick={() => router.push("/profile")} className="relative group">
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-secondary group-hover:border-accent transition-colors"
                />
              </button>
            ) : (
              <button
                onClick={() => router.push("/profile")}
                className="w-10 h-10 rounded-full bg-background border-2 border-secondary flex items-center justify-center hover:border-accent transition-colors"
              >
                <User className="w-5 h-5 text-secondary" />
              </button>
            )}
          </div>

          {/* Greeting */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {greeting}, <span className="gold-text">{firstName}</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            {userPrefs?.learning_level === "beginner"
              ? "Start your journey through authentic hadith literature"
              : userPrefs?.learning_level === "advanced"
                ? "Deepen your study of the prophetic traditions"
                : "Continue your journey through authentic hadith literature"}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hadiths, collections, or topics..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-border bg-card text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </form>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {streakDays} day{streakDays !== 1 ? "s" : ""} streak
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border">
              <Bookmark className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-medium text-foreground">{savedCount} saved</span>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Smart Reminder Banner */}
        <section className="pt-6 md:pt-8">
          <ReminderBanner
            streakDays={streakDays}
            totalRead={totalReadCount}
            lastActiveDate={lastActiveDate}
          />
        </section>

        {/* Daily Hadith */}
        <section className="py-6 md:py-8" aria-label="Daily featured hadith">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">Hadith of the Day</h2>
          </div>
  <DailyHadithCard hadith={displayHadith} onSave={handleSaveHadith} onShare={handleShareHadith} />
  </section>

  {/* Pro CTA for free users - show more prominently if they've used features */}
  {quota && !quota.isPremium && (
    <section className="pb-4">
      {/* Show enhanced CTA if user has engaged (saved hadiths, used AI, etc.) */}
      {(quota.usage.saves > 5 || quota.usage.aiToday > 0 || savedCount > 3) ? (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] p-5">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              <pattern id="pro-cta-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" className="text-white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#pro-cta-pattern)" />
            </svg>
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#E8C77D]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white mb-0.5">{"You're growing in knowledge!"}</h3>
              <p className="text-xs text-white/80">
                Unlock unlimited AI, saves, and advanced features with Pro.
              </p>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Try Free
            </button>
          </div>
        </div>
      ) : (
        <ProUpgradeCTA />
      )}
    </section>
  )}
  
  {/* Continue Reading */}
        {continueReading.length > 0 && (
          <section className="pb-6 md:pb-8" aria-label="Continue Reading">
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Continue Reading</h2>
            </div>
            <div className="flex flex-col gap-3">
              {continueReading.map((item) => (
                <button
                  key={item.collection_slug}
                  onClick={() => router.push(`/hadith/${item.last_hadith_id}`)}
                  className="w-full premium-card rounded-xl p-4 text-left hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.collection_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hadith #{item.hadith_number} -- {item.progress_percent}% complete
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors shrink-0" />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] transition-all"
                        style={{ width: `${Math.max(item.progress_percent, 1)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-primary">{item.progress_percent}%</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="pb-6 md:pb-8" aria-label="Quick Actions">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                icon: Sun,
                label: "Today",
                desc: "Daily card",
                href: "/today",
                gradient: "from-[#C5A059] to-[#E8C77D]",
                iconColor: "text-white",
              },
              {
                icon: BookOpen,
                label: "Collections",
                desc: "8 books",
                href: "/collections",
                gradient: "from-[#1B5E43] to-[#2D7A5B]",
                iconColor: "text-white",
              },
              {
                icon: Heart,
                label: "Sunnah",
                desc: "Lived practice",
                href: "/sunnah",
                gradient: "from-[#1B5E43] to-[#4a9973]",
                iconColor: "text-white",
              },
              {
                icon: Users,
                label: "Stories",
                desc: "The Companions",
                href: "/stories",
                gradient: "from-[#8a6e3a] to-[#C5A059]",
                iconColor: "text-white",
              },
              {
                icon: GraduationCap,
                label: "Learn",
                desc: "Guided paths",
                href: "/learn",
                gradient: "from-[#1B5E43] to-[#2D7A5B]",
                iconColor: "text-white",
              },
              {
                icon: Search,
                label: "Topics",
                desc: "Browse by tag",
                href: "/topics",
                gradient: "from-[#8a6e3a] to-[#C5A059]",
                iconColor: "text-white",
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="group relative flex flex-col items-start p-4 rounded-xl premium-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
              >
                {/* Subtle background gradient on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="relative z-10">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}
                  >
                    <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                  <span className="block text-xs text-muted-foreground group-hover:text-white/70 transition-colors mt-0.5">
                    {action.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Collections Carousel */}
        {featuredCollections.length > 0 && (
          <section className="pb-6 md:pb-8 border-t border-border pt-6 md:pt-8" aria-label="Featured Collections">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Featured Collections</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollCarousel("left")}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-secondary transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredCollections.map((collection) => {
                const total =
                  (collection.grade_distribution?.sahih || 0) +
                  (collection.grade_distribution?.hasan || 0) +
                  (collection.grade_distribution?.daif || 0)
                const sahihPct = total > 0 ? Math.round(((collection.grade_distribution?.sahih || 0) / total) * 100) : 0

                return (
                  <button
                    key={collection.id}
                    onClick={() => router.push(`/collections/${collection.slug}`)}
                    className="relative flex flex-col w-[260px] md:w-[280px] h-[200px] rounded-xl premium-card overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-lg flex-shrink-0 snap-center text-left"
                  >
                    {/* Featured badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold text-white bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] z-10">
                      Featured
                    </div>

                    {/* Pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.06]">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                        <pattern
                          id={`home-pattern-${collection.id}`}
                          x="0"
                          y="0"
                          width="20"
                          height="20"
                          patternUnits="userSpaceOnUse"
                        >
                          <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" className="text-secondary" />
                        </pattern>
                        <rect width="100%" height="100%" fill={`url(#home-pattern-${collection.id})`} />
                      </svg>
                    </div>

                    <div className="relative flex flex-col flex-1 p-5">
                      <div className="w-11 h-11 rounded-lg gold-icon-bg flex items-center justify-center mb-3">
                        <BookOpen className="w-5 h-5 text-secondary" />
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-0.5 line-clamp-1">
                        {collection.name_en}
                      </h3>
                      <p className="text-sm text-secondary mb-2" dir="rtl">
                        {collection.name_ar}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {collection.total_hadiths.toLocaleString()} hadiths
                      </p>
                      <div className="mt-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416]">
                          {sahihPct}% Sahih
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* View All card */}
              <button
                onClick={() => router.push("/collections")}
                className="relative flex flex-col items-center justify-center w-[200px] h-[200px] rounded-xl border-2 border-dashed border-secondary/40 hover:border-secondary transition-all flex-shrink-0 snap-center group"
              >
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <ChevronRight className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-sm font-semibold text-secondary">View All</span>
                <span className="text-xs text-muted-foreground mt-0.5">8 collections</span>
              </button>
            </div>
          </section>
        )}

        {/* Two Column: Recently Viewed + AI Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-8">
          {/* Recently Viewed */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">Recently Viewed</h2>
            </div>
            {recentlyViewed.length === 0 ? (
              <div className="premium-card gold-border rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full gold-icon-bg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Start Exploring</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your recently viewed hadiths will appear here
                </p>
                <button
                  onClick={() => router.push("/collections")}
                  className="px-5 py-2.5 rounded-lg emerald-button text-sm"
                >
                  Browse Collections
                </button>
              </div>
            ) : (
              <div className="premium-card gold-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                  {recentlyViewed.map((hadith) => (
                    <button
                      key={hadith.id}
                      onClick={() => router.push(`/hadith/${hadith.id}`)}
                      className="w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-lg gold-icon-bg flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {hadith.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {hadith.collection} {" \u2022 "}
                          {formatDistanceToNow(new Date(hadith.viewed_at), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-secondary transition-colors shrink-0 mt-2" />
                    </button>
                  ))}
                </div>
                <div className="border-t border-border p-3">
                  <button
                    onClick={() => router.push("/search")}
                    className="w-full text-center text-sm font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center justify-center gap-1"
                  >
                    View all history
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">AI Assistant</h2>
            </div>
            <AIAssistantBlock />
          </div>

          {/* Share prompt */}
          <div className="lg:col-span-2">
            <ShareBanner variant="compact" />
          </div>
        </div>
      </main>

    </div>
  )
}
