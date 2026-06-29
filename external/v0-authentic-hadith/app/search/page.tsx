"use client"

import React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ChevronLeft, BookOpen, Hash, FolderOpen, Bookmark, Share2, Sparkles, Crown } from "lucide-react"

import { getCleanTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"
import { useSubscription } from "@/hooks/use-subscription"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const suggestedTerms = ["intentions", "faith", "Muslim", "Quran", "believes", "modesty", "Paradise", "prayer"]

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()
  const { isPremium } = useSubscription()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const handleSave = async (e: React.MouseEvent, hadithId: string) => {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (savedIds.has(hadithId)) {
      await supabase.from("saved_hadiths").delete().eq("user_id", user.id).eq("hadith_id", hadithId)
      setSavedIds((prev) => { const next = new Set(prev); next.delete(hadithId); return next })
    } else {
      await supabase.from("saved_hadiths").insert({ user_id: user.id, hadith_id: hadithId })
      setSavedIds((prev) => new Set(prev).add(hadithId))
    }
  }

  const handleShare = async (e: React.MouseEvent, hadith: any) => {
    e.stopPropagation()
    const url = `${window.location.origin}/hadith/${hadith.id}`
    const text = getCleanTranslation(hadith.english_translation).substring(0, 200)

    if (navigator.share) {
      await navigator.share({ title: `Hadith #${hadith.hadith_number}`, text: text + "...", url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  // Debounce the query with proper cleanup
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const { data, isLoading } = useSWR(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
  )

  const results = data?.results || []
  const facets: Array<{ slug: string; name_en: string; count: number }> = data?.facets || []
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filteredResults = activeTag
    ? results.filter((h: any) => h.tags?.some((t: any) => t.slug === activeTag))
    : results

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-full bg-card border-2 border-[#C5A059]">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search hadiths..."
              className="flex-1 bg-transparent outline-none text-foreground"
              autoFocus
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 w-32 rounded bg-[#e5e7eb] animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-4 premium-card border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 rounded bg-[#e5e7eb] animate-pulse" />
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <div className="h-8 w-16 rounded-lg bg-muted animate-pulse" />
                  <div className="h-8 w-16 rounded-lg bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}{activeTag ? ` for #${activeTag}` : ""}
              </p>
              {!isPremium && (
                <button
                  onClick={() => router.push("/pricing")}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 transition-colors"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade for AI Search
                </button>
              )}
            </div>
            {/* Tag facets */}
            {facets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {activeTag && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear filter
                  </button>
                )}
                {facets.map((facet) => (
                  <button
                    key={facet.slug}
                    onClick={() => setActiveTag(activeTag === facet.slug ? null : facet.slug)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      activeTag === facet.slug
                        ? "bg-[#C5A059] text-white"
                        : "bg-[#C5A059]/10 text-[#8A6E3A] hover:bg-[#C5A059]/20"
                    )}
                  >
                    <Hash className="w-3 h-3" />
                    {facet.name_en}
                    <span className="opacity-60">({facet.count})</span>
                  </button>
                ))}
              </div>
            )}
            {filteredResults.map((hadith: any) => (
              <div
                key={hadith.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/hadith/${hadith.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/hadith/${hadith.id}`)}
                className="w-full gold-border rounded-xl p-4 premium-card text-left hover:-translate-y-0.5 transition-transform cursor-pointer"
              >
                {/* Summary line */}
                {hadith.summary_line && (
                  <p className="text-xs font-semibold text-[#C5A059] mb-2">{hadith.summary_line}</p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-bold text-white bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]">
                    {getCollectionDisplayName(hadith.collection)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Book {hadith.book_number} / Hadith {hadith.hadith_number}
                  </span>
                  {hadith.grade && (
                    <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-[#C5A059]/10 text-[#C5A059]">
                      {hadith.grade}
                    </span>
                  )}
                </div>
                {hadith.narrator && (
                  <p className="text-xs text-muted-foreground mb-1">Narrated by: {hadith.narrator}</p>
                )}
                <p className="text-sm text-foreground line-clamp-4 leading-relaxed">{getCleanTranslation(hadith.english_translation)}</p>
                {/* Enrichment tags */}
                {(hadith.tags?.length > 0 || hadith.category) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {hadith.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1B5E43]/10 text-[#1B5E43] text-[11px] font-medium whitespace-nowrap">
                        <FolderOpen className="w-2.5 h-2.5 shrink-0" />
                        {hadith.category.name_en}
                      </span>
                    )}
                    {hadith.tags?.map((tag: { slug: string; name_en: string }) => (
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
                {/* Save / Share actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={(e) => handleSave(e, hadith.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      savedIds.has(hadith.id)
                        ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                        : "border border-border text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059]",
                    )}
                  >
                    <Bookmark className={cn("w-3.5 h-3.5", savedIds.has(hadith.id) && "fill-current")} />
                    {savedIds.has(hadith.id) ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={(e) => handleShare(e, hadith)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059] transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : debouncedQuery.length > 1 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">No hadiths found for &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="text-sm text-muted-foreground/60">Try searching for: {suggestedTerms.join(", ")}</p>
            
            {/* Pro upsell when no results */}
            {!isPremium && (
              <button
                onClick={() => router.push("/pricing")}
                className="mt-6 mx-auto flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C5A059]/10 to-[#E8C77D]/10 border border-[#C5A059]/30 hover:border-[#C5A059]/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#E8C77D] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Try Advanced Search</p>
                  <p className="text-xs text-muted-foreground">Semantic search & synonym expansion</p>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-6">Enter a search term to find hadiths</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {suggestedTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQueryChange(term)}
                  className="px-3 py-1.5 rounded-full text-sm border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen marble-bg flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
