"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  GraduationCap,
  Trophy,
  Sparkles,
  Users,
  Lock,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useSubscription } from "@/hooks/use-subscription"
import { PremiumGate } from "@/components/premium-gate"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Star,
  GraduationCap,
  Trophy,
  Sparkles,
  Users,
}

const COLOR_MAP: Record<string, { color: string; bg: string; border: string }> = {
  emerald: { color: "text-[#1B5E43]", bg: "bg-[#1B5E43]/10", border: "border-[#1B5E43]/30" },
  amber: { color: "text-[#C5A059]", bg: "bg-[#C5A059]/10", border: "border-[#C5A059]/30" },
  blue: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  purple: { color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/10", border: "border-[#7c3aed]/30" },
  rose: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  slate: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
}

interface LearningPath {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  icon_name: string
  level: string
  sort_order: number
  is_premium: boolean
  total_modules: number
  total_lessons: number
  estimated_hours: number
  color: string
}

interface LearningModule {
  id: string
  path_id: string
  slug: string
  title: string
  description: string
  sort_order: number
}

interface LearningLesson {
  id: string
  module_id: string
  slug: string
  title: string
  description: string
  collection_slug: string
  book_number: number | null
  sort_order: number
  estimated_minutes: number
  has_quiz: boolean
  content_markdown: string | null
}

interface LessonProgress {
  lesson_id: string
  status: string
  completed_at: string | null
  quiz_passed: boolean
}

export default function LearnPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { isPremium } = useSubscription()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [modules, setModules] = useState<LearningModule[]>([])
  const [lessons, setLessons] = useState<LearningLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPath, setExpandedPath] = useState<string | null>(null)
  const [bookIdMap, setBookIdMap] = useState<Record<string, string>>({})
  const [progressMap, setProgressMap] = useState<Map<string, LessonProgress>>(new Map())
  const [userLevel, setUserLevel] = useState<string>("intermediate")

  useEffect(() => {
    async function loadData() {
      const [pathsRes, modulesRes, lessonsRes, booksRes, collectionsRes] = await Promise.all([
        supabase.from("learning_paths").select("*").order("sort_order"),
        supabase.from("learning_modules").select("*").order("sort_order"),
        supabase.from("learning_lessons").select("*").order("sort_order"),
        supabase.from("books").select("id, number, collection_id"),
        supabase.from("collections").select("id, slug"),
      ])

      // Build book ID map for deep-linking
      if (booksRes.data && collectionsRes.data) {
        const collSlugMap = new Map<string, string>()
        for (const c of collectionsRes.data) {
          collSlugMap.set(c.id, c.slug)
        }
        const map: Record<string, string> = {}
        for (const b of booksRes.data) {
          const collSlug = collSlugMap.get(b.collection_id)
          if (collSlug) map[`${collSlug}:${b.number}`] = b.id
        }
        setBookIdMap(map)
      }

      setModules(modulesRes.data || [])
      setLessons(lessonsRes.data || [])

      // Fetch user progress + preferences
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [progressRes, prefsRes] = await Promise.all([
          supabase
            .from("learning_progress")
            .select("lesson_id, status, completed_at, quiz_passed")
            .eq("user_id", user.id),
          supabase
            .from("user_preferences")
            .select("learning_level")
            .eq("user_id", user.id)
            .single(),
        ])

        if (progressRes.data) {
          const pMap = new Map<string, LessonProgress>()
          for (const p of progressRes.data) {
            pMap.set(p.lesson_id, p)
          }
          setProgressMap(pMap)
        }

        const level = prefsRes.data?.learning_level || "intermediate"
        setUserLevel(level)

        // Sort paths: user's level first, then others, preserving sort_order within each group
        const allPaths = pathsRes.data || []
        const LEVEL_ORDER = ["beginner", "intermediate", "advanced"]
        const levelIdx = LEVEL_ORDER.indexOf(level)
        const sorted = [...allPaths].sort((a, b) => {
          const aMatch = a.level === level ? 0 : 1
          const bMatch = b.level === level ? 0 : 1
          if (aMatch !== bMatch) return aMatch - bMatch
          // Within same group, sort by proximity to user level then sort_order
          const aLevelDist = Math.abs(LEVEL_ORDER.indexOf(a.level) - levelIdx)
          const bLevelDist = Math.abs(LEVEL_ORDER.indexOf(b.level) - levelIdx)
          if (aLevelDist !== bLevelDist) return aLevelDist - bLevelDist
          return a.sort_order - b.sort_order
        })
        setPaths(sorted)

        // Auto-expand first matching-level path
        const firstMatch = sorted.find((p) => p.level === level) || sorted[0]
        if (firstMatch) setExpandedPath(firstMatch.id)
      } else {
        setPaths(pathsRes.data || [])
        if (pathsRes.data && pathsRes.data.length > 0) {
          setExpandedPath(pathsRes.data[0].id)
        }
      }

      setLoading(false)
    }
    loadData()
  }, [supabase])

  const getModulesForPath = (pathId: string) =>
    modules.filter((m) => m.path_id === pathId).sort((a, b) => a.sort_order - b.sort_order)

  const getLessonsForModule = (moduleId: string) =>
    lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.sort_order - b.sort_order)

  const getTotalLessons = (pathId: string) => {
    const pathModules = getModulesForPath(pathId)
    return pathModules.reduce((sum, m) => sum + getLessonsForModule(m.id).length, 0)
  }

  const getCompletedLessons = (pathId: string) => {
    const pathModules = getModulesForPath(pathId)
    let completed = 0
    for (const mod of pathModules) {
      for (const lesson of getLessonsForModule(mod.id)) {
        const p = progressMap.get(lesson.id)
        if (p?.status === "completed") completed++
      }
    }
    return completed
  }

  const getModuleCompletedCount = (moduleId: string) => {
    const modLessons = getLessonsForModule(moduleId)
    return modLessons.filter((l) => progressMap.get(l.id)?.status === "completed").length
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Learning Paths</h1>
            <p className="text-xs text-muted-foreground">
              Personalized for <span className="capitalize font-medium text-[#C5A059]">{userLevel}</span> level
            </p>
          </div>
        </div>
      </header>

      {/* Intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Follow a structured path through the hadith collections. Each path is organized into modules and
          lessons, drawing from authentic narrations across multiple collections.
        </p>
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#1B5E43]/10 text-[#1B5E43] text-xs font-medium">
            {paths.length} learning paths
          </div>
          <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] text-xs font-medium">
            {modules.length} modules
          </div>
          <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
            {lessons.length} lessons
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {paths.map((path) => {
          const isExpanded = expandedPath === path.id
          const Icon = ICON_MAP[path.icon_name] || BookOpen
          const colors = COLOR_MAP[path.color] || COLOR_MAP.emerald
          const pathModules = getModulesForPath(path.id)
          const lessonCount = getTotalLessons(path.id)
          const completedCount = getCompletedLessons(path.id)
          const progressPercent = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0

          return (
            <div
              key={path.id}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                isExpanded ? colors.border + " shadow-md" : "border-border",
              )}
            >
              {/* Path Header */}
              <button
                onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                className="w-full p-4 flex items-start gap-4 text-left premium-card"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colors.bg)}>
                  <Icon className={cn("w-6 h-6", colors.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", colors.color)}>
                      {path.subtitle}
                    </span>
                    {path.level === userLevel && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1B5E43]/10 text-[10px] font-medium text-[#1B5E43]">
                        <Star className="w-2.5 h-2.5" /> For you
                      </span>
                    )}
                    {path.is_premium && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#C5A059]/10 text-[10px] font-medium text-[#C5A059]">
                        <Lock className="w-2.5 h-2.5" /> Premium
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground truncate">{path.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {lessonCount || path.total_lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {path.estimated_hours}h
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium capitalize">
                      {path.level}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {completedCount > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1B5E43] transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[#1B5E43]">
                        {completedCount}/{lessonCount}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight
                  className={cn(
                    "w-5 h-5 text-muted-foreground shrink-0 transition-transform mt-1",
                    isExpanded && "rotate-90",
                  )}
                />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-xs text-muted-foreground py-3 leading-relaxed">{path.description}</p>

                  {path.is_premium && !isPremium ? (
                    <PremiumGate featureName={path.title} />
                  ) : pathModules.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Modules coming soon</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {pathModules.map((mod, modIdx) => {
                        const modLessons = getLessonsForModule(mod.id)
                        return (
                          <div key={mod.id} className="rounded-lg border border-border overflow-hidden">
                            {/* Module Header */}
                            <div className="px-3 py-2.5 bg-muted/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Module {modIdx + 1}
                                </span>
                                {getModuleCompletedCount(mod.id) > 0 && (
                                  <span className="text-[10px] font-medium text-[#1B5E43]">
                                    {getModuleCompletedCount(mod.id)}/{modLessons.length} done
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-foreground mt-0.5">{mod.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                            </div>

                            {/* Lessons */}
                            {modLessons.length > 0 ? (
                              <div className="divide-y divide-border/50">
                                {modLessons.map((lesson) => {
                                  const lessonProgress = progressMap.get(lesson.id)
                                  const isLessonDone = lessonProgress?.status === "completed"
                                  const hasContent = !!lesson.content_markdown

                                  return (
                                    <button
                                      key={lesson.id}
                                      onClick={() => {
                                        // If lesson has markdown content, go to lesson page
                                        if (hasContent) {
                                          router.push(`/learn/lesson/${lesson.id}`)
                                        } else if (lesson.book_number && lesson.collection_slug) {
                                          const bookId = bookIdMap[`${lesson.collection_slug}:${lesson.book_number}`]
                                          if (bookId) {
                                            router.push(`/collections/${lesson.collection_slug}/books/${bookId}`)
                                          } else {
                                            router.push(`/collections/${lesson.collection_slug}`)
                                          }
                                        } else if (lesson.collection_slug) {
                                          router.push(`/collections/${lesson.collection_slug}`)
                                        }
                                      }}
                                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                                    >
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                          isLessonDone
                                            ? "bg-[#1B5E43] border-0"
                                            : "border border-border"
                                        )}
                                      >
                                        <CheckCircle2
                                          className={cn(
                                            "w-3.5 h-3.5",
                                            isLessonDone ? "text-white" : "text-muted-foreground/30"
                                          )}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={cn(
                                            "text-sm truncate",
                                            isLessonDone ? "text-muted-foreground line-through" : "text-foreground"
                                          )}
                                        >
                                          {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          {lesson.estimated_minutes > 0 && (
                                            <p className="text-[10px] text-muted-foreground">
                                              ~{lesson.estimated_minutes} min
                                            </p>
                                          )}
                                          {lesson.has_quiz && (
                                            <span className="text-[10px] text-[#C5A059]">Quiz</span>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                                Lessons coming soon
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
