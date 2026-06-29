"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { seedCollection, seedAllCollections } from "@/app/actions/seed-hadiths"
import type { SeedProgress } from "@/lib/seed-progress"
import { COLLECTION_MAPPING, ALL_COLLECTION_SLUGS } from "@/lib/hadith-cdn-mapping"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  BookOpen,
  ChevronLeft,
  Database,
  Loader2,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CollectionStatus {
  slug: string
  name_en: string
  name_ar: string
  scholar: string
  currentCount: number
  bookCount: number
}

type JobPhase = "idle" | "running" | "done" | "error"

export default function SeedAllPage() {
  const [statuses, setStatuses] = useState<CollectionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [seedingSlug, setSeedingSlug] = useState<string | null>(null)
  const [seedingAll, setSeedingAll] = useState(false)
  const [progress, setProgress] = useState<Record<string, SeedProgress>>({})
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string; stats?: Record<string, unknown> }>
  >({})
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch current collection statuses from DB
  const fetchStatuses = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    const statusList: CollectionStatus[] = []
    for (const slug of ALL_COLLECTION_SLUGS) {
      const config = COLLECTION_MAPPING[slug]
      const { data: coll } = await supabase
        .from("collections")
        .select("total_hadiths, total_books")
        .eq("slug", slug)
        .single()

      statusList.push({
        slug,
        name_en: config.name_en,
        name_ar: config.name_ar,
        scholar: config.scholar,
        currentCount: coll?.total_hadiths ?? 0,
        bookCount: coll?.total_books ?? 0,
      })
    }
    setStatuses(statusList)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  // Connect to SSE for real-time progress
  const startProgressListener = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close()

    const es = new EventSource("/api/seed-progress")
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, SeedProgress>
        setProgress(data)
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  // Seed a single collection
  const handleSeedOne = async (slug: string) => {
    setSeedingSlug(slug)
    setResults((prev) => {
      const next = { ...prev }
      delete next[slug]
      return next
    })
    startProgressListener()

    const result = await seedCollection(slug)
    setResults((prev) => ({ ...prev, [slug]: result }))
    setSeedingSlug(null)
    fetchStatuses()
  }

  // Seed all collections
  const handleSeedAll = async () => {
    setSeedingAll(true)
    setResults({})
    startProgressListener()

    const result = await seedAllCollections()
    const mapped: Record<string, { success: boolean; message: string; stats?: Record<string, unknown> }> = {}
    for (const r of result.results) {
      mapped[r.collection] = {
        success: r.success,
        message: r.success ? "Completed" : r.error || "Failed",
        stats: r.stats,
      }
    }
    setResults(mapped)
    setSeedingAll(false)
    fetchStatuses()
  }

  const getPhaseForSlug = (slug: string): JobPhase => {
    if (results[slug]) return results[slug].success ? "done" : "error"
    if (progress[slug]) {
      if (progress[slug].phase === "done") return "done"
      if (progress[slug].phase === "error") return "error"
      return "running"
    }
    return "idle"
  }

  const formatElapsed = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const isAnySeedRunning = seedingSlug !== null || seedingAll

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Hadith Data Seeding</h1>
              <p className="text-xs text-muted-foreground">Fetch and seed all collections from CDN</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Seed All button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">All Collections</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {statuses.reduce((sum, s) => sum + s.currentCount, 0).toLocaleString()} total hadiths across{" "}
              {statuses.filter((s) => s.currentCount > 0).length} collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatuses}
              disabled={isAnySeedRunning}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:border-[#C5A059] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={handleSeedAll}
              disabled={isAnySeedRunning}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {seedingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding All...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Seed All Collections
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collection cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            statuses.map((status) => {
              const phase = getPhaseForSlug(status.slug)
              const prog = progress[status.slug]
              const result = results[status.slug]

              return (
                <div
                  key={status.slug}
                  className={cn(
                    "rounded-xl border bg-card p-5 transition-all",
                    phase === "running" ? "border-[#C5A059] ring-1 ring-[#C5A059]/20" : "border-border",
                    phase === "done" && "border-[#1B5E43]/40",
                    phase === "error" && "border-red-400/40",
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1B5E43]/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#1B5E43]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{status.name_en}</h3>
                        <p className="text-xs text-muted-foreground">
                          {status.scholar} -- {status.name_ar}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status badge */}
                      {phase === "idle" && status.currentCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#1B5E43]/10 text-[#1B5E43]">
                          {status.currentCount.toLocaleString()} hadiths
                        </span>
                      )}
                      {phase === "idle" && status.currentCount === 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Pending
                        </span>
                      )}
                      {phase === "running" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#C5A059]/10 text-[#C5A059] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Seeding
                        </span>
                      )}
                      {phase === "done" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </span>
                      )}
                      {phase === "error" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Error
                        </span>
                      )}

                      {/* Seed button */}
                      <button
                        onClick={() => handleSeedOne(status.slug)}
                        disabled={isAnySeedRunning}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:border-[#C5A059] hover:text-[#C5A059] transition-colors disabled:opacity-50"
                      >
                        {seedingSlug === status.slug ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Seed"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar (if running) */}
                  {prog && phase === "running" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{prog.message}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatElapsed(Date.now() - prog.startedAt)}
                        </span>
                      </div>

                      {/* Books progress */}
                      {prog.booksTotal > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Books</span>
                            <span>
                              {prog.booksProcessed} / {prog.booksTotal}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#1B5E43] transition-all"
                              style={{
                                width: `${(prog.booksProcessed / prog.booksTotal) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Hadiths progress */}
                      {prog.hadithsTotal > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Hadiths</span>
                            <span>
                              {(prog.hadithsInserted + prog.hadithsUpdated).toLocaleString()} / {prog.hadithsTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#C5A059] transition-all"
                              style={{
                                width: `${
                                  ((prog.hadithsInserted + prog.hadithsUpdated) / prog.hadithsTotal) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result info */}
                  {result && (
                    <div
                      className={cn(
                        "mt-3 p-3 rounded-lg text-xs",
                        result.success
                          ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
                      )}
                    >
                      <p className="font-medium">{result.message}</p>
                      {result.stats && (
                        <p className="mt-1 text-muted-foreground">
                          {(result.stats.inserted as number)?.toLocaleString()} inserted,{" "}
                          {(result.stats.updated as number)?.toLocaleString()} updated in{" "}
                          {formatElapsed(result.stats.timeElapsed as number)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Error list */}
                  {prog && prog.errors.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs">
                      <p className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        {prog.errors.length} warning(s)
                      </p>
                      <ul className="space-y-0.5 text-amber-700 dark:text-amber-400 max-h-32 overflow-y-auto">
                        {prog.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>-- {err}</li>
                        ))}
                        {prog.errors.length > 10 && (
                          <li>...and {prog.errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{status.bookCount} books</span>
                    <span>{status.currentCount.toLocaleString()} hadiths</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
