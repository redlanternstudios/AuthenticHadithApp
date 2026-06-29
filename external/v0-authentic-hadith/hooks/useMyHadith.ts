import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import * as api from '@/lib/api/my-hadith'
import type { HadithFolder } from '@/types/my-hadith'

export function useFolders() {
  const supabase = getSupabaseBrowserClient()
  
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      return api.getUserFolders(user.id)
    }
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    }
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HadithFolder> }) =>
      api.updateFolder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    }
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    }
  })
}

export function useSaveHadith() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ hadithId, folderId, notes }: { 
      hadithId: string; 
      folderId?: string; 
      notes?: string 
    }) => api.saveHadithToFolder(hadithId, folderId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-hadiths'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    }
  })
}
