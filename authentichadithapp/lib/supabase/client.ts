import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { PRODUCTION_API_URL } from '@/lib/config/constants'

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 'https://nqklipakrfuwebkdnhwg.supabase.co'
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2xpcGFrcmZ1d2Via2RuaHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODA3NDUsImV4cCI6MjA4Mzg1Njc0NX0.yhIe3hqiLlyF8atvSmNOL3HBq91V9Frw5jYcat-sZxY'

// API Configuration
export const API_CONFIG = {
  baseUrl: Constants.expoConfig?.extra?.apiUrl || PRODUCTION_API_URL,
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
  name: string
  arabic_name: string
  description: string
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
