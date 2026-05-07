import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('name_en', { ascending: true })
      
      if (error) throw error
      return data
    },
  })
}

export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          books(*)
        `)
        .eq('id', collectionId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!collectionId,
  })
}

export function useHadiths(filters?: {
  collectionId?: string
  bookId?: string
  searchQuery?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['hadiths', filters],
    queryFn: async () => {
      let query = supabase
        .from('hadiths')
        .select(`
          *,
          collection:collections(name_en, name_ar),
          book:books(name)
        `)
      
      if (filters?.collectionId) {
        query = query.eq('collection_id', filters.collectionId)
      }
      
      if (filters?.bookId) {
        query = query.eq('book_id', filters.bookId)
      }
      
      if (filters?.searchQuery) {
        query = query.or(`english_text.ilike.%${filters.searchQuery}%,arabic_text.ilike.%${filters.searchQuery}%`)
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      
      const { data, error } = await query.order('hadith_number', { ascending: true })
      
      if (error) throw error
      return data
    },
  })
}
