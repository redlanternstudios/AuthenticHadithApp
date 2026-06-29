"use client"

import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"

interface CollectionCardProps {
  collection: {
    id: string
    name_en: string
    name_ar: string
    slug: string
    total_hadiths: number
    scholar: string
    is_featured?: boolean
    grade_distribution?: {
      sahih: number
      hasan: number
      daif: number
    }
    description_en?: string
  }
  variant?: "featured" | "default"
}

export function CollectionCard({ collection, variant = "default" }: CollectionCardProps) {
  const router = useRouter()

  const totalGraded =
    (collection.grade_distribution?.sahih || 0) +
    (collection.grade_distribution?.hasan || 0) +
    (collection.grade_distribution?.daif || 0)

  const sahihPercent =
    totalGraded > 0 ? Math.round(((collection.grade_distribution?.sahih || 0) / totalGraded) * 100) : 0
  const hasanPercent =
    totalGraded > 0 ? Math.round(((collection.grade_distribution?.hasan || 0) / totalGraded) * 100) : 0

  if (variant === "featured") {
    return (
      <button
        onClick={() => router.push(`/collections/${collection.slug}`)}
        className="relative flex flex-col w-[280px] md:w-full h-[200px] md:h-[240px] rounded-xl premium-card overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-lg flex-shrink-0 snap-center text-left"
      >
        {/* Featured badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold text-white bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] z-10">
          Featured
        </div>

        {/* Geometric pattern background */}
        <div className="absolute inset-0 opacity-[0.08]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id={`pattern-${collection.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" className="text-[#C5A059]" />
            </pattern>
            <rect width="100%" height="100%" fill={`url(#pattern-${collection.id})`} />
          </svg>
        </div>

        <div className="relative flex flex-col flex-1 p-5">
          {/* Icon */}
          <div className="w-12 h-12 rounded-lg gold-icon-bg flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-[#C5A059]" />
          </div>

          {/* Names */}
          <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{collection.name_en}</h3>
          <p className="text-sm text-[#C5A059] mb-2 font-arabic" dir="rtl">
            {collection.name_ar}
          </p>

          {/* Stats */}
          <p className="text-xs text-muted-foreground mb-3">{collection.total_hadiths.toLocaleString()} hadiths</p>

          {/* Grade badge */}
          <div className="mt-auto">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-foreground">
              {sahihPercent}% Sahih
            </span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => router.push(`/collections/${collection.slug}`)}
      className="flex flex-col p-5 rounded-xl premium-card text-left transition-all hover:shadow-lg hover:-translate-y-1 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg gold-icon-bg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-[#C5A059]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground mb-0.5 line-clamp-1">{collection.name_en}</h3>
          <p className="text-sm text-[#C5A059] mb-2 font-arabic" dir="rtl">
            {collection.name_ar}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {collection.total_hadiths.toLocaleString()} hadiths • {collection.scholar}
          </p>
        </div>
      </div>

      {/* Grade distribution bar */}
      {totalGraded > 0 && (
        <div className="mt-4">
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            <div className="bg-gradient-to-r from-[#C5A059] to-[#E8C77D]" style={{ width: `${sahihPercent}%` }} />
            <div className="bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]" style={{ width: `${hasanPercent}%` }} />
            <div className="bg-muted-foreground/20" style={{ width: `${100 - sahihPercent - hasanPercent}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>{sahihPercent}% Sahih</span>
            <span>{hasanPercent}% Hasan</span>
          </div>
        </div>
      )}

      {collection.description_en && (
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{collection.description_en}</p>
      )}

      <div className="mt-4 text-sm font-semibold text-[#1B5E43] group-hover:text-[#2D7A5B] transition-colors">
        Explore Books →
      </div>
    </button>
  )
}
