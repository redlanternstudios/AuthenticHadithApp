export type HadithGrade = 'sahih' | 'hasan' | 'daif'

export interface Hadith {
  id: string
  hadith_number: string
  arabic_text: string
  english_text: string
  grade: HadithGrade
  collection_slug: string
  book_number?: number
  chapter_number?: number
  narrator?: string
  source?: string
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  slug: string
  name_en: string
  name_ar?: string
  description_en?: string
  total_hadiths: number
  scholar?: string
  image_url?: string
  created_at: string
}

export interface Book {
  id: string
  collection_id: string
  book_number: number
  name: string
  arabic_name?: string
  total_hadiths: number
}

export interface Chapter {
  id: string
  book_id: string
  chapter_number: number
  name: string
  arabic_name?: string
}

export interface SavedHadith {
  id: string
  user_id: string
  hadith_id: string
  notes?: string
  created_at: string
  hadith?: Hadith
}

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  school_of_thought?: string
  is_premium: boolean
  subscription_status?: 'active' | 'canceled' | 'past_due' | null
  created_at: string
  updated_at: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'scholar'
  estimated_hours: number
  is_premium: boolean
  sort_order: number
  created_at: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  content?: string
  order_index: number
  estimated_minutes: number
  created_at: string
}

export interface UserLessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface PromoCode {
  id: string
  code: string
  type: 'referral' | 'campaign'
  premium_days: number
  max_uses?: number
  current_uses: number
  created_by?: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface Redemption {
  id: string
  user_id: string
  promo_code_id: string
  redeemed_at: string
  promo_code?: PromoCode
}

export interface SearchFilters {
  collection?: string
  grade?: HadithGrade
  book?: number
}

export interface SearchResult extends Hadith {
  rank?: number
  highlight?: string
}
