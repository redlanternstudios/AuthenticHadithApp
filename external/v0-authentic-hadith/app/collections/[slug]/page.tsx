"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Bookmark, Share2, BookOpen } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { Breadcrumb } from "@/components/collections/breadcrumb"
import { BookCard } from "@/components/collections/book-card"
import { cn } from "@/lib/utils"

interface Collection {
  id: string
  name_en: string
  name_ar: string
  slug: string
  description_en: string | null
  total_hadiths: number
  total_books: number
  scholar: string
  scholar_dates: string | null
  grade_distribution: {
    sahih: number
    hasan: number
    daif: number
  }
}

interface Book {
  id: string
  number: number
  name_en: string
  name_ar: string
  total_hadiths: number
  total_chapters: number
  first_chapter?: string
}

export default function CollectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()
  const slug = params.slug as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [topics, setTopics] = useState<{ name_en: string; count: number }[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const fetchCollection = async () => {
      // Fetch collection details
      const { data: collectionData, error: collError } = await supabase.from("collections").select("*").eq("slug", slug).single()

      if (collectionData) {
        setCollection(collectionData)

        // Fetch books for this collection
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .eq("collection_id", collectionData.id)
          .order("sort_order", { ascending: true })
          .limit(12)

        if (booksData) {
          // Get first chapter for each book
          const booksWithChapters = await Promise.all(
            booksData.map(async (book) => {
              const { data: chapter } = await supabase
                .from("chapters")
                .select("name_en")
                .eq("book_id", book.id)
                .order("sort_order", { ascending: true })
                .limit(1)
                .single()

              return {
                ...book,
                first_chapter: chapter?.name_en || null,
              }
            }),
          )
          setBooks(booksWithChapters)
          setHasMore(booksData.length === 12)
        }

        // Check if user has saved this collection
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: savedData } = await supabase
            .from("saved_collections")
            .select("id")
            .eq("user_id", user.id)
            .eq("collection_id", collectionData.id)
            .single()

          setIsSaved(!!savedData)
        }
      }

      setLoading(false)
    }

    fetchCollection()
  }, [supabase, slug])

  const loadMoreBooks = async () => {
    if (!collection || loadingMore) return

    setLoadingMore(true)
    const newOffset = offset + 12

    const { data: moreBooks } = await supabase
      .from("books")
      .select("*")
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true })
      .range(newOffset, newOffset + 11)

    if (moreBooks) {
      const booksWithChapters = await Promise.all(
        moreBooks.map(async (book) => {
          const { data: chapter } = await supabase
            .from("chapters")
            .select("name_en")
            .eq("book_id", book.id)
            .order("sort_order", { ascending: true })
            .limit(1)
            .single()

          return {
            ...book,
            first_chapter: chapter?.name_en || null,
          }
        }),
      )

      setBooks((prev) => [...prev, ...booksWithChapters])
      setOffset(newOffset)
      setHasMore(moreBooks.length === 12)
    }

    setLoadingMore(false)
  }

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !collection) {
      router.push("/")
      return
    }

    if (isSaved) {
      await supabase.from("saved_collections").delete().eq("user_id", user.id).eq("collection_id", collection.id)
    } else {
      await supabase.from("saved_collections").insert({ user_id: user.id, collection_id: collection.id })
    }
    setIsSaved(!isSaved)
  }

  const handleShare = async () => {
    if (!collection) return
    const url = window.location.href

    if (navigator.share) {
      await navigator.share({
        title: collection.name_en,
        text: `Explore ${collection.total_hadiths.toLocaleString()} authentic hadiths from ${collection.name_en}`,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Collection not found</p>
          <button onClick={() => router.push("/collections")} className="mt-4 px-4 py-2 rounded-lg gold-button">
            Browse Collections
          </button>
        </div>
      </div>
    )
  }

  const totalGraded =
    (collection.grade_distribution?.sahih || 0) +
    (collection.grade_distribution?.hasan || 0) +
    (collection.grade_distribution?.daif || 0)

  const sahihPercent =
    totalGraded > 0 ? Math.round(((collection.grade_distribution?.sahih || 0) / totalGraded) * 100) : 0
  const hasanPercent =
    totalGraded > 0 ? Math.round(((collection.grade_distribution?.hasan || 0) / totalGraded) * 100) : 0
  const daifPercent = 100 - sahihPercent - hasanPercent

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push("/collections")}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <h1 className="text-lg font-semibold text-foreground truncate">{collection.name_en}</h1>
            </div>
          </div>
          <Breadcrumb items={[{ label: "Collections", href: "/collections" }, { label: collection.name_en }]} />
        </div>
      </header>

      {/* Collection Header */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Gold gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#C5A059]/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl gold-icon-bg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-[#C5A059]" />
            </div>

            <div className="flex-1">
              {/* Names */}
              <h1
                className="text-2xl md:text-3xl font-bold text-foreground mb-1"
                style={{ fontFamily: "Cinzel, serif" }}
              >
                {collection.name_en}
              </h1>
              <p className="text-lg md:text-xl text-[#C5A059] mb-3 font-arabic" dir="rtl">
                {collection.name_ar}
              </p>

              {/* Scholar Info */}
              <p className="text-sm text-muted-foreground mb-4">
                Compiled by {collection.scholar}
                {collection.scholar_dates && ` (${collection.scholar_dates})`}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground mb-4">
                <span>{collection.total_hadiths.toLocaleString()} Hadiths</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{collection.total_books || books.length} Books</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416]">
                  {sahihPercent}% Sahih
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isSaved
                      ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416]"
                      : "border-2 border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10",
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                  {isSaved ? "Saved" : "Save Collection"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-border text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059] transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Grade Distribution */}
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm font-medium text-foreground">Grade Distribution</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <div
                className="bg-gradient-to-r from-[#C5A059] to-[#E8C77D] transition-all"
                style={{ width: `${sahihPercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] transition-all"
                style={{ width: `${hasanPercent}%` }}
              />
              <div className="bg-muted-foreground/30 transition-all" style={{ width: `${daifPercent}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>
                Sahih: {sahihPercent}% ({(collection.grade_distribution?.sahih || 0).toLocaleString()})
              </span>
              <span>
                Hasan: {hasanPercent}% ({(collection.grade_distribution?.hasan || 0).toLocaleString()})
              </span>
              <span>
                Da'if: {daifPercent}% ({(collection.grade_distribution?.daif || 0).toLocaleString()})
              </span>
            </div>
          </div>

          {/* Popular Topics - Horizontal scrollable chips */}
          {topics.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none" }}>
              {topics.map((topic) => (
                <button
                  key={topic.name_en}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-[#1B5E43] text-[#1B5E43] hover:bg-[#1B5E43] hover:text-white transition-colors"
                >
                  {topic.name_en}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Books List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <h2 className="text-lg font-bold text-foreground mb-4">Books ({collection.total_books || books.length})</h2>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">No books available yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} collectionSlug={slug} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreBooks}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-xl border-2 border-[#C5A059] text-[#C5A059] font-medium hover:bg-[#C5A059]/10 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Books"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  )
}
