"use client"

import { useRouter } from "next/navigation"
import { BookOpen, ChevronRight } from "lucide-react"

interface BookCardProps {
  book: {
    id: string
    number: number
    name_en: string
    name_ar: string
    total_hadiths: number
    total_chapters?: number
    first_chapter?: string
  }
  collectionSlug: string
}

export function BookCard({ book, collectionSlug }: BookCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/collections/${collectionSlug}/books/${book.id}`)}
      className="flex flex-col p-5 rounded-xl premium-card text-left transition-all hover:shadow-lg hover:-translate-y-1 group min-h-[160px]"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">Book {book.number}</span>
      </div>

      <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">{book.name_en}</h3>
      <p className="text-sm text-[#C5A059] mb-3 font-arabic" dir="rtl">
        {book.name_ar}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {book.total_hadiths} hadiths
        </span>
        {book.total_chapters && <span>• {book.total_chapters} chapters</span>}
      </div>

      {book.first_chapter && (
        <p className="text-xs text-muted-foreground italic line-clamp-1 mb-3">1. {book.first_chapter}</p>
      )}

      <div className="mt-auto flex items-center text-sm font-semibold text-[#1B5E43] group-hover:text-[#2D7A5B] transition-colors">
        View Chapters
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  )
}
