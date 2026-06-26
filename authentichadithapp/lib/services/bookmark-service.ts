import { supabase } from '../supabase/client'

export class BookmarkService {
  static async add(hadithId: string, userId: string): Promise<void> {
    // FIX-119: upsert with ignoreDuplicates so double-tap / re-bookmark never
    // throws a Postgres 23505 unique violation on (user_id, hadith_id).
    const { error } = await supabase
      .from('saved_hadiths')
      .upsert(
        { hadith_id: hadithId, user_id: userId },
        { onConflict: 'user_id,hadith_id', ignoreDuplicates: true }
      )

    if (error) {
      throw new Error(`Failed to add bookmark: ${error.message}`)
    }
  }

  static async remove(hadithId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_hadiths')
      .delete()
      .eq('hadith_id', hadithId)
      .eq('user_id', userId)
    
    if (error) {
      throw new Error(`Failed to remove bookmark: ${error.message}`)
    }
  }

  // FIX-121: Two-query merge pattern per Golden Rule #1 / FIX-041-FOLLOW-UP.
  // Production saved_hadiths.hadith_id has NO FK constraint to hadiths.id, so
  // the PostgREST embed hadith:hadiths(*) returns PGRST200 and BookmarkService.getAll
  // was throwing on every call, making the Bookmarks screen show QueryErrorBanner
  // for any user who had bookmarks. Replaced with the same client-side merge used
  // in getFolderHadiths (lib/api/my-hadith.ts).
  static async getAll(userId: string) {
    // Step 1: fetch saved rows for this user
    const { data: savedRows, error: savedError } = await supabase
      .from('saved_hadiths')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (savedError) {
      __DEV__ && console.error('[BookmarkService.getAll] saved_hadiths fetch failed:', savedError)
      throw new Error(`Failed to fetch bookmarks: ${savedError.message}`)
    }

    if (!savedRows || savedRows.length === 0) {
      return []
    }

    // Step 2: collect unique hadith IDs and batch-fetch hadith content
    const hadithIds = Array.from(
      new Set(savedRows.map(row => row.hadith_id).filter((id): id is string => !!id))
    )

    if (hadithIds.length === 0) {
      return savedRows
    }

    const { data: hadithRows, error: hadithError } = await supabase
      .from('hadiths')
      .select('*')
      .in('id', hadithIds)

    if (hadithError) {
      __DEV__ && console.error('[BookmarkService.getAll] hadiths batch fetch failed:', hadithError)
      // Return saved rows without hadith data rather than failing entirely
      return savedRows
    }

    // Step 3: merge client-side
    const hadithById = new Map((hadithRows ?? []).map(h => [h.id, h]))
    return savedRows.map(row => ({
      ...row,
      hadith: hadithById.get(row.hadith_id) ?? undefined,
    }))
  }

  static async isBookmarked(hadithId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('saved_hadiths')
      .select('*')
      .eq('hadith_id', hadithId)
      .eq('user_id', userId)
      .maybeSingle()
    
    return !!data
  }
}
