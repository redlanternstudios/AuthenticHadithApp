"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sun,
  BookOpen,
  Sparkles,
  ChevronRight,
  Bookmark,
  Share2,
  RefreshCw,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getCleanTranslation, getCollectionDisplayName } from "@/lib/hadith-utils"
import { cn } from "@/lib/utils"
import { ShareBanner } from "@/components/share-banner"

interface Hadith {
  id: string
  arabic_text: string
  english_translation: string
  collection: string
  reference: string
  grade: string
  narrator: string
}

const DAILY_ACTIONS = [
  { text: 'Smile at someone today. The Prophet (peace be upon him) said: "Your smiling in the face of your brother is charity."', ref: "Jami at-Tirmidhi 1956" },
  { text: 'Say "Bismillah" before eating. The Prophet (peace be upon him) said: "When any of you eats, let him mention the name of Allah."', ref: "Sahih Muslim 2017" },
  { text: 'Remove something harmful from the path. The Prophet (peace be upon him) said: "Removing harmful things from the road is an act of charity."', ref: "Sahih Muslim 1009" },
  { text: 'Greet someone you don\'t know with Salam. The Prophet (peace be upon him) was asked: "What is the best Islam?" He said: "Feeding others and greeting those you know and those you do not know."', ref: "Sahih al-Bukhari 12" },
  { text: 'Make du\'a for someone in their absence. The Prophet (peace be upon him) said: "The supplication of a Muslim for his brother in his absence will certainly be answered."', ref: "Sahih Muslim 2733" },
  { text: 'Give water to someone thirsty. The Prophet (peace be upon him) said: "The best charity is giving water to drink."', ref: "Musnad Ahmad 6657" },
  { text: 'Be patient with a difficulty today. The Prophet (peace be upon him) said: "No fatigue, nor disease, nor anxiety... afflicts a Muslim, even if it were the prick of a thorn, but Allah expiates some of his sins for that."', ref: "Sahih al-Bukhari 5641" },
  { text: 'Forgive someone who wronged you. The Prophet (peace be upon him) said: "Be merciful to others and you will receive mercy."', ref: "Musnad Ahmad 7001" },
  { text: 'Visit or call someone who is sick. The Prophet (peace be upon him) said: "When a Muslim visits a sick Muslim in the morning, seventy thousand angels send blessings upon him until evening."', ref: "Jami at-Tirmidhi 969" },
  { text: 'Share a meal with your neighbor. The Prophet (peace be upon him) said: "He is not a believer whose stomach is filled while the neighbour to his side goes hungry."', ref: "Al-Adab Al-Mufrad 112" },
  { text: 'Lower your gaze and guard your modesty. Allah says: "Tell the believing men to lower their gaze and guard their private parts."', ref: "Surah An-Nur 24:30" },
  { text: 'Sit in a gathering of remembrance. The Prophet (peace be upon him) said: "No people sit in a gathering remembering Allah, but the angels surround them."', ref: "Sahih Muslim 2700" },
  { text: 'Help someone carry their load. The Prophet (peace be upon him) said: "Helping a man with his mount, lifting him onto it or helping lift his belongings onto it, is charity."', ref: "Sahih al-Bukhari 2989" },
  { text: 'Recite Surah Al-Kahf (or part of it). The Prophet (peace be upon him) said: "Whoever reads Surah Al-Kahf on Friday will have a light between the two Fridays."', ref: "Sunan an-Nasai 6401" },
]

function getDailyAction(): { text: string; ref: string } {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  return DAILY_ACTIONS[dayOfYear % DAILY_ACTIONS.length]
}

