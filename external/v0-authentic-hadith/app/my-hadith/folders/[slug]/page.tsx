"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft, Share2, Users, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Folder {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  privacy: string
  share_token?: string
}

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

export default function FolderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = getSupabaseBrowserClient()
  
  const [folder, setFolder] = useState<Folder | null>(null)
  const [hadiths, setHadiths] = useState<SavedHadith[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFolder = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Fetch folder
      const { data: folderData } = await supabase
        .from('hadith_folders')
        .select('*')
        .eq('id', slug)
        .single()

      if (folderData) {
        setFolder(folderData as Folder)
        
        // Fetch saved hadiths in this folder
        const { data: hadithsData } = await supabase
          .from('saved_hadiths')
          .select(`
            *,
            hadiths(*)
          `)
          .eq('folder_id', slug)
          .order('created_at', { ascending: false })
        
        if (hadithsData) {
          setHadiths(hadithsData as unknown as SavedHadith[])
        }
      }

      setLoading(false)
    }

    fetchFolder()
  }, [supabase, router, slug])

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Folder not found</h1>
          <button
            onClick={() => router.push("/my-hadith")}
            className="gold-button px-6 py-2 rounded-lg"
          >
            Back to My Hadith
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push("/my-hadith")}
              className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{folder.icon}</span>
                <h1 className="text-xl font-bold text-foreground">{folder.name}</h1>
              </div>
              {folder.description && (
                <p className="text-sm text-muted-foreground mt-1">{folder.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Collaborate
            </button>
            <button className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {hadiths.length === 0 ? (
          <div className="premium-card rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              No hadiths in this folder yet
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Save hadiths to this folder while browsing
            </p>
            <button
              onClick={() => router.push("/collections")}
              className="gold-button px-4 py-2 rounded-lg text-sm"
            >
              Browse Collections
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hadiths.map((item) => (
              <div
                key={item.id}
                className="premium-card rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/hadith/${item.hadith_id}`)}
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
                    
                    <p className="text-sm text-foreground line-clamp-3 mb-3">
                      {item.hadiths.english_translation}
                    </p>

                    {item.notes && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground font-medium mb-1">My Notes</p>
                        <p className="text-sm text-foreground line-clamp-2">{item.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
