import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase/client'
import type { Hadith } from '../../types/hadith'

const STATIC_FALLBACK: Record<string, string> = {
  'sahih-bukhari': 'Sahih al-Bukhari',
  'sahih-muslim': 'Sahih Muslim',
  'sunan-abu-dawud': 'Sunan Abu Dawud',
  'jami-tirmidhi': 'Jami at-Tirmidhi',
  'sunan-nasai': "Sunan an-Nasa'i",
  'sunan-ibn-majah': 'Sunan Ibn Majah',
  'muwatta-malik': 'Muwatta Malik',
  'musnad-ahmad': 'Musnad Ahmad',
}

export type CollectionNameMap = Record<string, string>

export function useCollectionDisplayNames() {
  return useQuery<CollectionNameMap>({
    queryKey: ['collection-display-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('slug, name_en')
      if (error || !data) return {}
      return data.reduce<CollectionNameMap>((acc, row: any) => {
        if (row?.slug && row?.name_en) acc[row.slug] = row.name_en
        return acc
      }, {})
    },
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function getCollectionDisplayName(
  slug: string | undefined | null,
  namesByKey?: CollectionNameMap,
): string {
  if (!slug) return ''
  return namesByKey?.[slug] ?? STATIC_FALLBACK[slug] ?? slug
}

export function formatHadithReference(
  hadith: Pick<Hadith, 'collection_slug' | 'hadith_number'> | null | undefined,
  namesByKey?: CollectionNameMap,
): string {
  if (!hadith) return ''
  const name = getCollectionDisplayName(hadith.collection_slug, namesByKey)
  if (!name) return `#${hadith.hadith_number}`
  return `${name} #${hadith.hadith_number}`
}