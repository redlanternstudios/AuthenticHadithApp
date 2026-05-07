import type { Hadith } from './hadith'

export interface HadithFolder {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  parent_folder_id?: string
  is_smart: boolean
  smart_filter?: SmartFilter
  privacy: 'private' | 'public' | 'unlisted'
  share_token?: string
  created_at: string
  updated_at: string
  saved_hadiths_count?: number
  collaborators?: FolderCollaborator[]
}

export interface SmartFilter {
  collection_slug?: string
  grade?: 'sahih' | 'hasan' | 'daif'
  tags?: string[]
}

export interface SavedHadithWithNotes {
  id: string
  user_id: string
  hadith_id: string
  folder_id?: string
  notes?: string
  notes_html?: string
  highlights?: Highlight[]
  tags?: string[]
  attachments?: Attachment[]
  last_edited_at?: string
  version: number
  created_at: string
  hadith?: Hadith
  folder?: HadithFolder
  comments?: FolderComment[]
}

export interface Highlight {
  text: string
  color: string
  start: number
  end: number
}

export interface Attachment {
  url: string
  type: string
  name: string
  size: number
}

export interface FolderCollaborator {
  id: string
  folder_id: string
  user_id: string
  role: 'viewer' | 'contributor' | 'editor'
  invited_by: string
  invited_at: string
  accepted_at?: string
  user?: {
    email: string
    full_name?: string
    avatar_url?: string
  }
}

export interface FolderComment {
  id: string
  saved_hadith_id: string
  user_id: string
  comment: string
  mentions?: string[]
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
    avatar_url?: string
  }
}
