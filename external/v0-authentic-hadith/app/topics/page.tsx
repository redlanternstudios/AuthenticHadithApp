"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Hash,
  Loader2,
  type LucideIcon,
  // Category icons
  Landmark,
  Moon,
  HandCoins,
  MapPin,
  Heart,
  Shield,
  Sparkles,
  Droplets,
  Star,
  Users,
  Sun,
  Briefcase,
  BookOpenCheck,
  Megaphone,
  Scale,
  GraduationCap,
  Sword,
  Scroll,
  Flame,
  CircleDot,
  Cloud,
  AlertTriangle,
  Swords,
  Hand,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  // PascalCase variants
  Mosque: Landmark,
  Landmark: Landmark,
  Moon: Moon,
  HandCoins: HandCoins,
  MapPin: MapPin,
  Heart: Heart,
  Shield: Shield,
  Sparkles: Sparkles,
  BookOpen: BookOpen,
  Droplets: Droplets,
  Star: Star,
  Users: Users,
  Sun: Sun,
  Briefcase: Briefcase,
  BookOpenCheck: BookOpenCheck,
  Megaphone: Megaphone,
  Scale: Scale,
  GraduationCap: GraduationCap,
  Sword: Sword,
  Swords: Swords,
  Scroll: Scroll,
  Flame: Flame,
  CircleDot: CircleDot,
  Cloud: Cloud,
  AlertTriangle: AlertTriangle,
  Hand: Hand,
  Book: BookOpen,
  // kebab-case variants (from DB seed data)
  "mosque": Landmark,
  "landmark": Landmark,
  "moon": Moon,
  "hand-coins": HandCoins,
  "map-pin": MapPin,
  "heart": Heart,
  "shield": Shield,
  "sparkles": Sparkles,
  "book-open": BookOpen,
  "book": BookOpen,
  "droplets": Droplets,
  "star": Star,
  "users": Users,
  "sun": Sun,
  "briefcase": Briefcase,
  "book-open-check": BookOpenCheck,
  "megaphone": Megaphone,
  "scale": Scale,
  "graduation-cap": GraduationCap,
  "sword": Sword,
  "swords": Swords,
  "scroll": Scroll,
  "flame": Flame,
  "circle-dot": CircleDot,
  "cloud": Cloud,
  "alert-triangle": AlertTriangle,
  "hand": Hand,
}

function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return <BookOpen className={className} />
  const IconComponent = ICON_MAP[name] || ICON_MAP[name.toLowerCase()]
  if (IconComponent) {
    return <IconComponent className={className} />
  }
  return <BookOpen className={className} />
}
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  description: string | null
  icon: string | null
  display_order: number
  tag_count: number
  hadith_count: number
}

interface Tag {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  category_id: string | null
  hadith_count: number
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  worship: { bg: "bg-emerald-900/10", border: "border-emerald-700/30", text: "text-emerald-800 dark:text-emerald-300", icon: "text-emerald-600" },
  fasting: { bg: "bg-indigo-900/10", border: "border-indigo-700/30", text: "text-indigo-800 dark:text-indigo-300", icon: "text-indigo-600" },
  zakat: { bg: "bg-purple-900/10", border: "border-purple-700/30", text: "text-purple-800 dark:text-purple-300", icon: "text-purple-600" },
  hajj: { bg: "bg-orange-900/10", border: "border-orange-700/30", text: "text-orange-800 dark:text-orange-300", icon: "text-orange-600" },
  character: { bg: "bg-amber-900/10", border: "border-amber-700/30", text: "text-amber-800 dark:text-amber-300", icon: "text-amber-600" },
  faith: { bg: "bg-blue-900/10", border: "border-blue-700/30", text: "text-blue-800 dark:text-blue-300", icon: "text-blue-600" },
  dhikr: { bg: "bg-cyan-900/10", border: "border-cyan-700/30", text: "text-cyan-800 dark:text-cyan-300", icon: "text-cyan-600" },
  quran: { bg: "bg-green-900/10", border: "border-green-700/30", text: "text-green-800 dark:text-green-300", icon: "text-green-600" },
  purification: { bg: "bg-teal-900/10", border: "border-teal-700/30", text: "text-teal-800 dark:text-teal-300", icon: "text-teal-600" },
  "sunnah-acts": { bg: "bg-orange-900/10", border: "border-orange-700/30", text: "text-orange-800 dark:text-orange-300", icon: "text-orange-600" },
  family: { bg: "bg-rose-900/10", border: "border-rose-700/30", text: "text-rose-800 dark:text-rose-300", icon: "text-rose-600" },
  "daily-life": { bg: "bg-sky-900/10", border: "border-sky-700/30", text: "text-sky-800 dark:text-sky-300", icon: "text-sky-600" },
  business: { bg: "bg-stone-900/10", border: "border-stone-700/30", text: "text-stone-800 dark:text-stone-300", icon: "text-stone-600" },
  knowledge: { bg: "bg-emerald-900/10", border: "border-emerald-700/30", text: "text-emerald-800 dark:text-emerald-300", icon: "text-emerald-600" },
  dawah: { bg: "bg-pink-900/10", border: "border-pink-700/30", text: "text-pink-800 dark:text-pink-300", icon: "text-pink-600" },
  community: { bg: "bg-blue-900/10", border: "border-blue-700/30", text: "text-blue-800 dark:text-blue-300", icon: "text-blue-600" },
  warfare: { bg: "bg-slate-900/10", border: "border-slate-700/30", text: "text-slate-800 dark:text-slate-300", icon: "text-slate-600" },
  history: { bg: "bg-amber-900/10", border: "border-amber-700/30", text: "text-amber-800 dark:text-amber-300", icon: "text-amber-600" },
  afterlife: { bg: "bg-slate-900/10", border: "border-slate-700/30", text: "text-slate-800 dark:text-slate-300", icon: "text-slate-600" },
  fitna: { bg: "bg-red-900/10", border: "border-red-700/30", text: "text-red-800 dark:text-red-300", icon: "text-red-600" },
}

