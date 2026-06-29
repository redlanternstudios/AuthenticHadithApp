"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { Home, BookOpen, Sun, Bot, Star, Menu } from "lucide-react"
import { MobileDrawer } from "@/components/layout/mobile-drawer"
import { useLanguage } from "@/hooks/use-language"
import type { TranslationKey } from "@/lib/i18n/translations"

const navItems: { id: string; icon: typeof Home; labelKey: TranslationKey; href: string }[] = [
  { id: "home", icon: Home, labelKey: "home", href: "/home" },
  { id: "collections", icon: BookOpen, labelKey: "study", href: "/collections" },
  { id: "today", icon: Sun, labelKey: "today", href: "/today" },
  { id: "assistant", icon: Bot, labelKey: "chat", href: "/assistant" },
  { id: "my-hadith", icon: Star, labelKey: "myHadith", href: "/my-hadith" },
]

const excludedPaths = ["/", "/login", "/onboarding", "/reset-password"]

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, dir } = useLanguage()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), [])

  const isExcluded = excludedPaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path)))

  if (isExcluded) {
    return null
  }

  return (
    <>
      <nav className={cn("fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.1)] xl:hidden", dir === "rtl" && "font-arabic")} dir={dir}>
        <div className="flex items-center justify-around h-[72px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const label = t(item.labelKey)
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => router.push(item.href)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
                  "transition-colors",
                )}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-gradient-to-r from-[#C5A059] to-[#E8C77D]" />
                )}
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#C5A059]" : "text-foreground")} />
                <span
                  className={cn(
                    "text-[10px] transition-colors",
                    isActive ? "text-[#C5A059] font-bold" : "text-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
            )
          })}

          {/* More tab - opens drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
              "transition-colors",
            )}
            aria-label={t("more")}
          >
            <Menu className="w-5 h-5 text-foreground" />
            <span className="text-[10px] text-foreground">{t("more")}</span>
          </button>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={handleCloseDrawer} />
    </>
  )
}
