"use client"

import { useRouter } from "next/navigation"
import { BookOpen, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RecentHadith {
  id: string
  title: string
  collection: string
  viewed_at: string
}

interface RecentlyViewedListProps {
  hadiths: RecentHadith[]
}

export function RecentlyViewedList({ hadiths }: RecentlyViewedListProps) {
  const router = useRouter()

  if (hadiths.length === 0) {
    return (
      <div className="premium-card gold-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recently Viewed</h3>
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hadiths viewed yet</p>
          <p className="text-xs mt-1">Start exploring to see your history here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card gold-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recently Viewed</h3>
      <div className="divide-y divide-border">
        {hadiths.map((hadith) => (
          <button
            key={hadith.id}
            onClick={() => router.push(`/hadith/${hadith.id}`)}
            className="w-full flex items-start gap-3 py-4 first:pt-0 last:pb-0 hover:bg-[#fafaf9] -mx-2 px-2 rounded-lg transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg gold-icon-bg flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-[#C5A059]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{hadith.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hadith.collection} • {formatDistanceToNow(new Date(hadith.viewed_at), { addSuffix: true })}
              </p>
            </div>
          </button>
        ))}
      </div>
      <a
        href="/history"
        className="mt-4 inline-flex items-center gap-1 text-sm text-[#C5A059] font-medium hover:underline"
      >
        View all
        <ChevronRight className="w-4 h-4" />
      </a>
    </div>
  )
}
