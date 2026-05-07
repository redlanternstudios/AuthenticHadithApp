import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { I18nManager } from 'react-native'
import { loadLanguagePreference, saveLanguagePreference, LanguageCode } from '../storage/language-storage'
import { initI18n } from './i18n'
import i18n from './i18n'

interface LanguageContextType {
  language: LanguageCode
  isRTL: boolean
  setLanguage: (lang: LanguageCode) => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

/**
 * LanguageProvider — loads stored language preference, configures i18next,
 * and provides language + RTL state to the component tree.
 *
 * RTL note: I18nManager.forceRTL triggers a full native RTL layout, but
 * requires an app restart to fully apply. We expose isRTL via context so
 * components can apply directional styles immediately without a restart.
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAndInit()
  }, [])

  const loadAndInit = async () => {
    try {
      const saved = await loadLanguagePreference()
      initI18n(saved)
      setLanguageState(saved)
      // Apply RTL preference (requires restart for full effect)
      const shouldBeRTL = saved === 'ar'
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL)
      }
    } catch {
      initI18n('en')
    } finally {
      setIsLoading(false)
    }
  }

  const setLanguage = async (lang: LanguageCode) => {
    setLanguageState(lang)
    await saveLanguagePreference(lang)
    await i18n.changeLanguage(lang)
    // RTL requires restart — we still set here so next launch applies fully
    I18nManager.forceRTL(lang === 'ar')
  }

  const value: LanguageContextType = {
    language,
    isRTL: language === 'ar',
    setLanguage,
  }

  // Don't render until language is resolved to avoid flash
  if (isLoading) {
    return null
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/**
 * Hook to access language context
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
