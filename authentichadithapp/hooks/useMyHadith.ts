import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/AuthProvider'
import * as api from '@/lib/api/my-hadith'
import type { HadithFolder } from '@/types/my-hadith'

export function useFolders() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['folders', user?.id],
    queryFn: () => api.getUserFolders(user!.id),
    enabled: !!user
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
    }
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HadithFolder> }) =>
      api.updateFolder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
    }
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.id] })
    }
  })
}

export function useFolderHadiths(folderId?: string) {
  return useQuery({
    queryKey: ['folder-hadiths', folderId],
    queryFn: () => api.getFolderHadiths(folderId!),
    enabled: !!folderId
  })
}

export function useSaveHadith() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ hadithId, folderId, notes }: { 
      hadithId: string
      folderId?: string
      notes?: string 
    }) => api.saveHadithToFolder(hadithId, folderId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-hadiths'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    }
  })
}

export function useUpdateNotes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.updateSavedHadithNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-hadiths'] })
    }
  })
}
