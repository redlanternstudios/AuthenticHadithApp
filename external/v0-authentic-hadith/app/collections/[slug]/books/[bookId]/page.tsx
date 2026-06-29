"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, BookOpen } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { Breadcrumb } from "@/components/collections/breadcrumb"
import { ChapterCard } from "@/components/collections/chapter-card"
import { HadithCardCondensed } from "@/components/collections/hadith-card-condensed"

interface Book {
  id: string
  number: number
  name_en: string
  name_ar: string
  total_hadiths: number
  total_chapters: number
  collection_id: string
}

interface Collection {
  name_en: string
  slug: string
}

interface Chapter {
  id: string
  number: number
  name_en: string
  name_ar: string
  total_hadiths: number
  excerpt?: string
}

interface Hadith {
  id: string
  arabic_text: string
  english_translation: string
  grade: "sahih" | "hasan" | "daif"
  narrator: string
  hadith_number: number
  is_saved?: boolean
}

export default function BookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()
  const slug = params.slug as string
  const bookId = params.bookId as string

  const [book, setBook] = useState<Book | null>(null)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)
  const [showDirectHadiths, setShowDirectHadiths] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 20

  useEffect(() => {
    const fetchBook = async () => {
      // Fetch book details
      const { data: bookData } = await supabase.from("books").select("*").eq("id", bookId).single()

      if (bookData) {
        setBook(bookData)

        // Fetch collection
        const { data: collectionData } = await supabase
          .from("collections")
          .select("name_en, slug")
          .eq("id", bookData.collection_id)
          .single()

        if (collectionData) setCollection(collectionData)

        // Fetch chapters
        const { data: chaptersData } = await supabase
          .from("chapters")
          .select("*")
          .eq("book_id", bookId)
          .order("sort_order", { ascending: true })

        // If there's only 1 chapter (fake chapter from CDN seeding), show hadiths directly
        if (chaptersData && chaptersData.length <= 1) {
          setShowDirectHadiths(true)

          // Fetch hadiths for this book directly from the hadiths table —
          // the single source of truth, keyed by collection_slug + book_number.
          // (collection_hadiths is unused/empty; this count matches books.total_hadiths.)
          const { data: hadithsData } = await supabase
            .from("hadiths")
            .select("*")
            .eq("collection_slug", slug)
            .eq("book_number", bookData.number)
            .order("hadith_number", { ascending: true })
            .range(0, PAGE_SIZE - 1)

          if (hadithsData && hadithsData.length > 0) {
            const hadithIds = hadithsData.map((h) => h.id)

            // Check saved status
            const { data: { user } } = await supabase.auth.getUser()
            let savedHadithIds: string[] = []
            if (user) {
              const { data: savedData } = await supabase
                .from("saved_hadiths")
                .select("hadith_id")
                .eq("user_id", user.id)
                .in("hadith_id", hadithIds)
              savedHadithIds = savedData?.map((s) => s.hadith_id) || []
            }

            setHadiths(hadithsData.map((h) => ({ ...h, is_saved: savedHadithIds.includes(h.id) })) as Hadith[])
            setHasMore(hadithsData.length === PAGE_SIZE)
          }
        } else if (chaptersData) {
          // Multiple chapters -- show the chapter list as before
          const chaptersWithExcerpts = await Promise.all(
            chaptersData.map(async (chapter) => {
              const { data: hadithData } = await supabase
                .from("collection_hadiths")
                .select("hadith_id")
                .eq("chapter_id", chapter.id)
                .order("hadith_number", { ascending: true })
                .limit(1)
                .single()

              let excerpt = null
              if (hadithData) {
                const { data: hadith } = await supabase
                  .from("hadiths")
                  .select("english_translation")
                  .eq("id", hadithData.hadith_id)
                  .single()

                excerpt = hadith?.english_translation?.substring(0, 80)
              }

              return { ...chapter, excerpt }
            }),
          )

          setChapters(chaptersWithExcerpts)
        }
      }

      setLoading(false)
    }

    fetchBook()
  }, [supabase, bookId])

  const loadMoreHadiths = async () => {
    const nextPage = page + 1
    const from = (nextPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    if (!book) return
    const { data: hadithsData } = await supabase
      .from("hadiths")
      .select("*")
      .eq("collection_slug", slug)
      .eq("book_number", book.number)
      .order("hadith_number", { ascending: true })
      .range(from, to)

    if (hadithsData && hadithsData.length > 0) {
      const hadithIds = hadithsData.map((h) => h.id)
      const { data: { user } } = await supabase.auth.getUser()
      let savedHadithIds: string[] = []
      if (user) {
        const { data: savedData } = await supabase
          .from("saved_hadiths")
          .select("hadith_id")
          .eq("user_id", user.id)
          .in("hadith_id", hadithIds)
        savedHadithIds = savedData?.map((s) => s.hadith_id) || []
      }

      setHadiths((prev) => [...prev, ...(hadithsData.map((h) => ({ ...h, is_saved: savedHadithIds.includes(h.id) })) as Hadith[])])
      setHasMore(hadithsData.length === PAGE_SIZE)
    } else {
      setHasMore(false)
    }

    setPage(nextPage)
  }

  const handleSaveToggle = (hadithId: string, saved: boolean) => {
    setHadiths((prev) => prev.map((h) => (h.id === hadithId ? { ...h, is_saved: saved } : h)))
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!book || !collection) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Book not found</p>
          <button onClick={() => router.push("/collections")} className="mt-4 px-4 py-2 rounded-lg gold-button">
            Browse Collections
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-muted/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push(`/collections/${slug}`)}
              className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <h1 className="text-lg font-semibold text-foreground truncate">Book {book.number}</h1>
            </div>
          </div>
          <Breadcrumb
            items={[
              { label: "Collections", href: "/collections" },
              { label: collection.name_en, href: `/collections/${slug}` },
              { label: `Book ${book.number}` },
            ]}
          />
        </div>
      </header>

      {/* Book Header */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <span className="text-sm font-bold text-[#C5A059] uppercase tracking-wider mb-2 block">
            Book {book.number}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "Cinzel, serif" }}>
            {book.name_en}
          </h1>
          <p className="text-lg text-[#C5A059] mb-4 font-arabic" dir="rtl">
            {book.name_ar}
          </p>
          <p className="text-sm text-muted-foreground">
            {book.total_hadiths} Hadiths{!showDirectHadiths && ` • ${book.total_chapters || chapters.length} Chapters`}
          </p>
        </div>
      </section>

      {/* Content: either hadiths directly or chapters list */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {showDirectHadiths ? (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Hadiths
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({book.total_hadiths} total)
              </span>
            </h2>

            {hadiths.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground">No hadiths available yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {hadiths.map((hadith, index) => (
                  <HadithCardCondensed
                    key={hadith.id}
                    hadith={hadith}
                    referenceNumber={index + 1}
                    collectionName={collection.name_en}
                    isSaved={hadith.is_saved}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}

                {hasMore && (
                  <button
                    onClick={loadMoreHadiths}
                    className="w-full py-3 rounded-xl border border-[#C5A059] text-[#C5A059] font-semibold text-sm hover:bg-[#C5A059]/5 transition-colors"
                  >
                    Load More Hadiths
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">Chapters</h2>

            {chapters.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground">No chapters available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.map((chapter) => (
                  <ChapterCard key={chapter.id} chapter={chapter} collectionSlug={slug} bookId={bookId} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

    </div>
  )
}