export default function TodayPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [sunnah, setSunnah] = useState<{ title: string; description: string; category: string; source_reference: string } | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)

        const res = await fetch("/api/daily-hadith")
        const data = await res.json()
        if (data.hadith) {
          setHadith(data.hadith)
          if (user) {
            const { data: saved } = await supabase
              .from("saved_hadiths")
              .select("id")
              .eq("user_id", user.id)
              .eq("hadith_id", data.hadith.id)
              .maybeSingle()
            setIsSaved(!!saved)
          }
        }
        // Fetch today's sunnah
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
        const { data: sunnahData } = await supabase
          .from("sunnah_practices")
          .select("title, description, category, source_reference")
          .eq("day_of_year", dayOfYear)
          .single()
        if (sunnahData) setSunnah(sunnahData)
      } catch {
        // Failed to load
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = async () => {
    if (!userId || !hadith) return
    if (isSaved) {
      await supabase.from("saved_hadiths").delete().eq("user_id", userId).eq("hadith_id", hadith.id)
    } else {
      await supabase.from("saved_hadiths").insert({ user_id: userId, hadith_id: hadith.id })
    }
    setIsSaved(!isSaved)
  }

  const handleShare = async () => {
    if (!hadith) return
    const text = getCleanTranslation(hadith.english_translation)
    if (navigator.share) {
      await navigator.share({ title: "Hadith of the Day", text, url: `${window.location.origin}/hadith/${hadith.id}` })
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

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
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Sun className="w-6 h-6 text-[#C5A059]" />
            <h1 className="text-xl font-bold text-foreground">Today</h1>
          </div>
          <p className="text-sm text-muted-foreground">{todayDate}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Hadith of the Day */}
        {hadith && (
          <section className="premium-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Hadith of the Day</span>
            </div>

            {/* Arabic */}
            <p className="text-lg leading-loose text-foreground font-serif text-right mb-4" dir="rtl">
              {hadith.arabic_text}
            </p>

            {/* English */}
            <p className="text-sm leading-relaxed text-foreground/80 mb-4">
              {getCleanTranslation(hadith.english_translation)}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                hadith.grade === "sahih" ? "bg-[#1B5E43]/10 text-[#1B5E43]" :
                hadith.grade === "hasan" ? "bg-[#C5A059]/10 text-[#C5A059]" :
                "bg-red-50 text-red-600"
              )}>
                {hadith.grade}
              </span>
              <span className="text-xs text-muted-foreground">
                {getCollectionDisplayName(hadith.collection)} - {hadith.reference}
              </span>
            </div>
            {hadith.narrator && (
              <p className="text-xs text-muted-foreground italic mb-4">
                Narrated by {hadith.narrator}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  isSaved ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-muted text-muted-foreground hover:bg-muted"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                {isSaved ? "Saved" : "Save"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => router.push(`/hadith/${hadith.id}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors ml-auto"
              >
                Read more
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* Reflection Prompt */}
        <section className="premium-card rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-2">Reflection</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            How does today's hadith relate to a challenge you are currently facing? Take a moment to reflect.
          </p>
          <button
            onClick={() => router.push("/reflections")}
            className="text-xs font-medium text-[#C5A059] hover:text-[#8A6E3A] transition-colors flex items-center gap-1"
          >
            Write a reflection
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Today's Sunnah */}
        {sunnah && (
          <section className="premium-card gold-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Today's Sunnah</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1B5E43]/10 text-[#1B5E43] capitalize">
                {sunnah.category}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{sunnah.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{sunnah.description}</p>
            {sunnah.source_reference && (
              <p className="text-[10px] text-muted-foreground/60 italic">{sunnah.source_reference}</p>
            )}
            <button
              onClick={() => router.push("/sunnah")}
              className="mt-3 text-xs font-medium text-[#C5A059] hover:text-[#8A6E3A] transition-colors flex items-center gap-1"
            >
              View all sunnah practices
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </section>
        )}

        {/* Small Action */}
        <section className="premium-card rounded-xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-2">Today's Small Action</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getDailyAction().text}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2 italic">{getDailyAction().ref}</p>
        </section>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/sunnah")}
            className="premium-card rounded-xl p-4 text-left hover:shadow-md transition-shadow"
          >
            <BookOpen className="w-5 h-5 text-[#1B5E43] mb-2" />
            <p className="text-sm font-semibold text-foreground">Daily Sunnah</p>
            <p className="text-xs text-muted-foreground mt-0.5">Lived practice</p>
          </button>
          <button
            onClick={() => router.push("/stories")}
            className="premium-card rounded-xl p-4 text-left hover:shadow-md transition-shadow"
          >
            <RefreshCw className="w-5 h-5 text-[#C5A059] mb-2" />
            <p className="text-sm font-semibold text-foreground">Stories</p>
            <p className="text-xs text-muted-foreground mt-0.5">The Companions</p>
          </button>
        </div>

        {/* Share prompt */}
        <ShareBanner variant="compact" className="mt-6" />
      </main>
    </div>
  )
}
