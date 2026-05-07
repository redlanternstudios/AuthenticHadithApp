import AsyncStorage from '@react-native-async-storage/async-storage'

const LANGUAGE_KEY = 'user-language-preference'

export type LanguageCode = 'en' | 'ar'

/**
 * Save user's language preference
 */
export async function saveLanguagePreference(lang: LanguageCode): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang)
  } catch (error) {
    console.error('Failed to save language preference:', error)
  }
}

/**
 * Load user's language preference
 * Returns 'en' as default if no preference is saved
 */
export async function loadLanguagePreference(): Promise<LanguageCode> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY)
    return (lang === 'ar' ? 'ar' : 'en') as LanguageCode
  } catch (error) {
    console.error('Failed to load language preference:', error)
    return 'en'
  }
}
