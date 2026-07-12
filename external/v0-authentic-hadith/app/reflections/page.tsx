"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PenLine, ChevronLeft, Plus, Trash2, Calendar, BookOpen, Share2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Reflection {
  id: string
  content: string
  hadith_ref: string | null
  tag: string | null
  created_at: string
}

const TAG_OPTIONS = [
  { value: "gratitude", label: "Gratitude", color: "bg-[#1B5E43]/15 text-[#1B5E43] border border-[#1B5E43]/20", dot: "bg-[#1B5E43]" },
  { value: "patience", label: "Patience", color: "bg-[#C5A059]/15 text-[#8A6E3A] border border-[#C5A059]/20", dot: "bg-[#C5A059]" },
  { value: "tawakkul", label: "Tawakkul", color: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-500" },
  { value: "repentance", label: "Repentance", color: "bg-purple-50 text-purple-700 border border-purple-200", dot: "bg-purple-500" },
  { value: "hope", label: "Hope", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  { value: "general", label: "General", color: "bg-muted text-muted-foreground border border-border", dot: "bg-[#6b7280]" },
]

export default function ReflectionsPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [newTag, setNewTag] = useState("general")
  const [newRef, setNewRef] = useState("")
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUserId(user.id)

      // Try to load reflections -- table may not exist yet
      try {
        const { data, error } = await supabase
          .from("reflections")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
        if (!error && data) {
          setReflections(data)
        }
      } catch {
        // Table doesn't exist yet -- that's ok
      }
      setLoading(false)
    }
    load()
  }, [supabase, router])

  const handleSave = async () => {
    if (!newContent.trim() || !userId) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("reflections")
        .insert({
          user_id: userId,
          content: newContent.trim(),
          tag: newTag,
          hadith_ref: newRef.trim() || null,
        })
        .select()
        .single()
      if (!error && data) {
        setReflections([data, ...reflections])
        setNewContent("")
        setNewRef("")
        setNewTag("general")
        setShowCompose(false)
      }
    } catch {
      // Failed to save
    }
    setSaving(false)
  }

  const handleShareReflection = async (ref: Reflection) => {
    const tagLabel = TAG_OPTIONS.find((t) => t.value === ref.tag)?.label || ""
    const text = `${ref.content}${ref.hadith_ref ? `\n\nRef: ${ref.hadith_ref}` : ""}${tagLabel ? `\n\n#${tagLabel}` : ""}\n\nWritten on Authentic Hadith`
    const url = typeof window !== "undefined" ? window.location.origin : ""

    if (navigator.share) {
      await navigator.share({ title: "Reflection", text, url })
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from("reflections").delete().eq("id", id)
    setReflections(reflections.filter((r) => r.id !== id))
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Reflections</h1>
              <p className="text-xs text-muted-foreground">Your private journal</p>
            </div>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#C5A059] to-[#E8C77D] flex items-center justify-center text-white shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Compose */}
        {showCompose && (
          <section className="premium-card rounded-xl p-4 mb-6 border border-[#C5A059]/30">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-[#C5A059]" />
              New Reflection
            </h2>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What is on your mind? Reflect on a hadith, an ayah, or a moment in your day..."
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm resize-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all"
              rows={4}
            />
            <input
              value={newRef}
              onChange={(e) => setNewRef(e.target.value)}
              placeholder="Hadith or Ayah reference (optional)"
              className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-card text-xs focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => setNewTag(tag.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
                    newTag === tag.value
                      ? tag.color + " ring-1 ring-current"
                      : "bg-muted text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={!newContent.trim() || saving}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white text-xs font-medium disabled:opacity-50 transition-opacity"
              >
                {saving ? "Saving..." : "Save Reflection"}
              </button>
              <button
                onClick={() => { setShowCompose(false); setNewContent(""); setNewRef(""); }}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Empty State */}
        {reflections.length === 0 && !showCompose && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
              <PenLine className="w-7 h-7 text-[#C5A059]" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-2">Your Sacred Space</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
              Use this journal to reflect on hadiths, ayahs, or moments in your spiritual journey.
              Everything here is private -- just between you and Allah.
            </p>
            <button
              onClick={() => setShowCompose(true)}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              Write Your First Reflection
            </button>
          </div>
        )}

        {/* Reflections List */}
        {reflections.length > 0 && (
          <div className="flex flex-col gap-3">
            {reflections.map((ref) => {
              const tagInfo = TAG_OPTIONS.find((t) => t.value === ref.tag) || TAG_OPTIONS[5]
              return (
                <div key={ref.id} className="premium-card rounded-xl p-4 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatDate(ref.created_at)}</span>
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold", tagInfo.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", tagInfo.dot)} />
                        {tagInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShareReflection(ref)}
                        className="p-1.5 rounded hover:bg-[#C5A059]/10 transition-all"
                        aria-label="Share reflection"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                      </button>
                      <button
                        onClick={() => handleDelete(ref.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 transition-all"
                        aria-label="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{ref.content}</p>
                  {ref.hadith_ref && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{ref.hadith_ref}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
