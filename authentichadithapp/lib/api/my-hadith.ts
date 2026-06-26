import { supabase } from '@/lib/supabase/client'
import type { HadithFolder, SavedHadithWithNotes } from '@/types/my-hadith'

// Folders
export async function getUserFolders(userId: string) {
  const { data, error } = await supabase
    .from('hadith_folders')
    .select(`
      *,
      saved_hadiths(count)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data as HadithFolder[]
}

export async function createFolder(folder: Partial<HadithFolder>) {
  const { data, error } = await supabase
    .from('hadith_folders')
    .insert(folder)
    .select()
    .single()
  
  if (error) throw error
  return data as HadithFolder
}

export async function updateFolder(id: string, updates: Partial<HadithFolder>) {
  const { data, error } = await supabase
    .from('hadith_folders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as HadithFolder
}

export async function deleteFolder(id: string) {
  const { error } = await supabase
    .from('hadith_folders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Saved Hadiths
// FIX-119: userId passed from caller (auth context in hook) to eliminate the
// getUser() race condition that was sending undefined user_id on stale sessions.
// Also changed to upsert so repeated saves (double-tap, re-open modal) silently
// update folder/notes rather than throwing a Postgres 23505 unique violation.
export async function saveHadithToFolder(
  userId: string,
  hadithId: string,
  folderId?: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('saved_hadiths')
    .upsert(
      {
        user_id: userId,
        hadith_id: hadithId,
        folder_id: folderId,
        notes,
        notes_html: notes,
      },
      { onConflict: 'user_id,hadith_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as SavedHadithWithNotes
}

export async function updateSavedHadithNotes(
  savedHadithId: string,
  notes: string
) {
  const { data, error } = await supabase
    .from('saved_hadiths')
    .update({ 
      notes, 
      notes_html: notes,
      last_edited_at: new Date().toISOString()
    })
    .eq('id', savedHadithId)
    .select()
    .single()
  
  if (error) throw error
  return data as SavedHadithWithNotes
}

// Golden Rule #1: the production saved_hadiths.hadith_id has no FK constraint
// to hadiths.id, so PostgREST embeds (hadiths(*) / hadith:hadiths(*)) fail
// with PGRST200. Fetch saved rows and hadith rows separately, then merge.
export async function getFolderHadiths(folderId: string) {
  const { data: savedRows, error: savedError } = await supabase
    .from('saved_hadiths')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })

  if (savedError) {
    __DEV__ && console.error('getFolderHadiths saved_hadiths failed:', { folderId, error: savedError })
    throw savedError
  }

  if (!savedRows || savedRows.length === 0) {
    return [] as SavedHadithWithNotes[]
  }

  const hadithIds = Array.from(
    new Set(savedRows.map(row => row.hadith_id).filter((id): id is string => !!id))
  )

  if (hadithIds.length === 0) {
    return savedRows as SavedHadithWithNotes[]
  }

  const { data: hadithRows, error: hadithError } = await supabase
    .from('hadiths')
    .select('*')
    .in('id', hadithIds)

  if (hadithError) {
    __DEV__ && console.error('getFolderHadiths hadiths failed:', { folderId, hadithIds, error: hadithError })
    return savedRows as SavedHadithWithNotes[]
  }

  const hadithById = new Map((hadithRows ?? []).map(h => [h.id, h]))
  return savedRows.map(row => ({
    ...row,
    hadith: hadithById.get(row.hadith_id),
  })) as SavedHadithWithNotes[]
}

// Sharing
export async function generateShareToken(folderId: string, privacy: 'public' | 'unlisted' = 'unlisted') {
  const { data, error: rpcError } = await supabase.rpc('generate_share_token')
  
  if (rpcError) {
    __DEV__ && console.error('Failed to generate share token:', rpcError)
    throw rpcError
  }
  
  const token = data as string
  
  try {
    await updateFolder(folderId, { share_token: token, privacy })
    return token
  } catch (error) {
    __DEV__ && console.error('Failed to update folder with share token:', error)
    throw error
  }
}

export async function getFolderByShareToken(token: string) {
  const { data: folder, error: folderError } = await supabase
    .from('hadith_folders')
    .select('*')
    .eq('share_token', token)
    .single()

  if (folderError) {
    __DEV__ && console.error('getFolderByShareToken failed:', { token, error: folderError })
    throw folderError
  }

  const savedHadiths = await getFolderHadiths(folder.id)
  return { ...folder, saved_hadiths: savedHadiths } as HadithFolder
}

// Comments
export async function addComment(savedHadithId: string, comment: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    throw new Error('Authentication required')
  }

  const { data, error } = await supabase
    .from('folder_comments')
    .insert({
      saved_hadith_id: savedHadithId,
      user_id: authData.user.id,
      comment
    })
    .select()
    .single()

  if (error) throw error
  return data
}
