"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/hooks/use-language"
import type { TranslationKey } from "@/lib/i18n/translations"
import {
  Home,
  BookOpen,
  Search,
  Bot,
  User,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bookmark,
  Sun,
  Moon,
  Heart,
  Users,
  PenLine,
  BarChart3,
  HelpCircle,
  Tags,
  Star,
  Trophy,
  Info,
} from "lucide-react"

interface NavGroup {
  labelKey: TranslationKey | ""
  items: NavItem[]
}

interface NavItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  labelKey: TranslationKey
  href: string
  iconColor?: string // resting color class
  iconHover?: string // hover color class
}

const navGroups: NavGroup[] = [
  {
    labelKey: "",
    items: [{ id: "home", icon: Home, labelKey: "home", href: "/home", iconColor: "text-[#c5a059]/70", iconHover: "group-hover:text-[#c5a059]" }],
  },
  {
    labelKey: "study",
    items: [
      { id: "collections", icon: BookOpen, labelKey: "collections", href: "/collections", iconColor: "text-[#1b5e43]/60", iconHover: "group-hover:text-[#1b5e43]" },
      { id: "topics", icon: Tags, labelKey: "topics", href: "/topics", iconColor: "text-[#e8c77d]/80", iconHover: "group-hover:text-[#c5a059]" },
      { id: "sunnah", icon: Heart, labelKey: "sunnah", href: "/sunnah", iconColor: "text-[#c5a059]/60", iconHover: "group-hover:text-[#c5a059]" },
      { id: "learn", icon: GraduationCap, labelKey: "learningPaths", href: "/learn", iconColor: "text-[#2d7a5b]/60", iconHover: "group-hover:text-[#1b5e43]" },
      { id: "stories", icon: Users, labelKey: "stories", href: "/stories" },
    ],
  },
  {
    labelKey: "daily",
    items: [
      { id: "today", icon: Sun, labelKey: "today", href: "/today", iconColor: "text-[#e8c77d]/80", iconHover: "group-hover:text-[#c5a059]" },
      { id: "reflections", icon: PenLine, labelKey: "reflections", href: "/reflections" },
      { id: "progress", icon: BarChart3, labelKey: "progress", href: "/progress", iconColor: "text-[#2d7a5b]/60", iconHover: "group-hover:text-[#1b5e43]" },
    ],
  },
  {
    labelKey: "personal",
    items: [
      { id: "my-hadith", icon: Star, labelKey: "myHadith", href: "/my-hadith", iconColor: "text-[#c5a059]/70", iconHover: "group-hover:text-[#c5a059]" },
      { id: "achievements", icon: Trophy, labelKey: "achievements", href: "/achievements", iconColor: "text-[#e8c77d]/80", iconHover: "group-hover:text-[#c5a059]" },
      { id: "saved", icon: Bookmark, labelKey: "saved", href: "/saved" },
    ],
  },
  {
    labelKey: "tools",
    items: [
      { id: "search", icon: Search, labelKey: "search", href: "/search" },
      { id: "assistant", icon: Bot, labelKey: "assistant", href: "/assistant", iconColor: "text-[#1b5e43]/60", iconHover: "group-hover:text-[#1b5e43]" },
      { id: "quiz", icon: HelpCircle, labelKey: "quiz", href: "/quiz" },
    ],
  },
]

