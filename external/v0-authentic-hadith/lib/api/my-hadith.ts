import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { HadithFolder, SavedHadithWithNotes, FolderCollaborator } from '@/types/my-hadith'

export async function getUserFolders(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('hadith_folders')
    .select(`
      *,
      saved_hadiths(count),
      folder_collaborators(
        id,
        role,
        user_id,
        profiles(email, full_name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data as HadithFolder[]
}

export async function createFolder(folder: Partial<HadithFolder>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('hadith_folders')
    .insert(folder)
    .select()
    .single()
  
  if (error) throw error
  return data as HadithFolder
}

export async function updateFolder(id: string, updates: Partial<HadithFolder>) {
  const supabase = getSupabaseBrowserClient()
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
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from('hadith_folders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function generateShareToken(folderId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc('generate_share_token')
  if (error) throw error
  
  const token = data as string
  await updateFolder(folderId, { share_token: token })
  return token
}

export async function getFolderByShareToken(token: string) {
  const supabase = getSupabaseBrowserClient()
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
  
  // Track view
  await supabase.rpc('track_folder_view', { 
    p_share_token: token,
    p_viewer_ip: '' // Get from request headers
  })
  
  return data as HadithFolder
}

export async function inviteCollaborator(
  folderId: string, 
  email: string, 
  role: 'viewer' | 'contributor' | 'editor'
) {
  const supabase = getSupabaseBrowserClient()
  
  // Find user by email
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  
  if (!user) {
    throw new Error('User not found')
  }
  
  const { data, error } = await supabase
    .from('folder_collaborators')
    .insert({
      folder_id: folderId,
      user_id: user.id,
      role,
      invited_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data as FolderCollaborator
}

export async function updateCollaboratorRole(
  collaboratorId: string,
  role: 'viewer' | 'contributor' | 'editor'
) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('folder_collaborators')
    .update({ role })
    .eq('id', collaboratorId)
    .select()
    .single()
  
  if (error) throw error
  return data as FolderCollaborator
}

export async function removeCollaborator(collaboratorId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from('folder_collaborators')
    .delete()
    .eq('id', collaboratorId)
  
  if (error) throw error
}

export async function saveHadithToFolder(
  hadithId: string,
  folderId?: string,
  notes?: string
) {
  const supabase = getSupabaseBrowserClient()
  const userId = (await supabase.auth.getUser()).data.user?.id
  
  const { data, error } = await supabase
    .from('saved_hadiths')
    .insert({
      user_id: userId,
      hadith_id: hadithId,
      folder_id: folderId,
      notes,
      notes_html: notes // For now, store as plain text; convert to HTML on frontend display
    })
    .select()
    .single()
  
  if (error) throw error
  return data as SavedHadithWithNotes
}

export async function updateSavedHadithNotes(
  savedHadithId: string,
  notes: string,
  notesHtml: string
) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('saved_hadiths')
    .update({ 
      notes, 
      notes_html: notesHtml,
      last_edited_at: new Date().toISOString()
    })
    .eq('id', savedHadithId)
    .select()
    .single()
  
  if (error) throw error
  return data as SavedHadithWithNotes
}

export async function addComment(savedHadithId: string, comment: string, mentions?: string[]) {
  const supabase = getSupabaseBrowserClient()
  const userId = (await supabase.auth.getUser()).data.user?.id
  
  const { data, error } = await supabase
    .from('folder_comments')
    .insert({
      saved_hadith_id: savedHadithId,
      user_id: userId,
      comment,
      mentions
    })
    .select(`
      *,
      profiles(full_name, avatar_url)
    `)
    .single()
  
  if (error) throw error
  return data
}
