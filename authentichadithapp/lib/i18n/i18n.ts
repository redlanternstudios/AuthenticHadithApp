import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './translations/en.json'
import ar from './translations/ar.json'

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
}

/**
 * Initialize i18next. Called once by LanguageProvider on app start.
 * Default language is 'en'; LanguageProvider updates it after loading stored preference.
 */
export function initI18n(initialLanguage: 'en' | 'ar' = 'en') {
  if (i18n.isInitialized) {
    // Already initialized — just change language
    if (i18n.language !== initialLanguage) {
      i18n.changeLanguage(initialLanguage)
    }
    return
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    })
}

export default i18n
