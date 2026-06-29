"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  X,
  Tags,
  Heart,
  GraduationCap,
  Users,
  PenLine,
  BarChart3,
  Trophy,
  Bookmark,
  Search,
  HelpCircle,
  Info,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/hooks/use-language"
import type { TranslationKey } from "@/lib/i18n/translations"

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

type DrawerItem = { icon: typeof Tags; labelKey: TranslationKey; href: string }
type DrawerGroup = { labelKey: TranslationKey; items: DrawerItem[] }

const drawerGroups: DrawerGroup[] = [
  {
    labelKey: "study",
    items: [
      { icon: Tags, labelKey: "topics", href: "/topics" },
      { icon: Heart, labelKey: "sunnah", href: "/sunnah" },
      { icon: GraduationCap, labelKey: "learningPaths", href: "/learn" },
      { icon: Users, labelKey: "stories", href: "/stories" },
    ],
  },
  {
    labelKey: "daily",
    items: [
      { icon: PenLine, labelKey: "reflections", href: "/reflections" },
      { icon: BarChart3, labelKey: "progress", href: "/progress" },
    ],
  },
  {
    labelKey: "personal",
    items: [
      { icon: Trophy, labelKey: "achievements", href: "/achievements" },
      { icon: Bookmark, labelKey: "saved", href: "/saved" },
    ],
  },
  {
    labelKey: "tools",
    items: [
      { icon: Search, labelKey: "search", href: "/search" },
      { icon: HelpCircle, labelKey: "quiz", href: "/quiz" },
    ],
  },
  {
    labelKey: "account",
    items: [
      { icon: User, labelKey: "profile", href: "/profile" },
      { icon: Settings, labelKey: "settings", href: "/settings" },
      { icon: Info, labelKey: "about", href: "/about" },
    ],
  },
]

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { t, dir } = useLanguage()

  // Close drawer on route change
  useEffect(() => {
    if (open) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await fetch("/api/auth/signout", { method: "POST" })
    await supabase.auth.signOut({ scope: "global" })
    document.cookie = "ah_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
    router.refresh()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm xl:hidden cursor-default"
          onClick={onClose}
          aria-label={t("closeMenu")}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed top-0 z-[70] h-full w-[280px] bg-card shadow-xl",
          "transform transition-transform duration-300 ease-in-out xl:hidden",
          "overflow-y-auto",
          dir === "rtl" ? "left-0 border-r border-border font-arabic" : "right-0 border-l border-border",
          dir === "rtl" 
            ? (open ? "translate-x-0" : "-translate-x-full")
            : (open ? "translate-x-0" : "translate-x-full"),
        )}
        dir={dir}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{t("menu")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
            aria-label={t("cancel")}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="py-2">
          {drawerGroups.map((group) => (
            <div key={group.labelKey} className="px-3 py-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {t(group.labelKey)}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <button
                    type="button"
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                      "min-h-[44px]",
                      dir === "rtl" ? "text-right" : "text-left",
                      isActive
                        ? "bg-[#C5A059]/10 text-[#C5A059]"
                        : "text-foreground hover:bg-muted/50 active:bg-muted",
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#C5A059]" : "text-muted-foreground")} />
                    <span className={cn("text-sm", isActive && "font-semibold")}>{t(item.labelKey)}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Theme Toggle */}
        <div className="px-6 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] text-foreground hover:bg-muted/50 active:bg-muted",
              dir === "rtl" ? "text-right" : "text-left"
            )}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5 text-[#C5A059] shrink-0" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm">{resolvedTheme === "dark" ? t("lightMode") : t("darkMode")}</span>
          </button>
        </div>

        {/* Sign Out */}
        <div className="px-6 py-3 border-t border-border">
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100",
              dir === "rtl" ? "text-right" : "text-left"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm">{t("signOut")}</span>
          </button>
        </div>
      </div>
    </>
  )
}