const bottomNavItems: { id: string; icon: typeof User; labelKey: TranslationKey; href: string }[] = [
  { id: "profile", icon: User, labelKey: "profile", href: "/profile" },
  { id: "settings", icon: Settings, labelKey: "settings", href: "/settings" },
  { id: "about", icon: Info, labelKey: "about", href: "/about" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const { t, dir } = useLanguage()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("user_id", user.id)
            .single()
          if (profile) {
            setUserName(profile.name)
            setUserAvatar(profile.avatar_url)
          }
        }
      } catch {
        /* ignore */
      }
    }
    fetchUser()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      await supabase.auth.signOut({ scope: "global" })
    } catch {
      /* ignore */
    }
    document.cookie = "qbos_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
    router.refresh()
  }

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <aside
      className={cn(
        "fixed top-0 z-50 h-screen bg-card",
        "hidden xl:flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
        dir === "rtl" ? "right-0 border-l border-border font-arabic" : "left-0 border-r border-border",
      )}
      dir={dir}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 border-b border-border",
          collapsed ? "justify-center" : "px-4",
        )}
      >
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src="/images/gemini-generated-image-xw5svjxw5svjxw5s.jpeg"
            alt={t("authenticHadith")}
            fill
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold gold-text text-base leading-tight truncate">
              {t("authenticHadith")}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {t("verifiedSources")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={group.labelKey || `group-${groupIdx}`} className={cn(groupIdx > 0 && "mt-2")}>
            {group.labelKey && !collapsed && (
              <div className="px-5 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {t(group.labelKey)}
                </span>
              </div>
            )}
            {group.labelKey && collapsed && <div className="mx-4 my-1 border-t border-border/50" />}
            <ul className="space-y-0.5 px-3">
              {group.items.map((item) => {
                const isActive = isItemActive(item.href)
                const label = t(item.labelKey)
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "transition-all duration-200 group",
                        isActive
                          ? "bg-gradient-to-r from-[#C5A059]/15 to-[#E8C77D]/10 text-[#8A6E3A]"
                          : "text-foreground hover:bg-muted",
                        collapsed && "justify-center px-0",
                      )}
                      title={collapsed ? label : undefined}
                    >
                      {isActive && (
                        <div className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-[#C5A059] to-[#E8C77D]",
                          dir === "rtl" ? "right-0" : "left-0"
                        )} />
                      )}
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors",
                          isActive
                            ? "text-[#C5A059]"
                            : item.iconColor
                              ? cn(item.iconColor, item.iconHover)
                              : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {!collapsed && (
                        <span className={cn("font-medium text-sm whitespace-nowrap", isActive && "gold-text")}>
                          {label}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border">
        <ul className="py-2 px-3 space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            const label = t(item.labelKey)
            return (
              <li key={item.id}>
                <button
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                    "transition-all duration-200 group",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                  title={collapsed ? label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
                </button>
              </li>
            )
          })}
          {/* Theme toggle - always visible under About */}
          {mounted && (
            <li>
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                  "transition-all duration-200 group",
                  "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? (resolvedTheme === "dark" ? t("lightMode") : t("darkMode")) : undefined}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="w-5 h-5 flex-shrink-0 text-[#C5A059]" />
                ) : (
                  <Moon className="w-5 h-5 flex-shrink-0" />
                )}
                {!collapsed && (
                  <span className="text-sm whitespace-nowrap">
                    {resolvedTheme === "dark" ? t("lightMode") : t("darkMode")}
                  </span>
                )}
              </button>
            </li>
          )}
        </ul>

        {/* User */}
        <div className={cn("p-3 border-t border-border", collapsed && "flex justify-center")}>
          {collapsed ? (
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C5A059]/30 hover:border-[#C5A059] transition-colors"
            >
              {userAvatar ? (
                <img src={userAvatar || "/placeholder.svg"} alt={t("profile")} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/profile")}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C5A059]/30 hover:border-[#C5A059] transition-colors flex-shrink-0"
              >
                {userAvatar ? (
                  <img src={userAvatar || "/placeholder.svg"} alt={t("profile")} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName || t("user")}</p>
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1",
                    dir === "rtl" && "flex-row-reverse"
                  )}
                >
                  <LogOut className="w-3 h-3" />
                  {t("signOut")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapse */}
        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-lg",
              "text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
            )}
            aria-label={collapsed ? t("expand") : t("collapse")}
          >
            {collapsed ? (
              dir === "rtl" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                {dir === "rtl" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                <span className="text-xs">{t("collapse")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
