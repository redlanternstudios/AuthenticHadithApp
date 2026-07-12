"use client"

import type React from "react"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { CollectionCard } from "@/components/collections/collection-card"
import { CollectionFilters } from "@/components/collections/collection-filters"

interface Collection {
  id: string
  name_en: string
  name_ar: string
  slug: string
  description_en: string | null
  total_hadiths: number
  scholar: string
  is_featured: boolean
  grade_distribution: {
    sahih: number
    hasan: number
    daif: number
  }
}

function CollectionsContent() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const carouselRef = useRef<HTMLDivElement>(null)

  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([])
  const [allCollections, setAllCollections] = useState<Collection[]>([])
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([])
  const [scholars, setScholars] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollections = async () => {
      // Fetch featured collections (top 4 by hadith count)
      const { data: featured } = await supabase
        .from("collections")
        .select("*")
        .eq("is_featured", true)
        .order("total_hadiths", { ascending: false })
        .limit(4)

      // Fetch all collections
      const { data: all } = await supabase.from("collections").select("*").eq("is_featured", true).order("name_en", { ascending: true })

      if (featured) setFeaturedCollections(featured)
      if (all) {
        setAllCollections(all)
        setFilteredCollections(all)
        // Extract unique scholars
        const uniqueScholars = [...new Set(all.map((c) => c.scholar))]
        setScholars(uniqueScholars)
      }
      setLoading(false)
    }

    fetchCollections()
  }, [supabase])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=collections`)
    }
  }

  const handleFiltersChange = (filters: { grades: string[]; scholars: string[]; sort: string }) => {
    let filtered = [...allCollections]

    // Filter by grades
    if (filters.grades.length > 0) {
      filtered = filtered.filter((c) => {
        return filters.grades.some((grade) => {
          const gradeCount = c.grade_distribution?.[grade as keyof typeof c.grade_distribution] || 0
          return gradeCount > 0
        })
      })
    }

    // Filter by scholars
    if (filters.scholars.length > 0) {
      filtered = filtered.filter((c) => filters.scholars.includes(c.scholar))
    }

    // Sort
    if (filters.sort === "count") {
      filtered.sort((a, b) => b.total_hadiths - a.total_hadiths)
    } else if (filters.sort === "grade") {
      filtered.sort((a, b) => (b.grade_distribution?.sahih || 0) - (a.grade_distribution?.sahih || 0))
    } else {
      filtered.sort((a, b) => a.name_en.localeCompare(b.name_en))
    }

    setFilteredCollections(filtered)
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/home")}
            className="md:hidden w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image
                src="/images/gemini-generated-image-xw5svjxw5svjxw5s.jpeg"
                alt="Authentic Hadith"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Collections</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" className="text-[#C5A059]" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "Cinzel, serif" }}>
            Islamic Literature Collections
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            Explore authentic hadiths organized by classical scholarship
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections, books, or topics..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-border bg-card text-sm focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </form>
        </div>
      </section>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <section className="py-6 md:py-8 border-b border-border" aria-label="Featured Collections">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Featured Collections</h3>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scrollCarousel("left")}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop: 4-column grid */}
            <div className="hidden md:grid md:grid-cols-4 gap-4">
              {featuredCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} variant="featured" />
              ))}
            </div>

            {/* Mobile: Horizontal carousel */}
            <div
              ref={carouselRef}
              className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} variant="featured" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Filters + Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex gap-6">
          {/* Filter Sidebar (Desktop) */}
          <CollectionFilters onFiltersChange={handleFiltersChange} scholars={scholars} />

          {/* Collections Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">All Collections</h3>
              <span className="text-sm text-muted-foreground">{filteredCollections.length} collections</span>
            </div>

            {filteredCollections.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground mb-4">No collections match your filters</p>
                <button
                  onClick={() => handleFiltersChange({ grades: [], scholars: [], sort: "alphabetical" })}
                  className="px-4 py-2 rounded-lg emerald-button text-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}

export default function CollectionsIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen marble-bg flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  )
}
