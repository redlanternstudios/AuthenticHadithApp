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

export interface SavedHadith {
  id: string
  user_id: string
  hadith_id: string
  created_at: string
}

export interface SavedHadithWithNotes extends SavedHadith {
  folder_id?: string
  notes?: string
  notes_html?: string
  highlights?: Highlight[]
  tags?: string[]
  attachments?: Attachment[]
  last_edited_at?: string
  version: number
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

export interface HadithNoteVersion {
  id: string
  saved_hadith_id: string
  notes?: string
  notes_html?: string
  version: number
  created_at: string
  created_by: string
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
  mentions?: string[] // UUIDs stored as strings
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface FolderShare {
  id: string
  folder_id: string
  share_token: string
  views: number
  last_viewed_at?: string
  created_at: string
}

export interface HadithFolderWithHadiths extends HadithFolder {
  saved_hadiths?: Array<{
    id: string
    hadith_id: string
    notes?: string
    created_at: string
    hadiths?: {
      id: string
      arabic_text: string
      english_translation: string
      collection: string
      reference: string
      grade: string
    }
  }>
}
