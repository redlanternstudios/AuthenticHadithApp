"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getTranslation, getTextDirection, type TranslationKey, type Language } from "@/lib/i18n/translations"

export type LanguagePreference = Language

interface UseLanguageReturn {
  language: LanguagePreference
  isArabicPrimary: boolean
  showBoth: boolean
  isLoading: boolean
  dir: "rtl" | "ltr"
  t: (key: TranslationKey) => string
  setLanguage: (lang: LanguagePreference) => Promise<void>
}

export function useLanguage(): UseLanguageReturn {
  const supabase = createClient()

  const { data, isLoading, mutate } = useSWR(
    "user-language-preference",
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { language: "english" as LanguagePreference }

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("language")
        .eq("user_id", user.id)
        .single()

      return { language: (prefs?.language || "english") as LanguagePreference }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  const language = data?.language || "english"
  
  // Translation function
  const t = (key: TranslationKey): string => getTranslation(key, language)
  
  // Text direction
  const dir = getTextDirection(language)

  const setLanguage = async (newLang: LanguagePreference) => {
    // Optimistically update
    mutate({ language: newLang }, false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        language: newLang,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    // Revalidate
    mutate()
  }

  return {
    language,
    isArabicPrimary: language === "arabic",
    showBoth: language === "both",
    isLoading,
    dir,
    t,
    setLanguage,
  }
}

// Helper to get display order based on language preference
export function getTextOrder(language: LanguagePreference): "arabic-first" | "english-first" | "both" {
  if (language === "arabic") return "arabic-first"
  if (language === "both") return "both"
  return "english-first"
}
