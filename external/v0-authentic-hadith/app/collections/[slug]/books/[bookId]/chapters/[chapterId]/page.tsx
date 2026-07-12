"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, BookOpen } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { Breadcrumb } from "@/components/collections/breadcrumb"
import { HadithCardCondensed } from "@/components/collections/hadith-card-condensed"

interface Chapter {
  id: string
  number: number
  name_en: string
  name_ar: string
  total_hadiths: number
  book_id: string
}

interface Book {
  id: string
  number: number
  name_en: string
  collection_id: string
}

interface Collection {
  name_en: string
  slug: string
}

interface Hadith {
  id: string
  arabic_text: string
  english_translation: string
  grade: "sahih" | "hasan" | "daif"
  narrator: string
  hadith_number: number
  is_saved?: boolean
  summary_line?: string
  key_teaching_en?: string
  category?: { slug: string; name_en: string } | null
  tags?: Array<{ slug: string; name_en: string }>
}

export default function ChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()
  const slug = params.slug as string
  const bookId = params.bookId as string
  const chapterId = params.chapterId as string

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChapter = async () => {
      // Fetch chapter details
      const { data: chapterData } = await supabase.from("chapters").select("*").eq("id", chapterId).single()

      if (chapterData) {
        setChapter(chapterData)

        // Fetch book
        const { data: bookData } = await supabase
          .from("books")
          .select("id, number, name_en, collection_id")
          .eq("id", chapterData.book_id)
          .single()

        if (bookData) {
          setBook(bookData)

          // Fetch collection
          const { data: collectionData } = await supabase
            .from("collections")
            .select("name_en, slug")
            .eq("id", bookData.collection_id)
            .single()

          if (collectionData) setCollection(collectionData)
        }

        // Fetch hadiths in this chapter
        const { data: collectionHadiths } = await supabase
          .from("collection_hadiths")
          .select("hadith_id, hadith_number")
          .eq("chapter_id", chapterId)
          .order("hadith_number", { ascending: true })

        if (collectionHadiths && collectionHadiths.length > 0) {
          const hadithIds = collectionHadiths.map((ch) => ch.hadith_id)

          const { data: hadithsData } = await supabase.from("hadiths").select("*").in("id", hadithIds)

          if (hadithsData) {
            // Check which hadiths are saved by the user
            const {
              data: { user },
            } = await supabase.auth.getUser()
            let savedHadithIds: string[] = []

            if (user) {
              const { data: savedData } = await supabase
                .from("saved_hadiths")
                .select("hadith_id")
                .eq("user_id", user.id)
                .in("hadith_id", hadithIds)

              savedHadithIds = savedData?.map((s) => s.hadith_id) || []
            }

            // Batch-fetch enrichment data for all hadiths
            const { data: enrichments } = await supabase
              .from("hadith_enrichment")
              .select("hadith_id, summary_line, key_teaching_en, category_id, category:categories!category_id(slug, name_en)")
              .in("hadith_id", hadithIds)
              .eq("status", "published")

            const { data: allTags } = await supabase
              .from("hadith_tags")
              .select("hadith_id, tag:tags!tag_id(slug, name_en)")
              .in("hadith_id", hadithIds)
              .eq("status", "published")

            // Build enrichment lookup maps
            const enrichmentMap = new Map<string, { summary_line: string | null; key_teaching_en: string | null; category: { slug: string; name_en: string } | null }>()
            for (const e of enrichments || []) {
              enrichmentMap.set(e.hadith_id, {
                summary_line: e.summary_line,
                key_teaching_en: e.key_teaching_en,
                category: e.category as { slug: string; name_en: string } | null,
              })
            }

            const tagsMap = new Map<string, Array<{ slug: string; name_en: string }>>()
            for (const t of allTags || []) {
              const tag = t.tag as { slug: string; name_en: string } | null
              if (!tag) continue
              const existing = tagsMap.get(t.hadith_id) || []
              existing.push(tag)
              tagsMap.set(t.hadith_id, existing)
            }

            // Merge hadith data with hadith_number, saved status, and enrichment
            const mergedHadiths = collectionHadiths
              .map((ch) => {
                const hadith = hadithsData.find((h) => h.id === ch.hadith_id)
                if (!hadith) return null
                const enrichment = enrichmentMap.get(hadith.id)
                return {
                  ...hadith,
                  hadith_number: ch.hadith_number,
                  is_saved: savedHadithIds.includes(hadith.id),
                  summary_line: enrichment?.summary_line || undefined,
                  key_teaching_en: enrichment?.key_teaching_en || undefined,
                  category: enrichment?.category || undefined,
                  tags: tagsMap.get(hadith.id) || undefined,
                }
              })
              .filter(Boolean) as Hadith[]

            setHadiths(mergedHadiths)
          }
        }
      }

      setLoading(false)
    }

    fetchChapter()
  }, [supabase, chapterId])

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

  if (!chapter || !book || !collection) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Chapter not found</p>
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
              onClick={() => router.push(`/collections/${slug}/books/${bookId}`)}
              className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <h1 className="text-lg font-semibold text-foreground truncate">Chapter {chapter.number}</h1>
            </div>
          </div>
          <Breadcrumb
            items={[
              { label: "Collections", href: "/collections" },
              { label: collection.name_en, href: `/collections/${slug}` },
              { label: `Book ${book.number}`, href: `/collections/${slug}/books/${bookId}` },
              { label: `Chapter ${chapter.number}` },
            ]}
          />
        </div>
      </header>

      {/* Chapter Header */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <span className="text-sm font-bold text-[#1B5E43] uppercase tracking-wider mb-2 block">
            Chapter {chapter.number}
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "Cinzel, serif" }}>
            {chapter.name_en}
          </h1>
          <p className="text-lg text-[#C5A059] mb-4 font-arabic" dir="rtl">
            {chapter.name_ar}
          </p>
          <p className="text-sm text-muted-foreground">
            {chapter.total_hadiths || hadiths.length} Hadiths in this chapter
          </p>
        </div>
      </section>

      {/* Hadiths List */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
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
          </div>
        )}
      </section>

    </div>
  )
}
