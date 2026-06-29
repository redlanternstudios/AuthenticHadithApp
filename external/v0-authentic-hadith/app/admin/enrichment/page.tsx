"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Play,
  Check,
  X,
  Send,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit3,
  BarChart3,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { parseEnglishTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"

interface Enrichment {
  id: string
  hadith_id: string
  summary_line: string | null
  key_teaching_en: string | null
  key_teaching_ar: string | null
  summary_ar: string | null
  category_id: string | null
  status: "suggested" | "approved" | "published" | "rejected"
  confidence: number | null
  rationale: string | null
  suggested_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  // Joined
  hadith?: {
    id: string
    english_translation: string
    arabic_text: string
    narrator: string
    grade: string
    collection: string
    reference: string
  }
  category?: { slug: string; name_en: string }
  tags?: Array<{ tag_id: string; tag?: { slug: string; name_en: string } }>
}

interface Stats {
  total_hadiths: number
  enriched: number
  remaining: number
  coverage_percent: number
  by_status: {
    suggested: number
    approved: number
    published: number
    rejected: number
  }
}

interface Category {
  id: string
  slug: string
  name_en: string
}

interface Tag {
  id: string
  slug: string
  name_en: string
  category_id: string | null
}

const STATUS_COLORS: Record<string, string> = {
  suggested: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
}

const COLLECTIONS = [
  { slug: "sahih-bukhari", name: "Sahih al-Bukhari" },
  { slug: "sahih-muslim", name: "Sahih Muslim" },
  { slug: "sunan-abu-dawud", name: "Sunan Abu Dawud" },
  { slug: "jami-tirmidhi", name: "Jami at-Tirmidhi" },
  { slug: "sunan-nasai", name: "Sunan an-Nasai" },
  { slug: "sunan-ibn-majah", name: "Sunan Ibn Majah" },
  { slug: "muwatta-malik", name: "Muwatta Malik" },
  { slug: "musnad-ahmad", name: "Musnad Ahmad" },
]

export default function AdminEnrichmentPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [enrichments, setEnrichments] = useState<Enrichment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("suggested")
  const [filterCollection, setFilterCollection] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateCount, setGenerateCount] = useState(5)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchLog, setBatchLog] = useState<string[]>([])
  const [batchSize, setBatchSize] = useState(10)

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSummary, setEditSummary] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editTagIds, setEditTagIds] = useState<string[]>([])

  const getToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ""
  }, [supabase])

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/enrich")
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchEnrichments = useCallback(async () => {
    // Use admin client (service role) via API or direct query
    // For the review queue, we need to see all statuses
    const token = await getToken()
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterCollection) params.set("collection", filterCollection)
    params.set("limit", "50")

    // Query via supabase directly (RLS allows admin/reviewer to see all)
    let query = supabase
      .from("hadith_enrichment")
      .select(
        `
        *,
        hadith:hadiths!hadith_id(id, english_translation, arabic_text, narrator, grade, collection, reference),
        category:categories!category_id(slug, name_en)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50)

    if (filterStatus) {
      query = query.eq("status", filterStatus)
    }

    const { data, error } = await query

    if (!error && data) {
      // For each enrichment, also fetch tags
      const enrichmentIds = data.map((e: Enrichment) => e.id)
      const { data: tagData } = await supabase
        .from("hadith_tags")
        .select("enrichment_id, tag_id, tag:tags!tag_id(slug, name_en)")
        .in("enrichment_id", enrichmentIds)

      const tagsByEnrichment = new Map<string, Array<{ tag_id: string; tag?: { slug: string; name_en: string } }>>()
      for (const t of tagData || []) {
        const existing = tagsByEnrichment.get(t.enrichment_id) || []
        existing.push(t)
        tagsByEnrichment.set(t.enrichment_id, existing)
      }

      const enriched = data.map((e: Enrichment) => ({
        ...e,
        tags: tagsByEnrichment.get(e.id) || [],
      }))

      // Filter by collection if needed
      if (filterCollection) {
        setEnrichments(
          enriched.filter(
            (e: Enrichment) => e.hadith?.collection === filterCollection,
          ),
        )
      } else {
        setEnrichments(enriched)
      }
    }
  }, [supabase, filterStatus, filterCollection, getToken])

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (!profile || !["admin", "reviewer"].includes(profile.role)) {
        router.push("/home")
        return
      }

      setIsAdmin(true)

      // Fetch categories and tags for edit dropdowns
      const { data: cats } = await supabase
        .from("categories")
        .select("id, slug, name_en")
        .order("display_order")
      setCategories(cats || [])

      const { data: tgs } = await supabase
        .from("tags")
        .select("id, slug, name_en, category_id")
        .order("name_en")
      setAllTags(tgs || [])

      await fetchStats()
      await fetchEnrichments()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (isAdmin) fetchEnrichments()
  }, [filterStatus, filterCollection, isAdmin, fetchEnrichments])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection_slug: filterCollection || undefined,
          limit: generateCount,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        await fetchStats()
        await fetchEnrichments()
        alert(`Generated: ${result.success} success, ${result.failed} failed`)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown"}`)
    }
    setGenerating(false)
  }

  const handleReview = async (
    enrichmentId: string,
    action: "approve" | "reject" | "publish" | "edit",
    changes?: Record<string, unknown>,
    notes?: string,
  ) => {
    setActionLoading(enrichmentId)
    try {
      const token = await getToken()
      const res = await fetch("/api/enrich/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enrichment_id: enrichmentId, action, changes, notes }),
      })
      if (res.ok) {
        await fetchStats()
        await fetchEnrichments()
        setEditingId(null)
      } else {
        const err = await res.json()
        alert(`Error: ${err.error}`)
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown"}`)
    }
    setActionLoading(null)
  }

  const handleBatchAction = async (action: "approve_all" | "publish_all") => {
    if (!confirm(`Are you sure you want to ${action.replace("_", " ")} all ${filterStatus} enrichments?`)) return
    setActionLoading("batch")
    try {
      const token = await getToken()
      const res = await fetch("/api/enrich/review", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, filter_status: filterStatus }),
      })
      if (res.ok) {
        const result = await res.json()
        await fetchStats()
        await fetchEnrichments()
        alert(`Updated ${result.updated} enrichments`)
      }
    } catch {
      // error
    }
    setActionLoading(null)
  }

  const handleBatchEnrich = async (mode: "new" | "backfill") => {
    if (!confirm(`Run batch ${mode === "backfill" ? "backfill (add key teachings to existing)" : "enrich & auto-publish"} for ${batchSize} hadiths?`)) return
    setBatchRunning(true)
    setBatchLog([`Starting ${mode} batch (${batchSize} hadiths)...`])
    try {
      const token = await getToken()
      const res = await fetch("/api/enrich/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection_slug: filterCollection || undefined,
          batch_size: batchSize,
          auto_publish: true,
          mode,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setBatchLog((prev) => [
          ...prev,
          `Done: ${result.success} success, ${result.failed} failed (${result.processed} processed)`,
          ...(result.results || [])
            .filter((r: { success: boolean }) => !r.success)
            .map((r: { hadithId?: string; enrichmentId?: string; error?: string }) => `  Failed ${r.hadithId || r.enrichmentId}: ${r.error}`),
        ])
        await fetchStats()
        await fetchEnrichments()
      } else {
        setBatchLog((prev) => [...prev, `Error: ${result.error}`])
      }
    } catch (err) {
      setBatchLog((prev) => [...prev, `Error: ${err instanceof Error ? err.message : "Unknown"}`])
    }
    setBatchRunning(false)
  }

  const startEdit = (e: Enrichment) => {
    setEditingId(e.id)
    setEditSummary(e.summary_line || "")
    setEditCategoryId(e.category_id || "")
    setEditTagIds((e.tags || []).map((t) => t.tag_id))
  }

  const saveEdit = (enrichmentId: string) => {
    handleReview(enrichmentId, "edit", {
      summary_line: editSummary,
      category_id: editCategoryId,
      tag_ids: editTagIds,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen marble-bg pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#F8F6F2]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/home")}
              className="w-10 h-10 rounded-full bg-[#F8F6F2] border border-[#e5e7eb] flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#6b7280]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#1a1f36]">Enrichment Pipeline</h1>
              <p className="text-xs text-muted-foreground">Manage AI-generated hadith enrichments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="premium-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1a1f36]">{stats.total_hadiths.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Hadiths</p>
            </div>
            <div className="premium-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1B5E43]">{stats.coverage_percent}%</p>
              <p className="text-xs text-muted-foreground mt-1">Coverage</p>
            </div>
            <div className="premium-card rounded-xl p-4 text-center border-l-4 border-l-amber-400">
              <p className="text-2xl font-bold text-amber-700">{stats.by_status.suggested}</p>
              <p className="text-xs text-muted-foreground mt-1">Suggested</p>
            </div>
            <div className="premium-card rounded-xl p-4 text-center border-l-4 border-l-blue-400">
              <p className="text-2xl font-bold text-blue-700">{stats.by_status.approved}</p>
              <p className="text-xs text-muted-foreground mt-1">Approved</p>
            </div>
            <div className="premium-card rounded-xl p-4 text-center border-l-4 border-l-emerald-400">
              <p className="text-2xl font-bold text-emerald-700">{stats.by_status.published}</p>
              <p className="text-xs text-muted-foreground mt-1">Published</p>
            </div>
            <div className="premium-card rounded-xl p-4 text-center border-l-4 border-l-red-400">
              <p className="text-2xl font-bold text-red-700">{stats.by_status.rejected}</p>
              <p className="text-xs text-muted-foreground mt-1">Rejected</p>
            </div>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Generate Controls */}
          <div className="premium-card rounded-xl p-4 flex items-center gap-3 flex-1">
            <BarChart3 className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
            <select
              value={filterCollection}
              onChange={(e) => setFilterCollection(e.target.value)}
              className="text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 bg-transparent flex-1"
            >
              <option value="">All Collections</option>
              {COLLECTIONS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              className="text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 bg-transparent w-20"
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="emerald-button px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate
            </button>
          </div>

          {/* Filter + Batch Controls */}
          <div className="premium-card rounded-xl p-4 flex items-center gap-3">
            <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 bg-transparent"
            >
              <option value="suggested">Suggested</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
            <button
              onClick={() => fetchEnrichments()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {filterStatus === "suggested" && (
              <button
                onClick={() => handleBatchAction("approve_all")}
                disabled={actionLoading === "batch"}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Approve All
              </button>
            )}
            {filterStatus === "approved" && (
              <button
                onClick={() => handleBatchAction("publish_all")}
                disabled={actionLoading === "batch"}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                Publish All
              </button>
            )}
          </div>
        </div>

        {/* Batch Enrich Controls */}
        <div className="premium-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm font-semibold text-[#1a1f36]">Batch Enrich & Auto-Publish</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              {stats ? `${stats.remaining.toLocaleString()} remaining` : "..."}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Process hadiths through GPT-4o-mini to generate summary, key teaching (EN+AR), category, and tags. Auto-publishes results.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="text-sm border border-[#e5e7eb] rounded-lg px-3 py-2 bg-transparent w-24"
            >
              {[5, 10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleBatchEnrich("new")}
              disabled={batchRunning}
              className="emerald-button px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Enrich New Hadiths
            </button>
            <button
              onClick={() => handleBatchEnrich("backfill")}
              disabled={batchRunning}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors flex items-center gap-2"
            >
              {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Backfill Key Teachings
            </button>
          </div>
          {batchLog.length > 0 && (
            <div className="bg-[#1a1f36] rounded-lg p-3 max-h-40 overflow-y-auto">
              {batchLog.map((line, i) => (
                <p key={i} className="text-xs font-mono text-emerald-400">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Review Queue */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Review Queue ({enrichments.length})
          </h2>

          {enrichments.length === 0 && (
            <div className="premium-card rounded-xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                No enrichments found with status "{filterStatus}".
              </p>
              <p className="text-xs text-muted-foreground mt-1">Try generating some or changing the filter.</p>
            </div>
          )}

          {enrichments.map((e) => {
            const isExpanded = expandedId === e.id
            const isEditing = editingId === e.id
            const parsed = e.hadith
              ? parseEnglishTranslation(e.hadith.english_translation)
              : { narrator: "", text: "" }

            return (
              <div key={e.id} className="premium-card rounded-xl overflow-hidden">
                {/* Collapsed Row */}
                <div
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                >
                  <div className="flex-1 min-w-0">
                    {/* Summary + Status */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          STATUS_COLORS[e.status],
                        )}
                      >
                        {e.status}
                      </span>
                      {e.confidence != null && (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(e.confidence * 100)}% conf
                        </span>
                      )}
                      {e.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B5E43]/10 text-[#1B5E43] font-medium">
                          {e.category.name_en}
                        </span>
                      )}
                    </div>

                    {/* Summary Line */}
                    <p className="text-sm font-semibold text-[#1a1f36] line-clamp-1">
                      {e.summary_line || "No summary"}
                    </p>

                    {/* Hadith preview */}
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {parsed.text.slice(0, 120)}...
                    </p>

                    {/* Tags */}
                    {e.tags && e.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.tags.map((t) => (
                          <span
                            key={t.tag_id}
                            className="px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#8A6E3A] text-[10px] font-medium"
                          >
                            {t.tag?.name_en || t.tag_id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[#e5e7eb] p-4 space-y-4 bg-[#fafaf9]">
                    {/* Full Hadith */}
                    {e.hadith && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{getCollectionDisplayName(e.hadith.collection)}</span>
                          <span>|</span>
                          <span>{e.hadith.reference}</span>
                          <span>|</span>
                          <span className="capitalize">{e.hadith.grade}</span>
                        </div>
                        {parsed.narrator && (
                          <p className="text-xs italic text-muted-foreground">
                            Narrated by {parsed.narrator}
                          </p>
                        )}
                        <p className="text-sm text-[#4a5568] leading-relaxed">{parsed.text}</p>
                      </div>
                    )}

                    {/* Key Teaching */}
                    {e.key_teaching_en && (
                      <div className="bg-white rounded-lg p-3 border border-[#C5A059]/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] mb-1">
                          Key Teaching (EN)
                        </p>
                        <p className="text-xs text-[#4a5568] leading-relaxed">{e.key_teaching_en}</p>
                        {e.key_teaching_ar && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] mb-1 mt-3">
                              Key Teaching (AR)
                            </p>
                            <p className="text-xs text-[#4a5568] leading-relaxed text-right" dir="rtl" lang="ar">
                              {e.key_teaching_ar}
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Rationale */}
                    {e.rationale && (
                      <div className="bg-white rounded-lg p-3 border border-[#e5e7eb]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          AI Rationale
                        </p>
                        <p className="text-xs text-[#4a5568]">{e.rationale}</p>
                      </div>
                    )}

                    {/* Edit Mode */}
                    {isEditing ? (
                      <div className="space-y-3 bg-white rounded-lg p-4 border border-[#C5A059]/30">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Summary Line
                          </label>
                          <input
                            type="text"
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            maxLength={80}
                            className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {editSummary.length}/80 characters
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Category
                          </label>
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Select...</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Tags (click to toggle)
                          </label>
                          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                            {allTags.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                  setEditTagIds((prev) =>
                                    prev.includes(t.id)
                                      ? prev.filter((id) => id !== t.id)
                                      : prev.length < 4
                                        ? [...prev, t.id]
                                        : prev,
                                  )
                                }
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs transition-colors",
                                  editTagIds.includes(t.id)
                                    ? "bg-[#C5A059] text-white"
                                    : "bg-muted text-muted-foreground hover:bg-[#C5A059]/20",
                                )}
                              >
                                {t.name_en}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(e.id)}
                            disabled={actionLoading === e.id}
                            className="emerald-button px-4 py-2 rounded-lg text-xs font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Action Buttons */
                      <div className="flex flex-wrap gap-2">
                        {e.status === "suggested" && (
                          <>
                            <button
                              onClick={() => handleReview(e.id, "approve")}
                              disabled={actionLoading === e.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(e.id, "reject")}
                              disabled={actionLoading === e.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {(e.status === "suggested" || e.status === "approved") && (
                          <button
                            onClick={() => handleReview(e.id, "publish")}
                            disabled={actionLoading === e.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Publish
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(e)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] hover:bg-muted transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
