import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { filterVisibleCollections, HIDDEN_COLLECTION_FILTER } from '../lib/hadith/visibleCollections'

type CollectionRow = {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  description_en: string | null
  total_hadiths: number | null
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('name_en', { ascending: true })

      if (error) throw error
      // Drop release-hidden collections (e.g. the thin Musnad Ahmad seed) so no
      // consumer of this hook ever lists or links to them.
      return filterVisibleCollections(data as CollectionRow[] | null)
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
        .select('*')

      if (filters?.collectionId) {
        query = query.eq('collection_slug', filters.collectionId)
      } else if (HIDDEN_COLLECTION_FILTER) {
        // No specific collection requested → exclude release-hidden collections.
        query = query.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER)
      }

      if (filters?.bookId) {
        query = query.eq('book_number', Number(filters.bookId))
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