const DEFAULT_COLOR = { bg: "bg-muted", border: "border-border", text: "text-foreground", icon: "text-muted-foreground" }

export default function TopicsPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories with pre-computed hadith_count
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order")

      // Fetch tags
      const { data: tgs } = await supabase
        .from("tags")
        .select("id, slug, name_en, name_ar, category_id")
        .eq("is_active", true)

      // Use RPC for efficient server-side tag counts (avoids 1000-row pagination limit)
      const { data: tagCounts } = await supabase.rpc("get_tag_hadith_counts")

      // Build count map: tag_id -> count
      const tagCountMap = new Map<string, number>()
      for (const tc of tagCounts || []) {
        tagCountMap.set(tc.tag_id, Number(tc.hadith_count) || 0)
      }

      // Enrich tags with hadith counts
      const enrichedTags: Tag[] = (tgs || []).map((t: any) => ({
        ...t,
        hadith_count: tagCountMap.get(t.id) || 0,
      }))
      // Sort by hadith count descending
      enrichedTags.sort((a, b) => b.hadith_count - a.hadith_count)
      setTags(enrichedTags)

      // Categories already have hadith_count from the DB
      const enrichedCats: Category[] = (cats || []).map((c: any) => {
        const catTags = enrichedTags.filter((t) => t.category_id === c.id)
        return {
          ...c,
          tag_count: catTags.length,
          hadith_count: c.hadith_count || catTags.reduce((sum: number, t: Tag) => sum + t.hadith_count, 0),
        }
      })

      setCategories(enrichedCats)
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  const totalHadiths = categories.reduce((sum, c) => sum + c.hadith_count, 0)

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Browse by Topic</h1>
            <p className="text-xs text-muted-foreground">
              {totalHadiths.toLocaleString()} tagged hadiths across {categories.length} categories
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Popular Tags */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Popular Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags
              .filter((t) => t.hadith_count > 0)
              .slice(0, 24)
              .map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => router.push(`/topics/tag/${tag.slug}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-card border border-border hover:border-[#C5A059] hover:text-[#8A6E3A] transition-colors"
                >
                  <Hash className="w-3.5 h-3.5 text-[#C5A059]" />
                  {tag.name_en}
                  <span className="text-xs text-muted-foreground">({tag.hadith_count})</span>
                </button>
              ))}
          </div>
        </section>

        {/* Categories Grid */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const colors = CATEGORY_COLORS[cat.slug] || DEFAULT_COLOR
              const isExpanded = expandedCategory === cat.id
              const catTags = tags.filter((t) => t.category_id === cat.id && t.hadith_count > 0)

              return (
                <div key={cat.id} className={cn("rounded-xl border overflow-hidden transition-all", colors.border, colors.bg)}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colors.bg)}>
                      <CategoryIcon name={cat.icon} className={cn("w-6 h-6", colors.icon)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("font-semibold text-sm", colors.text)}>{cat.name_en}</h3>
                      {cat.name_ar && (
                        <p className="text-xs text-muted-foreground" dir="rtl">{cat.name_ar}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn("text-lg font-bold", colors.text)}>{cat.hadith_count}</p>
                      <p className="text-[10px] text-muted-foreground">hadiths</p>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 flex-shrink-0 transition-transform", colors.icon, isExpanded && "rotate-90")} />
                  </button>

                  {isExpanded && catTags.length > 0 && (
                    <div className="px-4 pb-4 border-t border-border/30 pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {catTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => router.push(`/topics/tag/${tag.slug}`)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-card/70 border border-border/50 hover:border-[#C5A059] hover:text-[#8A6E3A] transition-colors"
                          >
                            <Hash className="w-3 h-3" />
                            {tag.name_en}
                            <span className="text-[10px] text-muted-foreground ml-0.5">({tag.hadith_count})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && catTags.length === 0 && (
                    <div className="px-4 pb-4 border-t border-border/30 pt-3">
                      <p className="text-xs text-muted-foreground">No tagged hadiths in this category yet.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
