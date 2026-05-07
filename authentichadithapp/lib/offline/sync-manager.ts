import { supabase } from '../supabase/client'
import { cacheHadith, getPopularHadiths } from './sqlite-db'

export async function syncPopularHadiths() {
  try {
    // Fetch most viewed hadiths from Supabase
    const { data: hadiths, error } = await supabase
      .from('hadiths')
      .select('*')
      .limit(100)

    if (error) throw error

    // Cache each hadith
    if (hadiths) {
      for (const hadith of hadiths) {
        await cacheHadith(hadith)
      }
    }

    return { success: true, count: hadiths?.length || 0 }
  } catch (error) {
    console.error('Sync error:', error)
    return { success: false, error }
  }
}

export async function getOfflineHadiths() {
  return await getPopularHadiths(100)
}
