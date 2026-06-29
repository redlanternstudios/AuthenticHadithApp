"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getFolderByShareToken } from "@/lib/api/my-hadith"
import { Eye, Lock, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HadithFolderWithHadiths } from "@/types/my-hadith"

interface SavedHadith {
  id: string
  hadith_id: string
  notes?: string
  created_at: string
  hadiths?: {
    id: string
    arabic_text: string
    english_translation: string
    collection: string
    reference: string
    grade: string
  }
}

export default function SharedFolderPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const [folder, setFolder] = useState<HadithFolderWithHadiths | null>(null)
  const [hadiths, setHadiths] = useState<SavedHadith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSharedFolder = async () => {
      try {
        const data = await getFolderByShareToken(token) as HadithFolderWithHadiths
        setFolder(data)
        // Extract hadiths from the response
        const hadithsData = data.saved_hadiths || []
        setHadiths(hadithsData)
      } catch (err) {
        console.error('Error fetching shared folder:', err)
        setError('Failed to load shared folder')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedFolder()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !folder) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center premium-card rounded-xl p-8 max-w-md">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Folder not found"}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            This folder may be private or the link may have expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="gold-button px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[#C5A059]" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Shared Collection
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{folder.icon}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
              {folder.description && (
                <p className="text-sm text-muted-foreground mt-1">{folder.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/50 text-xs">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                {hadiths.length} hadith{hadiths.length !== 1 ? 's' : ''}
              </span>
            </div>
            {folder.privacy === 'public' && (
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs text-emerald-600 font-medium border border-emerald-500/20">
                Public
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {hadiths.length === 0 ? (
          <div className="premium-card rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              This folder is empty
            </p>
            <p className="text-xs text-muted-foreground">
              No hadiths have been added to this collection yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hadiths.map((item) => (
              <div
                key={item.id}
                className="premium-card rounded-xl p-4"
              >
                {item.hadiths && (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                            item.hadiths.grade === 'sahih' && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                            item.hadiths.grade === 'hasan' && "bg-blue-500/10 text-blue-600 border border-blue-500/20",
                            item.hadiths.grade === 'daif' && "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          )}>
                            {item.hadiths.grade}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.hadiths.collection} - {item.hadiths.reference}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <div className="mb-4 p-4 rounded-lg bg-accent/30 border border-border">
                      <p className="text-right text-lg leading-loose font-arabic text-foreground">
                        {item.hadiths.arabic_text}
                      </p>
                    </div>
                    
                    {/* English Translation */}
                    <p className="text-sm text-foreground leading-relaxed">
                      {item.hadiths.english_translation}
                    </p>

                    {item.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground font-medium mb-2">📝 Notes</p>
                        <p className="text-sm text-foreground">{item.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Footer CTA */}
        <div className="mt-8 premium-card rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Create Your Own Collections
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save, organize, and share authentic hadiths with your own notes and commentary.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="gold-button px-6 py-2 rounded-lg"
          >
            Sign Up Free
          </button>
        </div>
      </main>
    </div>
  )
}
