"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Hash, Loader2, BookOpen } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

import { HadithCardCondensed } from "@/components/collections/hadith-card-condensed"

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

export default function TagDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = getSupabaseBrowserClient()

  const [tag, setTag] = useState<{ name_en: string; name_ar: string | null; usage_count: number } | null>(null)
  const [hadiths, setHadiths] = useState<EnrichedHadith[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: tagData } = await supabase
        .from("tags")
        .select("id, name_en, name_ar, usage_count")
        .eq("slug", slug)
        .single()

      if (!tagData) {
        setLoading(false)
        return
      }
      setTag(tagData)

      // Get hadith IDs from hadith_tag_weights (primary) and hadith_tags (fallback)
      const { data: weightedRows } = await supabase
        .from("hadith_tag_weights")
        .select("hadith_id")
        .eq("tag_id", tagData.id)
        .order("weight", { ascending: false })
        .limit(50)

      let hadithIds = (weightedRows || []).map((t: { hadith_id: string }) => t.hadith_id)

      // Fall back to hadith_tags if no weighted results
      if (hadithIds.length === 0) {
        const { data: taggedRows } = await supabase
          .from("hadith_tags")
          .select("hadith_id")
          .eq("tag_id", tagData.id)
          .eq("status", "published")
          .limit(50)
        hadithIds = (taggedRows || []).map((t: { hadith_id: string }) => t.hadith_id)
      }

      if (hadithIds.length > 0) {

        const { data: hadithData } = await supabase
          .from("hadiths")
          .select("id, arabic_text, english_translation, narrator, grade, collection, reference, hadith_number")
          .in("collection", ["sahih-bukhari", "sahih-muslim"])
          .in("id", hadithIds)

        // Get summaries
        const { data: enrichments } = await supabase
          .from("hadith_enrichment")
          .select("hadith_id, summary_line")
          .in("hadith_id", hadithIds)
          .eq("status", "published")

        const summaryMap = new Map((enrichments || []).map((e: { hadith_id: string; summary_line: string }) => [e.hadith_id, e.summary_line]))
        setHadiths(
          (hadithData || []).map((h: EnrichedHadith) => ({
            ...h,
            summary_line: summaryMap.get(h.id) || undefined,
          })),
        )
      }

      setLoading(false)
    }
    fetchData()
  }, [supabase, slug])

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  if (!tag) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Tag not found</p>
          <button onClick={() => router.push("/topics")} className="mt-4 px-4 py-2 rounded-lg gold-button text-sm">
            Back to Topics
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-muted/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#C5A059]" />
            <div>
              <h1 className="text-lg font-bold text-foreground">{tag.name_en}</h1>
              <p className="text-xs text-muted-foreground">{hadiths.length} hadiths</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        {hadiths.length === 0 ? (
          <div className="premium-card rounded-xl p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No published hadiths with this tag yet.</p>
          </div>
        ) : (
          hadiths.map((hadith, idx) => (
            <div key={hadith.id} className="space-y-1">
              {hadith.summary_line && (
                <p className="text-xs font-medium text-[#C5A059] px-1">{hadith.summary_line}</p>
              )}
              <HadithCardCondensed
                hadith={hadith}
                referenceNumber={idx + 1}
                collectionName={hadith.collection}
              />
            </div>
          ))
        )}
      </main>

    </div>
  )
}
