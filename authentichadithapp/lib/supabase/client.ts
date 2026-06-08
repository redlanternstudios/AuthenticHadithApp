import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { normalizeApiBaseUrl } from '@/lib/config/constants'

// Supabase client config must come from Expo public env / config only.
// Do not keep project URLs or anon JWT fallbacks in source; even client-safe
// keys create scanner noise and can hide broken EAS environment injection.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  ''
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Set them in .env.local for dev and EAS production env before building.'
  )
}

// API Configuration
export const API_CONFIG = {
  baseUrl: normalizeApiBaseUrl(Constants.expoConfig?.extra?.apiUrl),
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return await AsyncStorage.getItem(key)
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      await AsyncStorage.setItem(key, value)
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {
      await AsyncStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types
export type Hadith = {
  id: string
  collection_id: string
  book_id: string
  hadith_number: string
  arabic_text: string
  english_text: string
  narrator: string
  grade: string
  created_at: string
}

export type Collection = {
  id: string
  name_en: string
  name_ar: string
  description_en: string
  total_hadiths: number
}

export type SavedHadith = {
  id: string
  user_id: string
  hadith_id: string
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}
