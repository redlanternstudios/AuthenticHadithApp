"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Hash, Loader2, BookOpen } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { HadithCardCondensed } from "@/components/collections/hadith-card-condensed"
import { cn } from "@/lib/utils"

const SAHIHAYN = ["sahih-bukhari", "sahih-muslim"] as const

interface Tag {
  id: string
  slug: string
  name_en: string
  hadith_count: number
}

interface EnrichedHadith {
  id: string
  arabic_text: string
  english_translation: string
  narrator: string
  grade: "sahih" | "hasan" | "daif"
  collection: string
  reference: string
  hadith_number: number
  summary_line?: string
}

export default function CategoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = getSupabaseBrowserClient()

  const [category, setCategory] = useState<{
    name_en: string
    name_ar: string | null
    description: string | null
    icon: string | null
  } | null>(null)
  const [hadiths, setHadiths] = useState<EnrichedHadith[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name_en, name_ar, description, icon")
        .eq("slug", slug)
        .single()

      if (!cat) {
        setLoading(false)
        return
      }
      setCategory(cat)

      const { data: catTags } = await supabase
        .from("tags")
        .select("id, slug, name_en")
        .eq("category_id", cat.id)
        .eq("is_active", true)

      const tagList = catTags || []
      const tagIds = tagList.map((t: { id: string }) => t.id)

      if (tagIds.length === 0) {
        setTags([])
        setHadiths([])
        setLoading(false)
        return
      }

      const { data: weights } = await supabase
        .from("hadith_tag_weights")
        .select("tag_id, hadith_id")
        .in("tag_id", tagIds)

      const tagCountMap = new Map<string, number>()
      const allHadithIds = new Set<string>()
      for (const w of weights || []) {
        tagCountMap.set(w.tag_id, (tagCountMap.get(w.tag_id) || 0) + 1)
        allHadithIds.add(w.hadith_id)
      }

      const enrichedTags: Tag[] = tagList.map((t: any) => ({
        ...t,
        hadith_count: tagCountMap.get(t.id) || 0,
      }))
      enrichedTags.sort((a, b) => b.hadith_count - a.hadith_count)
      setTags(enrichedTags)

      const hadithIdArr = [...allHadithIds].slice(0, 50)
      if (hadithIdArr.length > 0) {
        const { data: hadithData } = await supabase
          .from("hadiths")
          .select("id, arabic_text, english_translation, narrator, grade, collection, reference, hadith_number")
          .in("collection", SAHIHAYN)
          .in("id", hadithIdArr)
        setHadiths(hadithData || [])
      }

      setLoading(false)
    }
    fetchData()
  }, [supabase, slug])

  useEffect(() => {
    if (!activeTag || !category) return

    const filterByTag = async () => {
      setLoading(true)
      const { data: weightedIds } = await supabase
        .from("hadith_tag_weights")
        .select("hadith_id")
        .eq("tag_id", activeTag)
        .order("weight", { ascending: false })
        .limit(50)

      const ids = (weightedIds || []).map((w: { hadith_id: string }) => w.hadith_id)
      if (ids.length > 0) {
        const { data: hadithData } = await supabase
          .from("hadiths")
          .select("id, arabic_text, english_translation, narrator, grade, collection, reference, hadith_number")
          .in("collection", SAHIHAYN)
          .in("id", ids)
        setHadiths(hadithData || [])
      } else {
        setHadiths([])
      }
      setLoading(false)
    }
    filterByTag()
  }, [activeTag, supabase, category])

  const clearTagFilter = () => {
    setActiveTag(null)
    setLoading(true)
    const refetch = async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .single()
      if (!cat) { setLoading(false); return }

      const { data: catTags } = await supabase
        .from("tags")
        .select("id")
        .eq("category_id", cat.id)
        .eq("is_active", true)

      const tagIds = (catTags || []).map((t: { id: string }) => t.id)
      if (tagIds.length === 0) { setHadiths([]); setLoading(false); return }

      const { data: weights } = await supabase
        .from("hadith_tag_weights")
        .select("hadith_id")
        .in("tag_id", tagIds)

      const ids = [...new Set((weights || []).map((w: { hadith_id: string }) => w.hadith_id))].slice(0, 50)
      if (ids.length > 0) {
        const { data: hadithData } = await supabase
          .from("hadiths")
          .select("id, arabic_text, english_translation, narrator, grade, collection, reference, hadith_number")
          .in("collection", SAHIHAYN)
          .in("id", ids)
        setHadiths(hadithData || [])
      } else {
        setHadiths([])
      }
      setLoading(false)
    }
    refetch()
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Category not found</p>
          <button onClick={() => router.push("/topics")} className="mt-4 px-4 py-2 rounded-lg gold-button text-sm">
            Back to Topics
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/topics")}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            aria-label="Back to topics"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            {category.icon && <span className="text-2xl">{category.icon}</span>}
            <div>
              <h1 className="text-lg font-bold text-foreground">{category.name_en}</h1>
              <p className="text-xs text-muted-foreground">{hadiths.length} hadiths</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {category.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearTagFilter}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                !activeTag
                  ? "bg-[#1B5E43] text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-[#1B5E43]",
              )}
            >
              All
            </button>
            {tags.filter((t) => t.hadith_count > 0).map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(tag.id === activeTag ? null : tag.id)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  tag.id === activeTag
                    ? "bg-[#C5A059] text-white"
                    : "bg-card border border-border text-muted-foreground hover:border-[#C5A059]",
                )}
              >
                <Hash className="w-3 h-3" />
                {tag.name_en}
                <span className="text-[10px] opacity-60 ml-0.5">({tag.hadith_count})</span>
              </button>
            ))}
          </div>
        )}

        {hadiths.length === 0 ? (
          <div className="premium-card rounded-xl p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No hadiths tagged in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hadiths.map((hadith, idx) => (
              <HadithCardCondensed
                key={hadith.id}
                hadith={hadith}
                referenceNumber={idx + 1}
                collectionName={hadith.collection}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
              }
