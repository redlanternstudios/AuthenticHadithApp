import { supabase } from '../supabase/client'

export class BookmarkService {
  static async add(hadithId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_hadiths')
      .insert({
        hadith_id: hadithId,
        user_id: userId,
      })
    
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

  static async getAll(userId: string) {
    const { data, error } = await supabase
      .from('saved_hadiths')
      .select(`
        *,
        hadith:hadiths(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch bookmarks: ${error.message}`)
    }
    
    return data
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
