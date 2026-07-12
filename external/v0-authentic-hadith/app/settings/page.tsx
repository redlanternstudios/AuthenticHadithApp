"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Bell, Moon, Globe, Shield, HelpCircle, Star, ChevronDown, Info, ChevronRight, Trash2, AlertTriangle, Loader2, Mail, Check } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
import { useLanguage, type LanguagePreference } from "@/hooks/use-language"

type ExpandedSection = "appearance" | "notifications" | "language" | "privacy" | "help" | null

export default function SettingsPage() {
  const router = useRouter()
  const { language, t, dir, setLanguage, isLoading: isLanguageLoading } = useLanguage()
  const [expanded, setExpanded] = useState<ExpandedSection>("appearance")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isSavingLanguage, setIsSavingLanguage] = useState(false)

  // Language options with translations
  const LANGUAGES = [
    { id: "english" as LanguagePreference, label: t("english"), sublabel: t("englishPrimary"), icon: "EN" },
    { id: "arabic" as LanguagePreference, label: t("arabic"), sublabel: t("arabicFirst"), icon: "ع" },
    { id: "both" as LanguagePreference, label: t("both"), sublabel: t("sideBySide"), icon: "EN/ع" },
  ]

  // Settings items with translations
  const settingsItems = [
    { id: "notifications" as const, icon: Bell, label: t("notifications"), description: t("notificationsDesc") },
    { id: "appearance" as const, icon: Moon, label: t("appearance"), description: t("appearanceDesc") },
    { id: "language" as const, icon: Globe, label: t("language"), description: t("languageDesc") },
    { id: "privacy" as const, icon: Shield, label: t("privacy"), description: t("privacyDesc") },
    { id: "help" as const, icon: HelpCircle, label: t("help"), description: t("helpDesc") },
  ]

  // Update language preference
  const handleLanguageChange = async (newLanguage: LanguagePreference) => {
    setIsSavingLanguage(true)
    await setLanguage(newLanguage)
    setIsSavingLanguage(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account")
        setIsDeleting(false)
        return
      }
      // Redirect to login after successful deletion
      router.push("/login")
    } catch {
      setDeleteError("An unexpected error occurred. Please try again.")
      setIsDeleting(false)
    }
  }

  const toggleSection = (id: ExpandedSection) => {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <div className={cn("min-h-screen bg-background", dir === "rtl" && "font-arabic")} dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", dir === "rtl" && "rotate-180")} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t("settings")}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-3">
          {settingsItems.map((item) => (
            <div key={item.id} className="rounded-xl overflow-hidden border border-border bg-card">
              {/* Section Header - clickable to expand/collapse */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleSection(item.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection(item.id) } }}
                className="w-full p-4 flex items-center gap-4 cursor-pointer active:bg-muted/50 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                    expanded === item.id ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Expanded Content - NOT inside a button, so child buttons work */}
              {expanded === item.id && (
                <div className="px-4 pb-4">
                  {item.id === "appearance" && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4 mt-3">
                        Choose how Authentic Hadith looks to you
                      </p>
                      <ThemeToggle variant="settings" />
                    </div>
                  )}

                  {item.id === "notifications" && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mt-3">
                        Notification preferences are managed through your device settings. To receive daily hadith reminders, make sure notifications are enabled for Authentic Hadith in your device&apos;s notification settings.
                      </p>
                    </div>
                  )}

                  {item.id === "language" && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mt-3 mb-4">
                        {t("languageChooseDesc")}
                      </p>
                      <div className="space-y-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            disabled={isSavingLanguage}
                            onClick={() => handleLanguageChange(lang.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                              "hover:border-[#C5A059]/50 disabled:opacity-50",
                              language === lang.id
                                ? "border-[#C5A059] bg-[#C5A059]/5"
                                : "border-border bg-background"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold",
                              language === lang.id
                                ? "bg-[#C5A059] text-white"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {lang.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-foreground">{lang.label}</div>
                              <div className="text-xs text-muted-foreground">{lang.sublabel}</div>
                            </div>
                            {language === lang.id && (
                              <Check className="w-5 h-5 text-[#C5A059]" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        {t("languageNote")}
                      </p>
                    </div>
                  )}

                  {item.id === "privacy" && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mt-3">
                        Your data is stored securely and encrypted. All personal data is only accessible to you.
                      </p>

                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Danger Zone
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          Permanently delete your account and all associated data including saved hadiths, bookmarks, reflections, progress, and achievements. This action cannot be undone.
                        </p>

                        {!showDeleteConfirm ? (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="mt-3 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
                          >
                            Delete My Account
                          </button>
                        ) : (
                          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Are you absolutely sure?
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {"Type"} <span className="font-mono font-semibold text-destructive">DELETE MY ACCOUNT</span> {"below to confirm."}
                                </p>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="Type DELETE MY ACCOUNT"
                              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 font-mono"
                              autoComplete="off"
                              disabled={isDeleting}
                            />

                            {deleteError && (
                              <p className="text-sm text-destructive">{deleteError}</p>
                            )}

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteConfirm(false)
                                  setDeleteConfirmText("")
                                  setDeleteError(null)
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || isDeleting}
                                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Permanently Delete"
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.id === "help" && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mt-3">
                        {"Need help? Contact us at support@authentichadith.app"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* About & Premium Links */}
        <Link
          href="/about"
          className="mt-3 w-full rounded-xl p-4 border border-border bg-card flex items-center gap-4 hover:border-[#C5A059]/50 active:bg-muted/50 transition-colors"
        >
          <div className="w-11 h-11 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-[#C5A059]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">About Authentic Hadith</h3>
            <p className="text-sm text-muted-foreground">Mission, sources, AI policy & more</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/contact"
          className="mt-3 w-full rounded-xl p-4 border border-border bg-card flex items-center gap-4 hover:border-[#C5A059]/50 active:bg-muted/50 transition-colors"
        >
          <div className="w-11 h-11 rounded-lg bg-[#1B5E43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-[#1B5E43] dark:text-[#6bb895]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">Contact Us</h3>
            <p className="text-sm text-muted-foreground">support@authentichadith.app</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className="mt-3 w-full rounded-xl p-4 border border-border bg-card flex items-center gap-4 hover:border-[#C5A059]/50 active:bg-muted/50 transition-colors text-left"
        >
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#E8C77D] flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Upgrade to Premium</h3>
            <p className="text-sm text-muted-foreground">AI explanations, advanced search & more</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </button>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Authentic Hadith v1.0.0</p>
          <p className="mt-1">Made with care for the Muslim community</p>
        </div>
      </main>
    </div>
  )
}
