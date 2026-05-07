import { supabase } from '@/lib/supabase/client'
import type { HadithFolder, SavedHadithWithNotes, FolderCollaborator } from '@/types/my-hadith'

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
export async function saveHadithToFolder(
  hadithId: string,
  folderId?: string,
  notes?: string
) {
  const { data: user } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('saved_hadiths')
    .insert({
      user_id: user.user?.id,
      hadith_id: hadithId,
      folder_id: folderId,
      notes,
      notes_html: notes
    })
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

export async function getFolderHadiths(folderId: string) {
  const { data, error } = await supabase
    .from('saved_hadiths')
    .select(`
      *,
      hadiths(*)
    `)
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as SavedHadithWithNotes[]
}

// Sharing
export async function generateShareToken(folderId: string, privacy: 'public' | 'unlisted' = 'unlisted') {
  const { data, error: rpcError } = await supabase.rpc('generate_share_token')
  
  if (rpcError) {
    console.error('Failed to generate share token:', rpcError)
    throw rpcError
  }
  
  const token = data as string
  
  try {
    await updateFolder(folderId, { share_token: token, privacy })
    return token
  } catch (error) {
    console.error('Failed to update folder with share token:', error)
    throw error
  }
}

export async function getFolderByShareToken(token: string) {
  const { data, error } = await supabase
    .from('hadith_folders')
    .select(`
      *,
      saved_hadiths(
        *,
        hadiths(*)
      )
    `)
    .eq('share_token', token)
    .single()
  
  if (error) throw error
  return data as HadithFolder
}

// Comments
export async function addComment(savedHadithId: string, comment: string) {
  const { data: user } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('folder_comments')
    .insert({
      saved_hadith_id: savedHadithId,
      user_id: user.user?.id,
      comment
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}
