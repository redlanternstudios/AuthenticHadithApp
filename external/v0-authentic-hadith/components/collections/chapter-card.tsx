"use client"

import { useRouter } from "next/navigation"
import { FileText, ChevronRight } from "lucide-react"

interface ChapterCardProps {
  chapter: {
    id: string
    number: number
    name_en: string
    name_ar: string
    total_hadiths: number
    excerpt?: string
  }
  collectionSlug: string
  bookId: string
}

export function ChapterCard({ chapter, collectionSlug, bookId }: ChapterCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/collections/${collectionSlug}/books/${bookId}/chapters/${chapter.id}`)}
      className="flex flex-col p-5 rounded-xl premium-card text-left transition-all hover:shadow-lg hover:-translate-y-1 group"
    >
      <span className="text-xs font-bold text-[#1B5E43] uppercase tracking-wider mb-2">Chapter {chapter.number}</span>

      <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">{chapter.name_en}</h3>
      <p className="text-sm text-[#C5A059] mb-3 font-arabic" dir="rtl">
        {chapter.name_ar}
      </p>

      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <FileText className="w-3 h-3" />
        {chapter.total_hadiths} hadiths
      </div>

      {chapter.excerpt && (
        <p className="text-xs text-muted-foreground italic line-clamp-3 mb-3">"{chapter.excerpt}..."</p>
      )}

      <div className="mt-auto flex items-center text-sm font-semibold text-[#C5A059] group-hover:text-[#E8C77D] transition-colors">
        View Hadiths
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  )
}
