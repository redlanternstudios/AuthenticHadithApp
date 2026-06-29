"use client"

import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import type { TranslationKey } from "@/lib/i18n/translations"

// Root-level pages where back button should NOT appear
const rootPages = ["/home", "/collections", "/today", "/assistant", "/my-hadith"]

// Pages excluded from showing the top bar entirely
const excludedPaths = ["/", "/login", "/onboarding", "/reset-password", "/checkout/success"]

// Map routes to translation keys
const routeTranslationKeys: Record<string, TranslationKey> = {
  home: "home",
  collections: "collections",
  today: "today",
  assistant: "assistant",
  "my-hadith": "myHadith",
  search: "search",
  saved: "saved",
  quiz: "quiz",
  topics: "topics",
  sunnah: "sunnah",
  learn: "learningPaths",
  stories: "stories",
  reflections: "reflections",
  progress: "progress",
  achievements: "achievements",
  profile: "profile",
  settings: "settings",
  pricing: "subscription",
  hadith: "hadith",
  share: "shareHadith",
  dashboard: "progress",
  about: "about",
}

// Fallback capitalize for unknown routes
function capitalize(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function MobileTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, dir } = useLanguage()

  const isExcluded = excludedPaths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(path))
  )

  if (isExcluded) return null

  const isRootPage = rootPages.includes(pathname)
  const isHomePage = pathname === "/home"
  
  // Get translation key for the current route
  const getPageTitle = (): string => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return ""

    const firstSegment = segments[0]
    const translationKey = routeTranslationKeys[firstSegment]
    
    if (translationKey) {
      return t(translationKey)
    }

    // For deeply nested routes like /collections/bukhari/books/1/chapters/2
    if (firstSegment === "collections") {
      if (segments.includes("chapters")) return t("hadith")
      if (segments.includes("books")) return t("collections")
      return t("collections")
    }

    return capitalize(firstSegment)
  }

  const title = getPageTitle()
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center h-12 px-2 bg-card/95 backdrop-blur-sm border-b border-border",
        "xl:hidden", // Show on mobile and tablets, hide on desktop
        dir === "rtl" && "font-arabic flex-row-reverse"
      )}
      dir={dir}
    >
      {/* Back button - hidden on root pages */}
      <div className="w-10 flex items-center justify-center">
        {!isRootPage && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
            aria-label={t("back")}
          >
            <BackIcon className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-semibold text-foreground truncate px-2">
          {title}
        </h1>
      </div>

      {/* Home button - always visible, hidden on home page itself */}
      <div className="w-10 flex items-center justify-center">
        {!isHomePage && (
          <button
            onClick={() => router.push("/home")}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
            aria-label={t("home")}
          >
            <Home className="w-5 h-5 text-[#C5A059]" />
          </button>
        )}
      </div>
    </header>
  )
}
